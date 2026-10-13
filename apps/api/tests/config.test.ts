import { describe, expect, it } from 'vitest';
import { loadConfig } from '../src/config/env.js';

const validEnvironment = {
  NODE_ENV: 'test',
  PORT: '4100',
  HOST: '127.0.0.1',
  DATABASE_URL: 'postgresql://test:test@localhost:5432/jainconnect_test',
  CORS_ORIGINS: 'http://localhost:3000, https://example.test',
};

describe('loadConfig', () => {
  it('normalizes validated environment values', () => {
    expect(loadConfig(validEnvironment)).toEqual({
      nodeEnv: 'test',
      port: 4100,
      host: '127.0.0.1',
      sessionTtlSeconds: 604800,
      databaseUrl: 'postgresql://test:test@localhost:5432/jainconnect_test',
      corsOrigins: ['http://localhost:3000', 'https://example.test'],
    });
  });

  it('fails without a PostgreSQL database URL', () => {
    const environment = { ...validEnvironment, DATABASE_URL: undefined };

    expect(() => loadConfig(environment)).toThrow(/DATABASE_URL/);
  });

  it('rejects non-PostgreSQL database URLs', () => {
    const environment = { ...validEnvironment, DATABASE_URL: 'https://example.test/database' };

    expect(() => loadConfig(environment)).toThrow(/postgres/);
  });
});
