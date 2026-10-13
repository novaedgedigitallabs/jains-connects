import type { PrismaClient, UserStatus } from '@prisma/client';

export type AuthUser = {
  id: string;
  email: string | null;
  displayName: string;
  status: UserStatus;
  passwordHash: string | null;
};

export type ActiveSession = {
  tokenHash: string;
  user: AuthUser;
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
}

const userSelect = {
  id: true,
  email: true,
  displayName: true,
  status: true,
  passwordHash: true,
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
        user: { select: userSelect },
      },
    });

    if (!session) return null;

    const userStatus = session.user.status;
    const userIsActive = userStatus === 'ACTIVE';
    const sessionIsActive = session.revokedAt === null && session.expiresAt > now;

    return userIsActive && sessionIsActive
      ? { tokenHash: session.tokenHash, user: session.user }
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
}
