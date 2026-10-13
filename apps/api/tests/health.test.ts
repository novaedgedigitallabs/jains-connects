import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app.js';
import type { AppConfig } from '../src/config/env.js';

const config: AppConfig = {
  nodeEnv: 'test',
  port: 4100,
  host: '127.0.0.1',
  sessionTtlSeconds: 604800,
  databaseUrl: 'postgresql://test:test@localhost:5432/jainconnect_test',
  corsOrigins: ['http://localhost:3000'],
};

const createTestApp = (database: { check: () => Promise<void> }) =>
  createApp(config, {
    database,
    templeDirectory: {
      list: async () => ({ items: [], total: 0 }),
      findBySlug: async () => null,
    },
  });

describe('health API', () => {
  it('returns a live response without requiring the database', async () => {
    const database = { check: vi.fn().mockRejectedValue(new Error('database offline')) };
    const app = createTestApp(database);

    const response = await request(app).get('/api/v1/health/live');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      data: {
        status: 'ok',
        service: 'jainconnect-api',
      },
    });
    expect(database.check).not.toHaveBeenCalled();
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-request-id']).toBeTruthy();
  });

  it('reports database readiness without exposing provider details', async () => {
    const database = { check: vi.fn().mockRejectedValue(new Error('password=secret')) };
    const app = createTestApp(database);

    const response = await request(app).get('/api/v1/health/ready');

    expect(response.status).toBe(503);
    expect(response.body.error).toMatchObject({
      code: 'SERVICE_UNAVAILABLE',
      message: 'The service is not ready',
    });
    expect(JSON.stringify(response.body)).not.toContain('secret');
  });

  it('returns readiness when the database check succeeds', async () => {
    const database = { check: vi.fn().mockResolvedValue(undefined) };
    const app = createTestApp(database);

    const response = await request(app).get('/api/v1/health/ready');

    expect(response.status).toBe(200);
    expect(response.body.data.dependencies.database).toBe('ok');
    expect(database.check).toHaveBeenCalledOnce();
  });

  it('uses a consistent error envelope for unknown routes', async () => {
    const database = { check: vi.fn().mockResolvedValue(undefined) };
    const app = createTestApp(database);

    const response = await request(app).get('/api/v1/missing');

    expect(response.status).toBe(404);
    expect(response.body.error).toMatchObject({
      code: 'NOT_FOUND',
      message: 'Route not found',
    });
    expect(response.body.error.requestId).toBe(response.headers['x-request-id']);
  });

  it('replaces malformed incoming request IDs instead of reflecting unsafe values', async () => {
    const database = { check: vi.fn().mockResolvedValue(undefined) };
    const app = createTestApp(database);

    const response = await request(app)
      .get('/api/v1/missing')
      .set('X-Request-Id', 'contains whitespace');

    expect(response.headers['x-request-id']).not.toBe('contains whitespace');
    expect(response.headers['x-request-id']).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('returns a safe error for malformed JSON', async () => {
    const database = { check: vi.fn().mockResolvedValue(undefined) };
    const app = createTestApp(database);

    const response = await request(app)
      .post('/api/v1/health/live')
      .set('Content-Type', 'application/json')
      .send('{"broken":');

    expect(response.status).toBe(400);
    expect(response.body.error).toMatchObject({
      code: 'INVALID_JSON',
      message: 'Request body must contain valid JSON',
    });
    expect(response.body.error.requestId).toBe(response.headers['x-request-id']);
  });

  it('does not grant CORS access to an unlisted browser origin', async () => {
    const database = { check: vi.fn().mockResolvedValue(undefined) };
    const app = createTestApp(database);

    const response = await request(app)
      .get('/api/v1/health/live')
      .set('Origin', 'https://unlisted.example');

    expect(response.status).toBe(200);
    expect(response.headers['access-control-allow-origin']).toBeUndefined();
  });
});
