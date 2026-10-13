import type { ApiErrorResponse, PublicTemple, TempleListResponse } from './types';

type ApiResult<T> =
  | { ok: true; value: T }
  | { ok: false; reason: 'unavailable' | 'not-found' | 'invalid-response'; message: string };

const apiBaseUrl = process.env.API_BASE_URL ?? 'http://127.0.0.1:3001/api/v1';

function apiUrl(path: string) {
  return `${apiBaseUrl.replace(/\/$/, '')}${path}`;
}

async function readError(response: Response) {
  try {
    const body = (await response.json()) as ApiErrorResponse;
    return body.error?.message ?? 'The community directory is temporarily unavailable.';
  } catch {
    return 'The community directory is temporarily unavailable.';
  }
}

function isPublicTemple(value: unknown): value is PublicTemple {
  if (!value || typeof value !== 'object') return false;
  const temple = value as Partial<PublicTemple>;
  return (
    typeof temple.id === 'string' &&
    typeof temple.name === 'string' &&
    typeof temple.slug === 'string' &&
    temple.verificationStatus === 'VERIFIED'
  );
}

function parseTempleList(value: unknown): TempleListResponse | null {
  if (!value || typeof value !== 'object') return null;
  const response = value as Partial<TempleListResponse>;
  if (!Array.isArray(response.data) || !response.data.every(isPublicTemple)) return null;
  if (!response.pagination || typeof response.pagination !== 'object') return null;

  return response as TempleListResponse;
}

function parseTemple(value: unknown): PublicTemple | null {
  if (!value || typeof value !== 'object') return null;
  const response = value as { data?: unknown };
  return isPublicTemple(response.data) ? response.data : null;
}

export async function getPublicTemples(
  searchParams: URLSearchParams,
): Promise<ApiResult<TempleListResponse>> {
  try {
    const response = await fetch(apiUrl(`/temples?${searchParams.toString()}`), {
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      return {
        ok: false,
        reason: 'unavailable',
        message: await readError(response),
      };
    }

    const parsed = parseTempleList(await response.json());
    return parsed
      ? { ok: true, value: parsed }
      : {
          ok: false,
          reason: 'invalid-response',
          message: 'The directory returned an invalid response.',
        };
  } catch {
    return {
      ok: false,
      reason: 'unavailable',
      message: 'The community directory is temporarily unavailable. Please try again later.',
    };
  }
}

export async function getPublicTemple(slug: string): Promise<ApiResult<PublicTemple>> {
  try {
    const response = await fetch(apiUrl(`/temples/${encodeURIComponent(slug)}`), {
      next: { revalidate: 60 },
    });

    if (response.status === 404) {
      return { ok: false, reason: 'not-found', message: 'Temple not found.' };
    }

    if (!response.ok) {
      return { ok: false, reason: 'unavailable', message: await readError(response) };
    }

    const parsed = parseTemple(await response.json());
    return parsed
      ? { ok: true, value: parsed }
      : {
          ok: false,
          reason: 'invalid-response',
          message: 'The directory returned an invalid response.',
        };
  } catch {
    return {
      ok: false,
      reason: 'unavailable',
      message: 'The community directory is temporarily unavailable. Please try again later.',
    };
  }
}
