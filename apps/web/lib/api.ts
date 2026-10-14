import type {
  ApiErrorResponse,
  OrganizationListResponse,
  PublicOrganization,
  PublicTemple,
  TempleListResponse,
} from './types';

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

function isPublicOrganizationTemple(
  value: unknown,
): value is PublicOrganization['temples'][number] {
  if (!value || typeof value !== 'object') return false;
  const temple = value as Partial<PublicOrganization['temples'][number]>;
  return (
    typeof temple.id === 'string' &&
    typeof temple.name === 'string' &&
    typeof temple.slug === 'string' &&
    (typeof temple.city === 'string' || temple.city === null) &&
    (typeof temple.state === 'string' || temple.state === null)
  );
}

function isPublicOrganization(value: unknown): value is PublicOrganization {
  if (!value || typeof value !== 'object') return false;
  const organization = value as Partial<PublicOrganization>;
  return (
    typeof organization.id === 'string' &&
    typeof organization.name === 'string' &&
    typeof organization.slug === 'string' &&
    ['TEMPLE_TRUST', 'COMMUNITY_GROUP', 'CHARITY', 'OTHER'].includes(
      organization.organizationType ?? '',
    ) &&
    organization.verificationStatus === 'VERIFIED' &&
    Array.isArray(organization.temples) &&
    organization.temples.every(isPublicOrganizationTemple)
  );
}

function parseOrganizationList(value: unknown): OrganizationListResponse | null {
  if (!value || typeof value !== 'object') return null;
  const response = value as Partial<OrganizationListResponse>;
  if (!Array.isArray(response.data) || !response.data.every(isPublicOrganization)) return null;
  if (!response.pagination || typeof response.pagination !== 'object') return null;
  return response as OrganizationListResponse;
}

function parseOrganization(value: unknown): PublicOrganization | null {
  if (!value || typeof value !== 'object') return null;
  const response = value as { data?: unknown };
  return isPublicOrganization(response.data) ? response.data : null;
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

export async function getPublicOrganizations(
  searchParams: URLSearchParams,
): Promise<ApiResult<OrganizationListResponse>> {
  try {
    const response = await fetch(apiUrl(`/organizations?${searchParams.toString()}`), {
      next: { revalidate: 60 },
    });
    if (!response.ok) {
      return { ok: false, reason: 'unavailable', message: await readError(response) };
    }
    const parsed = parseOrganizationList(await response.json());
    return parsed
      ? { ok: true, value: parsed }
      : {
          ok: false,
          reason: 'invalid-response',
          message: 'The organization directory returned an invalid response.',
        };
  } catch {
    return {
      ok: false,
      reason: 'unavailable',
      message: 'The organization directory is temporarily unavailable. Please try again later.',
    };
  }
}

export async function getPublicOrganization(slug: string): Promise<ApiResult<PublicOrganization>> {
  try {
    const response = await fetch(apiUrl(`/organizations/${encodeURIComponent(slug)}`), {
      next: { revalidate: 60 },
    });
    if (response.status === 404) {
      return { ok: false, reason: 'not-found', message: 'Organization not found.' };
    }
    if (!response.ok) {
      return { ok: false, reason: 'unavailable', message: await readError(response) };
    }
    const parsed = parseOrganization(await response.json());
    return parsed
      ? { ok: true, value: parsed }
      : {
          ok: false,
          reason: 'invalid-response',
          message: 'The organization directory returned an invalid response.',
        };
  } catch {
    return {
      ok: false,
      reason: 'unavailable',
      message: 'The organization directory is temporarily unavailable. Please try again later.',
    };
  }
}

export async function getPublicOrganizationsForSitemap(): Promise<PublicOrganization[]> {
  const organizations: PublicOrganization[] = [];
  let page = 1;

  try {
    while (page <= 100) {
      const result = await getPublicOrganizations(
        new URLSearchParams({ page: String(page), pageSize: '50' }),
      );
      if (!result.ok) return organizations;
      organizations.push(...result.value.data);
      if (page >= result.value.pagination.totalPages || result.value.data.length === 0) break;
      page += 1;
    }
  } catch {
    return organizations;
  }

  return organizations;
}
