import { Prisma, type PrismaClient } from '@prisma/client';
import {
  assertCorrectionTransition,
  assertPublicationState,
  assertReportResolution,
  assertReportTransition,
  assertVerificationTransition,
  type CorrectionState,
  type PublicationState,
  type ReportState,
  type VerificationState,
} from './state.js';
import { AppError } from '../http/errors.js';
import {
  assertRepresentativeClaimTransition,
  assertRepresentativeEdit,
  assertRepresentativeResourceEditable,
  assertRepresentativeTempleEdit,
  isEligiblePublicOrganization,
  type OrganizationMembershipRole,
  type RepresentativeClaimStatus,
} from '../organizations/access.js';

export type AdminListFilters = {
  verificationStatus?: VerificationState;
  publicationStatus?: PublicationState;
  page: number;
  pageSize: number;
};

export type AdminActor = {
  userId: string;
  requestId: string | null;
};

export interface AdminStore {
  listTemples(filters: AdminListFilters): Promise<{ items: unknown[]; total: number }>;
  createTemple(input: Record<string, unknown>, actor: AdminActor): Promise<unknown>;
  updateTemple(id: string, input: Record<string, unknown>, actor: AdminActor): Promise<unknown>;
  reviewTemple(
    id: string,
    status: VerificationState,
    notes: string | undefined,
    actor: AdminActor,
  ): Promise<unknown>;
  setTemplePublication(id: string, status: PublicationState, actor: AdminActor): Promise<unknown>;
  listOrganizations(filters: AdminListFilters): Promise<{ items: unknown[]; total: number }>;
  createOrganization(input: Record<string, unknown>, actor: AdminActor): Promise<unknown>;
  updateOrganization(
    id: string,
    input: Record<string, unknown>,
    actor: AdminActor,
  ): Promise<unknown>;
  setOrganizationPublication(
    id: string,
    status: PublicationState,
    actor: AdminActor,
  ): Promise<unknown>;
  reviewOrganization(
    id: string,
    status: VerificationState,
    notes: string | undefined,
    actor: AdminActor,
  ): Promise<unknown>;
  listAuditEvents(page: number, pageSize: number): Promise<{ items: unknown[]; total: number }>;
  createTempleReport(
    templeId: string,
    input: { reasonCode: string; description: string },
    reporterUserId: string,
  ): Promise<{ id: string; status: string } | null>;
  createOrganizationReport(
    organizationId: string,
    input: { reasonCode: string; description: string },
    reporterUserId: string,
  ): Promise<{ id: string; status: string } | null>;
  listReports(
    status: string | undefined,
    page: number,
    pageSize: number,
  ): Promise<{ items: unknown[]; total: number }>;
  updateReport(
    id: string,
    input: {
      status: 'OPEN' | 'IN_REVIEW' | 'ACTIONED' | 'DISMISSED';
      resolutionCode?: string;
      moderatorNotes?: string;
    },
    actor: AdminActor,
  ): Promise<unknown>;
  submitRepresentativeClaim(
    organizationId: string,
    input: {
      requestedRole: OrganizationMembershipRole;
      applicantStatement: string;
      sourceUrl?: string;
    },
    applicantUserId: string,
  ): Promise<unknown>;
  listOrganizationMemberships(
    userId: string,
    page?: number,
    pageSize?: number,
  ): Promise<unknown[] | { items: unknown[]; total: number }>;
  listRepresentativeClaims(
    userId: string,
    page?: number,
    pageSize?: number,
  ): Promise<unknown[] | { items: unknown[]; total: number }>;
  getOrganizationAsMember?(organizationId: string, userId: string): Promise<unknown>;
  getTempleAsMember?(templeId: string, userId: string): Promise<unknown>;
  listTemplesAsMember?(
    organizationId: string,
    userId: string,
    page: number,
    pageSize: number,
  ): Promise<{ items: unknown[]; total: number } | null>;
  listAdminRepresentativeClaims(
    status: string | undefined,
    page: number,
    pageSize: number,
  ): Promise<{ items: unknown[]; total: number }>;
  decideRepresentativeClaim(
    id: string,
    status: 'APPROVED' | 'REJECTED' | 'NEEDS_MORE_INFO' | 'REVOKED',
    notes: string | undefined,
    actor: AdminActor,
  ): Promise<unknown>;
  revokeOrganizationMember(
    organizationId: string,
    memberId: string,
    actor: AdminActor,
  ): Promise<unknown>;
  updateOrganizationAsMember(
    id: string,
    input: Record<string, unknown>,
    actor: AdminActor,
  ): Promise<unknown>;
  updateTempleAsMember(
    id: string,
    input: Record<string, unknown>,
    actor: AdminActor,
  ): Promise<unknown>;
  createCorrection(
    target: { organizationId?: string; templeId?: string },
    input: {
      reasonCode: string;
      description: string;
      proposedChanges?: Record<string, string>;
      sourceUrl?: string;
    },
    submittedById: string,
  ): Promise<unknown>;
  listMyReports(
    userId: string,
    page?: number,
    pageSize?: number,
  ): Promise<{ items: unknown[]; total: number }>;
  listMyCorrections(
    userId: string,
    page?: number,
    pageSize?: number,
  ): Promise<{ items: unknown[]; total: number }>;
  listCorrections(
    status: string | undefined,
    page: number,
    pageSize: number,
  ): Promise<{ items: unknown[]; total: number }>;
  updateCorrection(
    id: string,
    input: {
      status: CorrectionState;
      reviewerNotes?: string;
    },
    actor: AdminActor,
  ): Promise<unknown>;
}

const adminTempleSelect = {
  id: true,
  organizationId: true,
  name: true,
  slug: true,
  traditionOrLineage: true,
  description: true,
  history: true,
  addressLine1: true,
  addressLine2: true,
  city: true,
  state: true,
  postalCode: true,
  country: true,
  timezone: true,
  publicEmail: true,
  publicPhone: true,
  websiteUrl: true,
  darshanInformation: true,
  verificationStatus: true,
  publicationStatus: true,
  verifiedAt: true,
  lastReviewedAt: true,
  createdAt: true,
  updatedAt: true,
  organization: { select: { id: true, name: true, slug: true } },
  verificationReviews: {
    orderBy: { createdAt: 'desc' as const },
    take: 5,
    select: {
      id: true,
      status: true,
      reviewNotes: true,
      submittedAt: true,
      reviewedAt: true,
      reviewer: { select: { id: true, displayName: true } },
    },
  },
} satisfies Prisma.TempleSelect;

