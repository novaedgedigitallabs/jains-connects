import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import RecordWorkflowForm from '../../../components/record-workflow-form';
import { getPublicTemple } from '../../../../lib/api';

export const metadata: Metadata = {
  title: 'Report temple information',
  robots: { index: false, follow: true },
};

export default async function TempleReportPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = await getPublicTemple(slug);
  if (!result.ok && result.reason === 'not-found') notFound();
  if (!result.ok)
    return (
      <div className="page-shell">
        <div className="notice notice-error" role="alert">
          <h1>Report form unavailable</h1>
          <p>{result.message}</p>
        </div>
      </div>
    );
  return (
    <main className="page-shell">
      <p className="eyebrow">{result.value.name}</p>
      <RecordWorkflowForm
        targetType="temples"
        targetId={result.value.id}
        targetName={result.value.name}
      />
    </main>
  );
}
