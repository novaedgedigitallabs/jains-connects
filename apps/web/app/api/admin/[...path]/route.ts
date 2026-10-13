import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const apiBaseUrl = process.env.API_BASE_URL ?? 'http://127.0.0.1:3001/api/v1';
const sessionCookie = 'jainconnect_admin_session';

type RouteContext = { params: Promise<{ path: string[] }> };

async function proxy(request: Request, context: RouteContext) {
  const method = request.method.toUpperCase();
  if (!['GET', 'HEAD'].includes(method)) {
    const origin = request.headers.get('origin');
    if (origin && origin !== new URL(request.url).origin) {
      return NextResponse.json(
        { error: { code: 'CSRF_REJECTED', message: 'Request origin is not allowed.' } },
        { status: 403 },
      );
    }
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookie)?.value;
  if (!token) {
    return NextResponse.json(
      { error: { code: 'AUTHENTICATION_REQUIRED', message: 'Sign-in is required.' } },
      { status: 401 },
    );
  }

  const { path } = await context.params;
  const upstreamUrl = `${apiBaseUrl.replace(/\/$/, '')}/${path.map(encodeURIComponent).join('/')}${new URL(request.url).search}`;
  const headers = new Headers();
  headers.set('authorization', `Bearer ${token}`);
  const contentType = request.headers.get('content-type');
  if (contentType) headers.set('content-type', contentType);

  try {
    const upstream = await fetch(upstreamUrl, {
      method,
      headers,
      body: method === 'GET' || method === 'HEAD' ? undefined : await request.text(),
      cache: 'no-store',
    });
    const responseHeaders = new Headers();
    const upstreamContentType = upstream.headers.get('content-type');
    if (upstreamContentType) responseHeaders.set('content-type', upstreamContentType);
    return new Response(upstream.body, { status: upstream.status, headers: responseHeaders });
  } catch {
    return NextResponse.json(
      { error: { code: 'API_UNAVAILABLE', message: 'The admin service is unavailable.' } },
      { status: 503 },
    );
  }
}

export const GET = proxy;
export const POST = proxy;
export const PATCH = proxy;
