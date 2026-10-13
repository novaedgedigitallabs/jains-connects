-- Review history and reports for protected moderation workflows.
-- Evidence files are intentionally not modeled here; no object-storage
-- provider is configured in this repository.

CREATE TYPE "VerificationReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED', 'NEEDS_MORE_INFO');
CREATE TYPE "ReportStatus" AS ENUM ('OPEN', 'IN_REVIEW', 'ACTIONED', 'DISMISSED');

ALTER TABLE "Temple" ADD COLUMN "verifiedAt" TIMESTAMPTZ(6);

CREATE TABLE "VerificationReview" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "templeId" UUID,
    "organizationId" UUID,
    "submittedById" UUID,
    "reviewerId" UUID,
    "status" "VerificationReviewStatus" NOT NULL DEFAULT 'PENDING',
    "reviewNotes" VARCHAR(2000),
    "submittedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "VerificationReview_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "VerificationReview_one_target_check" CHECK (num_nonnulls("templeId", "organizationId") = 1)
);

CREATE TABLE "Report" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "reporterUserId" UUID,
    "templeId" UUID,
    "organizationId" UUID,
    "reasonCode" VARCHAR(64) NOT NULL,
    "description" VARCHAR(2000) NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'OPEN',
    "assignedToId" UUID,
    "resolutionCode" VARCHAR(64),
    "moderatorNotes" VARCHAR(2000),
    "resolvedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "Report_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Report_one_target_check" CHECK (num_nonnulls("templeId", "organizationId") = 1)
);

CREATE INDEX "VerificationReview_status_createdAt_idx" ON "VerificationReview"("status", "createdAt");
CREATE INDEX "VerificationReview_templeId_createdAt_idx" ON "VerificationReview"("templeId", "createdAt");
CREATE INDEX "VerificationReview_organizationId_createdAt_idx" ON "VerificationReview"("organizationId", "createdAt");
CREATE INDEX "VerificationReview_reviewerId_createdAt_idx" ON "VerificationReview"("reviewerId", "createdAt");
CREATE INDEX "Report_status_createdAt_idx" ON "Report"("status", "createdAt");
CREATE INDEX "Report_templeId_createdAt_idx" ON "Report"("templeId", "createdAt");
CREATE INDEX "Report_organizationId_createdAt_idx" ON "Report"("organizationId", "createdAt");
CREATE INDEX "Report_assignedToId_status_idx" ON "Report"("assignedToId", "status");

ALTER TABLE "VerificationReview"
    ADD CONSTRAINT "VerificationReview_templeId_fkey"
    FOREIGN KEY ("templeId") REFERENCES "Temple"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT "VerificationReview_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT "VerificationReview_submittedById_fkey"
    FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    ADD CONSTRAINT "VerificationReview_reviewerId_fkey"
    FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Report"
    ADD CONSTRAINT "Report_reporterUserId_fkey"
    FOREIGN KEY ("reporterUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    ADD CONSTRAINT "Report_assignedToId_fkey"
    FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    ADD CONSTRAINT "Report_templeId_fkey"
    FOREIGN KEY ("templeId") REFERENCES "Temple"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT "Report_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
