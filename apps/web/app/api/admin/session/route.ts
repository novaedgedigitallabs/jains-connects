import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const apiBaseUrl = process.env.API_BASE_URL ?? 'http://127.0.0.1:3001/api/v1';
const sessionCookie = 'jainconnect_admin_session';

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { message: 'Enter a valid email and password.' } },
      { status: 400 },
    );
  }

  try {
    const upstream = await fetch(`${apiBaseUrl.replace(/\/$/, '')}/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
    });
    const payload = (await upstream.json()) as {
      data?: { accessToken?: string; expiresAt?: string; user?: { displayName?: string } };
      error?: { code?: string; message?: string };
    };

    if (!upstream.ok || !payload.data?.accessToken || !payload.data.expiresAt) {
      return NextResponse.json(payload, { status: upstream.status });
    }

    const expiresAt = new Date(payload.data.expiresAt);
    const maxAge = Math.max(1, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
    const cookieStore = await cookies();
    cookieStore.set(sessionCookie, payload.data.accessToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge,
      path: '/',
    });

    return NextResponse.json(
      { data: { user: payload.data.user, expiresAt: payload.data.expiresAt } },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      { error: { code: 'API_UNAVAILABLE', message: 'The sign-in service is unavailable.' } },
      { status: 503 },
    );
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookie)?.value;

  if (token) {
    try {
      await fetch(`${apiBaseUrl.replace(/\/$/, '')}/auth/logout`, {
        method: 'POST',
        headers: { authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
    } catch {
      // Clear the browser session even if the API is unavailable.
    }
  }

  cookieStore.delete(sessionCookie);
  return new Response(null, { status: 204 });
}
