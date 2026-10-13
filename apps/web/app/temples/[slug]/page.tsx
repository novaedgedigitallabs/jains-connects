import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPublicTemple } from '../../../lib/api';

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const result = await getPublicTemple(slug);

  if (!result.ok) {
    return {
      title: result.reason === 'not-found' ? 'Temple not found' : 'Temple directory unavailable',
      robots: { index: false, follow: true },
    };
  }

  return {
    title: result.value.name,
    description:
      result.value.description ?? `Public information for ${result.value.name} on JainConnect.`,
    alternates: { canonical: `/temples/${result.value.slug}` },
    openGraph: {
      title: `${result.value.name} — JainConnect`,
      description:
        result.value.description ?? `Public information for ${result.value.name} on JainConnect.`,
      type: 'article',
    },
  };
}

export default async function TemplePage({ params }: PageProps) {
  const { slug } = await params;
  const result = await getPublicTemple(slug);

  if (!result.ok && result.reason === 'not-found') notFound();

  if (!result.ok) {
    return (
      <div className="page-shell">
        <div className="notice notice-error" role="alert">
          <h1>Temple information unavailable</h1>
          <p>{result.message}</p>
          <Link className="text-link" href="/temples">
            Return to the temple directory
          </Link>
        </div>
      </div>
    );
  }

  const temple = result.value;
  const address = [
    temple.addressLine1,
    temple.addressLine2,
    temple.city,
    temple.state,
    temple.postalCode,
    temple.country,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <div className="page-shell">
      <p className="eyebrow">
        <Link href="/temples">Temple directory</Link>
      </p>
      <div className="detail-panel">
        <span className="status">Verified record</span>
        <h1>{temple.name}</h1>
        {temple.description && <p className="lead">{temple.description}</p>}
        <dl className="detail-list">
          {address && (
            <div>
              <dt>Address</dt>
              <dd>{address}</dd>
            </div>
          )}
          {temple.traditionOrLineage && (
            <div>
              <dt>Tradition or lineage</dt>
              <dd>{temple.traditionOrLineage}</dd>
            </div>
          )}
          {temple.darshanInformation && (
            <div>
              <dt>Visitor information</dt>
              <dd>{temple.darshanInformation}</dd>
            </div>
          )}
          {temple.publicPhone && (
            <div>
              <dt>Public phone</dt>
              <dd>{temple.publicPhone}</dd>
            </div>
          )}
          {temple.publicEmail && (
            <div>
              <dt>Public email</dt>
              <dd>{temple.publicEmail}</dd>
            </div>
          )}
          {temple.websiteUrl && (
            <div>
              <dt>Official website</dt>
              <dd>
                <a href={temple.websiteUrl} rel="noreferrer" target="_blank">
                  Visit official website
                </a>
              </dd>
            </div>
          )}
          <div>
            <dt>Last reviewed</dt>
            <dd>
              {temple.lastReviewedAt
                ? new Date(temple.lastReviewedAt).toLocaleDateString('en-IN')
                : 'Review date not supplied'}
            </dd>
          </div>
        </dl>
        {temple.history && (
          <section className="section" aria-labelledby="history-title">
            <h2 id="history-title">History</h2>
            <p>{temple.history}</p>
          </section>
        )}
      </div>
    </div>
  );
}
