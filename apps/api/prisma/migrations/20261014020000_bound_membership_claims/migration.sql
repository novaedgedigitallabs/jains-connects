-- Prevent concurrent or repeated in-review representative claims for the same user and organization.
CREATE UNIQUE INDEX "OrganizationRepresentativeClaim_pending_unique_idx"
ON "OrganizationRepresentativeClaim" ("organizationId", "applicantUserId")
WHERE "status" IN ('PENDING', 'NEEDS_MORE_INFO');
