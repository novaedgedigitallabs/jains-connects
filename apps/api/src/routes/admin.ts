import { Router } from 'express';
import { z } from 'zod';
import type { AdminListFilters, AdminStore } from '../admin/store.js';
import type { AuthStore } from '../auth/store.js';
import { requireAuthentication } from '../auth/middleware.js';
import {
  adminRoles,
  auditReaderRoles,
  editorRoles,
  moderatorRoles,
  requireAnyRole,
  reviewerRoles,
} from '../auth/roles.js';
import { AppError } from '../http/errors.js';

const verificationStatuses = [
  'PENDING',
  'VERIFIED',
  'REJECTED',
  'SUSPENDED',
  'NEEDS_REVIEW',
] as const;
const publicationStatuses = ['DRAFT', 'PUBLISHED', 'UNPUBLISHED', 'ARCHIVED'] as const;
const organizationTypes = ['TEMPLE_TRUST', 'COMMUNITY_GROUP', 'CHARITY', 'OTHER'] as const;
const reportStatuses = ['OPEN', 'IN_REVIEW', 'ACTIONED', 'DISMISSED'] as const;

const uuidSchema = z.string().uuid();
const paginationSchema = z
  .object({
    verificationStatus: z.enum(verificationStatuses).optional(),
    publicationStatus: z.enum(publicationStatuses).optional(),
    page: z.coerce.number().int().min(1).max(1000).default(1),
    pageSize: z.coerce.number().int().min(1).max(50).default(20),
  })
  .strict();

const templeInputSchema = z
  .object({
    name: z.string().trim().min(2).max(200),
    slug: z
      .string()
      .trim()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .max(180),
    organizationId: uuidSchema.nullable().optional(),
    traditionOrLineage: z.string().trim().max(200).nullable().optional(),
    description: z.string().trim().max(4000).nullable().optional(),
    history: z.string().trim().max(8000).nullable().optional(),
    addressLine1: z.string().trim().max(250).nullable().optional(),
    addressLine2: z.string().trim().max(250).nullable().optional(),
    city: z.string().trim().max(120).nullable().optional(),
    state: z.string().trim().max(120).nullable().optional(),
    postalCode: z.string().trim().max(20).nullable().optional(),
    country: z.string().trim().max(120).nullable().optional(),
    timezone: z.string().trim().max(64).nullable().optional(),
    publicEmail: z.string().trim().email().max(320).nullable().optional(),
    publicPhone: z.string().trim().max(32).nullable().optional(),
    websiteUrl: z.string().trim().url().max(2048).nullable().optional(),
    darshanInformation: z.string().trim().max(4000).nullable().optional(),
  })
  .strict();

const organizationInputSchema = z
  .object({
    name: z.string().trim().min(2).max(200),
    slug: z
      .string()
      .trim()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .max(180),
    organizationType: z.enum(organizationTypes),
    description: z.string().trim().max(4000).nullable().optional(),
    publicEmail: z.string().trim().email().max(320).nullable().optional(),
    publicPhone: z.string().trim().max(32).nullable().optional(),
    websiteUrl: z.string().trim().url().max(2048).nullable().optional(),
    addressLine1: z.string().trim().max(250).nullable().optional(),
    addressLine2: z.string().trim().max(250).nullable().optional(),
    city: z.string().trim().max(120).nullable().optional(),
    state: z.string().trim().max(120).nullable().optional(),
    postalCode: z.string().trim().max(20).nullable().optional(),
    country: z.string().trim().max(120).nullable().optional(),
  })
  .strict();

const reviewSchema = z
  .object({
    status: z.enum(verificationStatuses),
    notes: z.string().trim().max(2000).optional(),
  })
  .strict();

const publicationSchema = z.object({ status: z.enum(publicationStatuses) }).strict();
const reportUpdateSchema = z
  .object({
    status: z.enum(reportStatuses),
    resolutionCode: z.string().trim().max(64).optional(),
    moderatorNotes: z.string().trim().max(2000).optional(),
  })
  .strict();

function parse<T>(schema: z.ZodSchema<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success)
    throw new AppError(400, 'INVALID_INPUT', 'The submitted admin data is invalid');
  return result.data;
}

function actor(response: { locals: Record<string, unknown> }) {
  const auth = response.locals.auth as { userId: string } | undefined;
  if (!auth) throw new AppError(401, 'AUTHENTICATION_REQUIRED', 'Authentication is required');
  return {
    userId: auth.userId,
    requestId: typeof response.locals.requestId === 'string' ? response.locals.requestId : null,
  };
}

function requireStore(store: AdminStore | undefined): AdminStore {
  if (!store) throw new AppError(503, 'ADMIN_UNAVAILABLE', 'The admin service is not configured');
  return store;
}

