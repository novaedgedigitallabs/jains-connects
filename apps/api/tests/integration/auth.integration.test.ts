import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import type { AppConfig } from '../../src/config/env.js';
import { PrismaAuthStore } from '../../src/auth/store.js';

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

integrationSuite('authentication PostgreSQL integration', () => {
  const client = new PrismaClient({ datasources: { db: { url: config.databaseUrl } } });
  const email = `integration-${Date.now()}@example.test`;

  beforeAll(async () => {
    await client.$connect();
  });

  afterAll(async () => {
    await client.user.deleteMany({ where: { emailNormalized: email } });
    await client.$disconnect();
  });

  it('persists a hashed password, creates a revocable session, and rejects it after logout', async () => {
    const app = createApp(config, {
      database: {
        check: async () => {
          await client.$queryRaw`SELECT 1`;
        },
      },
      authStore: new PrismaAuthStore(client),
      templeDirectory: {
        list: async () => ({ items: [], total: 0 }),
        findBySlug: async () => null,
      },
    });

    const registration = await request(app).post('/api/v1/auth/register').send({
      email,
      displayName: 'Integration Member',
      password: 'integration-only password',
    });

    expect(registration.status).toBe(201);
    const storedUser = await client.user.findUnique({ where: { emailNormalized: email } });
    if (!storedUser) throw new Error('Integration user was not persisted');
    expect(storedUser?.passwordHash).toMatch(/^scrypt-v1\$/);
    expect(storedUser?.passwordHash).not.toContain('integration-only password');

    const login = await request(app).post('/api/v1/auth/login').send({
      email,
      password: 'integration-only password',
    });
    expect(login.status).toBe(200);

    const token = login.body.data.accessToken as string;
    expect(await client.session.count({ where: { userId: storedUser.id } })).toBe(1);

    const me = await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${token}`);
    expect(me.status).toBe(200);

    const logout = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${token}`);
    expect(logout.status).toBe(204);

    const revoked = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(revoked.status).toBe(401);
    expect(await client.session.count({ where: { userId: storedUser.id, revokedAt: null } })).toBe(
      0,
    );
  });
});
