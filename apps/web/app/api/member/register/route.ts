import {
  apiUrl,
  authFailure,
  forwardJsonResponse,
  privateJson,
  sameOriginFailure,
} from '../../../../lib/server/bff';

function registration(value: unknown) {
  if (!value || typeof value !== 'object') return null;
  const record = value as Record<string, unknown>;
  if (
    typeof record.email !== 'string' ||
    typeof record.password !== 'string' ||
    typeof record.displayName !== 'string'
  )
    return null;
  return {
    email: record.email,
    password: record.password,
    displayName: record.displayName,
  };
}

export async function POST(request: Request) {
  const originFailure = sameOriginFailure(request);
  if (originFailure) return originFailure;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return privateJson(
      { error: { code: 'INVALID_INPUT', message: 'Enter a name, email, and password.' } },
      400,
    );
  }
  const input = registration(body);
  if (!input) {
    return privateJson(
      { error: { code: 'INVALID_INPUT', message: 'Enter a name, email, and password.' } },
      400,
    );
  }
  try {
    const upstream = await fetch(apiUrl('/auth/register'), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(input),
      cache: 'no-store',
    });
    if (!upstream.ok) return authFailure(upstream.status, 'registration');
    return forwardJsonResponse(upstream);
  } catch {
    return privateJson(
      { error: { code: 'API_UNAVAILABLE', message: 'The registration service is unavailable.' } },
      503,
    );
  }
}
