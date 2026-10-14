-- Migration: email_verification_and_password_reset
-- Adds expiring, single-use token tables for email verification and password
-- recovery. Tokens are stored as SHA-256 hashes; the raw token is never
-- persisted. Each token has a short TTL (24 h for verification, 1 h for
-- reset) and is single-use (usedAt is set on first consumption).
--
-- email_verified is tracked on User.emailVerifiedAt (already present in
-- the schema). This migration does NOT expose tokens or token hashes through
-- any public-facing select — that is enforced in application code.

CREATE TABLE "EmailVerificationToken" (
  "id"         UUID         NOT NULL DEFAULT gen_random_uuid(),
  "userId"     UUID         NOT NULL,
  "tokenHash"  VARCHAR(128) NOT NULL,
  "expiresAt"  TIMESTAMPTZ(6) NOT NULL,
  "usedAt"     TIMESTAMPTZ(6),
  "createdAt"  TIMESTAMPTZ(6) NOT NULL DEFAULT now(),

  CONSTRAINT "EmailVerificationToken_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "EmailVerificationToken_tokenHash_key" UNIQUE ("tokenHash"),
  CONSTRAINT "EmailVerificationToken_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE INDEX "EmailVerificationToken_userId_idx"
  ON "EmailVerificationToken" ("userId");

CREATE INDEX "EmailVerificationToken_expiresAt_idx"
  ON "EmailVerificationToken" ("expiresAt");

CREATE TABLE "PasswordResetToken" (
  "id"         UUID         NOT NULL DEFAULT gen_random_uuid(),
  "userId"     UUID         NOT NULL,
  "tokenHash"  VARCHAR(128) NOT NULL,
  "expiresAt"  TIMESTAMPTZ(6) NOT NULL,
  "usedAt"     TIMESTAMPTZ(6),
  "createdAt"  TIMESTAMPTZ(6) NOT NULL DEFAULT now(),

  CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PasswordResetToken_tokenHash_key" UNIQUE ("tokenHash"),
  CONSTRAINT "PasswordResetToken_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE INDEX "PasswordResetToken_userId_idx"
  ON "PasswordResetToken" ("userId");

CREATE INDEX "PasswordResetToken_expiresAt_idx"
  ON "PasswordResetToken" ("expiresAt");
