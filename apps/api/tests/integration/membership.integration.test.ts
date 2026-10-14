import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import type { AppConfig } from '../../src/config/env.js';
import { PrismaAdminStore } from '../../src/admin/store.js';
import { hashAccessToken } from '../../src/auth/tokens.js';
import { PrismaAuthStore } from '../../src/auth/store.js';
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

integrationSuite('bounded organization membership PostgreSQL integration', () => {
  const client = new PrismaClient({ datasources: { db: { url: config.databaseUrl } } });
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const emails = {
    applicant: `membership-applicant-${suffix}@example.test`,
    reviewer: `membership-reviewer-${suffix}@example.test`,
    outsider: `membership-outsider-${suffix}@example.test`,
  };
  const slugs = {
    public: `membership-public-${suffix}`,
    self: `membership-self-${suffix}`,
    renewal: `membership-renewal-${suffix}`,
    draft: `membership-draft-${suffix}`,
    rejected: `membership-rejected-${suffix}`,
    suspended: `membership-suspended-${suffix}`,
    archived: `membership-archived-${suffix}`,
  };
  const tokens: Record<keyof typeof emails, string> = {
    applicant: `opaque-${suffix}-applicant`,
    reviewer: `opaque-${suffix}-reviewer`,
    outsider: `opaque-${suffix}-outsider`,
  };
  let applicantId: string;
  let publicOrganizationId: string;
  let publicTempleId: string;
  let renewalOrganizationId: string;
  let claimId: string;

  beforeAll(async () => {
    await client.$connect();
    const applicant = await client.user.create({
      data: {
        email: emails.applicant,
        emailNormalized: emails.applicant,
        displayName: 'Synthetic applicant membership user',
        status: 'ACTIVE',
      },
    });
    const reviewer = await client.user.create({
      data: {
        email: emails.reviewer,
        emailNormalized: emails.reviewer,
        displayName: 'Synthetic reviewer membership user',
        status: 'ACTIVE',
      },
    });
    const outsider = await client.user.create({
      data: {
        email: emails.outsider,
        emailNormalized: emails.outsider,
        displayName: 'Synthetic outsider membership user',
        status: 'ACTIVE',
      },
    });
    applicantId = applicant.id;
    const verifierRole = await client.role.upsert({
      where: { key: 'VERIFIER' },
      update: {},
      create: {
        key: 'VERIFIER',
        displayName: 'Synthetic verifier',
        description: 'Synthetic membership integration role',
      },
    });
    await client.userRole.create({ data: { userId: reviewer.id, roleId: verifierRole.id } });
    const sessionUsers = { applicant, reviewer, outsider };
    await Promise.all(
      Object.entries(tokens).map(([key, token]) =>
        client.session.create({
          data: {
            userId: sessionUsers[key as keyof typeof sessionUsers].id,
            tokenHash: hashAccessToken(token),
            expiresAt: new Date(Date.now() + 60 * 60_000),
          },
        }),
      ),
    );

    const [publicOrganization, , renewalOrganization] = await Promise.all([
      createOrganization(slugs.public, 'VERIFIED', 'PUBLISHED'),
      createOrganization(slugs.self, 'VERIFIED', 'PUBLISHED'),
      createOrganization(slugs.renewal, 'VERIFIED', 'PUBLISHED'),
      createOrganization(slugs.draft, 'VERIFIED', 'DRAFT'),
    ]);
    publicOrganizationId = publicOrganization.id;
    renewalOrganizationId = renewalOrganization.id;
    const publicTemples = await Promise.all([
      client.temple.create({
        data: {
          organizationId: publicOrganization.id,
          name: 'Synthetic managed temple one',
          slug: `membership-temple-one-${suffix}`,
          verificationStatus: 'VERIFIED',
          publicationStatus: 'PUBLISHED',
        },
      }),
      client.temple.create({
        data: {
          organizationId: publicOrganization.id,
          name: 'Synthetic managed temple two',
          slug: `membership-temple-two-${suffix}`,
          verificationStatus: 'VERIFIED',
          publicationStatus: 'PUBLISHED',
        },
      }),
    ]);
    publicTempleId = publicTemples[0]!.id;

    const lifecycleOrganizations = await Promise.all([
      createOrganization(slugs.rejected, 'REJECTED', 'UNPUBLISHED'),
      createOrganization(slugs.suspended, 'SUSPENDED', 'UNPUBLISHED'),
      createOrganization(slugs.archived, 'VERIFIED', 'ARCHIVED'),
    ]);
    await client.organizationMember.createMany({
      data: lifecycleOrganizations.map((organization) => ({
        organizationId: organization.id,
        userId: applicant.id,
        membershipRole: 'OWNER' as const,
        status: 'ACTIVE' as const,
        approvedById: reviewer.id,
        approvedAt: new Date(),
      })),
    });
    await client.temple.create({
      data: {
        organizationId: publicOrganization.id,
        name: 'Synthetic suspended managed temple',
        slug: `membership-temple-suspended-${suffix}`,
        verificationStatus: 'SUSPENDED',
        publicationStatus: 'UNPUBLISHED',
      },
    });

    async function createOrganization(
      slug: string,
      verificationStatus: 'VERIFIED' | 'REJECTED' | 'SUSPENDED',
      publicationStatus: 'PUBLISHED' | 'DRAFT' | 'UNPUBLISHED' | 'ARCHIVED',
    ) {
      return client.organization.create({
        data: {
          name: `Synthetic organization ${slug}`,
          slug,
          organizationType: 'TEMPLE_TRUST',
          verificationStatus,
          publicationStatus,
        },
      });
    }
  });

  afterAll(async () => {
    await client.temple.deleteMany({ where: { slug: { contains: suffix } } });
    await client.organization.deleteMany({ where: { slug: { in: Object.values(slugs) } } });
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

  function bearer(user: keyof typeof tokens) {
    return { Authorization: `Bearer ${tokens[user]}` };
  }

  it('accepts claims only for public organizations and suppresses concurrent duplicates', async () => {
    const ineligible = await request(app())
      .post(
        `/api/v1/organizations/${(await client.organization.findUniqueOrThrow({ where: { slug: slugs.draft } })).id}/representative-claims`,
      )
      .set(bearer('applicant'))
      .send({
        requestedRole: 'OWNER',
        applicantStatement: 'This synthetic claim should be rejected.',
      });
    expect(ineligible.status).toBe(404);

    const responses = await Promise.all(
      [1, 2].map(() =>
        request(app())
          .post(`/api/v1/organizations/${publicOrganizationId}/representative-claims`)
          .set(bearer('applicant'))
          .send({
            requestedRole: 'OWNER',
            applicantStatement: 'Synthetic representative claim with sufficient detail.',
          }),
      ),
    );
    const first = responses[0]!;
    const second = responses[1]!;
    expect([first.status, second.status].sort()).toEqual([201, 409]);
    claimId = first.status === 201 ? first.body.data.id : second.body.data.id;

    const claims = await request(app())
      .get('/api/v1/me/representative-claims')
      .query({ page: 1, pageSize: 1 })
      .set(bearer('applicant'));
    expect(claims.status).toBe(200);
    expect(claims.body.pagination).toMatchObject({ page: 1, pageSize: 1, total: 1 });
    expect(claims.body.data).toHaveLength(1);
    const unbounded = await request(app())
      .get('/api/v1/me/representative-claims')
      .query({ pageSize: 51 })
      .set(bearer('applicant'));
    expect(unbounded.status).toBe(400);
  });

  it('scopes member reads, preserves safe fields, and enforces legal decisions', async () => {
    const beforeApproval = await request(app())
      .get(`/api/v1/me/organizations/${publicOrganizationId}`)
      .set(bearer('applicant'));
    expect(beforeApproval.status).toBe(404);
    const crossUser = await request(app())
      .get(`/api/v1/me/organizations/${publicOrganizationId}`)
      .set(bearer('outsider'));
    expect(crossUser.status).toBe(404);

    const approved = await request(app())
      .post(`/api/v1/admin/representative-claims/${claimId}/decision`)
      .set(bearer('reviewer'))
      .send({ status: 'APPROVED', notes: 'Synthetic approval' });
    expect(approved.status).toBe(200);

    const organization = await request(app())
      .get(`/api/v1/me/organizations/${publicOrganizationId}`)
      .set(bearer('applicant'));
    expect(organization.status).toBe(200);
    expect(organization.body.data).not.toHaveProperty('createdById');
    expect(organization.body.data).not.toHaveProperty('verificationReviews');

    const temple = await request(app())
      .get(`/api/v1/me/temples/${publicTempleId}`)
      .set(bearer('applicant'));
    expect(temple.status).toBe(200);
    expect(temple.body.data).not.toHaveProperty('verificationReviews');

    const temples = await request(app())
      .get(`/api/v1/me/organizations/${publicOrganizationId}/temples`)
      .query({ page: 1, pageSize: 1 })
      .set(bearer('applicant'));
    expect(temples.status).toBe(200);
    expect(temples.body.pagination).toMatchObject({ page: 1, pageSize: 1, total: 3 });

    const edited = await request(app())
      .patch(`/api/v1/organizations/${publicOrganizationId}`)
      .set(bearer('applicant'))
      .send({ name: 'Synthetic reviewed organization edit' });
    expect(edited.status).toBe(200);
    expect(edited.body.data.verificationStatus).toBe('NEEDS_REVIEW');
    expect(edited.body.data.publicationStatus).toBe('UNPUBLISHED');

    const memberships = await request(app())
      .get('/api/v1/me/organization-memberships')
      .query({ page: 1, pageSize: 1 })
      .set(bearer('applicant'));
    expect(memberships.status).toBe(200);
    expect(memberships.body.pagination.pageSize).toBe(1);
    expect(memberships.body.data).toHaveLength(1);

    const invalidDecision = await request(app())
      .post(`/api/v1/admin/representative-claims/${claimId}/decision`)
      .set(bearer('reviewer'))
      .send({ status: 'REJECTED' });
    expect(invalidDecision.status).toBe(409);
    expect(invalidDecision.body.error.code).toBe('INVALID_CLAIM_TRANSITION');

    const selfClaim = await request(app())
      .post(
        `/api/v1/organizations/${(await client.organization.findUniqueOrThrow({ where: { slug: slugs.self } })).id}/representative-claims`,
      )
      .set(bearer('reviewer'))
      .send({
        requestedRole: 'OWNER',
        applicantStatement: 'Synthetic reviewer self-claim statement.',
      });
    expect(selfClaim.status).toBe(201);
    const selfDecision = await request(app())
      .post(`/api/v1/admin/representative-claims/${selfClaim.body.data.id}/decision`)
      .set(bearer('reviewer'))
      .send({ status: 'APPROVED' });
    expect(selfDecision.status).toBe(403);
    expect(selfDecision.body.error.code).toBe('SELF_CLAIM_DECISION_FORBIDDEN');

    const renewalClaim = await request(app())
      .post(`/api/v1/organizations/${renewalOrganizationId}/representative-claims`)
      .set(bearer('applicant'))
      .send({ requestedRole: 'OWNER', applicantStatement: 'Synthetic renewal claim statement.' });
    expect(renewalClaim.status).toBe(201);
    const renewalClaimId = renewalClaim.body.data.id as string;
    const renewalApproval = await request(app())
      .post(`/api/v1/admin/representative-claims/${renewalClaimId}/decision`)
      .set(bearer('reviewer'))
      .send({ status: 'APPROVED' });
    expect(renewalApproval.status).toBe(200);
    const renewalRevocation = await request(app())
      .post(`/api/v1/admin/representative-claims/${renewalClaimId}/decision`)
      .set(bearer('reviewer'))
      .send({ status: 'REVOKED' });
    expect(renewalRevocation.status).toBe(200);
    const resurrected = await request(app())
      .post(`/api/v1/admin/representative-claims/${renewalClaimId}/decision`)
      .set(bearer('reviewer'))
      .send({ status: 'APPROVED' });
    expect(resurrected.status).toBe(409);
    expect(resurrected.body.error.code).toBe('INVALID_CLAIM_TRANSITION');

    const freshClaim = await request(app())
      .post(`/api/v1/organizations/${renewalOrganizationId}/representative-claims`)
      .set(bearer('applicant'))
      .send({
        requestedRole: 'OWNER',
        applicantStatement: 'Synthetic fresh claim after revocation.',
      });
    expect(freshClaim.status).toBe(201);
    const freshApproval = await request(app())
      .post(`/api/v1/admin/representative-claims/${freshClaim.body.data.id}/decision`)
      .set(bearer('reviewer'))
      .send({ status: 'APPROVED' });
    expect(freshApproval.status).toBe(200);
    const renewedMembership = await client.organizationMember.findUnique({
      where: {
        organizationId_userId: { organizationId: renewalOrganizationId, userId: applicantId },
      },
      select: { status: true, approvedAt: true },
    });
    expect(renewedMembership?.status).toBe('ACTIVE');
    expect(renewedMembership?.approvedAt).toBeInstanceOf(Date);
  });

  it('denies rejected, suspended, archived, and suspended-temple edits', async () => {
    for (const slug of [slugs.rejected, slugs.suspended, slugs.archived]) {
      const organization = await client.organization.findUniqueOrThrow({ where: { slug } });
      const response = await request(app())
        .patch(`/api/v1/organizations/${organization.id}`)
        .set(bearer('applicant'))
        .send({ name: 'Blocked synthetic edit' });
      expect(response.status).toBe(409);
      expect(response.body.error.code).toBe('REPRESENTATIVE_EDIT_NOT_ALLOWED');
    }

    const suspendedTemple = await client.temple.findFirstOrThrow({
      where: { slug: `membership-temple-suspended-${suffix}` },
    });
    const response = await request(app())
      .patch(`/api/v1/temples/${suspendedTemple.id}`)
      .set(bearer('applicant'))
      .send({ name: 'Blocked synthetic temple edit' });
    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('REPRESENTATIVE_EDIT_NOT_ALLOWED');
  });
});
