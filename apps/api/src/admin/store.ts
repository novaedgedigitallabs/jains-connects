import type { Prisma, PrismaClient } from '@prisma/client';
import {
  assertPublicationState,
  assertVerificationTransition,
  type PublicationState,
  type VerificationState,
} from './state.js';

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
      const current = await tx.organization.findUnique({ where: { id }, select: { id: true } });
      if (!current) return null;
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
            `Updated fields: ${Object.keys(data).join(', ') || 'none'}`,
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
    const temple = await this.client.temple.findUnique({
      where: { id: templeId },
      select: { id: true },
    });
    if (!temple) return null;
    return this.client.report.create({
      data: {
        templeId,
        reporterUserId,
        reasonCode: input.reasonCode,
        description: input.description,
      },
      select: { id: true, status: true },
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
      const current = await tx.report.findUnique({ where: { id }, select: { id: true } });
      if (!current) return null;
      const resolved = input.status === 'ACTIONED' || input.status === 'DISMISSED';
      const updated = await tx.report.update({
        where: { id },
        data: withoutUndefined({
          status: input.status,
          resolutionCode: input.resolutionCode,
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
}