const adminOrganizationSelect = {
  id: true,
  name: true,
  slug: true,
  organizationType: true,
  description: true,
  publicEmail: true,
  publicPhone: true,
  websiteUrl: true,
  addressLine1: true,
  addressLine2: true,
  city: true,
  state: true,
  postalCode: true,
  country: true,
  verificationStatus: true,
  publicationStatus: true,
  verifiedAt: true,
  lastReviewedAt: true,
  createdById: true,
  createdAt: true,
  updatedAt: true,
  verificationReviews: {
    orderBy: { createdAt: 'desc' as const },
    take: 5,
    select: {
      id: true,
      status: true,
      reviewNotes: true,
      submittedAt: true,
      reviewedAt: true,
      reviewer: { select: { id: true, displayName: true } },
    },
  },
} satisfies Prisma.OrganizationSelect;

const representativeOrganizationSelect = {
  id: true,
  name: true,
  slug: true,
  organizationType: true,
  description: true,
  publicEmail: true,
  publicPhone: true,
  websiteUrl: true,
  addressLine1: true,
  addressLine2: true,
  city: true,
  state: true,
  postalCode: true,
  country: true,
  verificationStatus: true,
  publicationStatus: true,
  verifiedAt: true,
  lastReviewedAt: true,
  updatedAt: true,
} satisfies Prisma.OrganizationSelect;

const representativeTempleSelect = {
  id: true,
  organizationId: true,
  name: true,
  slug: true,
  traditionOrLineage: true,
  description: true,
  history: true,
  addressLine1: true,
  addressLine2: true,
  city: true,
  state: true,
  postalCode: true,
  country: true,
  timezone: true,
  publicEmail: true,
  publicPhone: true,
  websiteUrl: true,
  darshanInformation: true,
  verificationStatus: true,
  publicationStatus: true,
  verifiedAt: true,
  lastReviewedAt: true,
  updatedAt: true,
} satisfies Prisma.TempleSelect;

function auditSummary(
  action: string,
  targetType: string,
  targetId: string,
  details: string,
): string {
  return `${action} ${targetType} ${targetId}: ${details}`.slice(0, 1000);
}

function withoutUndefined<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined)) as T;
}

type LockedOrganization = {
  verificationStatus: string;
  publicationStatus: string;
};

type LockedMembership = {
  id: string;
  userId: string;
  membershipRole: OrganizationMembershipRole;
};

type LockedMemberStatus = LockedMembership & { status: string };

type LockedTemple = {
  organizationId: string | null;
  verificationStatus: string;
  publicationStatus: string;
};

type LockedClaim = {
  id: string;
  organizationId: string;
  applicantUserId: string;
  requestedRole: OrganizationMembershipRole;
  status: RepresentativeClaimStatus;
  reviewedAt: Date | null;
};

async function lockOrganization(
  tx: Prisma.TransactionClient,
  organizationId: string,
): Promise<LockedOrganization | null> {
  const rows = await tx.$queryRaw<LockedOrganization[]>`
    SELECT
      "verificationStatus"::text AS "verificationStatus",
      "publicationStatus"::text AS "publicationStatus"
    FROM "Organization"
    WHERE "id" = ${organizationId}::uuid
    FOR UPDATE
  `;
  return rows[0] ?? null;
}

async function lockActiveMembership(
  tx: Prisma.TransactionClient,
  organizationId: string,
  userId: string,
): Promise<LockedMembership | null> {
  const rows = await tx.$queryRaw<LockedMembership[]>`
    SELECT
      member."id",
      member."userId",
      member."membershipRole"::text AS "membershipRole"
    FROM "OrganizationMember" AS member
    INNER JOIN "User" AS member_user ON member_user."id" = member."userId"
    WHERE member."organizationId" = ${organizationId}::uuid
      AND member."userId" = ${userId}::uuid
      AND member."status" = 'ACTIVE'::"OrganizationMembershipStatus"
      AND member."approvedAt" IS NOT NULL
      AND member_user."status" = 'ACTIVE'::"UserStatus"
    FOR UPDATE OF member
  `;
  return rows[0] ?? null;
}

async function lockOrganizationMember(
  tx: Prisma.TransactionClient,
  organizationId: string,
  memberId: string,
): Promise<LockedMemberStatus | null> {
  const rows = await tx.$queryRaw<LockedMemberStatus[]>`
    SELECT
      "id",
      "userId",
      "membershipRole"::text AS "membershipRole",
      "status"::text AS "status"
    FROM "OrganizationMember"
    WHERE "organizationId" = ${organizationId}::uuid
      AND "id" = ${memberId}::uuid
    FOR UPDATE
  `;
  return rows[0] ?? null;
}

async function lockTemple(
  tx: Prisma.TransactionClient,
  templeId: string,
): Promise<LockedTemple | null> {
  const rows = await tx.$queryRaw<LockedTemple[]>`
    SELECT
      "organizationId",
      "verificationStatus"::text AS "verificationStatus",
      "publicationStatus"::text AS "publicationStatus"
    FROM "Temple"
    WHERE "id" = ${templeId}::uuid
    FOR UPDATE
  `;
  return rows[0] ?? null;
}

async function lockClaim(
  tx: Prisma.TransactionClient,
  claimId: string,
): Promise<LockedClaim | null> {
  const rows = await tx.$queryRaw<LockedClaim[]>`
    SELECT
      "id",
      "organizationId",
      "applicantUserId",
      "requestedRole"::text AS "requestedRole",
      "status"::text AS "status",
      "reviewedAt"
    FROM "OrganizationRepresentativeClaim"
    WHERE "id" = ${claimId}::uuid
    FOR UPDATE
  `;
  return rows[0] ?? null;
}

function isPrismaError(error: unknown, code: string): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === code;
}

async function runMembershipTransaction<T>(
  client: PrismaClient,
  callback: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  try {
    return await client.$transaction(callback, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });
  } catch (error) {
    if (isPrismaError(error, 'P2034')) {
      throw new AppError(
        409,
        'MEMBERSHIP_CONFLICT',
        'The membership changed while this action was being processed; please retry',
      );
    }
    throw error;
  }
}

export class PrismaAdminStore implements AdminStore {
  public constructor(private readonly client: PrismaClient) {}