function routeId(value: unknown) {
  const result = uuidSchema.safeParse(value);
  if (!result.success) throw new AppError(400, 'INVALID_ID', 'The resource ID is invalid');
  return result.data;
}

function parseFilters(value: unknown): AdminListFilters {
  const parsed = parse(paginationSchema, value);
  const filters: AdminListFilters = {
    page: parsed.page ?? 1,
    pageSize: parsed.pageSize ?? 20,
  };
  if (parsed.verificationStatus) filters.verificationStatus = parsed.verificationStatus;
  if (parsed.publicationStatus) filters.publicationStatus = parsed.publicationStatus;
  return filters;
}

function pageResponse(result: { items: unknown[]; total: number }, page: number, pageSize: number) {
  return {
    data: result.items,
    pagination: {
      page,
      pageSize,
      total: result.total,
      totalPages: result.total === 0 ? 0 : Math.ceil(result.total / pageSize),
    },
  };
}

function canReadReviewNotes(response: { locals: Record<string, unknown> }) {
  const roles = Array.isArray(response.locals.roleKeys) ? response.locals.roleKeys : [];
  return roles.includes('ADMIN') || roles.includes('VERIFIER');
}

function redactReviewNotes(result: { items: unknown[]; total: number }, includeNotes: boolean) {
  if (includeNotes) return result;
  return {
    ...result,
    items: result.items.map((item) => {
      if (!item || typeof item !== 'object') return item;
      const record = item as Record<string, unknown>;
      const reviews = record.verificationReviews;
      if (!Array.isArray(reviews)) return item;
      return {
        ...record,
        verificationReviews: reviews.map((review) => {
          if (!review || typeof review !== 'object') return review;
          const { reviewNotes: _reviewNotes, ...safeReview } = review as Record<string, unknown>;
          return safeReview;
        }),
      };
    }),
  };
}

