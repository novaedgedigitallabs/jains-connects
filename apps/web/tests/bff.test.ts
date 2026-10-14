import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  DELETE as memberDelete,
  GET as memberGet,
  PATCH as memberPatch,
  POST as memberPost,
} from '../app/api/member/[...path]/route';
import {
  DELETE as adminDelete,
  GET as adminGet,
  PATCH as adminPatch,
  POST as adminPost,
} from '../app/api/admin/[...path]/route';
import {
  DELETE as memberSessionDelete,
  POST as memberSessionPost,
} from '../app/api/member/session/route';
import { POST as memberRegisterPost } from '../app/api/member/register/route';
import {
  DELETE as adminSessionDelete,
  POST as adminSessionPost,
} from '../app/api/admin/session/route';
import { memberUpstreamPath, adminUpstreamPath } from '../lib/server/routes';

const { cookieStore } = vi.hoisted(() => ({
  cookieStore: {
    get: vi.fn(() => ({ value: 'member-secret-token' })),
    set: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => cookieStore),
}));

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe('web BFF route boundaries', () => {
  it('maps private member report listings through /me and keeps account scope', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          data: [],
          pagination: { page: 1, pageSize: 10, total: 0, totalPages: 0 },
        }),
        {
          status: 200,
          headers: { 'content-type': 'application/json' },
        },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    const response = await memberGet(
      new Request('http://localhost/api/member/me/reports?page=1&pageSize=10'),
      { params: Promise.resolve({ path: ['me', 'reports'] }) },
    );

    expect(fetchMock).toHaveBeenCalledWith(
      'http://127.0.0.1:3001/api/v1/me/reports?page=1&pageSize=10',
      expect.objectContaining({ headers: expect.any(Headers), cache: 'no-store' }),
    );
    expect(response.headers.get('cache-control')).toBe('no-store, private');
    expect(response.headers.get('x-robots-tag')).toContain('noindex');
  });

  it('adds the admin prefix for access and rejects non-allowlisted admin paths', async () => {
    expect(adminUpstreamPath(['access'], 'GET')).toBe('/admin/access');
    expect(adminUpstreamPath(['auth', 'login'], 'POST')).toBeNull();

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: { roles: ['ADMIN'] } }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);
    await adminGet(new Request('http://localhost/api/admin/access'), {
      params: Promise.resolve({ path: ['access'] }),
    });
    expect(fetchMock).toHaveBeenCalledWith(
      'http://127.0.0.1:3001/api/v1/admin/access',
      expect.any(Object),
    );
  });

  it('requires an exact same-origin header on member login', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const response = await memberSessionPost(
      new Request('http://localhost/api/member/session', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'member@example.test', password: 'synthetic-password' }),
      }),
    );
    expect(response.status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects a mismatched origin before forwarding logout', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const response = await memberSessionDelete(
      new Request('http://localhost/api/member/session', {
        method: 'DELETE',
        headers: { origin: 'https://attacker.example' },
      }),
    );
    expect(response.status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    [
      'member POST',
      memberPost,
      ['reports', 'organizations', '7a2c7a82-769a-4d76-b9bf-8e27b9bc4242'],
    ],
    ['member PATCH', memberPatch, ['organizations', '7a2c7a82-769a-4d76-b9bf-8e27b9bc4242']],
    ['member DELETE', memberDelete, ['organizations', '7a2c7a82-769a-4d76-b9bf-8e27b9bc4242']],
    ['admin POST', adminPost, ['temples', '7a2c7a82-769a-4d76-b9bf-8e27b9bc4242', 'publication']],
    ['admin PATCH', adminPatch, ['reports', '7a2c7a82-769a-4d76-b9bf-8e27b9bc4242']],
    ['admin DELETE', adminDelete, ['reports', '7a2c7a82-769a-4d76-b9bf-8e27b9bc4242']],
  ])('rejects a cross-origin %s proxy mutation', async (_label, handler, path) => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const response = await handler(
      new Request('http://localhost/api/private', {
        method: _label.includes('POST') ? 'POST' : _label.includes('PATCH') ? 'PATCH' : 'DELETE',
        headers: { origin: 'https://attacker.example' },
      }),
      { params: Promise.resolve({ path }) },
    );
    expect(response.status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('accepts exact same-origin admin login and logout requests without exposing the token', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            data: {
              accessToken: 'admin-secret-token',
              expiresAt: new Date(Date.now() + 60_000).toISOString(),
              user: { id: 'admin-1', email: 'admin@example.test', displayName: 'Synthetic Admin' },
            },
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        ),
      )
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetchMock);

    const loginResponse = await adminSessionPost(
      new Request('http://localhost/api/admin/session', {
        method: 'POST',
        headers: { origin: 'http://localhost', 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'admin@example.test', password: 'synthetic-password' }),
      }),
    );
    expect(loginResponse.status).toBe(200);
    expect(await loginResponse.text()).not.toContain('admin-secret-token');

    const logoutResponse = await adminSessionDelete(
      new Request('http://localhost/api/admin/session', {
        method: 'DELETE',
        headers: { origin: 'http://localhost' },
      }),
    );
    expect(logoutResponse.status).toBe(204);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(cookieStore.delete).toHaveBeenCalledWith('jainconnect_admin_session');
  });

  it.each([
    ['member login', memberSessionPost, 'POST'],
    ['member registration', memberRegisterPost, 'POST'],
    ['member logout', memberSessionDelete, 'DELETE'],
    ['admin login', adminSessionPost, 'POST'],
    ['admin logout', adminSessionDelete, 'DELETE'],
  ])('requires same-origin requests for %s', async (_label, handler, method) => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const response = await handler(
      new Request('http://localhost/api/session', {
        method,
        headers: { origin: 'https://attacker.example' },
        ...(method === 'POST'
          ? {
              body: JSON.stringify({
                email: 'member@example.test',
                password: 'synthetic-password',
              }),
              headers: {
                origin: 'https://attacker.example',
                'content-type': 'application/json',
              },
            }
          : {}),
      }),
    );
    expect(response.status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('does not reflect a bearer token from malformed upstream login success', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ data: { accessToken: 'upstream-secret-token' } }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      ),
    );
    const response = await memberSessionPost(
      new Request('http://localhost/api/member/session', {
        method: 'POST',
        headers: { origin: 'http://localhost', 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'member@example.test', password: 'synthetic-password' }),
      }),
    );
    const body = await response.text();
    expect(response.status).toBe(502);
    expect(body).not.toContain('upstream-secret-token');
    expect(cookieStore.set).not.toHaveBeenCalled();
  });

  it('removes token-shaped fields and values from forwarded private responses', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            data: {
              accessToken: 'member-secret-token',
              nested: { token: 'other-secret', message: 'Bearer member-secret-token' },
            },
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        ),
      ),
    );
    const response = await memberGet(new Request('http://localhost/api/member/me'), {
      params: Promise.resolve({ path: ['me'] }),
    });
    const body = await response.text();
    expect(body).not.toContain('member-secret-token');
    expect(body).not.toContain('other-secret');
    expect(body).not.toContain('accessToken');
    expect(body).not.toContain('token');
  });
});

