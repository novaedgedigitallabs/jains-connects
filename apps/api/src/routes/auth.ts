import rateLimit from 'express-rate-limit';
import { Router } from 'express';
import { z } from 'zod';
import type { AppConfig } from '../config/env.js';
import { AppError } from '../http/errors.js';
import { requireAuthentication, type AuthContext } from '../auth/middleware.js';
import { hashAccessToken, createAccessToken } from '../auth/tokens.js';
import { hashPassword, verifyPassword } from '../auth/password.js';
import {
  buildOtpauthUri,
  generateRecoveryCodes,
  generateTotpSecret,
  verifyTotp,
} from '../auth/totp.js';
import { decryptSecret, encodeEncryptionKey, encryptSecret } from '../auth/secret-box.js';
import type { AuthStore } from '../auth/store.js';
import type { EmailProvider } from '../email/provider.js';

const credentialsSchema = z
  .object({
    email: z.string().trim().email().max(320),
    password: z.string().min(12).max(128),
  })
  .strict();

const registrationSchema = credentialsSchema.extend({
  displayName: z.string().trim().min(2).max(120),
});

const verifyEmailSchema = z.object({ token: z.string().min(1).max(512) }).strict();

const requestResetSchema = z.object({ email: z.string().trim().email().max(320) }).strict();

const resetPasswordSchema = z
  .object({
    token: z.string().min(1).max(512),
    newPassword: z.string().min(12).max(128),
  })
  .strict();

const mfaCodeSchema = z.object({ code: z.string().trim().min(6).max(64) }).strict();

// TTLs for verification and reset tokens (seconds).
const EMAIL_VERIFICATION_TTL_SECONDS = 24 * 60 * 60; // 24 hours
const PASSWORD_RESET_TTL_SECONDS = 60 * 60; // 1 hour

const MFA_ISSUER = 'JainConnect';
const MFA_RECOVERY_CODE_COUNT = 10;

function parseBody<T>(schema: z.ZodSchema<T>, value: unknown): T {
  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    throw new AppError(400, 'INVALID_INPUT', 'Authentication details are invalid');
  }
  return parsed.data;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function publicUser(user: {
  id: string;
  email: string | null;
  displayName: string;
  emailVerifiedAt: Date | null;
}) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    emailVerifiedAt: user.emailVerifiedAt?.toISOString() ?? null,
  };
}

function authRateLimiter() {
  return rateLimit({
    windowMs: 15 * 60_000,
    limit: 30,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: (_request, response) => {
      response.status(429).json({
        error: {
          code: 'RATE_LIMITED',
          message: 'Too many authentication attempts. Please try again later.',
          requestId: response.locals.requestId,
        },
      });
    },
  });
}

// Tighter limiter for account-recovery requests to reduce both enumeration
// and third-party mail-bombing through the endpoint.
function recoveryRateLimiter() {
  return rateLimit({
    windowMs: 60 * 60_000,
    limit: 5,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: (_request, response) => {
      response.status(429).json({
        error: {
          code: 'RATE_LIMITED',
          message: 'Too many recovery requests. Please try again later.',
          requestId: response.locals.requestId,
        },
      });
    },
  });
}

