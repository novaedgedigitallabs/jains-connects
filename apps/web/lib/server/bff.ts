import { NextResponse } from 'next/server';

export const apiBaseUrl = process.env.API_BASE_URL ?? 'http://127.0.0.1:3001/api/v1';

const privateHeaders = {
  'cache-control': 'no-store, private',
  'x-robots-tag': 'noindex, nofollow, noarchive',
};

export function privateJson(body: unknown, status = 200, headers?: HeadersInit) {
  return NextResponse.json(body, {
    status,
    headers: { ...privateHeaders, ...headers },
  });
}

export function privateEmpty(status = 204) {
  return new Response(null, { status, headers: privateHeaders });
}

export function sameOriginFailure(request: Request) {
  const origin = request.headers.get('origin');
  if (!origin || origin !== new URL(request.url).origin) {
    return privateJson(
      { error: { code: 'CSRF_REJECTED', message: 'Request origin is not allowed.' } },
      403,
    );
  }
  return null;
}

export function apiUrl(path: string) {
  return `${apiBaseUrl.replace(/\/$/, '')}${path}`;
}

const secretKeys = new Set([
  'accesstoken',
  'access_token',
  'refreshtoken',
  'refresh_token',
  'token',
  'authorization',
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function containsSecret(value: string, token?: string) {
  return Boolean(
    (token && value.includes(token)) ||
    /bearer\s+[a-z0-9._~-]+/i.test(value) ||
    /ey[a-z0-9_-]{10,}\.[a-z0-9_-]{10,}\.[a-z0-9_-]{10,}/i.test(value),
  );
}

function stripSecrets(value: unknown, token?: string): unknown {
  if (typeof value === 'string' && containsSecret(value, token)) return '[redacted]';
  if (Array.isArray(value)) return value.map((item) => stripSecrets(item, token));
  if (!isRecord(value)) return value;

  const result: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value)) {
    if (secretKeys.has(key.toLowerCase())) continue;
    result[key] = stripSecrets(item, token);
  }
  return result;
}

function safeError(upstreamStatus: number, payload: unknown, token?: string) {
  if (isRecord(payload) && isRecord(payload.error)) {
    const code = typeof payload.error.code === 'string' ? payload.error.code : 'UPSTREAM_ERROR';
    const message = typeof payload.error.message === 'string' ? payload.error.message : '';
    if (message && !containsSecret(message, token)) {
      return { error: { code, message } };
    }
  }

  return {
    error: {
      code: upstreamStatus >= 500 ? 'API_UNAVAILABLE' : 'REQUEST_FAILED',
      message:
        upstreamStatus >= 500
          ? 'The service is temporarily unavailable.'
          : 'The request could not be completed.',
    },
  };
}

export async function forwardJsonResponse(upstream: Response, token?: string) {
  if (upstream.status === 204) return privateEmpty(204);

  let payload: unknown;
  try {
    payload = await upstream.json();
  } catch {
    return privateJson(
      {
        error: {
          code: 'INVALID_UPSTREAM_RESPONSE',
          message: 'The service returned an invalid response.',
        },
      },
      502,
    );
  }

  if (!upstream.ok) return privateJson(safeError(upstream.status, payload, token), upstream.status);
  return privateJson(stripSecrets(payload, token), upstream.status);
}

export function privateError(code: string, message: string, status: number) {
  return privateJson({ error: { code, message } }, status);
}

export function authFailure(status: number, operation: 'sign-in' | 'registration') {
  if (status === 401) {
    return privateJson(
      {
        error: {
          code: operation === 'sign-in' ? 'INVALID_CREDENTIALS' : 'REGISTRATION_FAILED',
          message:
            operation === 'sign-in'
              ? 'Email or password is incorrect.'
              : 'Registration could not be completed.',
        },
      },
      status,
    );
  }
  if (status === 409 && operation === 'registration') {
    return privateJson(
      { error: { code: 'EMAIL_IN_USE', message: 'An account already exists for this email.' } },
      status,
    );
  }
  if (status === 429) {
    return privateJson(
      {
        error: {
          code: 'RATE_LIMITED',
          message: 'Too many authentication attempts. Please try again later.',
        },
      },
      status,
    );
  }
  return privateJson(
    {
      error: {
        code: operation === 'sign-in' ? 'SIGN_IN_FAILED' : 'REGISTRATION_FAILED',
        message: operation === 'sign-in' ? 'Sign-in failed.' : 'Registration failed.',
      },
    },
    status,
  );
}
