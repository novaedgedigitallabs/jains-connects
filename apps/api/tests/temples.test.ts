import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app.js';
import type { AppConfig } from '../src/config/env.js';
import type { PublicTemple } from '../src/directories/temples.js';

const config: AppConfig = {
  nodeEnv: 'test',
  port: 4100,
  host: '127.0.0.1',
  sessionTtlSeconds: 604800,
  databaseUrl: 'postgresql://test:test@localhost:5432/jainconnect_test',
  corsOrigins: [],
};

const verifiedTemple: PublicTemple = {
  id: '7a2c7a82-769a-4d76-b9bf-8e27b9bc4242',
  name: 'Synthetic Jain Temple',
  slug: 'synthetic-jain-temple',
  traditionOrLineage: null,
  description: 'Synthetic test listing; not a real-world verification.',
  history: null,
  addressLine1: '1 Community Way',
  addressLine2: null,
  city: 'Indore',
  state: 'Madhya Pradesh',
  postalCode: null,
  country: 'India',
  timezone: 'Asia/Kolkata',
  publicEmail: null,
  publicPhone: null,
  websiteUrl: null,
  darshanInformation: null,
  verificationStatus: 'VERIFIED',
  lastReviewedAt: new Date('2026-10-13T00:00:00.000Z'),
};

function createTestApp(directory: {
  list: (filters: {
    query?: string;
    city?: string;
    state?: string;
    page: number;
    pageSize: number;
  }) => Promise<{ items: PublicTemple[]; total: number }>;
  findBySlug: (slug: string) => Promise<PublicTemple | null>;
}) {
  return createApp(config, {
    database: { check: vi.fn().mockResolvedValue(undefined) },
    templeDirectory: directory,
  });
}

describe('public temple directory API', () => {
  it('returns paginated, approved temple data and safe cache headers', async () => {
    const directory = {
      list: vi.fn().mockResolvedValue({ items: [verifiedTemple], total: 1 }),
      findBySlug: vi.fn(),
    };
    const app = createTestApp(directory);

    const response = await request(app)
      .get('/api/v1/temples')
      .query({ q: 'temple', city: 'Indore', page: '2', pageSize: '10' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      data: [
        {
          ...verifiedTemple,
          lastReviewedAt: '2026-10-13T00:00:00.000Z',
        },
      ],
      pagination: { page: 2, pageSize: 10, total: 1, totalPages: 1 },
    });
    expect(response.headers['cache-control']).toBe('no-store');
    expect(response.headers['x-robots-tag']).toBe('noindex');
    expect(directory.list).toHaveBeenCalledWith({
      query: 'temple',
      city: 'Indore',
      page: 2,
      pageSize: 10,
    });
  });

  it('rejects invalid or unbounded search input before querying the repository', async () => {
    const directory = {
      list: vi.fn(),
      findBySlug: vi.fn(),
    };
    const app = createTestApp(directory);

    const response = await request(app).get('/api/v1/temples').query({ pageSize: '5000' });

    expect(response.status).toBe(400);
    expect(response.body.error).toMatchObject({
      code: 'INVALID_QUERY',
      message: 'Search filters are invalid',
    });
    expect(directory.list).not.toHaveBeenCalled();
  });

  it('returns only a public detail response for an approved slug', async () => {
    const directory = {
      list: vi.fn(),
      findBySlug: vi.fn().mockResolvedValue(verifiedTemple),
    };
    const app = createTestApp(directory);

    const response = await request(app).get('/api/v1/temples/synthetic-jain-temple');

    expect(response.status).toBe(200);
    expect(response.body.data.lastReviewedAt).toBe('2026-10-13T00:00:00.000Z');
    expect(response.body.data.verificationStatus).toBe('VERIFIED');
    expect(directory.findBySlug).toHaveBeenCalledWith('synthetic-jain-temple');
  });

  it('does not reveal whether a non-public slug exists', async () => {
    const directory = {
      list: vi.fn(),
      findBySlug: vi.fn().mockResolvedValue(null),
    };
    const app = createTestApp(directory);

    const response = await request(app).get('/api/v1/temples/pending-temple');

    expect(response.status).toBe(404);
    expect(response.body.error.message).toBe('Temple not found');
  });

  it('rejects unsafe slugs without a database lookup', async () => {
    const directory = {
      list: vi.fn(),
      findBySlug: vi.fn(),
    };
    const app = createTestApp(directory);

    const response = await request(app).get('/api/v1/temples/Bad%20Slug');

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('INVALID_SLUG');
    expect(directory.findBySlug).not.toHaveBeenCalled();
  });

  it('removes unsafe persisted website schemes from public output', async () => {
    const directory = {
      list: vi.fn(),
      findBySlug: vi.fn().mockResolvedValue({
        ...verifiedTemple,
        websiteUrl: 'javascript:alert(1)',
      }),
    };
    const app = createTestApp(directory);

    const response = await request(app).get('/api/v1/temples/synthetic-jain-temple');

    expect(response.status).toBe(200);
    expect(response.body.data.websiteUrl).toBeNull();
  });
});
