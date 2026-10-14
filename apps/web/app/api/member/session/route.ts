import { cookies } from 'next/headers';
import {
  apiUrl,
  authFailure,
  forwardJsonResponse,
  privateEmpty,
  privateJson,
  sameOriginFailure,
} from '../../../../lib/server/bff';

const sessionCookie = 'jainconnect_member_session';

function credentials(value: unknown) {
  if (!value || typeof value !== 'object') return null;
  const record = value as Record<string, unknown>;
  if (typeof record.email !== 'string' || typeof record.password !== 'string') return null;
  return { email: record.email, password: record.password };
}

function publicUser(value: unknown) {
  if (!value || typeof value !== 'object') return undefined;
  const user = value as Record<string, unknown>;
  return {
    ...(typeof user.id === 'string' ? { id: user.id } : {}),
    ...(typeof user.email === 'string' ? { email: user.email } : {}),
    ...(typeof user.displayName === 'string' ? { displayName: user.displayName } : {}),
  };
}

export async function GET() {
  const token = (await cookies()).get(sessionCookie)?.value;
  if (!token) return privateJson({ data: { user: null } });

  try {
    const upstream = await fetch(apiUrl('/auth/me'), {
      headers: { authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!upstream.ok) {
      return privateJson(
        {
          error: {
            code: upstream.status === 401 ? 'INVALID_SESSION' : 'API_UNAVAILABLE',
            message:
              upstream.status === 401
                ? 'The session is invalid or expired.'
                : 'The sign-in service is unavailable.',
          },
        },
        upstream.status,
      );
    }
    return forwardJsonResponse(upstream, token);
  } catch {
    return privateJson(
      { error: { code: 'API_UNAVAILABLE', message: 'The sign-in service is unavailable.' } },
      503,
    );
  }
}

export async function POST(request: Request) {
  const originFailure = sameOriginFailure(request);
  if (originFailure) return originFailure;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return privateJson(
      { error: { code: 'INVALID_INPUT', message: 'Enter a valid email and password.' } },
      400,
    );
  }
  const input = credentials(body);
  if (!input) {
    return privateJson(
      { error: { code: 'INVALID_INPUT', message: 'Enter a valid email and password.' } },
      400,
    );
  }

  try {
    const upstream = await fetch(apiUrl('/auth/login'), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(input),
      cache: 'no-store',
    });
    let payload: unknown;
    try {
      payload = await upstream.json();
    } catch {
      return privateJson(
        {
          error: {
            code: 'INVALID_UPSTREAM_RESPONSE',
            message: 'The sign-in service returned an invalid response.',
          },
        },
        502,
      );
    }

    const data =
      payload && typeof payload === 'object' && 'data' in payload
        ? (payload as { data?: unknown }).data
        : undefined;
    const auth = data && typeof data === 'object' ? (data as Record<string, unknown>) : undefined;
    const accessToken = typeof auth?.accessToken === 'string' ? auth.accessToken : null;
    const expiresAt = typeof auth?.expiresAt === 'string' ? auth.expiresAt : null;
    const expiry = expiresAt ? new Date(expiresAt) : null;
    const user = publicUser(auth?.user);

    if (!upstream.ok) {
      return authFailure(upstream.status, 'sign-in');
    }

    if (
      !accessToken ||
      !expiry ||
      Number.isNaN(expiry.getTime()) ||
      expiry.getTime() <= Date.now() ||
      !user ||
      Object.keys(user).length === 0
    ) {
      return privateJson(
        {
          error: {
            code: 'INVALID_UPSTREAM_RESPONSE',
            message: 'The sign-in service returned an invalid response.',
          },
        },
        502,
      );
    }

    const maxAge = Math.max(1, Math.floor((expiry.getTime() - Date.now()) / 1000));
    (await cookies()).set(sessionCookie, accessToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge,
      path: '/',
    });
    return privateJson({ data: { user, expiresAt } });
  } catch {
    return privateJson(
      { error: { code: 'API_UNAVAILABLE', message: 'The sign-in service is unavailable.' } },
      503,
    );
  }
}

export async function DELETE(request: Request) {
  const originFailure = sameOriginFailure(request);
  if (originFailure) return originFailure;

  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookie)?.value;
  if (token) {
    try {
      await fetch(apiUrl('/auth/logout'), {
        method: 'POST',
        headers: { authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
    } catch {
      // Local session clearing is still safe if the API is unavailable.
    }
  }
  cookieStore.delete(sessionCookie);
  return privateEmpty();
}
