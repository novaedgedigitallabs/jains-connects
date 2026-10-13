-- Public temple directory records remain hidden until both publication and
-- verification status are explicitly approved.

CREATE TYPE "OrganizationType" AS ENUM ('TEMPLE_TRUST', 'COMMUNITY_GROUP', 'CHARITY', 'OTHER');
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED', 'SUSPENDED', 'NEEDS_REVIEW');
CREATE TYPE "PublicationStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'UNPUBLISHED', 'ARCHIVED');

CREATE TABLE "Organization" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(200) NOT NULL,
    "slug" VARCHAR(180) NOT NULL,
    "organizationType" "OrganizationType" NOT NULL,
    "description" VARCHAR(4000),
    "publicEmail" VARCHAR(320),
    "publicPhone" VARCHAR(32),
    "websiteUrl" VARCHAR(2048),
    "addressLine1" VARCHAR(250),
    "addressLine2" VARCHAR(250),
    "city" VARCHAR(120),
    "state" VARCHAR(120),
    "postalCode" VARCHAR(20),
    "country" VARCHAR(120),
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "publicationStatus" "PublicationStatus" NOT NULL DEFAULT 'DRAFT',
    "verifiedAt" TIMESTAMPTZ(6),
    "lastReviewedAt" TIMESTAMPTZ(6),
    "createdById" UUID,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Temple" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "organizationId" UUID,
    "name" VARCHAR(200) NOT NULL,
    "slug" VARCHAR(180) NOT NULL,
    "traditionOrLineage" VARCHAR(200),
    "description" VARCHAR(4000),
    "history" VARCHAR(8000),
    "addressLine1" VARCHAR(250),
    "addressLine2" VARCHAR(250),
    "city" VARCHAR(120),
    "state" VARCHAR(120),
    "postalCode" VARCHAR(20),
    "country" VARCHAR(120),
    "timezone" VARCHAR(64),
    "publicEmail" VARCHAR(320),
    "publicPhone" VARCHAR(32),
    "websiteUrl" VARCHAR(2048),
    "darshanInformation" VARCHAR(4000),
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "publicationStatus" "PublicationStatus" NOT NULL DEFAULT 'DRAFT',
    "lastReviewedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "Temple_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");
CREATE INDEX "Organization_publicationStatus_verificationStatus_idx" ON "Organization"("publicationStatus", "verificationStatus");
CREATE INDEX "Organization_city_state_idx" ON "Organization"("city", "state");
CREATE UNIQUE INDEX "Temple_slug_key" ON "Temple"("slug");
CREATE INDEX "Temple_publicationStatus_verificationStatus_idx" ON "Temple"("publicationStatus", "verificationStatus");
CREATE INDEX "Temple_city_state_idx" ON "Temple"("city", "state");
CREATE INDEX "Temple_organizationId_idx" ON "Temple"("organizationId");

ALTER TABLE "Organization"
    ADD CONSTRAINT "Organization_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Temple"
    ADD CONSTRAINT "Temple_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
