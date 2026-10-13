import type { Prisma, PrismaClient } from '@prisma/client';

export interface TempleSearchFilters {
  query?: string;
  city?: string;
  state?: string;
  page: number;
  pageSize: number;
}

export interface PublicTemple {
  id: string;
  name: string;
  slug: string;
  traditionOrLineage: string | null;
  description: string | null;
  history: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
  timezone: string | null;
  publicEmail: string | null;
  publicPhone: string | null;
  websiteUrl: string | null;
  darshanInformation: string | null;
  verificationStatus: 'VERIFIED';
  lastReviewedAt: Date | null;
}

export interface PublicTempleDirectory {
  list(filters: TempleSearchFilters): Promise<{ items: PublicTemple[]; total: number }>;
  findBySlug(slug: string): Promise<PublicTemple | null>;
}

const publicTempleSelect = {
  id: true,
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
  lastReviewedAt: true,
} satisfies Prisma.TempleSelect;

type PublicTempleRow = Prisma.TempleGetPayload<{ select: typeof publicTempleSelect }>;

function toPublicTemple(row: PublicTempleRow): PublicTemple {
  return {
    ...row,
    verificationStatus: 'VERIFIED',
  };
}

export class PrismaTempleDirectory implements PublicTempleDirectory {
  public constructor(private readonly client: PrismaClient) {}

  public async list(filters: TempleSearchFilters) {
    const where: Prisma.TempleWhereInput = {
      publicationStatus: 'PUBLISHED',
      verificationStatus: 'VERIFIED',
      ...(filters.city ? { city: { equals: filters.city, mode: 'insensitive' } } : {}),
      ...(filters.state ? { state: { equals: filters.state, mode: 'insensitive' } } : {}),
      ...(filters.query
        ? {
            OR: [
              { name: { contains: filters.query, mode: 'insensitive' } },
              { city: { contains: filters.query, mode: 'insensitive' } },
              { state: { contains: filters.query, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [rows, total] = await Promise.all([
      this.client.temple.findMany({
        where,
        orderBy: [{ name: 'asc' }, { id: 'asc' }],
        skip: (filters.page - 1) * filters.pageSize,
        take: filters.pageSize,
        select: publicTempleSelect,
      }),
      this.client.temple.count({ where }),
    ]);

    return {
      items: rows.map(toPublicTemple),
      total,
    };
  }

  public async findBySlug(slug: string) {
    const row = await this.client.temple.findFirst({
      where: {
        slug,
        publicationStatus: 'PUBLISHED',
        verificationStatus: 'VERIFIED',
      },
      select: publicTempleSelect,
    });

    return row ? toPublicTemple(row) : null;
  }
}
