import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app.js';
import { hashPassword } from '../src/auth/password.js';
import type { ActiveSession, AuthStore, AuthUser } from '../src/auth/store.js';
import type { AdminStore } from '../src/admin/store.js';
import type { AppConfig } from '../src/config/env.js';
import { AppError } from '../src/http/errors.js';

const config: AppConfig = {
  nodeEnv: 'test',
  port: 4100,
  host: '127.0.0.1',
  sessionTtlSeconds: 3600,
  databaseUrl: 'postgresql://test:test@localhost:5432/jainconnect_test',
  corsOrigins: [],
};

const editor: AuthUser = {
  id: '7a2c7a82-769a-4d76-b9bf-8e27b9bc4242',
  email: 'editor@example.test',
  displayName: 'Synthetic Editor',
  status: 'ACTIVE',
  passwordHash: null,
};

class FakeAuthStore implements AuthStore {
  users = new Map<string, AuthUser>();
  sessions = new Map<string, ActiveSession>();
  roleKeys: string[] = [];

  async findUserByEmail(email: string) {
    return this.users.get(email) ?? null;
  }
  async createUser(input: {
    email: string;
    emailNormalized: string;
    displayName: string;
    passwordHash: string;
  }) {
    const created = {
      ...editor,
      email: input.email,
      displayName: input.displayName,
      passwordHash: input.passwordHash,
    };
    this.users.set(input.emailNormalized, created);
    return created;
  }
  async createSession(input: { userId: string; tokenHash: string; expiresAt: Date }) {
    const user =
      [...this.users.values()].find((candidate) => candidate.id === input.userId) ?? editor;
    this.sessions.set(input.tokenHash, { tokenHash: input.tokenHash, user });
  }
  async findActiveSession(tokenHash: string, _now: Date) {
    return this.sessions.get(tokenHash) ?? null;
  }
  async findActiveRoleKeys(_userId: string) {
    return this.roleKeys;
  }
  async touchSession(_tokenHash: string, _lastUsedAt: Date) {}
  async revokeSession(tokenHash: string, _revokedAt: Date) {
    this.sessions.delete(tokenHash);
  }
}

class FakeAdminStore implements AdminStore {
  readonly reviewTemple = vi
    .fn()
    .mockResolvedValue({ id: 'temple-1', verificationStatus: 'VERIFIED' });
  readonly setTemplePublication = vi
    .fn()
    .mockResolvedValue({ id: 'temple-1', publicationStatus: 'PUBLISHED' });
  readonly createTemple = vi.fn().mockResolvedValue({
    id: 'temple-1',
    verificationStatus: 'PENDING',
    publicationStatus: 'DRAFT',
  });

  async listTemples() {
    return { items: [], total: 0 };
  }
  async updateTemple() {
    return { id: 'temple-1' };
  }
  async listOrganizations() {
    return { items: [], total: 0 };
  }
  async createOrganization() {
    return { id: 'organization-1' };
  }
  readonly updateOrganization = vi.fn().mockResolvedValue({ id: 'organization-1' });
  readonly setOrganizationPublication = vi
    .fn()
    .mockResolvedValue({ id: 'organization-1', publicationStatus: 'PUBLISHED' });
  async reviewOrganization() {
    return { id: 'organization-1', verificationStatus: 'VERIFIED' };
  }
  async listAuditEvents() {
    return { items: [], total: 0 };
  }
  async createTempleReport() {
    return { id: 'report-1', status: 'OPEN' };
  }
  async createOrganizationReport() {
    return { id: 'report-2', status: 'OPEN' };
  }
  async listReports() {
    return { items: [], total: 0 };
  }
  async updateReport() {
    return { id: 'report-1', status: 'ACTIONED' };
  }
  async submitRepresentativeClaim() {
    return { id: 'claim-1', status: 'PENDING' };
  }
  async listOrganizationMemberships() {
    return [];
  }
  async listRepresentativeClaims() {
    return [];
  }
  async listAdminRepresentativeClaims() {
    return { items: [], total: 0 };
  }
  async decideRepresentativeClaim() {
    return { id: 'claim-1', status: 'APPROVED' };
  }
  async revokeOrganizationMember() {
    return { id: 'member-1', status: 'REVOKED' };
  }
  async updateOrganizationAsMember() {
    return { id: 'organization-1' };
  }
  async updateTempleAsMember() {
    return { id: 'temple-1' };
  }
  async createCorrection() {
    return { id: 'correction-1', status: 'SUBMITTED' };
  }
  async listMyReports() {
    return { items: [], total: 0 };
  }
  async listMyCorrections() {
    return { items: [], total: 0 };
  }
  async listCorrections() {
    return { items: [], total: 0 };
  }
  async updateCorrection() {
    return { id: 'correction-1', status: 'APPROVED' };
  }
}

function createTestApp(authStore: AuthStore, adminStore: AdminStore) {
  return createApp(config, {
    database: { check: vi.fn().mockResolvedValue(undefined) },
    authStore,
    adminStore,
    templeDirectory: { list: async () => ({ items: [], total: 0 }), findBySlug: async () => null },
  });
}

async function login(app: ReturnType<typeof createApp>, email: string, password: string) {
  const response = await request(app).post('/api/v1/auth/login').send({ email, password });
  return response.body.data.accessToken as string;
}

