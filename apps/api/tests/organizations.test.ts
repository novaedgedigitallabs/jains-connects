import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app.js';
import type { AppConfig } from '../src/config/env.js';
import type { PublicOrganization } from '../src/directories/organizations.js';

const config: AppConfig = {
  nodeEnv: 'test',
  port: 4100,
  host: '127.0.0.1',
  sessionTtlSeconds: 604800,
  databaseUrl: 'postgresql://test:test@localhost:5432/jainconnect_test',
  corsOrigins: [],
};

const verifiedOrganization: PublicOrganization = {
  id: '7a2c7a82-769a-4d76-b9bf-8e27b9bc4242',
  name: 'Synthetic Jain Trust',
  slug: 'synthetic-jain-trust',
  organizationType: 'TEMPLE_TRUST',
  description: 'Synthetic test listing; not a real-world verification.',
  publicEmail: 'public@example.test',
  publicPhone: '+91 70000 00000',
  websiteUrl: 'https://example.test/trust',
  addressLine1: '1 Community Way',
  addressLine2: null,
  city: 'Indore',
  state: 'Madhya Pradesh',
  postalCode: null,
  country: 'India',
  verificationStatus: 'VERIFIED',
  lastReviewedAt: new Date('2026-10-13T00:00:00.000Z'),
  temples: [
    {
      id: '2b3d8b93-87ba-4e87-cafc-9f38cace5353',
      name: 'Synthetic Published Temple',
      slug: 'synthetic-published-temple',
      city: 'Indore',
      state: 'Madhya Pradesh',
      lastReviewedAt: new Date('2026-10-12T00:00:00.000Z'),
    },
  ],
};

function createTestApp(directory: {
  list: (filters: {
    query?: string;
    organizationType?: 'TEMPLE_TRUST' | 'COMMUNITY_GROUP' | 'CHARITY' | 'OTHER';
    city?: string;
    state?: string;
    page: number;
    pageSize: number;
  }) => Promise<{ items: PublicOrganization[]; total: number }>;
  findBySlug: (slug: string) => Promise<PublicOrganization | null>;
}) {
  return createApp(config, {
    database: { check: vi.fn().mockResolvedValue(undefined) },
    templeDirectory: { list: async () => ({ items: [], total: 0 }), findBySlug: async () => null },
    organizationDirectory: directory,
  });
}

describe('public organization directory API', () => {
  it('returns paginated verified organization data and bounded filters', async () => {
    const directory = {
      list: vi.fn().mockResolvedValue({ items: [verifiedOrganization], total: 21 }),
      findBySlug: vi.fn(),
    };
    const app = createTestApp(directory);

    const response = await request(app).get('/api/v1/organizations').query({
      q: 'trust',
      organizationType: 'TEMPLE_TRUST',
      city: 'Indore',
      state: 'Madhya Pradesh',
      page: '2',
      pageSize: '10',
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      data: [
        {
          ...verifiedOrganization,
          websiteUrl: 'https://example.test/trust',
          lastReviewedAt: '2026-10-13T00:00:00.000Z',
          temples: [
            { ...verifiedOrganization.temples[0], lastReviewedAt: '2026-10-12T00:00:00.000Z' },
          ],
        },
      ],
      pagination: { page: 2, pageSize: 10, total: 21, totalPages: 3 },
    });
    expect(directory.list).toHaveBeenCalledWith({
      query: 'trust',
      organizationType: 'TEMPLE_TRUST',
      city: 'Indore',
      state: 'Madhya Pradesh',
      page: 2,
      pageSize: 10,
    });
  });

  it('rejects invalid category and unbounded pagination before querying', async () => {
    const directory = { list: vi.fn(), findBySlug: vi.fn() };
    const app = createTestApp(directory);

    const invalidCategory = await request(app)
      .get('/api/v1/organizations')
      .query({ organizationType: 'TRUST' });
    expect(invalidCategory.status).toBe(400);
    expect(invalidCategory.body.error.code).toBe('INVALID_QUERY');

    const unbounded = await request(app).get('/api/v1/organizations').query({ pageSize: '5000' });
    expect(unbounded.status).toBe(400);
    expect(directory.list).not.toHaveBeenCalled();
  });

  it('returns approved detail data, hides unsafe URLs, and excludes non-public slugs', async () => {
    const directory = {
      list: vi.fn(),
      findBySlug: vi
        .fn()
        .mockResolvedValueOnce({ ...verifiedOrganization, websiteUrl: 'javascript:alert(1)' })
        .mockResolvedValueOnce(null),
    };
    const app = createTestApp(directory);

    const detail = await request(app).get('/api/v1/organizations/synthetic-jain-trust');
    expect(detail.status).toBe(200);
    expect(detail.body.data.websiteUrl).toBeNull();
    expect(detail.body.data.verificationStatus).toBe('VERIFIED');
    expect(detail.body.data.temples[0].lastReviewedAt).toBe('2026-10-12T00:00:00.000Z');

    const missing = await request(app).get('/api/v1/organizations/unpublished-trust');
    expect(missing.status).toBe(404);
    expect(missing.body.error.message).toBe('Organization not found');
  });

  it('rejects unsafe slugs without a repository lookup', async () => {
    const directory = { list: vi.fn(), findBySlug: vi.fn() };
    const app = createTestApp(directory);
    const response = await request(app).get('/api/v1/organizations/Bad%20Slug');
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('INVALID_SLUG');
    expect(directory.findBySlug).not.toHaveBeenCalled();
  });
});