  public async listTemples(filters: AdminListFilters) {
    const where: Prisma.TempleWhereInput = {
      ...(filters.verificationStatus ? { verificationStatus: filters.verificationStatus } : {}),
      ...(filters.publicationStatus ? { publicationStatus: filters.publicationStatus } : {}),
    };
    const [items, total] = await Promise.all([
      this.client.temple.findMany({
        where,
        orderBy: [{ updatedAt: 'desc' }, { id: 'asc' }],
        skip: (filters.page - 1) * filters.pageSize,
        take: filters.pageSize,
        select: adminTempleSelect,
      }),
      this.client.temple.count({ where }),
    ]);
    return { items, total };
  }

  public async createTemple(input: Record<string, unknown>, actor: AdminActor) {
    const temple = await this.client.$transaction(async (tx) => {
      const created = await tx.temple.create({
        data: withoutUndefined({
          name: input.name as string,
          slug: input.slug as string,
          organizationId: input.organizationId as string | null | undefined,
          traditionOrLineage: input.traditionOrLineage as string | null | undefined,
          description: input.description as string | null | undefined,
          history: input.history as string | null | undefined,
          addressLine1: input.addressLine1 as string | null | undefined,
          addressLine2: input.addressLine2 as string | null | undefined,
          city: input.city as string | null | undefined,
          state: input.state as string | null | undefined,
          postalCode: input.postalCode as string | null | undefined,
          country: input.country as string | null | undefined,
          timezone: input.timezone as string | null | undefined,
          publicEmail: input.publicEmail as string | null | undefined,
          publicPhone: input.publicPhone as string | null | undefined,
          websiteUrl: input.websiteUrl as string | null | undefined,
          darshanInformation: input.darshanInformation as string | null | undefined,
          verificationStatus: 'PENDING',
          publicationStatus: 'DRAFT',
        }) as Prisma.TempleUncheckedCreateInput,
        select: adminTempleSelect,
      });
      await tx.auditEvent.create({
        data: {
          actorUserId: actor.userId,
          action: 'TEMPLE_CREATED',
          targetType: 'TEMPLE',
          targetId: created.id,
          summary: auditSummary(
            'TEMPLE_CREATED',
            'TEMPLE',
            created.id,
            'Created as pending and draft',
          ),
          requestId: actor.requestId,
        },
      });
      return created;
    });
    return temple;
  }

  public async updateTemple(id: string, input: Record<string, unknown>, actor: AdminActor) {
    const data: Record<string, unknown> = {};
    const editableFields = [
      'name',
      'slug',
      'organizationId',
      'traditionOrLineage',
      'description',
      'history',
      'addressLine1',
      'addressLine2',
      'city',
      'state',
      'postalCode',
      'country',
      'timezone',
      'publicEmail',
      'publicPhone',
      'websiteUrl',
      'darshanInformation',
    ] as const;
    for (const field of editableFields) {
      if (field in input) (data as Record<string, unknown>)[field] = input[field];
    }

    return this.client.$transaction(async (tx) => {
      const current = await tx.temple.findUnique({ where: { id }, select: { id: true } });
      if (!current) return null;
      const updated = await tx.temple.update({
        where: { id },
        data: data as Prisma.TempleUncheckedUpdateInput,
        select: adminTempleSelect,
      });
      await tx.auditEvent.create({
        data: {
          actorUserId: actor.userId,
          action: 'TEMPLE_UPDATED',
          targetType: 'TEMPLE',
          targetId: id,
          summary: auditSummary(
            'TEMPLE_UPDATED',
            'TEMPLE',
            id,
            `Updated fields: ${Object.keys(data).join(', ') || 'none'}`,
          ),
          requestId: actor.requestId,
        },
      });
      return updated;
    });
  }

  public async reviewTemple(
    id: string,
    status: VerificationState,
    notes: string | undefined,
    actor: AdminActor,
  ) {
    return this.client.$transaction(async (tx) => {
      const current = await tx.temple.findUnique({
        where: { id },
        select: { verificationStatus: true },
      });
      if (!current) return null;
      assertVerificationTransition(current.verificationStatus, status);
      const now = new Date();
      const updateData: Prisma.TempleUncheckedUpdateInput = {
        verificationStatus: status,
        verifiedAt: status === 'VERIFIED' ? now : null,
        lastReviewedAt: now,
      };
      if (status !== 'VERIFIED') updateData.publicationStatus = 'UNPUBLISHED';
      const updated = await tx.temple.update({
        where: { id },
        data: updateData,
        select: adminTempleSelect,
      });
      await tx.verificationReview.create({
        data: {
          templeId: id,
          reviewerId: actor.userId,
          status:
            status === 'VERIFIED'
              ? 'APPROVED'
              : status === 'NEEDS_REVIEW'
                ? 'NEEDS_MORE_INFO'
                : status,
          reviewNotes: notes ?? null,
          reviewedAt: now,
        },
      });
      await tx.auditEvent.create({
        data: {
          actorUserId: actor.userId,
          action: `TEMPLE_VERIFICATION_${status}`,
          targetType: 'TEMPLE',
          targetId: id,
          summary: auditSummary(
            `TEMPLE_VERIFICATION_${status}`,
            'TEMPLE',
            id,
            notes ? 'Review decision recorded with restricted note' : 'Review decision recorded',
          ),
          requestId: actor.requestId,
        },
      });
      return updated;
    });
  }

  public async setTemplePublication(id: string, status: PublicationState, actor: AdminActor) {
    return this.client.$transaction(async (tx) => {
      const current = await tx.temple.findUnique({
        where: { id },
        select: { verificationStatus: true },
      });
      if (!current) return null;
      assertPublicationState(current.verificationStatus, status);
      const updated = await tx.temple.update({
        where: { id },
        data: { publicationStatus: status },
        select: adminTempleSelect,
      });
      await tx.auditEvent.create({
        data: {
          actorUserId: actor.userId,
          action: `TEMPLE_PUBLICATION_${status}`,
          targetType: 'TEMPLE',
          targetId: id,
          summary: auditSummary(
            `TEMPLE_PUBLICATION_${status}`,
            'TEMPLE',
            id,
            'Publication state changed',
          ),
          requestId: actor.requestId,
        },
      });
      return updated;
    });
  }

  public async listOrganizations(filters: AdminListFilters) {
    const where: Prisma.OrganizationWhereInput = {
      ...(filters.verificationStatus ? { verificationStatus: filters.verificationStatus } : {}),
      ...(filters.publicationStatus ? { publicationStatus: filters.publicationStatus } : {}),
    };
    const [items, total] = await Promise.all([
      this.client.organization.findMany({
        where,
        orderBy: [{ updatedAt: 'desc' }, { id: 'asc' }],
        skip: (filters.page - 1) * filters.pageSize,
        take: filters.pageSize,
        select: adminOrganizationSelect,
      }),
      this.client.organization.count({ where }),
    ]);
    return { items, total };
  }

