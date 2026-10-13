import type { RequestHandler } from 'express';
import { AppError } from '../http/errors.js';
import { hashAccessToken } from './tokens.js';
import type { AuthStore } from './store.js';

export type AuthContext = {
  userId: string;
  tokenHash: string;
};

export function requireAuthentication(store: AuthStore): RequestHandler {
  return (request, response, next) => {
    const authorization = request.header('Authorization');
    const token = authorization?.startsWith('Bearer ') ? authorization.slice(7).trim() : '';

    if (!token || token.length > 256) {
      next(new AppError(401, 'AUTHENTICATION_REQUIRED', 'Authentication is required'));
      return;
    }

    const run = async () => {
      const tokenHash = hashAccessToken(token);
      const session = await store.findActiveSession(tokenHash, new Date());

      if (!session) {
        throw new AppError(401, 'INVALID_SESSION', 'The session is invalid or expired');
      }

      const context: AuthContext = { userId: session.user.id, tokenHash };
      response.locals.auth = context;
      await store.touchSession(tokenHash, new Date());
      next();
    };

    void run().catch(next);
  };
}
