import type { Metadata } from 'next';
import Link from 'next/link';
import { getPublicOrganizations } from '../../lib/api';

type SearchParams = Record<string, string | string[] | undefined>;

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function buildSearchParams(searchParams: SearchParams) {
  const apiParams = new URLSearchParams();
  for (const key of ['q', 'organizationType', 'city', 'state', 'page']) {
    const value = firstValue(searchParams[key]);
    if (value) apiParams.set(key, value);
  }
  apiParams.set('pageSize', '20');
  return apiParams;
}

function pageNumber(searchParams: SearchParams) {
  const value = Number(firstValue(searchParams.page) ?? '1');
  return Number.isInteger(value) && value > 0 ? value : 1;
}

function organizationTypeLabel(value: string) {
  return value
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/(^|\s)\S/g, (letter) => letter.toUpperCase());
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}): Promise<Metadata> {
  const params = await searchParams;
  const filtered = ['q', 'organizationType', 'city', 'state', 'page'].some((key) =>
    Boolean(firstValue(params[key])),
  );
  return {
    title: 'Jain organizations and trusts',
    description:
      'Find published and verified Jain organizations, community groups, charities, and trusts with available public details.',
    alternates: { canonical: '/organizations' },
    robots: filtered ? { index: false, follow: true } : undefined,
  };
}

export default async function OrganizationsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const result = await getPublicOrganizations(buildSearchParams(params));
  const currentPage = pageNumber(params);
  const queryString = buildSearchParams(params);
  queryString.delete('page');
  const hasFilters = ['q', 'organizationType', 'city', 'state'].some((key) =>
    Boolean(firstValue(params[key])),
  );

  return (
    <div className="page-shell">
      <section className="hero" aria-labelledby="organizations-title">
        <p className="eyebrow">Public directory</p>
        <h1 id="organizations-title">Jain organizations and trusts</h1>
        <p className="lead">
          Explore community groups, charities, and temple trusts whose public records have been
          explicitly verified and published by the backend.
        </p>
      </section>

      <form
        className="search-form organization-search-form"
        method="get"
        action="/organizations"
        aria-label="Search organizations"
      >
        <div className="field">
          <label htmlFor="organization-query">Organization or city</label>
          <input
            id="organization-query"
            name="q"
            type="search"
            defaultValue={firstValue(params.q)}
            maxLength={100}
            placeholder="Search by name or city"
          />
        </div>
        <div className="field">
          <label htmlFor="organization-type">Category</label>
          <select
            id="organization-type"
            name="organizationType"
            defaultValue={firstValue(params.organizationType) ?? ''}
          >
            <option value="">All categories</option>
            <option value="TEMPLE_TRUST">Temple trust</option>
            <option value="COMMUNITY_GROUP">Community group</option>
            <option value="CHARITY">Charity</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="organization-city">City</label>
          <input
            id="organization-city"
            name="city"
            defaultValue={firstValue(params.city)}
            maxLength={120}
            placeholder="For example, Indore"
          />
        </div>
        <button type="submit">Search organizations</button>
      </form>

      <section className="section" aria-labelledby="organization-results-title">
        <div className="section-heading">
          <div>
            <h2 id="organization-results-title">Directory results</h2>
            {result.ok ? <p>{result.value.pagination.total} approved records found.</p> : null}
          </div>
          {hasFilters ? <Link href="/organizations">Reset filters</Link> : null}
        </div>

        {!result.ok ? (
          <div className="notice notice-error" role="alert">
            <h3>Directory unavailable</h3>
            <p>{result.message}</p>
          </div>
        ) : result.value.data.length === 0 ? (
          <div className="notice">
            <h3>No approved organizations found</h3>
            <p>Try a different spelling, category, or location.</p>
          </div>
        ) : (
          <>
            <div className="temple-grid">
              {result.value.data.map((organization) => (
                <article className="temple-card" key={organization.id}>
                  <span className="status">Verified record</span>
                  <p className="eyebrow">{organizationTypeLabel(organization.organizationType)}</p>
                  <h3>
                    <Link href={`/organizations/${organization.slug}`}>{organization.name}</Link>
                  </h3>
                  <p>
                    {[organization.city, organization.state].filter(Boolean).join(', ') ||
                      'Location not supplied'}
                  </p>
                  {organization.description ? <p>{organization.description}</p> : null}
                  <p className="muted">
                    Last reviewed{' '}
                    {organization.lastReviewedAt
                      ? new Date(organization.lastReviewedAt).toLocaleDateString('en-IN')
                      : 'date not supplied'}
                  </p>
                </article>
              ))}
            </div>
            {result.value.pagination.totalPages > 1 ? (
              <nav className="pagination" aria-label="Organization result pages">
                <span className="muted">
                  Page {currentPage} of {result.value.pagination.totalPages}
                </span>
                <div>
                  {currentPage > 1 ? (
                    <Link
                      className="button button-secondary"
                      href={`/organizations?${new URLSearchParams([
                        ...queryString,
                        ['page', String(currentPage - 1)],
                      ])}`}
                    >
                      Previous
                    </Link>
                  ) : null}{' '}
                  {currentPage < result.value.pagination.totalPages ? (
                    <Link
                      className="button"
                      href={`/organizations?${new URLSearchParams([
                        ...queryString,
                        ['page', String(currentPage + 1)],
                      ])}`}
                    >
                      Next
                    </Link>
                  ) : null}
                </div>
              </nav>
            ) : null}
          </>
        )}
      </section>
    </div>
  );
}