export function createAdminRouter(authStore: AuthStore, adminStore?: AdminStore): Router {
  const router = Router();
  router.use(requireAuthentication(authStore));

  router.get('/access', requireAnyRole(authStore, adminRoles), (_request, response) => {
    response.status(200).json({ data: { roles: response.locals.roleKeys ?? [] } });
  });

  router.get('/temples', requireAnyRole(authStore, adminRoles), (request, response, next) => {
    const run = async () => {
      const store = requireStore(adminStore);
      const filters = parseFilters(request.query);
      const result = await store.listTemples(filters);
      response
        .status(200)
        .json(
          pageResponse(
            redactReviewNotes(result, canReadReviewNotes(response)),
            filters.page,
            filters.pageSize,
          ),
        );
    };
    void run().catch(next);
  });

  router.post('/temples', requireAnyRole(authStore, editorRoles), (request, response, next) => {
    const run = async () => {
      const store = requireStore(adminStore);
      const input = parse(templeInputSchema, request.body);
      const created = await store.createTemple(input as Record<string, unknown>, actor(response));
      response.status(201).json({ data: created });
    };
    void run().catch(next);
  });

  router.patch(
    '/temples/:id',
    requireAnyRole(authStore, editorRoles),
    (request, response, next) => {
      const run = async () => {
        const store = requireStore(adminStore);
        const id = routeId(request.params.id);
        const input = parse(templeInputSchema.partial(), request.body);
        const updated = await store.updateTemple(
          id,
          input as Record<string, unknown>,
          actor(response),
        );
        if (!updated) throw new AppError(404, 'NOT_FOUND', 'Temple not found');
        response.status(200).json({ data: updated });
      };
      void run().catch(next);
    },
  );

  router.post(
    '/temples/:id/verification',
    requireAnyRole(authStore, reviewerRoles),
    (request, response, next) => {
      const run = async () => {
        const store = requireStore(adminStore);
        const id = routeId(request.params.id);
        const input = parse(reviewSchema, request.body);
        const updated = await store.reviewTemple(id, input.status, input.notes, actor(response));
        if (!updated) throw new AppError(404, 'NOT_FOUND', 'Temple not found');
        response.status(200).json({ data: updated });
      };
      void run().catch(next);
    },
  );

  router.post(
    '/temples/:id/publication',
    requireAnyRole(authStore, editorRoles),
    (request, response, next) => {
      const run = async () => {
        const store = requireStore(adminStore);
        const id = routeId(request.params.id);
        const input = parse(publicationSchema, request.body);
        const updated = await store.setTemplePublication(id, input.status, actor(response));
        if (!updated) throw new AppError(404, 'NOT_FOUND', 'Temple not found');
        response.status(200).json({ data: updated });
      };
      void run().catch(next);
    },
  );

  router.get('/organizations', requireAnyRole(authStore, adminRoles), (request, response, next) => {
    const run = async () => {
      const store = requireStore(adminStore);
      const filters = parseFilters(request.query);
      const result = await store.listOrganizations(filters);
      response
        .status(200)
        .json(
          pageResponse(
            redactReviewNotes(result, canReadReviewNotes(response)),
            filters.page,
            filters.pageSize,
          ),
        );
    };
    void run().catch(next);
  });

  router.post(
    '/organizations',
    requireAnyRole(authStore, editorRoles),
    (request, response, next) => {
      const run = async () => {
        const store = requireStore(adminStore);
        const input = parse(organizationInputSchema, request.body);
        const created = await store.createOrganization(
          input as Record<string, unknown>,
          actor(response),
        );
        response.status(201).json({ data: created });
      };
      void run().catch(next);
    },
  );

  router.patch(
    '/organizations/:id',
    requireAnyRole(authStore, editorRoles),
    (request, response, next) => {
      const run = async () => {
        const store = requireStore(adminStore);
        const id = routeId(request.params.id);
        const input = parse(organizationInputSchema.partial(), request.body);
        const updated = await store.updateOrganization(
          id,
          input as Record<string, unknown>,
          actor(response),
        );
        if (!updated) throw new AppError(404, 'NOT_FOUND', 'Organization not found');
        response.status(200).json({ data: updated });
      };
      void run().catch(next);
    },
  );

  router.post(
    '/organizations/:id/verification',
    requireAnyRole(authStore, reviewerRoles),
    (request, response, next) => {
      const run = async () => {
        const store = requireStore(adminStore);
        const id = routeId(request.params.id);
        const input = parse(reviewSchema, request.body);
        const updated = await store.reviewOrganization(
          id,
          input.status,
          input.notes,
          actor(response),
        );
        if (!updated) throw new AppError(404, 'NOT_FOUND', 'Organization not found');
        response.status(200).json({ data: updated });
      };
      void run().catch(next);
    },
  );

  router.get('/audit', requireAnyRole(authStore, auditReaderRoles), (request, response, next) => {
    const run = async () => {
      const store = requireStore(adminStore);
      const parsed = parse(
        z
          .object({
            page: z.coerce.number().int().min(1).max(1000).default(1),
            pageSize: z.coerce.number().int().min(1).max(50).default(25),
          })
          .strict(),
        request.query,
      );
      const page = parsed.page ?? 1;
      const pageSize = parsed.pageSize ?? 25;
      const result = await store.listAuditEvents(page, pageSize);
      response.status(200).json(pageResponse(result, page, pageSize));
    };
    void run().catch(next);
  });

  router.get('/reports', requireAnyRole(authStore, moderatorRoles), (request, response, next) => {
    const run = async () => {
      const store = requireStore(adminStore);
      const parsed = parse(
        z
          .object({
            status: z.enum(reportStatuses).optional(),
            page: z.coerce.number().int().min(1).max(1000).default(1),
            pageSize: z.coerce.number().int().min(1).max(50).default(25),
          })
          .strict(),
        request.query,
      );
      const page = parsed.page ?? 1;
      const pageSize = parsed.pageSize ?? 25;
      const result = await store.listReports(parsed.status, page, pageSize);
      response.status(200).json(pageResponse(result, page, pageSize));
    };
    void run().catch(next);
  });

  router.patch(
    '/reports/:id',
    requireAnyRole(authStore, moderatorRoles),
    (request, response, next) => {
      const run = async () => {
        const store = requireStore(adminStore);
        const id = routeId(request.params.id);
        const input = parse(reportUpdateSchema, request.body);
        const update = { status: input.status } as {
          status: 'OPEN' | 'IN_REVIEW' | 'ACTIONED' | 'DISMISSED';
          resolutionCode?: string;
          moderatorNotes?: string;
        };
        if (input.resolutionCode !== undefined) update.resolutionCode = input.resolutionCode;
        if (input.moderatorNotes !== undefined) update.moderatorNotes = input.moderatorNotes;
        const updated = await store.updateReport(id, update, actor(response));
        if (!updated) throw new AppError(404, 'NOT_FOUND', 'Report not found');
        response.status(200).json({ data: updated });
      };
      void run().catch(next);
    },
  );

  return router;
}

export function createReportRouter(authStore: AuthStore, adminStore: AdminStore): Router {
  const router = Router();
  router.use(requireAuthentication(authStore));
  router.post('/temples/:id', (request, response, next) => {
    const run = async () => {
      const id = routeId(request.params.id);
      const input = parse(
        z
          .object({
            reasonCode: z.string().trim().min(2).max(64),
            description: z.string().trim().min(10).max(2000),
          })
          .strict(),
        request.body,
      );
      const auth = response.locals.auth as { userId: string };
      const created = await adminStore.createTempleReport(id, input, auth.userId);
      if (!created) throw new AppError(404, 'NOT_FOUND', 'Temple not found');
      response.status(201).json({ data: { id: created.id, status: created.status } });
    };
    void run().catch(next);
  });
  return router;
}
