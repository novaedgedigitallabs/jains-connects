import rateLimit from 'express-rate-limit';
import { Router } from 'express';
import { z } from 'zod';
import type { AppConfig } from '../config/env.js';
import { AppError } from '../http/errors.js';
import { requireAuthentication, type AuthContext } from '../auth/middleware.js';
import { hashAccessToken, createAccessToken } from '../auth/tokens.js';
import { hashPassword, verifyPassword } from '../auth/password.js';
import type { AuthStore, AuthUser } from '../auth/store.js';

const credentialsSchema = z
  .object({
    email: z.string().trim().email().max(320),
    password: z.string().min(12).max(128),
  })
  .strict();

const registrationSchema = credentialsSchema.extend({
  displayName: z.string().trim().min(2).max(120),
});

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

function publicUser(user: AuthUser) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
  };
}

function authRateLimiter() {
  return rateLimit({
    windowMs: 15 * 60_000,
    limit: 10,
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

export function createAuthRouter(config: AppConfig, store: AuthStore): Router {
  const router = Router();
  router.use(authRateLimiter());

  router.post('/register', (request, response, next) => {
    const run = async () => {
      const input = parseBody(registrationSchema, request.body);
      const emailNormalized = normalizeEmail(input.email);
      const existing = await store.findUserByEmail(emailNormalized);

      if (existing) {
        throw new AppError(409, 'EMAIL_IN_USE', 'An account already exists for this email');
      }

      const user = await store.createUser({
        email: emailNormalized,
        emailNormalized,
        displayName: input.displayName,
        passwordHash: await hashPassword(input.password),
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

      if (!user || user.status !== 'ACTIVE' || !passwordIsValid) {
        throw new AppError(401, 'INVALID_CREDENTIALS', 'Email or password is incorrect');
      }

      const accessToken = createAccessToken();
      const expiresAt = new Date(Date.now() + config.sessionTtlSeconds * 1000);
      await store.createSession({
        userId: user.id,
        tokenHash: hashAccessToken(accessToken),
        expiresAt,
      });

      response.status(200).json({
        data: {
          accessToken,
          expiresAt: expiresAt.toISOString(),
          user: publicUser(user),
        },
      });
    };

    void run().catch(next);
  });

  router.get('/me', requireAuthentication(store), (_request, response, next) => {
    const run = async () => {
      const auth = response.locals.auth as AuthContext;
      const session = await store.findActiveSession(auth.tokenHash, new Date());

      if (!session) {
        throw new AppError(401, 'INVALID_SESSION', 'The session is invalid or expired');
      }

      response.status(200).json({ data: { user: publicUser(session.user) } });
    };

    void run().catch(next);
  });

  router.post('/logout', requireAuthentication(store), (_request, response, next) => {
    const run = async () => {
      const auth = response.locals.auth as AuthContext;
      await store.revokeSession(auth.tokenHash, new Date());
      response.status(204).send();
    };

    void run().catch(next);
  });

  return router;
}
