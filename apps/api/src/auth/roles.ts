import type { RequestHandler } from 'express';
import { AppError } from '../http/errors.js';
import type { AuthStore } from './store.js';

export const adminRoles = ['ADMIN', 'CONTENT_EDITOR', 'MODERATOR', 'VERIFIER'] as const;
export const reviewerRoles = ['ADMIN', 'VERIFIER'] as const;
export const editorRoles = ['ADMIN', 'CONTENT_EDITOR'] as const;
export const moderatorRoles = ['ADMIN', 'MODERATOR'] as const;
export const auditReaderRoles = ['ADMIN', 'VERIFIER', 'MODERATOR'] as const;

export function requireAnyRole(store: AuthStore, allowedRoles: readonly string[]): RequestHandler {
  return (_request, response, next) => {
    const auth = response.locals.auth as { userId: string } | undefined;

    if (!auth) {
      next(new AppError(401, 'AUTHENTICATION_REQUIRED', 'Authentication is required'));
      return;
    }

    const run = async () => {
      const roleKeys = await store.findActiveRoleKeys(auth.userId);
      const hasAllowedRole = roleKeys.some((roleKey) => allowedRoles.includes(roleKey));

      if (!hasAllowedRole) {
        throw new AppError(403, 'FORBIDDEN', 'You do not have permission to perform this action');
      }

      response.locals.roleKeys = roleKeys;
      next();
    };

    void run().catch(next);
  };
}
