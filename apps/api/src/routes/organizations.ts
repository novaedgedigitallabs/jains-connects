import { Router } from 'express';
import { z } from 'zod';
import type {
  OrganizationSearchFilters,
  PublicOrganization,
  PublicOrganizationDirectory,
} from '../directories/organizations.js';
import { AppError } from '../http/errors.js';

const organizationTypes = ['TEMPLE_TRUST', 'COMMUNITY_GROUP', 'CHARITY', 'OTHER'] as const;
const positiveInteger = z
  .string()
  .regex(/^[1-9]\d*$/)
  .transform(Number);
const querySchema = z
  .object({
    q: z.string().trim().min(1).max(100).optional(),
    organizationType: z.enum(organizationTypes).optional(),
    city: z.string().trim().min(1).max(120).optional(),
    state: z.string().trim().min(1).max(120).optional(),
    page: positiveInteger.pipe(z.number().max(1000)).default('1'),
    pageSize: positiveInteger.pipe(z.number().max(50)).default('20'),
  })
  .strict();

const slugSchema = z
  .string()
  .max(180)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'must be a lowercase hyphenated slug');

function parseQuery(input: unknown): OrganizationSearchFilters {
  const parsed = querySchema.safeParse(input);
  if (!parsed.success) {
    throw new AppError(400, 'INVALID_QUERY', 'Organization search filters are invalid');
  }

  const filters: OrganizationSearchFilters = {
    page: parsed.data.page,
    pageSize: parsed.data.pageSize,
  };
  if (parsed.data.q) filters.query = parsed.data.q;
  if (parsed.data.organizationType) filters.organizationType = parsed.data.organizationType;
  if (parsed.data.city) filters.city = parsed.data.city;
  if (parsed.data.state) filters.state = parsed.data.state;
  return filters;
}

function toSafeExternalUrl(value: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : null;
  } catch {
    return null;
  }
}

function serializeOrganization(organization: PublicOrganization) {
  return {
    ...organization,
    websiteUrl: toSafeExternalUrl(organization.websiteUrl),
    lastReviewedAt: organization.lastReviewedAt?.toISOString() ?? null,
    temples: organization.temples.map((temple) => ({
      ...temple,
      lastReviewedAt: temple.lastReviewedAt?.toISOString() ?? null,
    })),
  };
}

export function createOrganizationRouter(directory: PublicOrganizationDirectory): Router {
  const router = Router();

  router.get('/', (request, response, next) => {
    const run = async () => {
      const filters = parseQuery(request.query);
      const result = await directory.list(filters);
      response.status(200).json({
        data: result.items.map(serializeOrganization),
        pagination: {
          page: filters.page,
          pageSize: filters.pageSize,
          total: result.total,
          totalPages: result.total === 0 ? 0 : Math.ceil(result.total / filters.pageSize),
        },
      });
    };
    void run().catch(next);
  });

  router.get('/:slug', (request, response, next) => {
    const run = async () => {
      const parsedSlug = slugSchema.safeParse(request.params.slug);
      if (!parsedSlug.success) {
        throw new AppError(400, 'INVALID_SLUG', 'Organization slug is invalid');
      }

      const organization = await directory.findBySlug(parsedSlug.data);
      if (!organization) {
        throw new AppError(404, 'NOT_FOUND', 'Organization not found');
      }

      response.status(200).json({ data: serializeOrganization(organization) });
    };
    void run().catch(next);
  });

  return router;
}
