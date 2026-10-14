import { cookies } from 'next/headers';
import {
  apiUrl,
  forwardJsonResponse,
  privateError,
  privateJson,
  sameOriginFailure,
} from '../../../../lib/server/bff';
import { adminUpstreamPath } from '../../../../lib/server/routes';

const sessionCookie = 'jainconnect_admin_session';
type RouteContext = { params: Promise<{ path: string[] }> };

async function proxy(request: Request, context: RouteContext) {
  const method = request.method.toUpperCase();
  if (method !== 'GET' && method !== 'HEAD') {
    const originFailure = sameOriginFailure(request);
    if (originFailure) return originFailure;
  }

  const { path } = await context.params;
  const upstreamPath = adminUpstreamPath(path, method);
  if (!upstreamPath) return privateError('NOT_FOUND', 'The admin endpoint does not exist.', 404);

  const token = (await cookies()).get(sessionCookie)?.value;
  if (!token) {
    return privateJson(
      { error: { code: 'AUTHENTICATION_REQUIRED', message: 'Sign-in is required.' } },
      401,
    );
  }

  const headers = new Headers({ authorization: `Bearer ${token}` });
  if (method !== 'GET' && method !== 'HEAD') headers.set('content-type', 'application/json');
  const body = method === 'GET' || method === 'HEAD' ? undefined : await request.text();

  try {
    const upstream = await fetch(`${apiUrl(upstreamPath)}${new URL(request.url).search}`, {
      method,
      headers,
      body,
      cache: 'no-store',
    });
    return forwardJsonResponse(upstream, token);
  } catch {
    return privateJson(
      { error: { code: 'API_UNAVAILABLE', message: 'The admin service is unavailable.' } },
      503,
    );
  }
}

export const GET = proxy;
export const POST = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
