import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPublicOrganization } from '../../../../lib/api';
import RepresentativeClaimForm from '../../../components/representative-claim-form';

export const metadata: Metadata = {
  title: 'Request organization management access',
  robots: { index: false, follow: true },
};

export default async function OrganizationClaimPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const result = await getPublicOrganization(slug);
  if (!result.ok && result.reason === 'not-found') notFound();
  if (!result.ok) {
    return (
      <main className="page-shell">
        <div className="notice notice-error" role="alert">
          <h1>Claim form unavailable</h1>
          <p>{result.message}</p>
        </div>
      </main>
    );
  }
  return (
    <main className="page-shell">
      <p className="eyebrow">{result.value.name}</p>
      <RepresentativeClaimForm
        organizationId={result.value.id}
        organizationName={result.value.name}
      />
    </main>
  );
}