  public async createOrganization(input: Record<string, unknown>, actor: AdminActor) {
    return this.client.$transaction(async (tx) => {
      const created = await tx.organization.create({
        data: withoutUndefined({
          name: input.name as string,
          slug: input.slug as string,
          organizationType: input.organizationType as
            'TEMPLE_TRUST' | 'COMMUNITY_GROUP' | 'CHARITY' | 'OTHER',
          description: input.description as string | null | undefined,
          publicEmail: input.publicEmail as string | null | undefined,
          publicPhone: input.publicPhone as string | null | undefined,
          websiteUrl: input.websiteUrl as string | null | undefined,
          addressLine1: input.addressLine1 as string | null | undefined,
          addressLine2: input.addressLine2 as string | null | undefined,
          city: input.city as string | null | undefined,
          state: input.state as string | null | undefined,
          postalCode: input.postalCode as string | null | undefined,
          country: input.country as string | null | undefined,
          createdById: actor.userId,
          verificationStatus: 'PENDING',
          publicationStatus: 'DRAFT',
        }) as Prisma.OrganizationUncheckedCreateInput,
        select: adminOrganizationSelect,
      });
      await tx.auditEvent.create({
        data: {
          actorUserId: actor.userId,
          action: 'ORGANIZATION_CREATED',
          targetType: 'ORGANIZATION',
          targetId: created.id,
          summary: auditSummary(
            'ORGANIZATION_CREATED',
            'ORGANIZATION',
            created.id,
            'Created as pending and draft',
          ),
          requestId: actor.requestId,
        },
      });
      return created;
    });
  }

  public async reviewOrganization(
    id: string,
    status: VerificationState,
    notes: string | undefined,
    actor: AdminActor,
  ) {
    return this.client.$transaction(async (tx) => {
      const current = await tx.organization.findUnique({
        where: { id },
        select: { verificationStatus: true },
      });
      if (!current) return null;
      assertVerificationTransition(current.verificationStatus, status);
      const now = new Date();
      const updateData: Prisma.OrganizationUncheckedUpdateInput = {
        verificationStatus: status,
        verifiedAt: status === 'VERIFIED' ? now : null,
        lastReviewedAt: now,
      };
      if (status !== 'VERIFIED') updateData.publicationStatus = 'UNPUBLISHED';
      const updated = await tx.organization.update({
        where: { id },
        data: updateData,
        select: adminOrganizationSelect,
      });
      await tx.verificationReview.create({
        data: {
          organizationId: id,
          reviewerId: actor.userId,
          status:
            status === 'VERIFIED'
              ? 'APPROVED'
              : status === 'NEEDS_REVIEW'
                ? 'NEEDS_MORE_INFO'
                : status,
          reviewNotes: notes ?? null,
          reviewedAt: now,
        },
      });
      await tx.auditEvent.create({
        data: {
          actorUserId: actor.userId,
          action: `ORGANIZATION_VERIFICATION_${status}`,
          targetType: 'ORGANIZATION',
          targetId: id,
          summary: auditSummary(
            `ORGANIZATION_VERIFICATION_${status}`,
            'ORGANIZATION',
            id,
            notes ? 'Review decision recorded with restricted note' : 'Review decision recorded',
          ),
          requestId: actor.requestId,
        },
      });
      return updated;
    });
  }

  public async setOrganizationPublication(id: string, status: PublicationState, actor: AdminActor) {
    return this.client.$transaction(async (tx) => {
      const current = await tx.organization.findUnique({
        where: { id },
        select: { verificationStatus: true },
      });
      if (!current) return null;
      assertPublicationState(current.verificationStatus, status);
      const updated = await tx.organization.update({
        where: { id },
        data: { publicationStatus: status },
        select: adminOrganizationSelect,
      });
      await tx.auditEvent.create({
        data: {
          actorUserId: actor.userId,
          action: `ORGANIZATION_PUBLICATION_${status}`,
          targetType: 'ORGANIZATION',
          targetId: id,
          summary: auditSummary(
            `ORGANIZATION_PUBLICATION_${status}`,
            'ORGANIZATION',
            id,
            'Publication state changed',
          ),
          requestId: actor.requestId,
        },
      });
      return updated;
    });
  }

  public async updateOrganization(id: string, input: Record<string, unknown>, actor: AdminActor) {
    const data: Record<string, unknown> = {};
    const editableFields = [
      'name',
      'slug',
      'organizationType',
      'description',
      'publicEmail',
      'publicPhone',
      'websiteUrl',
      'addressLine1',
      'addressLine2',
      'city',
      'state',
      'postalCode',
      'country',
    ] as const;
    for (const field of editableFields) {
      if (field in input) (data as Record<string, unknown>)[field] = input[field];
    }

    return this.client.$transaction(async (tx) => {
      const current = await tx.organization.findUnique({
        where: { id },
        select: { id: true, verificationStatus: true, publicationStatus: true },
      });
      if (!current) return null;
      const wasPubliclyReviewed =
        current.verificationStatus === 'VERIFIED' || current.publicationStatus === 'PUBLISHED';
      if (Object.keys(data).length > 0 && wasPubliclyReviewed) {
        data.verificationStatus = 'NEEDS_REVIEW';
        data.publicationStatus = 'UNPUBLISHED';
        data.verifiedAt = null;
      }
      const updated = await tx.organization.update({
        where: { id },
        data: data as Prisma.OrganizationUncheckedUpdateInput,
        select: adminOrganizationSelect,
      });
      await tx.auditEvent.create({
        data: {
          actorUserId: actor.userId,
          action: 'ORGANIZATION_UPDATED',
          targetType: 'ORGANIZATION',
          targetId: id,
          summary: auditSummary(
            'ORGANIZATION_UPDATED',
            'ORGANIZATION',
            id,
            `Updated fields: ${Object.keys(data).join(', ') || 'none'}${
              wasPubliclyReviewed ? '; moved to review and unpublished' : ''
            }`,
          ),
          requestId: actor.requestId,
        },
      });
      return updated;
    });
  }

