-- Initial identity, consent, role, and audit foundation.
-- Sensitive domain tables are intentionally added in reviewed increments.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE "UserStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'DELETION_REQUESTED', 'DELETED');
CREATE TYPE "ProfileVisibility" AS ENUM ('PRIVATE', 'COMMUNITY', 'PUBLIC');
CREATE TYPE "ConsentPurpose" AS ENUM ('BLOOD_DONOR_LISTING', 'CONTACT_SHARING', 'NOTIFICATIONS', 'ANALYTICS');
CREATE TYPE "ConsentStatus" AS ENUM ('GRANTED', 'WITHDRAWN');

CREATE TABLE "User" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" VARCHAR(320),
    "emailNormalized" VARCHAR(320),
    "displayName" VARCHAR(120) NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'PENDING',
    "emailVerifiedAt" TIMESTAMPTZ(6),
    "lastLoginAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UserProfile" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "displayName" VARCHAR(120),
    "city" VARCHAR(120),
    "state" VARCHAR(120),
    "country" VARCHAR(120),
    "bio" VARCHAR(2000),
    "visibility" "ProfileVisibility" NOT NULL DEFAULT 'PRIVATE',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Role" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "key" VARCHAR(64) NOT NULL,
    "displayName" VARCHAR(120) NOT NULL,
    "description" VARCHAR(500),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UserRole" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "roleId" UUID NOT NULL,
    "assignedById" UUID,
    "assignedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMPTZ(6),
    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ConsentRecord" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "purpose" "ConsentPurpose" NOT NULL,
    "policyVersion" VARCHAR(32) NOT NULL,
    "status" "ConsentStatus" NOT NULL,
    "source" VARCHAR(32) NOT NULL,
    "grantedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "withdrawnAt" TIMESTAMPTZ(6),
    CONSTRAINT "ConsentRecord_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AuditEvent" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "actorUserId" UUID,
    "action" VARCHAR(120) NOT NULL,
    "targetType" VARCHAR(80) NOT NULL,
    "targetId" VARCHAR(128),
    "summary" VARCHAR(1000) NOT NULL,
    "requestId" VARCHAR(128),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_emailNormalized_key" ON "User"("emailNormalized");
CREATE INDEX "User_status_createdAt_idx" ON "User"("status", "createdAt");
CREATE UNIQUE INDEX "UserProfile_userId_key" ON "UserProfile"("userId");
CREATE UNIQUE INDEX "Role_key_key" ON "Role"("key");
CREATE UNIQUE INDEX "UserRole_userId_roleId_key" ON "UserRole"("userId", "roleId");
CREATE INDEX "UserRole_userId_revokedAt_idx" ON "UserRole"("userId", "revokedAt");
CREATE INDEX "UserRole_roleId_revokedAt_idx" ON "UserRole"("roleId", "revokedAt");
CREATE INDEX "ConsentRecord_userId_purpose_status_idx" ON "ConsentRecord"("userId", "purpose", "status");
CREATE INDEX "AuditEvent_action_createdAt_idx" ON "AuditEvent"("action", "createdAt");
CREATE INDEX "AuditEvent_targetType_targetId_createdAt_idx" ON "AuditEvent"("targetType", "targetId", "createdAt");
CREATE INDEX "AuditEvent_actorUserId_createdAt_idx" ON "AuditEvent"("actorUserId", "createdAt");

ALTER TABLE "UserProfile"
    ADD CONSTRAINT "UserProfile_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserRole"
    ADD CONSTRAINT "UserRole_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT "UserRole_roleId_fkey"
    FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT "UserRole_assignedById_fkey"
    FOREIGN KEY ("assignedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ConsentRecord"
    ADD CONSTRAINT "ConsentRecord_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AuditEvent"
    ADD CONSTRAINT "AuditEvent_actorUserId_fkey"
    FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
