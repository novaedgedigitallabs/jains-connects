import type { PrismaClient, UserStatus } from '@prisma/client';

export type AuthUser = {
  id: string;
  email: string | null;
  displayName: string;
  status: UserStatus;
  passwordHash: string | null;
  emailVerifiedAt: Date | null;
};

export type ActiveSession = {
  tokenHash: string;
  mfaVerifiedAt: Date | null;
  user: AuthUser;
};

export type MfaSecretRecord = {
  userId: string;
  secretCipher: Uint8Array;
  secretIv: Uint8Array;
  secretTag: Uint8Array;
  enabled: boolean;
};

export interface AuthStore {
  findUserByEmail(emailNormalized: string): Promise<AuthUser | null>;
  createUser(input: {
    email: string;
    emailNormalized: string;
    displayName: string;
    passwordHash: string;
  }): Promise<AuthUser>;
  createSession(input: { userId: string; tokenHash: string; expiresAt: Date }): Promise<void>;
  findActiveSession(tokenHash: string, now: Date): Promise<ActiveSession | null>;
  findActiveRoleKeys(userId: string): Promise<string[]>;
  touchSession(tokenHash: string, lastUsedAt: Date): Promise<void>;
  revokeSession(tokenHash: string, revokedAt: Date): Promise<void>;
  revokeAllUserSessions(userId: string, revokedAt: Date): Promise<void>;
  markUserLoggedIn(userId: string, loggedInAt: Date): Promise<void>;
  setSessionMfaVerified(tokenHash: string, verifiedAt: Date): Promise<void>;
  /** Deletes sessions/tokens that expired or were revoked/consumed before the cutoff. */
  purgeStaleAuthRecords(before: Date): Promise<{
    sessions: number;
    verificationTokens: number;
    resetTokens: number;
  }>;

  // Email verification
  createEmailVerificationToken(input: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<{ id: string }>;
  /**
   * Atomically consumes a single-use, unexpired verification token and marks
   * the user's email verified (with an audit event) in one transaction.
   * Returns null when the token is unknown, used, or expired.
   */
  verifyEmailWithToken(tokenHash: string, now: Date): Promise<{ userId: string } | null>;

  // Password reset
  createPasswordResetToken(input: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<{ id: string }>;
  /**
   * Atomically consumes a single-use, unexpired reset token, sets the new
   * password hash, marks the email verified (a delivered reset link proves
   * mailbox control), revokes all of the user's sessions, and records the
   * AUTH_PASSWORD_RESET_COMPLETED audit event in one transaction. Returns
   * null when the token is unknown, used, or expired.
   */
  resetPasswordWithToken(
    tokenHash: string,
    newPasswordHash: string,
    now: Date,
  ): Promise<{ userId: string } | null>;

  // MFA
  findMfaCredential(userId: string): Promise<MfaSecretRecord | null>;
  createMfaCredential(input: {
    userId: string;
    secretCipher: Uint8Array;
    secretIv: Uint8Array;
    secretTag: Uint8Array;
  }): Promise<void>;
  activateMfaCredential(userId: string, activatedAt: Date): Promise<void>;
  disableMfaCredential(userId: string): Promise<void>;
  recordMfaVerification(userId: string, verifiedAt: Date): Promise<void>;
  replaceRecoveryCodes(userId: string, codeHashes: string[]): Promise<void>;
  consumeRecoveryCode(codeHash: string, now: Date): Promise<{ userId: string } | null>;
}

const userSelect = {
  id: true,
  email: true,
  displayName: true,
  status: true,
  passwordHash: true,
  emailVerifiedAt: true,
} as const;

export class PrismaAuthStore implements AuthStore {
  public constructor(private readonly client: PrismaClient) {}

  public async findUserByEmail(emailNormalized: string) {
    return this.client.user.findUnique({
      where: { emailNormalized },
      select: userSelect,
    });
  }

  public async createUser(input: {
    email: string;
    emailNormalized: string;
    displayName: string;
    passwordHash: string;
  }) {
    return this.client.user.create({
      data: {
        email: input.email,
        emailNormalized: input.emailNormalized,
        displayName: input.displayName,
        passwordHash: input.passwordHash,
        status: 'ACTIVE',
      },
      select: userSelect,
    });
  }

  public async createSession(input: { userId: string; tokenHash: string; expiresAt: Date }) {
    await this.client.session.create({ data: input });
  }

  public async findActiveSession(tokenHash: string, now: Date) {
    const session = await this.client.session.findUnique({
      where: { tokenHash },
      select: {
        tokenHash: true,
        expiresAt: true,
        revokedAt: true,
        mfaVerifiedAt: true,
        user: { select: userSelect },
      },
    });

    if (!session) return null;

    const userStatus = session.user.status;
    const userIsActive = userStatus === 'ACTIVE';
    const sessionIsActive = session.revokedAt === null && session.expiresAt > now;

    return userIsActive && sessionIsActive
      ? { tokenHash: session.tokenHash, mfaVerifiedAt: session.mfaVerifiedAt, user: session.user }
      : null;
  }

  public async touchSession(tokenHash: string, lastUsedAt: Date) {
    await this.client.session.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { lastUsedAt },
    });
  }

