import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import type { AdminStore } from '../admin/store.js';
import type { AuthStore } from '../auth/store.js';
import { requireAuthentication } from '../auth/middleware.js';
import { AppError } from '../http/errors.js';

const uuidSchema = z.string().uuid();
const membershipRoles = ['OWNER', 'MANAGER', 'EDITOR'] as const;
const memberPaginationSchema = z
  .object({
    page: z.coerce.number().int().min(1).max(1000).default(1),
    pageSize: z.coerce.number().int().min(1).max(50).default(20),
  })
  .strict();
const organizationPatchSchema = z
  .object({
    name: z.string().trim().min(2).max(200).optional(),
    slug: z
      .string()
      .trim()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .max(180)
      .optional(),
    organizationType: z.enum(['TEMPLE_TRUST', 'COMMUNITY_GROUP', 'CHARITY', 'OTHER']).optional(),
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
const templePatchSchema = z
  .object({
    name: z.string().trim().min(2).max(200).optional(),
    slug: z
      .string()
      .trim()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .max(180)
      .optional(),
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

function id(value: unknown, label: string) {
  const parsed = uuidSchema.safeParse(value);
  if (!parsed.success) throw new AppError(400, 'INVALID_ID', `${label} is invalid`);
  return parsed.data;
}

function authUserId(response: { locals: Record<string, unknown> }) {
  const auth = response.locals.auth as { userId: string } | undefined;
  if (!auth) throw new AppError(401, 'AUTHENTICATION_REQUIRED', 'Authentication is required');
  return auth.userId;
}

function actor(response: { locals: Record<string, unknown> }) {
  return {
    userId: authUserId(response),
    requestId: typeof response.locals.requestId === 'string' ? response.locals.requestId : null,
  };
}

function parse<T>(schema: z.ZodSchema<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success)
    throw new AppError(400, 'INVALID_INPUT', 'The submitted organization data is invalid');
  return result.data;
}

function publicRepresentativeRecord(value: unknown) {
  if (!value || typeof value !== 'object') return value;
  const record = value as Record<string, unknown>;
  const { verificationReviews: _reviews, createdById: _createdById, ...safe } = record;
  return safe;
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

function boundedResult(result: unknown[] | { items: unknown[]; total: number }) {
  return Array.isArray(result) ? { items: result, total: result.length } : result;
}

export function createOrganizationManagementRouter(
  authStore: AuthStore,
  adminStore: AdminStore,
): Router {
  const router = Router();

  router.post(
    '/:id/representative-claims',
    requireAuthentication(authStore),
    rateLimit({
      windowMs: 15 * 60_000,
      limit: 10,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
    }),
    (request, response, next) => {
      const run = async () => {
        const claim = parse(
          z
            .object({
              requestedRole: z.enum(membershipRoles),
              applicantStatement: z.string().trim().min(20).max(2000),
              sourceUrl: z.string().trim().url().max(2048).optional(),
            })
            .strict(),
          request.body,
        );
        const created = await adminStore.submitRepresentativeClaim(
          id(request.params.id, 'Organization ID'),
          {
            requestedRole: claim.requestedRole,
            applicantStatement: claim.applicantStatement,
            ...(claim.sourceUrl !== undefined ? { sourceUrl: claim.sourceUrl } : {}),
          },
          authUserId(response),
        );
        if (!created) throw new AppError(404, 'NOT_FOUND', 'Organization not found');
        response.status(201).json({ data: created });
      };
      void run().catch(next);
    },
  );

  router.patch('/:id', requireAuthentication(authStore), (request, response, next) => {
    const run = async () => {
      const input = parse(organizationPatchSchema, request.body);
      const updated = await adminStore.updateOrganizationAsMember(
        id(request.params.id, 'Organization ID'),
        input as Record<string, unknown>,
        actor(response),
      );
      if (!updated) throw new AppError(404, 'NOT_FOUND', 'Organization not found');
      response.status(200).json({ data: publicRepresentativeRecord(updated) });
    };
    void run().catch(next);
  });

  return router;
}

export function createTempleManagementRouter(authStore: AuthStore, adminStore: AdminStore): Router {
  const router = Router();
  router.patch('/:id', requireAuthentication(authStore), (request, response, next) => {
    const run = async () => {
      const input = parse(templePatchSchema, request.body);
      const updated = await adminStore.updateTempleAsMember(
        id(request.params.id, 'Temple ID'),
        input as Record<string, unknown>,
        actor(response),
      );
      if (!updated) throw new AppError(404, 'NOT_FOUND', 'Temple not found');
      response.status(200).json({ data: publicRepresentativeRecord(updated) });
    };
    void run().catch(next);
  });
  return router;
}

export function createMemberWorkflowRouter(authStore: AuthStore, adminStore: AdminStore): Router {
  const router = Router();
  router.use(requireAuthentication(authStore));

  router.get('/organization-memberships', (request, response, next) => {
    const run = async () => {
      const parsed = parse(memberPaginationSchema, request.query);
      const page = parsed.page ?? 1;
      const pageSize = parsed.pageSize ?? 20;
      const result = await adminStore.listOrganizationMemberships(
        authUserId(response),
        page,
        pageSize,
      );
      response.status(200).json(pageResponse(boundedResult(result), page, pageSize));
    };
    void run().catch(next);
  });
  router.get('/representative-claims', (request, response, next) => {
    const run = async () => {
      const parsed = parse(memberPaginationSchema, request.query);
      const page = parsed.page ?? 1;
      const pageSize = parsed.pageSize ?? 20;
      const result = await adminStore.listRepresentativeClaims(
        authUserId(response),
        page,
        pageSize,
      );
      response.status(200).json(pageResponse(boundedResult(result), page, pageSize));
    };
    void run().catch(next);
  });
  router.get('/organizations/:id/temples', (request, response, next) => {
    const run = async () => {
      const parsed = parse(memberPaginationSchema, request.query);
      const page = parsed.page ?? 1;
      const pageSize = parsed.pageSize ?? 20;
      if (!adminStore.listTemplesAsMember) {
        throw new AppError(503, 'MEMBERSHIP_UNAVAILABLE', 'Membership access is not configured');
      }
      const result = await adminStore.listTemplesAsMember(
        id(request.params.id, 'Organization ID'),
        authUserId(response),
        page,
        pageSize,
      );
      if (!result) throw new AppError(404, 'NOT_FOUND', 'Organization not found');
      response.status(200).json(pageResponse(result, page, pageSize));
    };
    void run().catch(next);
  });
  router.get('/organizations/:id', (request, response, next) => {
    const run = async () => {
      if (!adminStore.getOrganizationAsMember) {
        throw new AppError(503, 'MEMBERSHIP_UNAVAILABLE', 'Membership access is not configured');
      }
      const organization = await adminStore.getOrganizationAsMember(
        id(request.params.id, 'Organization ID'),
        authUserId(response),
      );
      if (!organization) throw new AppError(404, 'NOT_FOUND', 'Organization not found');
      response.status(200).json({ data: publicRepresentativeRecord(organization) });
    };
    void run().catch(next);
  });
  router.get('/temples/:id', (request, response, next) => {
    const run = async () => {
      if (!adminStore.getTempleAsMember) {
        throw new AppError(503, 'MEMBERSHIP_UNAVAILABLE', 'Membership access is not configured');
      }
      const temple = await adminStore.getTempleAsMember(
        id(request.params.id, 'Temple ID'),
        authUserId(response),
      );
      if (!temple) throw new AppError(404, 'NOT_FOUND', 'Temple not found');
      response.status(200).json({ data: publicRepresentativeRecord(temple) });
    };
    void run().catch(next);
  });
  router.get('/reports', (request, response, next) => {
    const run = async () => {
      const parsed = parse(memberPaginationSchema, request.query);
      const page = parsed.page ?? 1;
      const pageSize = parsed.pageSize ?? 20;
      const result = await adminStore.listMyReports(authUserId(response), page, pageSize);
      response.status(200).json(pageResponse(result, page, pageSize));
    };
    void run().catch(next);
  });
  router.get('/corrections', (request, response, next) => {
    const run = async () => {
      const parsed = parse(memberPaginationSchema, request.query);
      const page = parsed.page ?? 1;
      const pageSize = parsed.pageSize ?? 20;
      const result = await adminStore.listMyCorrections(authUserId(response), page, pageSize);
      response.status(200).json(pageResponse(result, page, pageSize));
    };
    void run().catch(next);
  });
  return router;
}
