import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app.js';
import type { AppConfig } from '../src/config/env.js';
import { hashPassword } from '../src/auth/password.js';
import { hashAccessToken } from '../src/auth/tokens.js';
import type { ActiveSession, AuthStore, AuthUser, MfaSecretRecord } from '../src/auth/store.js';

const config: AppConfig = {
  nodeEnv: 'test',
  port: 4100,
  host: '127.0.0.1',
  sessionTtlSeconds: 3600,
  databaseUrl: 'postgresql://test:test@localhost:5432/jainconnect_test',
  corsOrigins: [],
  smtp: { port: 587, secure: false },
};

const user: AuthUser = {
  id: '7a2c7a82-769a-4d76-b9bf-8e27b9bc4242',
  email: 'member@example.test',
  displayName: 'Synthetic Member',
  status: 'ACTIVE',
  passwordHash: null,
  emailVerifiedAt: null,
};

class FakeAuthStore implements AuthStore {
  readonly sessions = new Map<string, ActiveSession>();
  readonly users = new Map<string, AuthUser>();
  roleKeys: string[] = [];

  async findUserByEmail(emailNormalized: string) {
    return this.users.get(emailNormalized) ?? null;
  }

  async createUser(input: {
    email: string;
    emailNormalized: string;
    displayName: string;
    passwordHash: string;
  }) {
    const created: AuthUser = {
      id: 'f13e691f-d9f4-45a6-a1d7-2f9525aa8d4b',
      email: input.email,
      displayName: input.displayName,
      status: 'ACTIVE',
      passwordHash: input.passwordHash,
      emailVerifiedAt: null,
    };
    this.users.set(input.emailNormalized, created);
    return created;
  }

  async createSession(input: { userId: string; tokenHash: string; expiresAt: Date }) {
    this.sessions.set(input.tokenHash, {
      tokenHash: input.tokenHash,
      mfaVerifiedAt: null,
      user,
    });
  }

  async findActiveSession(tokenHash: string, _now: Date) {
    const session = this.sessions.get(tokenHash);
    return session && session.user.status === 'ACTIVE' ? session : null;
  }

  async findActiveRoleKeys(_userId: string) {
    return this.roleKeys;
  }

  async touchSession(_tokenHash: string, _lastUsedAt: Date) {}

  async revokeSession(tokenHash: string, _revokedAt: Date) {
    this.sessions.delete(tokenHash);
  }

  async revokeAllUserSessions(_userId: string, _revokedAt: Date) {
    this.sessions.clear();
  }

  async markUserLoggedIn(_userId: string, _loggedInAt: Date) {}

  async setSessionMfaVerified(_tokenHash: string, _verifiedAt: Date) {}

  async purgeStaleAuthRecords(_before: Date) {
    return { sessions: 0, verificationTokens: 0, resetTokens: 0 };
  }

  // Email verification
  async createEmailVerificationToken(_input: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }) {
    return { id: 'evt-1' };
  }

  async verifyEmailWithToken(_tokenHash: string, _now: Date) {
    return null;
  }

  // Password reset
  async createPasswordResetToken(_input: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }) {
    return { id: 'prt-1' };
  }

  async resetPasswordWithToken(
    _tokenHash: string,
    _newPasswordHash: string,
    _now: Date,
  ) {
    return null;
  }

  // MFA stubs
  async findMfaCredential(_userId: string): Promise<MfaSecretRecord | null> {
    return null;
  }

  async createMfaCredential(_input: {
    userId: string;
    secretCipher: Uint8Array;
    secretIv: Uint8Array;
    secretTag: Uint8Array;
  }) {}

  async activateMfaCredential(_userId: string, _activatedAt: Date) {}
  async disableMfaCredential(_userId: string) {}
  async recordMfaVerification(_userId: string, _verifiedAt: Date) {}
  async replaceRecoveryCodes(_userId: string, _codeHashes: string[]) {}
  async consumeRecoveryCode(_codeHash: string, _now: Date) {
    return null;
  }
}

function createTestApp(store: AuthStore) {
  return createApp(config, {
    database: { check: vi.fn().mockResolvedValue(undefined) },
    authStore: store,
    templeDirectory: {
      list: async () => ({ items: [], total: 0 }),
      findBySlug: async () => null,
    },
  });
}