  public async findActiveRoleKeys(userId: string) {
    const assignments = await this.client.userRole.findMany({
      where: { userId, revokedAt: null },
      select: { role: { select: { key: true } } },
    });

    return assignments.map((assignment) => assignment.role.key);
  }

  public async revokeSession(tokenHash: string, revokedAt: Date) {
    await this.client.session.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt },
    });
  }

  public async revokeAllUserSessions(userId: string, revokedAt: Date) {
    await this.client.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt },
    });
  }

  public async markUserLoggedIn(userId: string, loggedInAt: Date) {
    await this.client.user.update({
      where: { id: userId },
      data: { lastLoginAt: loggedInAt },
    });
  }

  public async setSessionMfaVerified(tokenHash: string, verifiedAt: Date) {
    await this.client.session.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { mfaVerifiedAt: verifiedAt },
    });
  }

  public async purgeStaleAuthRecords(before: Date) {
    // Sessions/tokens are deleted only after both expiry and a retention
    // window have passed so that audit investigations keep recent artifacts.
    const sessions = await this.client.session.deleteMany({
      where: { OR: [{ expiresAt: { lt: before } }, { revokedAt: { lt: before } }] },
    });

    const verificationTokens = await this.client.emailVerificationToken.deleteMany({
      where: { OR: [{ expiresAt: { lt: before } }, { usedAt: { lt: before } }] },
    });

    const resetTokens = await this.client.passwordResetToken.deleteMany({
      where: { OR: [{ expiresAt: { lt: before } }, { usedAt: { lt: before } }] },
    });

    return {
      sessions: sessions.count,
      verificationTokens: verificationTokens.count,
      resetTokens: resetTokens.count,
    };
  }

  // ── Email verification ─────────────────────────────────────────────────────

  public async createEmailVerificationToken(input: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }) {
    return this.client.emailVerificationToken.create({
      data: input,
      select: { id: true },
    });
  }

  public async verifyEmailWithToken(tokenHash: string, now: Date) {
    return this.client.$transaction(async (tx) => {
      // Atomic single-use consumption: only a row that is unused and
      // unexpired transitions to used, so concurrent requests cannot both
      // succeed.
      const consumed = await tx.emailVerificationToken.updateMany({
        where: { tokenHash, usedAt: null, expiresAt: { gt: now } },
        data: { usedAt: now },
      });

      if (consumed.count === 0) {
        return null;
      }

      const token = await tx.emailVerificationToken.findUnique({
        where: { tokenHash },
        select: { userId: true },
      });

      if (!token) {
        return null;
      }

      await tx.user.update({
        where: { id: token.userId },
        data: { emailVerifiedAt: now },
      });

      await tx.auditEvent.create({
        data: {
          actorUserId: token.userId,
          action: 'AUTH_EMAIL_VERIFIED',
          targetType: 'USER',
          targetId: token.userId,
          summary: 'Email address verified with a single-use token',
        },
      });

      return { userId: token.userId };
    });
  }

  // ── Password reset ─────────────────────────────────────────────────────────

  public async createPasswordResetToken(input: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }) {
    return this.client.passwordResetToken.create({
      data: input,
      select: { id: true },
    });
  }

  public async resetPasswordWithToken(
    tokenHash: string,
    newPasswordHash: string,
    now: Date,
  ) {
    return this.client.$transaction(async (tx) => {
      const consumed = await tx.passwordResetToken.updateMany({
        where: { tokenHash, usedAt: null, expiresAt: { gt: now } },
        data: { usedAt: now },
      });

      if (consumed.count === 0) {
        return null;
      }

      const token = await tx.passwordResetToken.findUnique({
        where: { tokenHash },
        select: { userId: true },
      });

      if (!token) {
        return null;
      }

      await tx.user.update({
        where: { id: token.userId },
        data: { passwordHash: newPasswordHash, emailVerifiedAt: now },
      });

      // Invalidate every existing session so a stolen session cannot survive
      // a credential change.
      await tx.session.updateMany({
        where: { userId: token.userId, revokedAt: null },
        data: { revokedAt: now },
      });

      await tx.auditEvent.create({
        data: {
          actorUserId: token.userId,
          action: 'AUTH_PASSWORD_RESET_COMPLETED',
          targetType: 'USER',
          targetId: token.userId,
          summary: 'Password reset completed; all sessions revoked',
        },
      });

      return { userId: token.userId };
    });
  }

  // ── MFA ─────────────────────────────────────────────────────────────────────

  public async findMfaCredential(userId: string) {
    const credential = await this.client.mfaCredential.findUnique({
      where: { userId },
      select: {
        userId: true,
        secretCipher: true,
        secretIv: true,
        secretTag: true,
        enabled: true,
      },
    });

    return credential ?? null;
  }

  public async createMfaCredential(input: {
    userId: string;
    secretCipher: Uint8Array;
    secretIv: Uint8Array;
    secretTag: Uint8Array;
  }) {
    // Enrollment replaces any earlier unactivated credential so a stale
    // pending secret cannot linger. Activated credentials are rejected by
    // the route before reaching here.
    await this.client.mfaCredential.deleteMany({
      where: { userId: input.userId, enabled: false },
    });

    await this.client.mfaCredential.create({
      data: {
        userId: input.userId,
        secretCipher: Buffer.from(input.secretCipher),
        secretIv: Buffer.from(input.secretIv),
        secretTag: Buffer.from(input.secretTag),
        enabled: false,
      },
    });
  }

  public async activateMfaCredential(userId: string, activatedAt: Date) {
    await this.client.$transaction([
      this.client.mfaCredential.update({
        where: { userId },
        data: { enabled: true, activatedAt },
      }),
      this.client.auditEvent.create({
        data: {
          actorUserId: userId,
          action: 'AUTH_MFA_ACTIVATED',
          targetType: 'USER',
          targetId: userId,
          summary: 'TOTP multi-factor authentication activated',
        },
      }),
    ]);
  }

  public async disableMfaCredential(userId: string) {
    await this.client.$transaction([
      this.client.mfaCredential.deleteMany({ where: { userId } }),
      this.client.mfaRecoveryCode.deleteMany({ where: { userId } }),
      this.client.auditEvent.create({
        data: {
          actorUserId: userId,
          action: 'AUTH_MFA_DISABLED',
          targetType: 'USER',
          targetId: userId,
          summary: 'TOTP multi-factor authentication disabled after code verification',
        },
      }),
    ]);
  }

  public async recordMfaVerification(userId: string, verifiedAt: Date) {
    await this.client.mfaCredential.update({
      where: { userId },
      data: { lastVerifiedAt: verifiedAt },
    });
  }

  public async replaceRecoveryCodes(userId: string, codeHashes: string[]) {
    await this.client.$transaction([
      this.client.mfaRecoveryCode.deleteMany({ where: { userId } }),
      this.client.mfaRecoveryCode.createMany({
        data: codeHashes.map((codeHash) => ({ userId, codeHash })),
      }),
    ]);
  }

  public async consumeRecoveryCode(codeHash: string, now: Date) {
    const consumed = await this.client.mfaRecoveryCode.updateMany({
      where: { codeHash, usedAt: null },
      data: { usedAt: now },
    });

    if (consumed.count === 0) {
      return null;
    }

    const code = await this.client.mfaRecoveryCode.findUnique({
      where: { codeHash },
      select: { userId: true },
    });

    return code ? { userId: code.userId } : null;
  }
}
