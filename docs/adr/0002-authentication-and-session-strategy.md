# ADR 0002: Opaque bearer sessions for the first authentication slice

- **Status:** Accepted for the first authenticated API slice
- **Date:** 2026-10-13
- **Scope:** `apps/api/src/auth`, `/api/v1/auth`

## Context

Account, donor, listing-management, moderation, and admin operations require a
server-enforced identity boundary. No identity provider or session strategy
was configured in the repository. The first slice needs revocation and simple
resource authorization without putting signing secrets into a mobile client.

## Decision

Use local email/password registration with passwords hashed by Node's scrypt
implementation. Generate random opaque bearer tokens at login, store only a
SHA-256 token hash in PostgreSQL, and return the token once in the login
response. Sessions have a bounded expiry, can be revoked by logout, and are
rejected when the user is not `ACTIVE`.

Protected routes require `Authorization: Bearer <token>`. The server resolves
the current user from the session row; clients cannot supply user IDs, roles,
status, or ownership as authorization claims.

Registration, login, and all auth routes have a rate limiter. Invalid login
responses do not disclose whether an email exists. Password hashes, bearer
tokens, and authentication payloads are not logged or returned from public
responses.

## Alternatives considered

- **Signed JWT access and refresh tokens:** deferred because revocation and
  key-management requirements add complexity before a provider/deployment
  boundary is selected.
- **Third-party identity provider:** pending a product decision, provider
  review, and production credentials.
- **Cookie sessions:** suitable for a same-origin web app, but the shared
  Flutter API also needs a bearer-compatible client contract. Web cookie or
  BFF adoption can be added later with CSRF review.

## Consequences and limits

- Session records are easy to revoke and audit, but require database access on
  protected requests.
- The token is an application secret; future Flutter/web clients must use
  platform-protected storage and clear it on logout/session expiry.
- Email verification, account recovery, MFA, password reset, and fine-grained
  role/permission actions are not implemented by this ADR and remain release
  blockers for privileged or sensitive workflows. A coarse server-side admin
  role boundary exists only to support the next implementation phase.
