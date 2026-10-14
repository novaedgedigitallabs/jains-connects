import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import type { AppConfig } from '../../src/config/env.js';
import { PrismaOrganizationDirectory } from '../../src/directories/organizations.js';
import { PrismaTempleDirectory } from '../../src/directories/temples.js';

const databaseUrl = process.env.DATABASE_URL;
const integrationSuite = databaseUrl ? describe : describe.skip;

const config: AppConfig = {
  nodeEnv: 'test',
  port: 4100,
  host: '127.0.0.1',
  sessionTtlSeconds: 3600,
  databaseUrl: databaseUrl ?? 'postgresql://test:test@localhost:5432/missing',
  corsOrigins: [],
};

integrationSuite('public organization directory PostgreSQL integration', () => {
  const client = new PrismaClient({ datasources: { db: { url: config.databaseUrl } } });
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const publicSlug = `integration-public-organization-${suffix}`;
  const pendingSlug = `integration-pending-organization-${suffix}`;
  const draftSlug = `integration-draft-organization-${suffix}`;
  const rejectedSlug = `integration-rejected-organization-${suffix}`;

  beforeAll(async () => {
    await client.$connect();
    const published = await client.organization.create({
      data: {
        name: 'Synthetic Public Jain Trust',
        slug: publicSlug,
        organizationType: 'TEMPLE_TRUST',
        description: 'Synthetic public organization record.',
        publicEmail: 'public@example.test',
        publicPhone: '+91 70000 00000',
        websiteUrl: 'javascript:alert(1)',
        city: 'Indore',
        state: 'Madhya Pradesh',
        country: 'India',
        verificationStatus: 'VERIFIED',
        publicationStatus: 'PUBLISHED',
        lastReviewedAt: new Date('2026-10-13T00:00:00.000Z'),
      },
    });
    await client.temple.createMany({
      data: [
        {
          organizationId: published.id,
          name: 'Synthetic Public Associated Temple',
          slug: `integration-public-temple-${suffix}`,
          city: 'Indore',
          state: 'Madhya Pradesh',
          verificationStatus: 'VERIFIED',
          publicationStatus: 'PUBLISHED',
          lastReviewedAt: new Date('2026-10-12T00:00:00.000Z'),
        },
        {
          organizationId: published.id,
          name: 'Synthetic Private Associated Temple',
          slug: `integration-private-temple-${suffix}`,
          city: 'Indore',
          verificationStatus: 'VERIFIED',
          publicationStatus: 'DRAFT',
        },
      ],
    });
    await client.organization.createMany({
      data: [
        {
          name: 'Synthetic Pending Organization',
          slug: pendingSlug,
          organizationType: 'COMMUNITY_GROUP',
          verificationStatus: 'PENDING',
          publicationStatus: 'PUBLISHED',
        },
        {
          name: 'Synthetic Draft Organization',
          slug: draftSlug,
          organizationType: 'CHARITY',
          verificationStatus: 'VERIFIED',
          publicationStatus: 'DRAFT',
        },
        {
          name: 'Synthetic Rejected Organization',
          slug: rejectedSlug,
          organizationType: 'OTHER',
          verificationStatus: 'REJECTED',
          publicationStatus: 'PUBLISHED',
        },
      ],
    });
  });

  afterAll(async () => {
    await client.temple.deleteMany({
      where: {
        slug: {
          in: [`integration-public-temple-${suffix}`, `integration-private-temple-${suffix}`],
        },
      },
    });
    await client.organization.deleteMany({
      where: { slug: { in: [publicSlug, pendingSlug, draftSlug, rejectedSlug] } },
    });
    await client.$disconnect();
  });

  function app() {
    return createApp(config, {
      database: { check: () => client.$queryRaw`SELECT 1`.then(() => undefined) },
      templeDirectory: new PrismaTempleDirectory(client),
      organizationDirectory: new PrismaOrganizationDirectory(client),
    });
  }

  it('lists only verified and published organizations with filters and pagination', async () => {
    const response = await request(app())
      .get('/api/v1/organizations')
      .query({ organizationType: 'TEMPLE_TRUST', city: 'indore', page: '1', pageSize: '1' });

    expect(response.status).toBe(200);
    expect(response.body.pagination.total).toBe(1);
    expect(response.body.data[0].slug).toBe(publicSlug);
    expect(response.body.data[0]).not.toHaveProperty('publicationStatus');
    expect(response.body.data[0]).not.toHaveProperty('createdById');
    expect(response.body.data[0]).not.toHaveProperty('verificationReviews');
    expect(response.body.data[0].websiteUrl).toBeNull();
  });

  it('returns only public associated temples and hides ineligible organization slugs', async () => {
    const detail = await request(app()).get(`/api/v1/organizations/${publicSlug}`);
    expect(detail.status).toBe(200);
    expect(detail.body.data.temples).toHaveLength(1);
    expect(detail.body.data.temples[0].slug).toContain('integration-public-temple');

    for (const slug of [pendingSlug, draftSlug, rejectedSlug, 'missing-organization']) {
      const response = await request(app()).get(`/api/v1/organizations/${slug}`);
      expect(response.status).toBe(404);
    }
  });
});
