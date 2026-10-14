import type { Prisma, PrismaClient } from '@prisma/client';

export type OrganizationType = 'TEMPLE_TRUST' | 'COMMUNITY_GROUP' | 'CHARITY' | 'OTHER';

export interface OrganizationSearchFilters {
  query?: string;
  organizationType?: OrganizationType;
  city?: string;
  state?: string;
  page: number;
  pageSize: number;
}

export interface PublicOrganizationTemple {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  state: string | null;
  lastReviewedAt: Date | null;
}

export interface PublicOrganization {
  id: string;
  name: string;
  slug: string;
  organizationType: OrganizationType;
  description: string | null;
  publicEmail: string | null;
  publicPhone: string | null;
  websiteUrl: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
  verificationStatus: 'VERIFIED';
  lastReviewedAt: Date | null;
  temples: PublicOrganizationTemple[];
}

export interface PublicOrganizationDirectory {
  list(filters: OrganizationSearchFilters): Promise<{
    items: PublicOrganization[];
    total: number;
  }>;
  findBySlug(slug: string): Promise<PublicOrganization | null>;
}

const publicOrganizationSelect = {
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
  lastReviewedAt: true,
  temples: {
    where: {
      verificationStatus: 'VERIFIED',
      publicationStatus: 'PUBLISHED',
    },
    orderBy: [{ name: 'asc' as const }, { id: 'asc' as const }],
    select: {
      id: true,
      name: true,
      slug: true,
      city: true,
      state: true,
      lastReviewedAt: true,
    },
  },
} satisfies Prisma.OrganizationSelect;

type PublicOrganizationRow = Prisma.OrganizationGetPayload<{
  select: typeof publicOrganizationSelect;
}>;

function toPublicOrganization(row: PublicOrganizationRow): PublicOrganization {
  return {
    ...row,
    verificationStatus: 'VERIFIED',
  };
}

export class PrismaOrganizationDirectory implements PublicOrganizationDirectory {
  public constructor(private readonly client: PrismaClient) {}

  public async list(filters: OrganizationSearchFilters) {
    const where: Prisma.OrganizationWhereInput = {
      publicationStatus: 'PUBLISHED',
      verificationStatus: 'VERIFIED',
      ...(filters.organizationType ? { organizationType: filters.organizationType } : {}),
      ...(filters.city ? { city: { equals: filters.city, mode: 'insensitive' } } : {}),
      ...(filters.state ? { state: { equals: filters.state, mode: 'insensitive' } } : {}),
      ...(filters.query
        ? {
            OR: [
              { name: { contains: filters.query, mode: 'insensitive' } },
              { description: { contains: filters.query, mode: 'insensitive' } },
              { city: { contains: filters.query, mode: 'insensitive' } },
              { state: { contains: filters.query, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [rows, total] = await Promise.all([
      this.client.organization.findMany({
        where,
        orderBy: [{ name: 'asc' }, { id: 'asc' }],
        skip: (filters.page - 1) * filters.pageSize,
        take: filters.pageSize,
        select: publicOrganizationSelect,
      }),
      this.client.organization.count({ where }),
    ]);

    return { items: rows.map(toPublicOrganization), total };
  }

  public async findBySlug(slug: string) {
    const row = await this.client.organization.findFirst({
      where: {
        slug,
        publicationStatus: 'PUBLISHED',
        verificationStatus: 'VERIFIED',
      },
      select: publicOrganizationSelect,
    });

    return row ? toPublicOrganization(row) : null;
  }
}