export function createAuthRouter(
  config: AppConfig,
  store: AuthStore,
  emailProvider: EmailProvider,
): Router {
  const router = Router();
  router.use(authRateLimiter());

  const mfaEncryptionKey = config.mfaEncryptionKey
    ? encodeEncryptionKey(config.mfaEncryptionKey)
    : null;

  const requireMfaConfigured = () => {
    if (!mfaEncryptionKey) {
      throw new AppError(
        503,
        'MFA_NOT_CONFIGURED',
        'Multi-factor authentication is not configured on this deployment',
      );
    }
  };

  router.post('/register', (request, response, next) => {
    const run = async () => {
      const input = parseBody(registrationSchema, request.body);
      const emailNormalized = normalizeEmail(input.email);

      const existing = await store.findUserByEmail(emailNormalized);
      if (existing) {
        throw new AppError(409, 'EMAIL_IN_USE', 'An account with this email already exists');
      }

      const user = await store.createUser({
        email: input.email,
        emailNormalized,
        displayName: input.displayName,
        passwordHash: await hashPassword(input.password),
      });

      // Issue an email verification token immediately after registration.
      // The raw token exists only in memory and inside the outbound email.
      const rawToken = createAccessToken();
      const tokenHash = hashAccessToken(rawToken);
      const expiresAt = new Date(Date.now() + EMAIL_VERIFICATION_TTL_SECONDS * 1000);
      const tokenRecord = await store.createEmailVerificationToken({
        userId: user.id,
        tokenHash,
        expiresAt,
      });

      await emailProvider.sendEmailVerification({
        toEmail: emailNormalized,
        toDisplayName: input.displayName,
        tokenId: tokenRecord.id,
        rawToken,
        expiresAt,
      });

      response.status(201).json({ data: { user: publicUser(user) } });
    };

    void run().catch(next);
  });

  router.post('/login', (request, response, next) => {
    const run = async () => {
      const input = parseBody(credentialsSchema, request.body);
      const user = await store.findUserByEmail(normalizeEmail(input.email));
      const passwordIsValid = user?.passwordHash
        ? await verifyPassword(input.password, user.passwordHash)
        : false;

      // Generic response to prevent account enumeration.
      if (!user || user.status !== 'ACTIVE' || !passwordIsValid) {
        throw new AppError(401, 'INVALID_CREDENTIALS', 'Email or password is incorrect');
      }

      const accessToken = createAccessToken();
      const tokenHash = hashAccessToken(accessToken);
      const expiresAt = new Date(Date.now() + config.sessionTtlSeconds * 1000);
      await store.createSession({ userId: user.id, tokenHash, expiresAt });
      await store.markUserLoggedIn(user.id, new Date());

      // Sessions for MFA-enabled accounts start without a completed MFA
      // challenge; privileged surfaces reject them until /mfa/verification
      // succeeds.
      const mfaCredential = await store.findMfaCredential(user.id);
      const mfaRequired = mfaCredential?.enabled === true;

      response.status(200).json({
        data: {
          accessToken,
          user: publicUser(user),
          mfaRequired,
        },
      });
    };

    void run().catch(next);
  });

  router.get('/me', requireAuthentication(store), (request, response, next) => {
    const run = async () => {
      const auth = response.locals.auth as AuthContext;
      const session = await store.findActiveSession(auth.tokenHash, new Date());
      if (!session) {
        throw new AppError(401, 'INVALID_SESSION', 'The session is invalid or expired');
      }

      response.status(200).json({
        data: {
          user: publicUser(session.user),
          mfaVerified: auth.mfaVerifiedAt !== null,
        },
      });
    };

    void run().catch(next);
  });

  router.post('/logout', requireAuthentication(store), (request, response, next) => {
    const run = async () => {
      const auth = response.locals.auth as AuthContext;
      await store.revokeSession(auth.tokenHash, new Date());
      response.status(204).send();
    };

    void run().catch(next);
  });

  // Revokes every active session for the authenticated account ("log out
  // everywhere"), e.g. after a suspected device compromise.
  router.post('/logout-all', requireAuthentication(store), (request, response, next) => {
    const run = async () => {
      const auth = response.locals.auth as AuthContext;
      await store.revokeAllUserSessions(auth.userId, new Date());
      response.status(204).send();
    };

    void run().catch(next);
  });

  // ── Email verification ──────────────────────────────────────────────────────

  /**
   * POST /api/v1/auth/verify-email
   * Consumes a single-use, expiring verification token and marks the user's
   * email as verified. Returns a generic response to avoid leaking token
   * state to a caller probing guessed tokens.
   */
  router.post('/verify-email', (request, response, next) => {
    const run = async () => {
      const input = parseBody(verifyEmailSchema, request.body);
      await store.verifyEmailWithToken(hashAccessToken(input.token), new Date());

      response.status(200).json({
        data: { message: 'If the token is valid, your email has been verified.' },
      });
    };

    void run().catch(next);
  });

  /**
   * POST /api/v1/auth/resend-verification
   * Issues a fresh verification token for the authenticated user if their
   * email is not yet verified. Already-verified users receive the same
   * generic success so the endpoint cannot be used to probe state.
   */
  router.post('/resend-verification', requireAuthentication(store), (request, response, next) => {
    const run = async () => {
      const auth = response.locals.auth as AuthContext;
      const session = await store.findActiveSession(auth.tokenHash, new Date());
      if (!session) {
        throw new AppError(401, 'INVALID_SESSION', 'The session is invalid or expired');
      }

      const user = session.user;
      if (user.emailVerifiedAt === null && user.email) {
        const rawToken = createAccessToken();
        const tokenHash = hashAccessToken(rawToken);
        const expiresAt = new Date(Date.now() + EMAIL_VERIFICATION_TTL_SECONDS * 1000);
        const tokenRecord = await store.createEmailVerificationToken({
          userId: user.id,
          tokenHash,
          expiresAt,
        });

        await emailProvider.sendEmailVerification({
          toEmail: user.email,
          toDisplayName: user.displayName,
          tokenId: tokenRecord.id,
          rawToken,
          expiresAt,
        });
      }

      response.status(200).json({ data: { message: 'Verification email sent if applicable.' } });
    };

    void run().catch(next);
  });

  // ── Password reset ──────────────────────────────────────────────────────────

  /**
   * POST /api/v1/auth/request-password-reset
   * Issues a single-use, 1-hour reset token for the given email if an active
   * account exists. Always returns the same 200 response to prevent account
   * enumeration.
   */
  router.post(
    '/request-password-reset',
    recoveryRateLimiter(),
    (request, response, next) => {
      const run = async () => {
        const input = parseBody(requestResetSchema, request.body);
        const user = await store.findUserByEmail(normalizeEmail(input.email));

        if (user && user.status === 'ACTIVE' && user.email) {
          const rawToken = createAccessToken();
          const tokenHash = hashAccessToken(rawToken);
          const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_SECONDS * 1000);
          const tokenRecord = await store.createPasswordResetToken({
            userId: user.id,
            tokenHash,
            expiresAt,
          });

          await emailProvider.sendPasswordReset({
            toEmail: user.email,
            toDisplayName: user.displayName,
            tokenId: tokenRecord.id,
            rawToken,
            expiresAt,
          });
        }

        response.status(200).json({
          data: { message: 'If an account exists for this email, a reset link has been sent.' },
        });
      };

      void run().catch(next);
    },
  );

  /**
   * POST /api/v1/auth/reset-password
   * Consumes the single-use reset token, updates the password, marks the
   * email verified, and revokes all of the user's sessions in one atomic
   * transaction.
   */
  router.post('/reset-password', (request, response, next) => {
    const run = async () => {
      const input = parseBody(resetPasswordSchema, request.body);
      const result = await store.resetPasswordWithToken(
        hashAccessToken(input.token),
        await hashPassword(input.newPassword),
        new Date(),
      );

      if (!result) {
        // Generic error; do not distinguish unknown, used, or expired tokens.
        throw new AppError(400, 'INVALID_RESET_TOKEN', 'The reset token is invalid or has expired');
      }

      response.status(200).json({
        data: { message: 'Your password has been reset. Please log in with your new password.' },
      });
    };

    void run().catch(next);
  });

  // ── Multi-factor authentication (TOTP) ──────────────────────────────────────

  /**
   * POST /api/v1/auth/mfa/enrollment
   * Creates (or replaces) a pending TOTP credential and returns the base32
   * secret plus an otpauth:// URI for authenticator apps. The credential is
   * unusable until activation confirms a valid code.
   */
  router.post('/mfa/enrollment', requireAuthentication(store), (request, response, next) => {
    const run = async () => {
      requireMfaConfigured();
      const auth = response.locals.auth as AuthContext;

      const existing = await store.findMfaCredential(auth.userId);
      if (existing?.enabled) {
        throw new AppError(
          409,
          'MFA_ALREADY_ENABLED',
          'Multi-factor authentication is already enabled',
        );
      }

      const secret = generateTotpSecret();
      const encrypted = encryptSecret(mfaEncryptionKey as Buffer, secret);
      await store.createMfaCredential({ userId: auth.userId, ...encrypted });

      const session = await store.findActiveSession(auth.tokenHash, new Date());
      const label = session?.user.email ?? auth.userId;

      response.status(201).json({
        data: {
          secret,
          otpauthUri: buildOtpauthUri({ label, issuer: MFA_ISSUER, secret }),
        },
      });
    };

    void run().catch(next);
  });

  /**
   * POST /api/v1/auth/mfa/activation
   * Confirms a valid TOTP code against the pending credential, enables MFA,
   * and returns single-use recovery codes exactly once (only their hashes
   * are stored).
   */
  router.post('/mfa/activation', requireAuthentication(store), (request, response, next) => {
    const run = async () => {
      requireMfaConfigured();
      const auth = response.locals.auth as AuthContext;
      const input = parseBody(mfaCodeSchema, request.body);

      const credential = await store.findMfaCredential(auth.userId);
      if (!credential) {
        throw new AppError(400, 'MFA_NOT_ENROLLED', 'Start multi-factor enrollment first');
      }
      if (credential.enabled) {
        throw new AppError(
          409,
          'MFA_ALREADY_ENABLED',
          'Multi-factor authentication is already enabled',
        );
      }

      const secret = decryptSecret(mfaEncryptionKey as Buffer, {
        cipher: credential.secretCipher,
        iv: credential.secretIv,
        tag: credential.secretTag,
      });

      if (!verifyTotp(secret, input.code)) {
        throw new AppError(400, 'INVALID_MFA_CODE', 'The verification code is not valid');
      }

      const recoveryCodes = generateRecoveryCodes(MFA_RECOVERY_CODE_COUNT);
      await store.activateMfaCredential(auth.userId, new Date());
      await store.replaceRecoveryCodes(
        auth.userId,
        recoveryCodes.map((code) => hashAccessToken(code)),
      );

      response.status(200).json({ data: { recoveryCodes } });
    };

    void run().catch(next);
  });

  /**
   * POST /api/v1/auth/mfa/verification
   * Completes the MFA challenge for the current session with either a TOTP
   * code or a single-use recovery code. Required before privileged (staff)
   * surfaces accept the session.
   */
  router.post('/mfa/verification', requireAuthentication(store), (request, response, next) => {
    const run = async () => {
      requireMfaConfigured();
      const auth = response.locals.auth as AuthContext;
      const input = parseBody(mfaCodeSchema, request.body);

      const credential = await store.findMfaCredential(auth.userId);
      if (!credential || !credential.enabled) {
        throw new AppError(400, 'MFA_NOT_ENABLED', 'Multi-factor authentication is not enabled');
      }

      const secret = decryptSecret(mfaEncryptionKey as Buffer, {
        cipher: credential.secretCipher,
        iv: credential.secretIv,
        tag: credential.secretTag,
      });

      const now = new Date();

      if (verifyTotp(secret, input.code)) {
        await store.setSessionMfaVerified(auth.tokenHash, now);
        await store.recordMfaVerification(auth.userId, now);
        response.status(200).json({ data: { mfaVerified: true } });
        return;
      }

      // Fall back to a single-use recovery code. The consumed code must
      // belong to the authenticated user.
      const consumed = await store.consumeRecoveryCode(
        hashAccessToken(input.code.trim().toUpperCase()),
        now,
      );

      if (consumed && consumed.userId === auth.userId) {
        await store.setSessionMfaVerified(auth.tokenHash, now);
        response.status(200).json({ data: { mfaVerified: true, recoveryCodeUsed: true } });
        return;
      }

      // Generic failure for wrong TOTP codes and invalid or already-used
      // recovery codes alike.
      throw new AppError(400, 'INVALID_MFA_CODE', 'The verification code is not valid');
    };

    void run().catch(next);
  });

  /**
   * DELETE /api/v1/auth/mfa
   * Disables MFA. Requires a currently valid TOTP or recovery code, so a
   * stolen bearer token alone cannot strip the second factor.
   */
  router.delete('/mfa', requireAuthentication(store), (request, response, next) => {
    const run = async () => {
      requireMfaConfigured();
      const auth = response.locals.auth as AuthContext;
      const input = parseBody(mfaCodeSchema, request.body);

      const credential = await store.findMfaCredential(auth.userId);
      if (!credential || !credential.enabled) {
        throw new AppError(400, 'MFA_NOT_ENABLED', 'Multi-factor authentication is not enabled');
      }

      const secret = decryptSecret(mfaEncryptionKey as Buffer, {
        cipher: credential.secretCipher,
        iv: credential.secretIv,
        tag: credential.secretTag,
      });

      const codeValid = verifyTotp(secret, input.code);
      const recoveryValid = codeValid
        ? false
        : (
            await store.consumeRecoveryCode(
              hashAccessToken(input.code.trim().toUpperCase()),
              new Date(),
            )
          )?.userId === auth.userId;

      if (!codeValid && !recoveryValid) {
        throw new AppError(400, 'INVALID_MFA_CODE', 'The verification code is not valid');
      }

      await store.disableMfaCredential(auth.userId);
      response.status(204).send();
    };

    void run().catch(next);
  });

  return router;
}
