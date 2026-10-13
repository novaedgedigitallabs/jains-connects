import Link from 'next/link';
import { getPublicTemples } from '../../lib/api';

type SearchParams = Record<string, string | string[] | undefined>;

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function buildSearchParams(searchParams: SearchParams) {
  const apiParams = new URLSearchParams();
  for (const key of ['q', 'city', 'state', 'page']) {
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

export async function generateMetadata() {
  return {
    title: 'Approved Jain temples',
    description:
      'Search published Jain temple records with available public details and review information.',
    alternates: { canonical: '/temples' },
  };
}

export default async function TemplesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const result = await getPublicTemples(buildSearchParams(params));
  const currentPage = pageNumber(params);
  const queryString = buildSearchParams(params);
  queryString.delete('page');

  return (
    <div className="page-shell">
      <section className="hero" aria-labelledby="temples-title">
        <p className="eyebrow">Public directory</p>
        <h1 id="temples-title">Approved Jain temples</h1>
        <p className="lead">
          Search the public temple directory. Details shown here come from records that are
          explicitly published and verified by the backend.
        </p>
      </section>

      <form className="search-form" method="get" action="/temples" aria-label="Search temples">
        <div className="field">
          <label htmlFor="temple-query">Temple or city</label>
          <input
            id="temple-query"
            name="q"
            type="search"
            defaultValue={firstValue(params.q)}
            maxLength={100}
            placeholder="Search by name or city"
          />
        </div>
        <div className="field">
          <label htmlFor="temple-city">City filter</label>
          <input
            id="temple-city"
            name="city"
            defaultValue={firstValue(params.city)}
            maxLength={120}
            placeholder="For example, Indore"
          />
        </div>
        <button type="submit">Search temples</button>
      </form>

      <section className="section" aria-labelledby="results-title">
        <div className="section-heading">
          <div>
            <h2 id="results-title">Directory results</h2>
            {result.ok && <p>{result.value.pagination.total} approved records found.</p>}
          </div>
          {(firstValue(params.q) || firstValue(params.city)) && (
            <Link href="/temples">Reset filters</Link>
          )}
        </div>

        {!result.ok ? (
          <div className="notice notice-error" role="alert">
            <h3>Directory unavailable</h3>
            <p>{result.message}</p>
          </div>
        ) : result.value.data.length === 0 ? (
          <div className="notice">
            <h3>No approved temples found</h3>
            <p>Try a different spelling or remove the location filter.</p>
          </div>
        ) : (
          <>
            <div className="temple-grid">
              {result.value.data.map((temple) => (
                <article className="temple-card" key={temple.id}>
                  <span className="status">Verified record</span>
                  <h3>
                    <Link href={`/temples/${temple.slug}`}>{temple.name}</Link>
                  </h3>
                  <p>
                    {[temple.city, temple.state].filter(Boolean).join(', ') ||
                      'Location not supplied'}
                  </p>
                  <p className="muted">
                    Last reviewed{' '}
                    {temple.lastReviewedAt
                      ? new Date(temple.lastReviewedAt).toLocaleDateString('en-IN')
                      : 'date not supplied'}
                  </p>
                </article>
              ))}
            </div>
            {result.value.pagination.totalPages > 1 && (
              <nav className="pagination" aria-label="Temple result pages">
                <span className="muted">
                  Page {currentPage} of {result.value.pagination.totalPages}
                </span>
                <div>
                  {currentPage > 1 && (
                    <Link
                      className="button button-secondary"
                      href={`/temples?${new URLSearchParams([
                        ...queryString,
                        ['page', String(currentPage - 1)],
                      ])}`}
                    >
                      Previous
                    </Link>
                  )}{' '}
                  {currentPage < result.value.pagination.totalPages && (
                    <Link
                      className="button"
                      href={`/temples?${new URLSearchParams([
                        ...queryString,
                        ['page', String(currentPage + 1)],
                      ])}`}
                    >
                      Next
                    </Link>
                  )}
                </div>
              </nav>
            )}
          </>
        )}
      </section>
    </div>
  );
}
