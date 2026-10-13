import { Router } from 'express';
import { z } from 'zod';
import type {
  PublicTemple,
  PublicTempleDirectory,
  TempleSearchFilters,
} from '../directories/temples.js';
import { AppError } from '../http/errors.js';

const positiveInteger = z
  .string()
  .regex(/^[1-9]\d*$/)
  .transform(Number);
const querySchema = z
  .object({
    q: z.string().trim().min(1).max(100).optional(),
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

function parseQuery(input: unknown): TempleSearchFilters {
  const parsed = querySchema.safeParse(input);

  if (!parsed.success) {
    throw new AppError(400, 'INVALID_QUERY', 'Search filters are invalid');
  }

  const filters: TempleSearchFilters = {
    page: parsed.data.page,
    pageSize: parsed.data.pageSize,
  };

  if (parsed.data.q) filters.query = parsed.data.q;
  if (parsed.data.city) filters.city = parsed.data.city;
  if (parsed.data.state) filters.state = parsed.data.state;

  return filters;
}

function serializeTemple(temple: PublicTemple) {
  return {
    ...temple,
    websiteUrl: toSafeExternalUrl(temple.websiteUrl),
    lastReviewedAt: temple.lastReviewedAt?.toISOString() ?? null,
  };
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

export function createTempleRouter(directory: PublicTempleDirectory): Router {
  const router = Router();

  router.get('/', (request, response, next) => {
    const run = async () => {
      const filters = parseQuery(request.query);
      const result = await directory.list(filters);
      const totalPages = result.total === 0 ? 0 : Math.ceil(result.total / filters.pageSize);

      response.status(200).json({
        data: result.items.map(serializeTemple),
        pagination: {
          page: filters.page,
          pageSize: filters.pageSize,
          total: result.total,
          totalPages,
        },
      });
    };

    void run().catch(next);
  });

  router.get('/:slug', (request, response, next) => {
    const run = async () => {
      const parsedSlug = slugSchema.safeParse(request.params.slug);

      if (!parsedSlug.success) {
        throw new AppError(400, 'INVALID_SLUG', 'Temple slug is invalid');
      }

      const temple = await directory.findBySlug(parsedSlug.data);

      if (!temple) {
        throw new AppError(404, 'NOT_FOUND', 'Temple not found');
      }

      response.status(200).json({ data: serializeTemple(temple) });
    };

    void run().catch(next);
  });

  return router;
}
