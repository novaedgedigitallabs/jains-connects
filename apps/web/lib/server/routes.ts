const uuid = '[0-9a-fA-F-]{36}';

function matches(path: string[], pattern: RegExp) {
  return pattern.test(path.join('/'));
}

export function memberUpstreamPath(path: string[], method: string): string | null {
  const normalized = path.filter(Boolean);
  const joined = normalized.join('/');
  const verb = method.toUpperCase();

  if (normalized[0] === 'me') {
    if (normalized.length === 1 && verb === 'GET') return '/me';
    if (
      normalized.length === 2 &&
      verb === 'GET' &&
      ['reports', 'corrections', 'organization-memberships', 'representative-claims'].includes(
        normalized[1],
      )
    )
      return `/${joined}`;
    if (matches(normalized, new RegExp(`^me/(organizations|temples)/${uuid}$`)) && verb === 'GET')
      return `/${joined}`;
    if (matches(normalized, new RegExp(`^me/organizations/${uuid}/temples$`)) && verb === 'GET')
      return `/${joined}`;
    return null;
  }

  if (
    matches(normalized, new RegExp(`^reports/(temples|organizations)/${uuid}$`)) &&
    verb === 'POST'
  )
    return `/${joined}`;
  if (
    matches(normalized, new RegExp(`^reports/(temples|organizations)/${uuid}/corrections$`)) &&
    verb === 'POST'
  )
    return `/${joined}`;
  if (
    matches(normalized, new RegExp(`^organizations/${uuid}/representative-claims$`)) &&
    verb === 'POST'
  )
    return `/${joined}`;
  if (matches(normalized, new RegExp(`^(organizations|temples)/${uuid}$`)) && verb === 'PATCH')
    return `/${joined}`;

  return null;
}

export function adminUpstreamPath(path: string[], method: string): string | null {
  const normalized = path.filter(Boolean);
  const joined = normalized.join('/');
  const verb = method.toUpperCase();
  const id = uuid;

  if (normalized.length === 1 && normalized[0] === 'access' && verb === 'GET')
    return '/admin/access';
  if (normalized.length === 1 && normalized[0] === 'audit' && verb === 'GET') return '/admin/audit';
  if (['temples', 'organizations'].includes(normalized[0]) && normalized.length === 1) {
    if (verb === 'GET' || verb === 'POST') return `/admin/${joined}`;
  }
  if (matches(normalized, new RegExp(`^(temples|organizations)/${id}$`)) && verb === 'PATCH')
    return `/admin/${joined}`;
  if (
    matches(normalized, new RegExp(`^(temples|organizations)/${id}/(verification|publication)$`)) &&
    verb === 'POST'
  )
    return `/admin/${joined}`;
  if (
    matches(normalized, new RegExp(`^organizations/${id}/members/${id}/revoke$`)) &&
    verb === 'POST'
  )
    return `/admin/${joined}`;
  if (normalized[0] === 'representative-claims') {
    if (normalized.length === 1 && verb === 'GET') return `/admin/${joined}`;
    if (
      matches(normalized, new RegExp(`^representative-claims/${id}/decision$`)) &&
      verb === 'POST'
    )
      return `/admin/${joined}`;
  }
  if (normalized[0] === 'reports') {
    if (normalized.length === 1 && verb === 'GET') return `/admin/${joined}`;
    if (matches(normalized, new RegExp(`^reports/${id}$`)) && verb === 'PATCH')
      return `/admin/${joined}`;
  }
  if (normalized[0] === 'corrections') {
    if (normalized.length === 1 && verb === 'GET') return `/admin/${joined}`;
    if (matches(normalized, new RegExp(`^corrections/${id}/decision$`)) && verb === 'POST')
      return `/admin/${joined}`;
  }
  return null;
}
