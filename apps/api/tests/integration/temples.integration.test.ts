import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import type { AppConfig } from '../../src/config/env.js';
import { PrismaTempleDirectory } from '../../src/directories/temples.js';

const databaseUrl = process.env.DATABASE_URL;
const integrationSuite = databaseUrl ? describe : describe.skip;

const config: AppConfig = {
  nodeEnv: 'test',
  port: 4100,
  host: '127.0.0.1',
  sessionTtlSeconds: 604800,
  databaseUrl: databaseUrl ?? 'postgresql://test:test@localhost:5432/missing',
  corsOrigins: [],
};

integrationSuite('public temple directory PostgreSQL integration', () => {
  const client = new PrismaClient({
    datasources: {
      db: { url: config.databaseUrl },
    },
  });
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const publishedSlug = `synthetic-published-temple-${suffix}`;
  const draftSlug = `synthetic-draft-temple-${suffix}`;
  const pendingSlug = `synthetic-pending-temple-${suffix}`;
  const city = `Synthetic City ${suffix}`;

  beforeAll(async () => {
    await client.temple.createMany({
      data: [
        {
          name: 'Synthetic Published Temple',
          slug: publishedSlug,
          city,
          state: 'Madhya Pradesh',
          country: 'India',
          verificationStatus: 'VERIFIED',
          publicationStatus: 'PUBLISHED',
          lastReviewedAt: new Date('2026-10-13T00:00:00.000Z'),
        },
        {
          name: 'Synthetic Draft Temple',
          slug: draftSlug,
          city,
          verificationStatus: 'VERIFIED',
          publicationStatus: 'DRAFT',
        },
        {
          name: 'Synthetic Pending Temple',
          slug: pendingSlug,
          city,
          verificationStatus: 'PENDING',
          publicationStatus: 'PUBLISHED',
        },
      ],
    });
  });

  afterAll(async () => {
    await client.temple.deleteMany({
      where: { slug: { in: [publishedSlug, draftSlug, pendingSlug] } },
    });
    await client.$disconnect();
  });

  it('returns only records that are both published and verified', async () => {
    const app = createApp(config, {
      database: {
        check: async () => {
          await client.$queryRaw`SELECT 1`;
        },
      },
      templeDirectory: new PrismaTempleDirectory(client),
    });

    const response = await request(app).get('/api/v1/temples').query({ city: city.toLowerCase() });

    expect(response.status).toBe(200);
    expect(response.body.pagination.total).toBe(1);
    expect(response.body.data[0].slug).toBe(publishedSlug);
    expect(response.body.data[0]).not.toHaveProperty('publicationStatus');
    expect(response.body.data[0]).not.toHaveProperty('createdById');
  });

  it('does not disclose non-public records through slug lookups', async () => {
    const app = createApp(config, {
      database: {
        check: async () => {
          await client.$queryRaw`SELECT 1`;
        },
      },
      templeDirectory: new PrismaTempleDirectory(client),
    });

    const response = await request(app).get(`/api/v1/temples/${pendingSlug}`);

    expect(response.status).toBe(404);
    expect(response.body.error.message).toBe('Temple not found');
  });
});