describe('authentication API', () => {
  it('registers a user without returning or storing a plaintext password', async () => {
    const store = new FakeAuthStore();
    const app = createTestApp(store);

    const response = await request(app).post('/api/v1/auth/register').send({
      email: 'Member@Example.Test',
      displayName: 'Synthetic Member',
      password: 'a secure synthetic password',
    });

    expect(response.status).toBe(201);
    expect(response.body.data.user).toMatchObject({
      id: 'f13e691f-d9f4-45a6-a1d7-2f9525aa8d4b',
      email: 'member@example.test',
      displayName: 'Synthetic Member',
    });
    expect(JSON.stringify(response.body)).not.toContain('secure synthetic');
    expect(store.users.get('member@example.test')?.passwordHash).toMatch(/^scrypt-v1\$/);
  });

  it('rejects weak or mass-assigned registration fields before persistence', async () => {
    const store = new FakeAuthStore();
    const app = createTestApp(store);

    const response = await request(app).post('/api/v1/auth/register').send({
      email: 'member@example.test',
      displayName: 'S',
      password: 'short',
      status: 'ADMIN',
      role: 'ADMIN',
    });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('INVALID_INPUT');
    expect(store.users.size).toBe(0);
  });

  it('logs in with a valid password and supports me/logout/revocation', async () => {
    const store = new FakeAuthStore();
    const passwordHash = await hashPassword('a secure synthetic password');
    store.users.set('member@example.test', { ...user, passwordHash });
    const app = createTestApp(store);

    const login = await request(app).post('/api/v1/auth/login').send({
      email: 'MEMBER@example.test',
      password: 'a secure synthetic password',
    });

    expect(login.status).toBe(200);
    expect(login.body.data.accessToken).toEqual(expect.any(String));
    expect(login.body.data.user).toMatchObject({
      id: user.id,
      email: user.email,
      displayName: user.displayName,
    });

    const token = login.body.data.accessToken as string;
    const me = await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${token}`);
    expect(me.status).toBe(200);
    expect(me.body.data.user.email).toBe('member@example.test');

    const logout = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${token}`);
    expect(logout.status).toBe(204);

    const revoked = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(revoked.status).toBe(401);
    expect(revoked.body.error.code).toBe('INVALID_SESSION');
  });

  it('does not disclose whether an email has a valid password', async () => {
    const store = new FakeAuthStore();
    store.users.set('member@example.test', {
      ...user,
      passwordHash: await hashPassword('correct password'),
    });
    const app = createTestApp(store);

    const response = await request(app).post('/api/v1/auth/login').send({
      email: 'member@example.test',
      password: 'incorrect password',
    });

    expect(response.status).toBe(401);
    expect(response.body.error).toMatchObject({
      code: 'INVALID_CREDENTIALS',
      message: 'Email or password is incorrect',
    });
  });

  it('requires a bearer token for protected account routes', async () => {
    const app = createTestApp(new FakeAuthStore());

    const response = await request(app).get('/api/v1/auth/me');

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('AUTHENTICATION_REQUIRED');
  });

  it('denies a normal member from the protected admin access boundary', async () => {
    const store = new FakeAuthStore();
    const passwordHash = await hashPassword('a secure synthetic password');
    store.users.set('member@example.test', { ...user, passwordHash });
    const app = createTestApp(store);
    const login = await request(app).post('/api/v1/auth/login').send({
      email: 'member@example.test',
      password: 'a secure synthetic password',
    });

    const response = await request(app)
      .get('/api/v1/admin/access')
      .set('Authorization', `Bearer ${login.body.data.accessToken as string}`);

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('FORBIDDEN');
  });

  it('allows a server-resolved admin role and returns only active role keys', async () => {
    const store = new FakeAuthStore();
    store.roleKeys = ['CONTENT_EDITOR'];
    const passwordHash = await hashPassword('a secure synthetic password');
    store.users.set('member@example.test', { ...user, passwordHash });
    const app = createTestApp(store);
    const login = await request(app).post('/api/v1/auth/login').send({
      email: 'member@example.test',
      password: 'a secure synthetic password',
    });

    const response = await request(app)
      .get('/api/v1/admin/access')
      .set('Authorization', `Bearer ${login.body.data.accessToken as string}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: { roles: ['CONTENT_EDITOR'] } });
  });

  it('uses a one-way token hash for a session lookup', () => {
    expect(hashAccessToken('synthetic-token')).not.toBe('synthetic-token');
    expect(hashAccessToken('synthetic-token')).toHaveLength(64);
  });
});
