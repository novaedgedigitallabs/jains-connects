import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import { PrismaAdminStore } from '../../src/admin/store.js';
import { hashPassword } from '../../src/auth/password.js';
import { PrismaAuthStore } from '../../src/auth/store.js';
import type { AppConfig } from '../../src/config/env.js';
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

integrationSuite('admin moderation PostgreSQL integration', () => {
  const client = new PrismaClient({ datasources: { db: { url: config.databaseUrl } } });
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const emails = {
    editor: `admin-editor-${suffix}@example.test`,
    reviewer: `admin-reviewer-${suffix}@example.test`,
    member: `admin-member-${suffix}@example.test`,
  };
  const password = 'integration-only password';
  let templeId: string;
  let reportId: string;

  beforeAll(async () => {
    await client.$connect();
    const roles = await Promise.all(
      ['CONTENT_EDITOR', 'VERIFIER', 'MODERATOR'].map((key) =>
        client.role.upsert({
          where: { key },
          update: {},
          create: { key, displayName: key, description: 'Synthetic integration role' },
        }),
      ),
    );
    const editorRole = roles[0];
    const reviewerRole = roles[1];
    const moderatorRole = roles[2];
    if (!editorRole || !reviewerRole || !moderatorRole)
      throw new Error('Synthetic roles were not created');
    const [editor, reviewer, member] = await Promise.all([
      createUser(emails.editor),
      createUser(emails.reviewer),
      createUser(emails.member),
    ]);
    await client.userRole.createMany({
      data: [
        { userId: editor.id, roleId: editorRole.id },
        { userId: reviewer.id, roleId: reviewerRole.id },
        { userId: reviewer.id, roleId: moderatorRole.id },
      ],
    });
    expect(member.id).toBeTruthy();

    async function createUser(email: string) {
      return client.user.create({
        data: {
          email,
          emailNormalized: email,
          displayName: 'Synthetic Admin Test User',
          passwordHash: await hashPassword(password),
          status: 'ACTIVE',
        },
      });
    }
  });

  afterAll(async () => {
    await client.temple.deleteMany({
      where: { slug: { startsWith: `integration-admin-${suffix}` } },
    });
    await client.organization.deleteMany({
      where: { slug: { startsWith: `integration-org-${suffix}` } },
    });
    await client.user.deleteMany({ where: { email: { in: Object.values(emails) } } });
    await client.$disconnect();
  });

  function app() {
    return createApp(config, {
      database: { check: () => client.$queryRaw`SELECT 1`.then(() => undefined) },
      authStore: new PrismaAuthStore(client),
      adminStore: new PrismaAdminStore(client),
      templeDirectory: new PrismaTempleDirectory(client),
    });
  }

  async function login(email: string) {
    const response = await request(app()).post('/api/v1/auth/login').send({ email, password });
    expect(response.status).toBe(200);
    return response.body.data.accessToken as string;
  }

  it('keeps editor, reviewer, publication, report, and audit flows separate', async () => {
    const editorToken = await login(emails.editor);
    const reviewerToken = await login(emails.reviewer);
    const memberToken = await login(emails.member);
    const slug = `integration-admin-${suffix}`;

    const created = await request(app())
      .post('/api/v1/admin/temples')
      .set('Authorization', `Bearer ${editorToken}`)
      .send({ name: 'Synthetic Admin Temple', slug, city: 'Indore', country: 'India' });
    expect(created.status).toBe(201);
    templeId = created.body.data.id as string;
    expect(created.body.data.verificationStatus).toBe('PENDING');
    expect(created.body.data.publicationStatus).toBe('DRAFT');

    const organization = await request(app())
      .post('/api/v1/admin/organizations')
      .set('Authorization', `Bearer ${editorToken}`)
      .send({
        name: 'Synthetic Community Trust',
        slug: `integration-org-${suffix}`,
        organizationType: 'TEMPLE_TRUST',
      });
    expect(organization.status).toBe(201);
    const organizationId = organization.body.data.id as string;
    const organizationUpdate = await request(app())
      .patch(`/api/v1/admin/organizations/${organizationId}`)
      .set('Authorization', `Bearer ${editorToken}`)
      .send({ name: 'Updated Synthetic Community Trust' });
    expect(organizationUpdate.status).toBe(200);

    const organizationReview = await request(app())
      .post(`/api/v1/admin/organizations/${organizationId}/verification`)
      .set('Authorization', `Bearer ${reviewerToken}`)
      .send({ status: 'VERIFIED', notes: 'Private organization note' });
    expect(organizationReview.status).toBe(200);

    const earlyPublish = await request(app())
      .post(`/api/v1/admin/temples/${templeId}/publication`)
      .set('Authorization', `Bearer ${editorToken}`)
      .send({ status: 'PUBLISHED' });
    expect(earlyPublish.status).toBe(409);
    expect(earlyPublish.body.error.code).toBe('PUBLICATION_REQUIRES_VERIFICATION');

    const reviewed = await request(app())
      .post(`/api/v1/admin/temples/${templeId}/verification`)
      .set('Authorization', `Bearer ${reviewerToken}`)
      .send({ status: 'VERIFIED', notes: 'Private synthetic verification note' });
    expect(reviewed.status).toBe(200);

    const editorQueue = await request(app())
      .get('/api/v1/admin/temples')
      .set('Authorization', `Bearer ${editorToken}`);
    expect(editorQueue.status).toBe(200);
    expect(
      editorQueue.body.data.find((item: { id: string }) => item.id === templeId)
        .verificationReviews[0],
    ).not.toHaveProperty('reviewNotes');

    const reviewerQueue = await request(app())
      .get('/api/v1/admin/temples')
      .set('Authorization', `Bearer ${reviewerToken}`);
    expect(reviewerQueue.status).toBe(200);
    expect(
      reviewerQueue.body.data.find((item: { id: string }) => item.id === templeId)
        .verificationReviews[0].reviewNotes,
    ).toBe('Private synthetic verification note');

    const published = await request(app())
      .post(`/api/v1/admin/temples/${templeId}/publication`)
      .set('Authorization', `Bearer ${editorToken}`)
      .send({ status: 'PUBLISHED' });
    expect(published.status).toBe(200);

    const publicRecord = await request(app()).get(`/api/v1/temples/${slug}`);
    expect(publicRecord.status).toBe(200);
    expect(JSON.stringify(publicRecord.body)).not.toContain('Private synthetic verification note');

    const report = await request(app())
      .post(`/api/v1/reports/temples/${templeId}`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ reasonCode: 'OUTDATED', description: 'Synthetic report for moderation testing.' });
    expect(report.status).toBe(201);
    reportId = report.body.data.id as string;

    const reports = await request(app())
      .get('/api/v1/admin/reports')
      .set('Authorization', `Bearer ${reviewerToken}`);
    expect(reports.status).toBe(200);
    expect(reports.body.data.some((item: { id: string }) => item.id === reportId)).toBe(true);

    const actioned = await request(app())
      .patch(`/api/v1/admin/reports/${reportId}`)
      .set('Authorization', `Bearer ${reviewerToken}`)
      .send({ status: 'ACTIONED', resolutionCode: 'CORRECTED' });
    expect(actioned.status).toBe(200);

    const reviewRecord = await client.verificationReview.findFirst({ where: { templeId } });
    expect(reviewRecord?.reviewNotes).toBe('Private synthetic verification note');
    const auditEvents = await client.auditEvent.findMany({ where: { targetId: templeId } });
    expect(auditEvents.some((event) => event.action === 'TEMPLE_VERIFICATION_VERIFIED')).toBe(true);
    expect(
      auditEvents.some((event) => event.summary.includes('Private synthetic verification note')),
    ).toBe(false);
  });
});
