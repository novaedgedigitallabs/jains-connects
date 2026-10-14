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
    moderator: `admin-moderator-${suffix}@example.test`,
    member: `admin-member-${suffix}@example.test`,
    otherMember: `admin-other-member-${suffix}@example.test`,
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
    const [editor, reviewer, moderator, member, otherMember] = await Promise.all([
      createUser(emails.editor),
      createUser(emails.reviewer),
      createUser(emails.moderator),
      createUser(emails.member),
      createUser(emails.otherMember),
    ]);
    await client.userRole.createMany({
      data: [
        { userId: editor.id, roleId: editorRole.id },
        { userId: reviewer.id, roleId: reviewerRole.id },
        { userId: moderator.id, roleId: moderatorRole.id },
      ],
    });
    expect(member.id).toBeTruthy();
    expect(otherMember.id).toBeTruthy();

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
      where: { slug: { in: [`integration-org-${suffix}`, `integration-unrelated-org-${suffix}`] } },
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
    const moderatorToken = await login(emails.moderator);
    const memberToken = await login(emails.member);
    const otherMemberToken = await login(emails.otherMember);
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
    const organizationPublished = await request(app())
      .post(`/api/v1/admin/organizations/${organizationId}/publication`)
      .set('Authorization', `Bearer ${editorToken}`)
      .send({ status: 'PUBLISHED' });
    expect(organizationPublished.status).toBe(200);
    expect(organizationPublished.body.data.publicationStatus).toBe('PUBLISHED');

    const claim = await request(app())
      .post(`/api/v1/organizations/${organizationId}/representative-claims`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        requestedRole: 'EDITOR',
        applicantStatement: 'Synthetic representative statement for integration testing.',
      });
    expect(claim.status).toBe(201);
    const claimId = claim.body.data.id as string;
    const approvedClaim = await request(app())
      .post(`/api/v1/admin/representative-claims/${claimId}/decision`)
      .set('Authorization', `Bearer ${reviewerToken}`)
      .send({ status: 'APPROVED', notes: 'Synthetic approval note' });
    expect(approvedClaim.status).toBe(200);
    expect(
      await client.organizationMember.count({
        where: {
          organizationId,
          userId: (await client.user.findUniqueOrThrow({ where: { email: emails.member } })).id,
          status: 'ACTIVE',
        },
      }),
    ).toBe(1);

    const unrelatedOrganization = await request(app())
      .post('/api/v1/admin/organizations')
      .set('Authorization', `Bearer ${editorToken}`)
      .send({
        name: 'Synthetic Unrelated Trust',
        slug: `integration-unrelated-org-${suffix}`,
        organizationType: 'TEMPLE_TRUST',
      });
    expect(unrelatedOrganization.status).toBe(201);
    const unrelatedOrganizationId = unrelatedOrganization.body.data.id as string;
    const forbiddenOrganizationEdit = await request(app())
      .patch(`/api/v1/organizations/${unrelatedOrganizationId}`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ description: 'Should not be accepted.' });
    expect(forbiddenOrganizationEdit.status).toBe(403);

    const representativeEdit = await request(app())
      .patch(`/api/v1/organizations/${organizationId}`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ description: 'Synthetic representative correction.' });
    expect(representativeEdit.status).toBe(200);
    expect(representativeEdit.body.data.publicationStatus).toBe('UNPUBLISHED');

    const organizationChanged = await request(app())
      .patch(`/api/v1/admin/organizations/${organizationId}`)
      .set('Authorization', `Bearer ${editorToken}`)
      .send({ description: 'Synthetic revised public description.' });
    expect(organizationChanged.status).toBe(200);
    expect(organizationChanged.body.data.verificationStatus).toBe('NEEDS_REVIEW');
    expect(organizationChanged.body.data.publicationStatus).toBe('UNPUBLISHED');
    expect(organizationChanged.body.data.verificationReviews[0]).not.toHaveProperty('reviewNotes');

    const earlyPublish = await request(app())
      .post(`/api/v1/admin/temples/${templeId}/publication`)
      .set('Authorization', `Bearer ${editorToken}`)
      .send({ status: 'PUBLISHED' });
    expect(earlyPublish.status).toBe(409);
    expect(earlyPublish.body.error.code).toBe('PUBLICATION_REQUIRES_VERIFICATION');

    const associateTemple = await request(app())
      .patch(`/api/v1/admin/temples/${templeId}`)
      .set('Authorization', `Bearer ${editorToken}`)
      .send({ organizationId });
    expect(associateTemple.status).toBe(200);

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

    const duplicateReport = await request(app())
      .post(`/api/v1/reports/temples/${templeId}`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ reasonCode: 'OUTDATED', description: 'Duplicate synthetic report.' });
    expect(duplicateReport.status).toBe(409);

    const memberCorrections = await request(app())
      .post(`/api/v1/reports/temples/${templeId}/corrections`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        reasonCode: 'INCORRECT',
        description: 'Synthetic correction request for testing.',
        proposedChanges: { name: 'Corrected Synthetic Admin Temple' },
      });
    expect(memberCorrections.status).toBe(201);
    const correctionId = memberCorrections.body.data.id as string;
    const correctionQueue = await request(app())
      .get('/api/v1/admin/corrections?status=SUBMITTED')
      .set('Authorization', `Bearer ${moderatorToken}`);
    expect(correctionQueue.status).toBe(200);
    expect(correctionQueue.body.data.some((item: { id: string }) => item.id === correctionId)).toBe(
      true,
    );
    const correctionDecision = await request(app())
      .post(`/api/v1/admin/corrections/${correctionId}/decision`)
      .set('Authorization', `Bearer ${moderatorToken}`)
      .send({ status: 'APPROVED', reviewerNotes: 'Private correction review note' });
    expect(correctionDecision.status).toBe(200);
    const unchangedAfterCorrection = await client.temple.findUniqueOrThrow({
      where: { id: templeId },
      select: { name: true, verificationStatus: true, publicationStatus: true },
    });
    expect(unchangedAfterCorrection).toEqual({
      name: 'Synthetic Admin Temple',
      verificationStatus: 'VERIFIED',
      publicationStatus: 'PUBLISHED',
    });

    const myReports = await request(app())
      .get('/api/v1/me/reports')
      .set('Authorization', `Bearer ${memberToken}`);
    expect(myReports.status).toBe(200);
    expect(myReports.body.pagination).toMatchObject({ page: 1, pageSize: 20, total: 1 });
    expect(myReports.body.data.some((item: { id: string }) => item.id === reportId)).toBe(true);
    const myCorrections = await request(app())
      .get('/api/v1/me/corrections')
      .set('Authorization', `Bearer ${memberToken}`);
    expect(myCorrections.status).toBe(200);
    expect(myCorrections.body.pagination).toMatchObject({ page: 1, pageSize: 20, total: 1 });
    expect(myCorrections.body.data.some((item: { id: string }) => item.id === correctionId)).toBe(
      true,
    );
    const otherMemberReports = await request(app())
      .get('/api/v1/me/reports')
      .set('Authorization', `Bearer ${otherMemberToken}`);
    expect(otherMemberReports.status).toBe(200);
    expect(otherMemberReports.body.data).toHaveLength(0);
    const otherMemberCorrections = await request(app())
      .get('/api/v1/me/corrections')
      .set('Authorization', `Bearer ${otherMemberToken}`);
    expect(otherMemberCorrections.status).toBe(200);
    expect(otherMemberCorrections.body.data).toHaveLength(0);

    const representativeTempleEdit = await request(app())
      .patch(`/api/v1/temples/${templeId}`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ darshanInformation: 'Synthetic representative-maintained visitor information.' });
    expect(representativeTempleEdit.status).toBe(200);
    expect(representativeTempleEdit.body.data.publicationStatus).toBe('UNPUBLISHED');

    const reports = await request(app())
      .get('/api/v1/admin/reports')
      .set('Authorization', `Bearer ${moderatorToken}`);
    expect(reports.status).toBe(200);
    expect(reports.body.data.some((item: { id: string }) => item.id === reportId)).toBe(true);

    const missingResolution = await request(app())
      .patch(`/api/v1/admin/reports/${reportId}`)
      .set('Authorization', `Bearer ${moderatorToken}`)
      .send({ status: 'ACTIONED' });
    expect(missingResolution.status).toBe(400);
    expect(missingResolution.body.error.code).toBe('RESOLUTION_REQUIRED');

    const actioned = await request(app())
      .patch(`/api/v1/admin/reports/${reportId}`)
      .set('Authorization', `Bearer ${moderatorToken}`)
      .send({ status: 'ACTIONED', resolutionCode: 'CORRECTED' });
    expect(actioned.status).toBe(200);

    const reopened = await request(app())
      .patch(`/api/v1/admin/reports/${reportId}`)
      .set('Authorization', `Bearer ${moderatorToken}`)
      .send({ status: 'OPEN' });
    expect(reopened.status).toBe(200);
    const clearedResolution = await client.report.findUniqueOrThrow({
      where: { id: reportId },
      select: { resolutionCode: true, resolvedAt: true },
    });
    expect(clearedResolution).toEqual({ resolutionCode: null, resolvedAt: null });

    const reviewerCannotModerateCorrections = await request(app())
      .get('/api/v1/admin/corrections')
      .set('Authorization', `Bearer ${reviewerToken}`);
    expect(reviewerCannotModerateCorrections.status).toBe(403);

    const reviewRecord = await client.verificationReview.findFirst({ where: { templeId } });
    expect(reviewRecord?.reviewNotes).toBe('Private synthetic verification note');
    const auditEvents = await client.auditEvent.findMany({ where: { targetId: templeId } });
    expect(auditEvents.some((event) => event.action === 'TEMPLE_VERIFICATION_VERIFIED')).toBe(true);
    expect(
      auditEvents.some((event) => event.summary.includes('Private synthetic verification note')),
    ).toBe(false);
  });
});
