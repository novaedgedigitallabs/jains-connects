import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPublicOrganization } from '../../../lib/api';

type PageProps = { params: Promise<{ slug: string }> };

function organizationTypeLabel(value: string) {
  return value
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/(^|\s)\S/g, (letter) => letter.toUpperCase());
}

function safeJsonLd(value: unknown) {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const result = await getPublicOrganization(slug);
  if (!result.ok) {
    return {
      title:
        result.reason === 'not-found'
          ? 'Organization not found'
          : 'Organization directory unavailable',
      robots: { index: false, follow: true },
    };
  }

  const description =
    result.value.description ??
    `Public information for ${result.value.name}, a verified Jain organization on JainConnect.`;
  return {
    title: result.value.name,
    description,
    alternates: { canonical: `/organizations/${result.value.slug}` },
    openGraph: {
      title: `${result.value.name} — JainConnect`,
      description,
      type: 'article',
    },
  };
}

export default async function OrganizationPage({ params }: PageProps) {
  const { slug } = await params;
  const result = await getPublicOrganization(slug);
  if (!result.ok && result.reason === 'not-found') notFound();

  if (!result.ok) {
    return (
      <div className="page-shell">
        <div className="notice notice-error" role="alert">
          <h1>Organization information unavailable</h1>
          <p>{result.message}</p>
          <Link className="text-link" href="/organizations">
            Return to the organization directory
          </Link>
        </div>
      </div>
    );
  }

  const organization = result.value;
  const siteUrl = process.env.PUBLIC_SITE_URL ?? 'http://localhost:3000';
  const address = [
    organization.addressLine1,
    organization.addressLine2,
    organization.city,
    organization.state,
    organization.postalCode,
    organization.country,
  ]
    .filter(Boolean)
    .join(', ');
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: organization.name,
    url: `${siteUrl.replace(/\/$/, '')}/organizations/${organization.slug}`,
    description: organization.description ?? undefined,
    email: organization.publicEmail ?? undefined,
    telephone: organization.publicPhone ?? undefined,
    sameAs: organization.websiteUrl ? [organization.websiteUrl] : undefined,
    address: address
      ? {
          '@type': 'PostalAddress',
          streetAddress:
            [organization.addressLine1, organization.addressLine2].filter(Boolean).join(', ') ||
            undefined,
          addressLocality: organization.city ?? undefined,
          addressRegion: organization.state ?? undefined,
          postalCode: organization.postalCode ?? undefined,
          addressCountry: organization.country ?? undefined,
        }
      : undefined,
  };

  return (
    <div className="page-shell">
      <p className="eyebrow">
        <Link href="/organizations">Organization directory</Link>
      </p>
      <div className="detail-panel">
        <span className="status">Verified record</span>
        <p className="eyebrow">{organizationTypeLabel(organization.organizationType)}</p>
        <h1>{organization.name}</h1>
        {organization.description ? <p className="lead">{organization.description}</p> : null}
        <dl className="detail-list">
          {address ? (
            <div>
              <dt>Address</dt>
              <dd>{address}</dd>
            </div>
          ) : null}
          {organization.publicPhone ? (
            <div>
              <dt>Public phone</dt>
              <dd>
                <a href={`tel:${organization.publicPhone}`}>{organization.publicPhone}</a>
              </dd>
            </div>
          ) : null}
          {organization.publicEmail ? (
            <div>
              <dt>Public email</dt>
              <dd>
                <a href={`mailto:${organization.publicEmail}`}>{organization.publicEmail}</a>
              </dd>
            </div>
          ) : null}
          {organization.websiteUrl ? (
            <div>
              <dt>Official website</dt>
              <dd>
                <a href={organization.websiteUrl} rel="noreferrer" target="_blank">
                  Visit official website
                </a>
              </dd>
            </div>
          ) : null}
          <div>
            <dt>Last reviewed</dt>
            <dd>
              {organization.lastReviewedAt
                ? new Date(organization.lastReviewedAt).toLocaleDateString('en-IN')
                : 'Review date not supplied'}
            </dd>
          </div>
        </dl>

        {organization.temples.length ? (
          <section className="section" aria-labelledby="associated-temples-title">
            <h2 id="associated-temples-title">Associated published temples</h2>
            <ul className="link-list">
              {organization.temples.map((temple) => (
                <li key={temple.id}>
                  <Link href={`/temples/${temple.slug}`}>{temple.name}</Link>
                  <span className="muted">
                    {' '}
                    {[temple.city, temple.state].filter(Boolean).join(', ')}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <div className="workflow-stack">
          <p>
            <Link className="text-link" href={`/organizations/${organization.slug}/report`}>
              Report incorrect information or suggest a correction
            </Link>
          </p>
          <p>
            <Link className="text-link" href={`/organizations/${organization.slug}/claim`}>
              Request representative management access
            </Link>
          </p>
        </div>

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
        />
      </div>
    </div>
  );
}
