-- Migration: mfa_and_session_mfa
-- Adds TOTP multi-factor credentials for privileged accounts.
--
-- - Session.mfaVerifiedAt records that the session holder completed a TOTP
--   or recovery-code challenge; staff routes reject sessions without it.
-- - MfaCredential stores only AES-256-GCM ciphertext, IV, and auth tag of
--   the TOTP shared secret (encrypted with MFA_ENCRYPTION_KEY).
-- - MfaRecoveryCode stores single-use recovery codes as SHA-256 hashes.

ALTER TABLE "Session" ADD COLUMN "mfaVerifiedAt" TIMESTAMPTZ(6);

CREATE TABLE "MfaCredential" (
  "id"             UUID          NOT NULL DEFAULT gen_random_uuid(),
  "userId"         UUID          NOT NULL,
  "secretCipher"   BYTEA         NOT NULL,
  "secretIv"       BYTEA         NOT NULL,
  "secretTag"      BYTEA         NOT NULL,
  "enabled"        BOOLEAN       NOT NULL DEFAULT false,
  "activatedAt"    TIMESTAMPTZ(6),
  "lastVerifiedAt" TIMESTAMPTZ(6),
  "createdAt"      TIMESTAMPTZ(6) NOT NULL DEFAULT now(),

  CONSTRAINT "MfaCredential_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "MfaCredential_userId_key" UNIQUE ("userId"),
  CONSTRAINT "MfaCredential_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE INDEX "MfaCredential_enabled_idx" ON "MfaCredential" ("enabled");

CREATE TABLE "MfaRecoveryCode" (
  "id"        UUID          NOT NULL DEFAULT gen_random_uuid(),
  "userId"    UUID          NOT NULL,
  "codeHash"  VARCHAR(128)  NOT NULL,
  "usedAt"    TIMESTAMPTZ(6),
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),

  CONSTRAINT "MfaRecoveryCode_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "MfaRecoveryCode_codeHash_key" UNIQUE ("codeHash"),
  CONSTRAINT "MfaRecoveryCode_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE INDEX "MfaRecoveryCode_userId_idx" ON "MfaRecoveryCode" ("userId");
