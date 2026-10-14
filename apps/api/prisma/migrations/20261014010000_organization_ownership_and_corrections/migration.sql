-- Organization-scoped representative access and authenticated corrections.
-- Membership approval does not change organization verification/publication.

CREATE TYPE "OrganizationMembershipRole" AS ENUM ('OWNER', 'MANAGER', 'EDITOR', 'VIEWER');
CREATE TYPE "OrganizationMembershipStatus" AS ENUM ('PENDING', 'ACTIVE', 'REVOKED');
CREATE TYPE "RepresentativeClaimStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'NEEDS_MORE_INFO', 'REVOKED');
CREATE TYPE "CorrectionStatus" AS ENUM ('SUBMITTED', 'IN_REVIEW', 'NEEDS_CHANGES', 'APPROVED', 'REJECTED', 'WITHDRAWN');

CREATE TABLE "OrganizationMember" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organizationId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "membershipRole" "OrganizationMembershipRole" NOT NULL,
    "status" "OrganizationMembershipStatus" NOT NULL DEFAULT 'PENDING',
    "requestedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedById" UUID,
    "approvedAt" TIMESTAMPTZ(6),
    "revokedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "OrganizationMember_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OrganizationRepresentativeClaim" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organizationId" UUID NOT NULL,
    "applicantUserId" UUID NOT NULL,
    "requestedRole" "OrganizationMembershipRole" NOT NULL,
    "applicantStatement" VARCHAR(2000) NOT NULL,
    "sourceUrl" VARCHAR(2048),
    "status" "RepresentativeClaimStatus" NOT NULL DEFAULT 'PENDING',
    "reviewerId" UUID,
    "reviewNotes" VARCHAR(2000),
    "submittedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "OrganizationRepresentativeClaim_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CorrectionRequest" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "submittedById" UUID NOT NULL,
    "templeId" UUID,
    "organizationId" UUID,
    "reasonCode" VARCHAR(64) NOT NULL,
    "description" VARCHAR(2000) NOT NULL,
    "proposedChanges" JSONB,
    "sourceUrl" VARCHAR(2048),
    "status" "CorrectionStatus" NOT NULL DEFAULT 'SUBMITTED',
    "reviewerId" UUID,
    "reviewerNotes" VARCHAR(2000),
    "submittedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMPTZ(6),
    "resolvedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "CorrectionRequest_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "CorrectionRequest_one_target_check" CHECK (num_nonnulls("templeId", "organizationId") = 1)
);

CREATE UNIQUE INDEX "OrganizationMember_organizationId_userId_key" ON "OrganizationMember"("organizationId", "userId");
CREATE INDEX "OrganizationMember_organizationId_status_idx" ON "OrganizationMember"("organizationId", "status");
CREATE INDEX "OrganizationMember_userId_status_idx" ON "OrganizationMember"("userId", "status");
CREATE INDEX "OrganizationRepresentativeClaim_status_submittedAt_idx" ON "OrganizationRepresentativeClaim"("status", "submittedAt");
CREATE INDEX "OrganizationRepresentativeClaim_organizationId_status_idx" ON "OrganizationRepresentativeClaim"("organizationId", "status");
CREATE INDEX "OrganizationRepresentativeClaim_applicantUserId_status_idx" ON "OrganizationRepresentativeClaim"("applicantUserId", "status");
CREATE INDEX "CorrectionRequest_status_submittedAt_idx" ON "CorrectionRequest"("status", "submittedAt");
CREATE INDEX "CorrectionRequest_submittedById_status_idx" ON "CorrectionRequest"("submittedById", "status");
CREATE INDEX "CorrectionRequest_organizationId_status_idx" ON "CorrectionRequest"("organizationId", "status");
CREATE INDEX "CorrectionRequest_templeId_status_idx" ON "CorrectionRequest"("templeId", "status");

ALTER TABLE "OrganizationMember"
    ADD CONSTRAINT "OrganizationMember_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT "OrganizationMember_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT "OrganizationMember_approvedById_fkey"
    FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "OrganizationRepresentativeClaim"
    ADD CONSTRAINT "OrganizationRepresentativeClaim_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT "OrganizationRepresentativeClaim_applicantUserId_fkey"
    FOREIGN KEY ("applicantUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT "OrganizationRepresentativeClaim_reviewerId_fkey"
    FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CorrectionRequest"
    ADD CONSTRAINT "CorrectionRequest_submittedById_fkey"
    FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT "CorrectionRequest_reviewerId_fkey"
    FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    ADD CONSTRAINT "CorrectionRequest_templeId_fkey"
    FOREIGN KEY ("templeId") REFERENCES "Temple"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT "CorrectionRequest_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