describe('explicit BFF route mapping', () => {
  it('keeps member report submission and organization management on their intended API roots', () => {
    expect(
      memberUpstreamPath(
        ['reports', 'organizations', '7a2c7a82-769a-4d76-b9bf-8e27b9bc4242'],
        'POST',
      ),
    ).toBe('/reports/organizations/7a2c7a82-769a-4d76-b9bf-8e27b9bc4242');
    expect(
      memberUpstreamPath(['organizations', '7a2c7a82-769a-4d76-b9bf-8e27b9bc4242'], 'PATCH'),
    ).toBe('/organizations/7a2c7a82-769a-4d76-b9bf-8e27b9bc4242');
    expect(memberUpstreamPath(['auth', 'login'], 'POST')).toBeNull();
    expect(memberUpstreamPath(['me', 'reports'], 'POST')).toBeNull();
    expect(
      memberUpstreamPath(['organizations', '7a2c7a82-769a-4d76-b9bf-8e27b9bc4242'], 'DELETE'),
    ).toBeNull();
    expect(adminUpstreamPath(['auth', 'login'], 'POST')).toBeNull();
    expect(
      adminUpstreamPath(['reports', '7a2c7a82-769a-4d76-b9bf-8e27b9bc4242'], 'DELETE'),
    ).toBeNull();
  });
});