describe('protected admin API', () => {
  it('denies anonymous and normal-member access before the admin store is called', async () => {
    const auth = new FakeAuthStore();
    const admin = new FakeAdminStore();
    const app = createTestApp(auth, admin);

    const anonymous = await request(app).get('/api/v1/admin/temples');
    expect(anonymous.status).toBe(401);

    const passwordHash = await hashPassword('a secure synthetic password');
    auth.users.set('member@example.test', {
      ...editor,
      email: 'member@example.test',
      passwordHash,
    });
    auth.roleKeys = ['MEMBER'];
    const token = await login(app, 'member@example.test', 'a secure synthetic password');
    const member = await request(app)
      .get('/api/v1/admin/temples')
      .set('Authorization', `Bearer ${token}`);
    expect(member.status).toBe(403);
    expect(admin.createTemple).not.toHaveBeenCalled();
  });

  it('enforces separate reviewer/editor permissions and rejects client status mass assignment', async () => {
    const auth = new FakeAuthStore();
    const admin = new FakeAdminStore();
    const app = createTestApp(auth, admin);
    const passwordHash = await hashPassword('a secure synthetic password');
    auth.users.set('editor@example.test', { ...editor, passwordHash });

    auth.roleKeys = ['VERIFIER'];
    const reviewerToken = await login(app, 'editor@example.test', 'a secure synthetic password');
    const review = await request(app)
      .post('/api/v1/admin/temples/7a2c7a82-769a-4d76-b9bf-8e27b9bc4242/verification')
      .set('Authorization', `Bearer ${reviewerToken}`)
      .send({ status: 'VERIFIED', notes: 'Synthetic review note' });
    expect(review.status).toBe(200);
    expect(admin.reviewTemple).toHaveBeenCalledWith(
      '7a2c7a82-769a-4d76-b9bf-8e27b9bc4242',
      'VERIFIED',
      'Synthetic review note',
      expect.objectContaining({ userId: editor.id }),
    );

    auth.roleKeys = ['CONTENT_EDITOR'];
    const editorToken = await login(app, 'editor@example.test', 'a secure synthetic password');
    const publication = await request(app)
      .post('/api/v1/admin/temples/7a2c7a82-769a-4d76-b9bf-8e27b9bc4242/publication')
      .set('Authorization', `Bearer ${editorToken}`)
      .send({ status: 'PUBLISHED' });
    expect(publication.status).toBe(200);
    expect(admin.setTemplePublication).toHaveBeenCalled();

    const organizationPublication = await request(app)
      .post('/api/v1/admin/organizations/7a2c7a82-769a-4d76-b9bf-8e27b9bc4242/publication')
      .set('Authorization', `Bearer ${editorToken}`)
      .send({ status: 'PUBLISHED' });
    expect(organizationPublication.status).toBe(200);
    expect(admin.setOrganizationPublication).toHaveBeenCalled();

    const organizationUpdate = await request(app)
      .patch('/api/v1/admin/organizations/7a2c7a82-769a-4d76-b9bf-8e27b9bc4242')
      .set('Authorization', `Bearer ${editorToken}`)
      .send({ name: 'Updated Synthetic Trust' });
    expect(organizationUpdate.status).toBe(200);
    expect(admin.updateOrganization).toHaveBeenCalledWith(
      '7a2c7a82-769a-4d76-b9bf-8e27b9bc4242',
      { name: 'Updated Synthetic Trust' },
      expect.objectContaining({ userId: editor.id }),
    );

    const massAssignment = await request(app)
      .post('/api/v1/admin/temples')
      .set('Authorization', `Bearer ${editorToken}`)
      .send({
        name: 'Synthetic Temple',
        slug: 'synthetic-temple',
        verificationStatus: 'VERIFIED',
        publicationStatus: 'PUBLISHED',
      });
    expect(massAssignment.status).toBe(400);
    expect(admin.createTemple).not.toHaveBeenCalled();
  });

  it('returns safe errors for invalid IDs and invalid transitions', async () => {
    const auth = new FakeAuthStore();
    const admin = new FakeAdminStore();
    admin.reviewTemple.mockRejectedValue(
      new AppError(409, 'INVALID_STATE_TRANSITION', 'invalid transition'),
    );
    const app = createTestApp(auth, admin);
    const passwordHash = await hashPassword('a secure synthetic password');
    auth.users.set('reviewer@example.test', {
      ...editor,
      email: 'reviewer@example.test',
      passwordHash,
    });
    auth.roleKeys = ['VERIFIER'];
    const token = await login(app, 'reviewer@example.test', 'a secure synthetic password');

    const invalidId = await request(app)
      .post('/api/v1/admin/temples/not-a-uuid/verification')
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'VERIFIED' });
    expect(invalidId.status).toBe(400);
    expect(invalidId.body.error.code).toBe('INVALID_ID');

    const invalidTransition = await request(app)
      .post('/api/v1/admin/temples/7a2c7a82-769a-4d76-b9bf-8e27b9bc4242/verification')
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'VERIFIED' });
    expect(invalidTransition.status).toBe(409);
    expect(invalidTransition.body.error.code).toBe('INVALID_STATE_TRANSITION');
  });
});