  public async listAuditEvents(page: number, pageSize: number) {
    const [items, total] = await Promise.all([
      this.client.auditEvent.findMany({
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          action: true,
          targetType: true,
          targetId: true,
          summary: true,
          requestId: true,
          createdAt: true,
          actorUser: { select: { id: true, displayName: true, email: true } },
        },
      }),
      this.client.auditEvent.count(),
    ]);
    return { items, total };
  }

  public async createTempleReport(
    templeId: string,
    input: { reasonCode: string; description: string },
    reporterUserId: string,
  ) {
    return this.client.$transaction(async (tx) => {
      const temple = await tx.temple.findFirst({
        where: { id: templeId, verificationStatus: 'VERIFIED', publicationStatus: 'PUBLISHED' },
        select: { id: true },
      });
      if (!temple) return null;
      const duplicate = await tx.report.findFirst({
        where: { templeId, reporterUserId, status: { in: ['OPEN', 'IN_REVIEW'] } },
        select: { id: true },
      });
      if (duplicate)
        throw new AppError(
          409,
          'DUPLICATE_REPORT',
          'You already have an open report for this record',
        );
      const created = await tx.report.create({
        data: {
          templeId,
          reporterUserId,
          reasonCode: input.reasonCode,
          description: input.description,
        },
        select: { id: true, status: true },
      });
      await tx.auditEvent.create({
        data: {
          actorUserId: reporterUserId,
          action: 'REPORT_CREATED',
          targetType: 'TEMPLE',
          targetId: templeId,
          summary: auditSummary(
            'REPORT_CREATED',
            'TEMPLE',
            templeId,
            'Authenticated report submitted',
          ),
        },
      });
      return created;
    });
  }

  public async createOrganizationReport(
    organizationId: string,
    input: { reasonCode: string; description: string },
    reporterUserId: string,
  ) {
    return this.client.$transaction(async (tx) => {
      const organization = await tx.organization.findFirst({
        where: {
          id: organizationId,
          verificationStatus: 'VERIFIED',
          publicationStatus: 'PUBLISHED',
        },
        select: { id: true },
      });
      if (!organization) return null;
      const duplicate = await tx.report.findFirst({
        where: { organizationId, reporterUserId, status: { in: ['OPEN', 'IN_REVIEW'] } },
        select: { id: true },
      });
      if (duplicate)
        throw new AppError(
          409,
          'DUPLICATE_REPORT',
          'You already have an open report for this record',
        );
      const created = await tx.report.create({
        data: {
          organizationId,
          reporterUserId,
          reasonCode: input.reasonCode,
          description: input.description,
        },
        select: { id: true, status: true },
      });
      await tx.auditEvent.create({
        data: {
          actorUserId: reporterUserId,
          action: 'REPORT_CREATED',
          targetType: 'ORGANIZATION',
          targetId: organizationId,
          summary: auditSummary(
            'REPORT_CREATED',
            'ORGANIZATION',
            organizationId,
            'Authenticated report submitted',
          ),
        },
      });
      return created;
    });
  }

  public async listReports(status: string | undefined, page: number, pageSize: number) {
    const where = status
      ? { status: status as 'OPEN' | 'IN_REVIEW' | 'ACTIONED' | 'DISMISSED' }
      : {};
    const [items, total] = await Promise.all([
      this.client.report.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          reasonCode: true,
          description: true,
          status: true,
          resolutionCode: true,
          moderatorNotes: true,
          resolvedAt: true,
          createdAt: true,
          reporter: { select: { id: true, displayName: true } },
          assignee: { select: { id: true, displayName: true } },
          temple: { select: { id: true, name: true, slug: true } },
          organization: { select: { id: true, name: true, slug: true } },
        },
      }),
      this.client.report.count({ where }),
    ]);
    return { items, total };
  }

  public async updateReport(
    id: string,
    input: {
      status: 'OPEN' | 'IN_REVIEW' | 'ACTIONED' | 'DISMISSED';
      resolutionCode?: string;
      moderatorNotes?: string;
    },
    actor: AdminActor,
  ) {
    return this.client.$transaction(async (tx) => {
      const current = await tx.report.findUnique({
        where: { id },
        select: { id: true, status: true, resolutionCode: true },
      });
      if (!current) return null;
      const resolved = input.status === 'ACTIONED' || input.status === 'DISMISSED';
      assertReportTransition(current.status as ReportState, input.status as ReportState);
      // Closing a report must record a deliberate, current moderation outcome.
      // Reopening clears the prior outcome so it cannot be silently reused.
      const resolutionCode = resolved ? input.resolutionCode : null;
      assertReportResolution(input.status as ReportState, resolutionCode);
      const updated = await tx.report.update({
        where: { id },
        data: withoutUndefined({
          status: input.status,
          resolutionCode,
          moderatorNotes: input.moderatorNotes,
          resolvedAt: resolved ? new Date() : null,
          assignedToId: actor.userId,
        }) as Prisma.ReportUncheckedUpdateInput,
      });
      await tx.auditEvent.create({
        data: {
          actorUserId: actor.userId,
          action: `REPORT_${input.status}`,
          targetType: 'REPORT',
          targetId: id,
          summary: auditSummary(`REPORT_${input.status}`, 'REPORT', id, 'Moderation state changed'),
          requestId: actor.requestId,
        },
      });
      return updated;
    });
  }

  public async submitRepresentativeClaim(
    organizationId: string,
    input: {
      requestedRole: OrganizationMembershipRole;
      applicantStatement: string;
      sourceUrl?: string;
    },
    applicantUserId: string,
  ) {
    try {
      return await runMembershipTransaction(this.client, async (tx) => {
        const organization = await lockOrganization(tx, organizationId);
        if (!organization) return null;
        if (
          !isEligiblePublicOrganization(
            organization.verificationStatus,
            organization.publicationStatus,
          )
        ) {
          return null;
        }
        const applicant = await tx.user.findUnique({
          where: { id: applicantUserId },
          select: { status: true },
        });
        if (applicant?.status !== 'ACTIVE') {
          throw new AppError(403, 'USER_NOT_ACTIVE', 'An active user account is required');
        }
        const activeMembership = await tx.organizationMember.findFirst({
          where: {
            organizationId,
            userId: applicantUserId,
            status: 'ACTIVE',
            approvedAt: { not: null },
          },
          select: { id: true },
        });
        if (activeMembership) {
          throw new AppError(
            409,
            'ALREADY_ORGANIZATION_MEMBER',
            'You already have active representative access to this organization',
          );
        }
        const existing = await tx.organizationRepresentativeClaim.findFirst({
          where: {
            organizationId,
            applicantUserId,
            status: { in: ['PENDING', 'NEEDS_MORE_INFO'] },
          },
          select: { id: true },
        });
        if (existing)
          throw new AppError(
            409,
            'DUPLICATE_CLAIM',
            'You already have a representative claim in review',
          );
        const claim = await tx.organizationRepresentativeClaim.create({
          data: {
            organizationId,
            applicantUserId,
            requestedRole: input.requestedRole,
            applicantStatement: input.applicantStatement,
            sourceUrl: input.sourceUrl ?? null,
          },
          select: {
            id: true,
            organizationId: true,
            requestedRole: true,
            status: true,
            submittedAt: true,
          },
        });
        await tx.auditEvent.create({
          data: {
            actorUserId: applicantUserId,
            action: 'REPRESENTATIVE_CLAIM_SUBMITTED',
            targetType: 'ORGANIZATION',
            targetId: organizationId,
            summary: auditSummary(
              'REPRESENTATIVE_CLAIM_SUBMITTED',
              'ORGANIZATION',
              organizationId,
              'Representative claim submitted',
            ),
          },
        });
        return claim;
      });
    } catch (error) {
      if (isPrismaError(error, 'P2002')) {
        throw new AppError(
          409,
          'DUPLICATE_CLAIM',
          'You already have a representative claim in review',
        );
      }
      throw error;
    }
  }

  public async listOrganizationMemberships(userId: string, page = 1, pageSize = 20) {
    const where = { userId };
    const [items, total] = await Promise.all([
      this.client.organizationMember.findMany({
        where,
        orderBy: [{ updatedAt: 'desc' }, { id: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          organizationId: true,
          membershipRole: true,
          status: true,
          approvedAt: true,
          revokedAt: true,
          organization: {
            select: { name: true, slug: true, verificationStatus: true, publicationStatus: true },
          },
        },
      }),
      this.client.organizationMember.count({ where }),
    ]);
    return { items, total };
  }

  public async listRepresentativeClaims(userId: string, page = 1, pageSize = 20) {
    const where = { applicantUserId: userId };
    const [items, total] = await Promise.all([
      this.client.organizationRepresentativeClaim.findMany({
        where,
        orderBy: [{ submittedAt: 'desc' }, { id: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          organizationId: true,
          requestedRole: true,
          status: true,
          applicantStatement: true,
          submittedAt: true,
          reviewedAt: true,
          organization: { select: { name: true, slug: true } },
        },
      }),
      this.client.organizationRepresentativeClaim.count({ where }),
    ]);
    return { items, total };
  }

  public async getOrganizationAsMember(organizationId: string, userId: string) {
    return this.client.organization.findFirst({
      where: {
        id: organizationId,
        members: {
          some: {
            userId,
            status: 'ACTIVE',
            approvedAt: { not: null },
            user: { is: { status: 'ACTIVE' } },
          },
        },
      },
      select: representativeOrganizationSelect,
    });
  }

  public async getTempleAsMember(templeId: string, userId: string) {
    return this.client.temple.findFirst({
      where: {
        id: templeId,
        organization: {
          is: {
            members: {
              some: {
                userId,
                status: 'ACTIVE',
                approvedAt: { not: null },
                user: { is: { status: 'ACTIVE' } },
              },
            },
          },
        },
      },
      select: representativeTempleSelect,
    });
  }

  public async listTemplesAsMember(
    organizationId: string,
    userId: string,
    page: number,
    pageSize: number,
  ) {
    const membership = await this.client.organizationMember.findFirst({
      where: {
        organizationId,
        userId,
        status: 'ACTIVE',
        approvedAt: { not: null },
        user: { is: { status: 'ACTIVE' } },
      },
      select: { id: true },
    });
    if (!membership) return null;
    const where = { organizationId };
    const [items, total] = await Promise.all([
      this.client.temple.findMany({
        where,
        orderBy: [{ updatedAt: 'desc' }, { id: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: representativeTempleSelect,
      }),
      this.client.temple.count({ where }),
    ]);
    return { items, total };
  }

  public async listAdminRepresentativeClaims(
    status: string | undefined,
    page: number,
    pageSize: number,
  ) {
    const where = status
      ? { status: status as 'PENDING' | 'APPROVED' | 'REJECTED' | 'NEEDS_MORE_INFO' | 'REVOKED' }
      : {};
    const [items, total] = await Promise.all([
      this.client.organizationRepresentativeClaim.findMany({
        where,
        orderBy: [{ submittedAt: 'asc' }, { id: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          organizationId: true,
          requestedRole: true,
          status: true,
          applicantStatement: true,
          sourceUrl: true,
          reviewNotes: true,
          submittedAt: true,
          reviewedAt: true,
          applicant: { select: { id: true, displayName: true, email: true } },
          organization: { select: { id: true, name: true, slug: true, verificationStatus: true } },
        },
      }),
      this.client.organizationRepresentativeClaim.count({ where }),
    ]);
    return { items, total };
  }

  public async decideRepresentativeClaim(
    id: string,
    status: 'APPROVED' | 'REJECTED' | 'NEEDS_MORE_INFO' | 'REVOKED',
    notes: string | undefined,
    actor: AdminActor,
  ) {
    return runMembershipTransaction(this.client, async (tx) => {
      const claimReference = await tx.organizationRepresentativeClaim.findUnique({
        where: { id },
        select: { organizationId: true },
      });
      if (!claimReference) return null;
      const organization = await lockOrganization(tx, claimReference.organizationId);
      if (!organization) return null;
      const lockedClaim = await lockClaim(tx, id);
      if (!lockedClaim) return null;
      if (lockedClaim.applicantUserId === actor.userId) {
        throw new AppError(
          403,
          'SELF_CLAIM_DECISION_FORBIDDEN',
          'A reviewer cannot decide their own representative claim',
        );
      }
      assertRepresentativeClaimTransition(lockedClaim.status, status);
      if (
        status === 'APPROVED' &&
        !isEligiblePublicOrganization(
          organization.verificationStatus,
          organization.publicationStatus,
        )
      ) {
        throw new AppError(
          409,
          'ORGANIZATION_NOT_ELIGIBLE',
          'The organization must be verified and published before representative access is approved',
        );
      }
      if (status === 'APPROVED') {
        const applicant = await tx.user.findUnique({
          where: { id: lockedClaim.applicantUserId },
          select: { status: true },
        });
        if (applicant?.status !== 'ACTIVE') {
          throw new AppError(409, 'USER_NOT_ACTIVE', 'The applicant account is not active');
        }
      }
      const now = new Date();
      const updated = await tx.organizationRepresentativeClaim.update({
        where: { id },
        data: { status, reviewerId: actor.userId, reviewNotes: notes ?? null, reviewedAt: now },
        select: {
          id: true,
          organizationId: true,
          requestedRole: true,
          status: true,
          reviewNotes: true,
          reviewedAt: true,
          applicant: { select: { id: true, displayName: true, email: true } },
          organization: { select: { id: true, name: true, slug: true } },
        },
      });
      if (status === 'APPROVED') {
        await tx.organizationMember.upsert({
          where: {
            organizationId_userId: {
              organizationId: lockedClaim.organizationId,
              userId: lockedClaim.applicantUserId,
            },
          },
          create: {
            organizationId: lockedClaim.organizationId,
            userId: lockedClaim.applicantUserId,
            membershipRole: lockedClaim.requestedRole,
            status: 'ACTIVE',
            approvedById: actor.userId,
            approvedAt: now,
          },
          update: {
            membershipRole: lockedClaim.requestedRole,
            status: 'ACTIVE',
            approvedById: actor.userId,
            approvedAt: now,
            revokedAt: null,
          },
        });
      }
      if (status === 'REVOKED') {
        if (lockedClaim.reviewedAt) {
          await tx.organizationMember.updateMany({
            where: {
              organizationId: lockedClaim.organizationId,
              userId: lockedClaim.applicantUserId,
              status: 'ACTIVE',
              approvedAt: lockedClaim.reviewedAt,
            },
            data: { status: 'REVOKED', revokedAt: now },
          });
        }
      }
      await tx.auditEvent.create({
        data: {
          actorUserId: actor.userId,
          action: `REPRESENTATIVE_CLAIM_${status}`,
          targetType: 'REPRESENTATIVE_CLAIM',
          targetId: id,
          summary: auditSummary(
            `REPRESENTATIVE_CLAIM_${status}`,
            'REPRESENTATIVE_CLAIM',
            id,
            notes ? 'Claim decision recorded with restricted note' : 'Claim decision recorded',
          ),
          requestId: actor.requestId,
        },
      });
      return updated;
    });
  }

  public async revokeOrganizationMember(
    organizationId: string,
    memberId: string,
    actor: AdminActor,
  ) {
    return runMembershipTransaction(this.client, async (tx) => {
      const organization = await lockOrganization(tx, organizationId);
      if (!organization) return null;
      const member = await lockOrganizationMember(tx, organizationId, memberId);
      if (!member || member.status !== 'ACTIVE') return null;
      if (member.userId === actor.userId) {
        throw new AppError(
          403,
          'SELF_MEMBERSHIP_DECISION_FORBIDDEN',
          'A reviewer cannot revoke their own organization membership',
        );
      }
      const now = new Date();
      const updated = await tx.organizationMember.update({
        where: { id: memberId },
        data: { status: 'REVOKED', revokedAt: now },
      });
      await tx.auditEvent.create({
        data: {
          actorUserId: actor.userId,
          action: 'ORGANIZATION_MEMBER_REVOKED',
          targetType: 'ORGANIZATION_MEMBER',
          targetId: memberId,
          summary: auditSummary(
            'ORGANIZATION_MEMBER_REVOKED',
            'ORGANIZATION_MEMBER',
            memberId,
            'Organization membership revoked',
          ),
          requestId: actor.requestId,
        },
      });
      return updated;
    });
  }

  public async updateOrganizationAsMember(
    id: string,
    input: Record<string, unknown>,
    actor: AdminActor,
  ) {
    const fields = Object.keys(input);
    return runMembershipTransaction(this.client, async (tx) => {
      const current = await lockOrganization(tx, id);
      if (!current) return null;
      assertRepresentativeResourceEditable(current, 'organization');
      const member = await lockActiveMembership(tx, id, actor.userId);
      if (!member)
        throw new AppError(
          403,
          'ORGANIZATION_ACCESS_DENIED',
          'You do not manage this organization',
        );
      assertRepresentativeEdit(member.membershipRole, fields);
      const data = withoutUndefined(input) as Prisma.OrganizationUncheckedUpdateInput;
      if (
        fields.length > 0 &&
        (current.verificationStatus === 'VERIFIED' || current.publicationStatus === 'PUBLISHED')
      ) {
        data.verificationStatus = 'NEEDS_REVIEW';
        data.publicationStatus = 'UNPUBLISHED';
        data.verifiedAt = null;
      }
      const updated = await tx.organization.update({
        where: { id },
        data,
        select: representativeOrganizationSelect,
      });
      await tx.auditEvent.create({
        data: {
          actorUserId: actor.userId,
          action: 'ORGANIZATION_REPRESENTATIVE_UPDATED',
          targetType: 'ORGANIZATION',
          targetId: id,
          summary: auditSummary(
            'ORGANIZATION_REPRESENTATIVE_UPDATED',
            'ORGANIZATION',
            id,
            `Representative updated fields: ${fields.join(', ')}`,
          ),
          requestId: actor.requestId,
        },
      });
      return updated;
    });
  }

  public async updateTempleAsMember(id: string, input: Record<string, unknown>, actor: AdminActor) {
    const fields = Object.keys(input);
    return runMembershipTransaction(this.client, async (tx) => {
      const temple = await lockTemple(tx, id);
      if (!temple) return null;
      if (!temple.organizationId)
        throw new AppError(
          403,
          'ORGANIZATION_ACCESS_DENIED',
          'This temple is not managed through an organization',
        );
      const organization = await lockOrganization(tx, temple.organizationId);
      if (!organization) return null;
      assertRepresentativeResourceEditable(organization, 'organization');
      assertRepresentativeResourceEditable(temple, 'temple');
      const member = await lockActiveMembership(tx, temple.organizationId, actor.userId);
      if (!member)
        throw new AppError(403, 'ORGANIZATION_ACCESS_DENIED', 'You do not manage this temple');
      assertRepresentativeTempleEdit(member.membershipRole, fields);
      const data = withoutUndefined(input) as Prisma.TempleUncheckedUpdateInput;
      if (
        fields.length > 0 &&
        (temple.verificationStatus === 'VERIFIED' || temple.publicationStatus === 'PUBLISHED')
      ) {
        data.verificationStatus = 'NEEDS_REVIEW';
        data.publicationStatus = 'UNPUBLISHED';
        data.verifiedAt = null;
      }
      const updated = await tx.temple.update({
        where: { id },
        data,
        select: representativeTempleSelect,
      });
      await tx.auditEvent.create({
        data: {
          actorUserId: actor.userId,
          action: 'TEMPLE_REPRESENTATIVE_UPDATED',
          targetType: 'TEMPLE',
          targetId: id,
          summary: auditSummary(
            'TEMPLE_REPRESENTATIVE_UPDATED',
            'TEMPLE',
            id,
            `Representative updated fields: ${fields.join(', ')}`,
          ),
          requestId: actor.requestId,
        },
      });
      return updated;
    });
  }

  public async createCorrection(
    target: { organizationId?: string; templeId?: string },
    input: {
      reasonCode: string;
      description: string;
      proposedChanges?: Record<string, string>;
      sourceUrl?: string;
    },
    submittedById: string,
  ) {
    const targetCount = Number(Boolean(target.organizationId)) + Number(Boolean(target.templeId));
    if (targetCount !== 1)
      throw new AppError(400, 'INVALID_TARGET', 'Exactly one correction target is required');
    const targetId = target.organizationId ?? target.templeId;
    if (!targetId)
      throw new AppError(400, 'INVALID_TARGET', 'Exactly one correction target is required');
    return this.client.$transaction(async (tx) => {
      const publicTarget = target.organizationId
        ? await tx.organization.findFirst({
            where: {
              id: target.organizationId,
              verificationStatus: 'VERIFIED',
              publicationStatus: 'PUBLISHED',
            },
            select: { id: true },
          })
        : await tx.temple.findFirst({
            where: {
              id: targetId,
              verificationStatus: 'VERIFIED',
              publicationStatus: 'PUBLISHED',
            },
            select: { id: true },
          });
      if (!publicTarget) return null;
      const duplicate = await tx.correctionRequest.findFirst({
        where: {
          submittedById,
          ...(target.organizationId
            ? { organizationId: target.organizationId }
            : { templeId: targetId }),
          status: { in: ['SUBMITTED', 'IN_REVIEW', 'NEEDS_CHANGES'] },
        },
        select: { id: true },
      });
      if (duplicate)
        throw new AppError(
          409,
          'DUPLICATE_CORRECTION',
          'You already have an open correction for this record',
        );
      const created = await tx.correctionRequest.create({
        data: {
          ...(target.organizationId
            ? { organizationId: target.organizationId }
            : { templeId: targetId }),
          submittedById,
          reasonCode: input.reasonCode,
          description: input.description,
          proposedChanges: input.proposedChanges ?? Prisma.JsonNull,
          sourceUrl: input.sourceUrl ?? null,
        },
        select: { id: true, status: true, submittedAt: true },
      });
      await tx.auditEvent.create({
        data: {
          actorUserId: submittedById,
          action: 'CORRECTION_SUBMITTED',
          targetType: target.organizationId ? 'ORGANIZATION' : 'TEMPLE',
          targetId: (target.organizationId ?? target.templeId) as string,
          summary: auditSummary(
            'CORRECTION_SUBMITTED',
            target.organizationId ? 'ORGANIZATION' : 'TEMPLE',
            (target.organizationId ?? target.templeId) as string,
            'Authenticated correction submitted',
          ),
        },
      });
      return created;
    });
  }

  public async listMyReports(userId: string, page = 1, pageSize = 20) {
    const where = { reporterUserId: userId };
    const [items, total] = await Promise.all([
      this.client.report.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          reasonCode: true,
          description: true,
          status: true,
          resolutionCode: true,
          createdAt: true,
          temple: { select: { name: true, slug: true } },
          organization: { select: { name: true, slug: true } },
        },
      }),
      this.client.report.count({ where }),
    ]);
    return { items, total };
  }

  public async listMyCorrections(userId: string, page = 1, pageSize = 20) {
    const where = { submittedById: userId };
    const [items, total] = await Promise.all([
      this.client.correctionRequest.findMany({
        where,
        orderBy: [{ submittedAt: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          reasonCode: true,
          description: true,
          status: true,
          sourceUrl: true,
          submittedAt: true,
          reviewedAt: true,
          temple: { select: { name: true, slug: true } },
          organization: { select: { name: true, slug: true } },
        },
      }),
      this.client.correctionRequest.count({ where }),
    ]);
    return { items, total };
  }

  public async listCorrections(status: string | undefined, page: number, pageSize: number) {
    const where = status
      ? {
          status: status as
            'SUBMITTED' | 'IN_REVIEW' | 'NEEDS_CHANGES' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN',
        }
      : {};
    const [items, total] = await Promise.all([
      this.client.correctionRequest.findMany({
        where,
        orderBy: [{ submittedAt: 'asc' }, { id: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          reasonCode: true,
          description: true,
          proposedChanges: true,
          sourceUrl: true,
          status: true,
          reviewerNotes: true,
          submittedAt: true,
          reviewedAt: true,
          requester: { select: { id: true, displayName: true, email: true } },
          temple: { select: { id: true, name: true, slug: true } },
          organization: { select: { id: true, name: true, slug: true } },
        },
      }),
      this.client.correctionRequest.count({ where }),
    ]);
    return { items, total };
  }

  public async updateCorrection(
    id: string,
    input: { status: CorrectionState; reviewerNotes?: string },
    actor: AdminActor,
  ) {
    return this.client.$transaction(async (tx) => {
      const current = await tx.correctionRequest.findUnique({
        where: { id },
        select: {
          id: true,
          status: true,
          organizationId: true,
          templeId: true,
        },
      });
      if (!current) return null;
      assertCorrectionTransition(current.status as CorrectionState, input.status);
      const now = new Date();
      const updated = await tx.correctionRequest.update({
        where: { id },
        data: {
          status: input.status,
          reviewerId: actor.userId,
          reviewerNotes: input.reviewerNotes ?? null,
          reviewedAt: now,
          resolvedAt: ['APPROVED', 'REJECTED', 'WITHDRAWN'].includes(input.status) ? now : null,
        },
        select: { id: true, status: true, reviewerNotes: true, reviewedAt: true, resolvedAt: true },
      });
      await tx.auditEvent.create({
        data: {
          actorUserId: actor.userId,
          action: `CORRECTION_${input.status}`,
          targetType: 'CORRECTION_REQUEST',
          targetId: id,
          summary: auditSummary(
            `CORRECTION_${input.status}`,
            'CORRECTION_REQUEST',
            id,
            input.reviewerNotes
              ? 'Correction decision recorded with restricted note'
              : 'Correction decision recorded',
          ),
          requestId: actor.requestId,
        },
      });
      return updated;
    });
  }
}
