'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import MemberAuthPanel, { useMemberSession } from '../../components/member-session';

type Item = {
  id: string;
  status: string;
  description: string;
  createdAt?: string;
  submittedAt?: string;
  reasonCode: string;
  organization?: { name: string } | null;
  temple?: { name: string } | null;
};

type Page<T> = {
  data: T[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
};

function label(value: string) {
  return value
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/(^|\s)\S/g, (letter) => letter.toUpperCase());
}

async function readPage<T>(path: string, signal: AbortSignal): Promise<Page<T>> {
  const response = await fetch(path, { cache: 'no-store', signal });
  const payload = (await response.json()) as {
    data?: T[];
    pagination?: Page<T>['pagination'];
    error?: { message?: string };
  };
  if (!response.ok) throw new Error(payload.error?.message ?? 'Your status could not be loaded.');
  if (!Array.isArray(payload.data) || !payload.pagination) {
    throw new Error('Your status response was invalid.');
  }
  return { data: payload.data, pagination: payload.pagination };
}

function Pager({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <nav className="pagination" aria-label="Private request pages">
      <span className="muted">
        Page {page} of {totalPages}
      </span>
      <div>
        <button
          className="button-secondary"
          type="button"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        >
          Previous
        </button>{' '}
        <button type="button" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
          Next
        </button>
      </div>
    </nav>
  );
}

export default function AccountReports() {
  const { user, loading: sessionLoading } = useMemberSession();
  const [reports, setReports] = useState<Page<Item> | null>(null);
  const [corrections, setCorrections] = useState<Page<Item> | null>(null);
  const [reportPage, setReportPage] = useState(1);
  const [correctionPage, setCorrectionPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestNumber = useRef(0);
  const identityKey = user?.id ?? user?.email ?? null;
  const identityRef = useRef(identityKey);
  identityRef.current = identityKey;
  const [pageIdentity, setPageIdentity] = useState(identityKey);

  const load = useCallback(
    async (memberId: string, reportsPage: number, correctionsPage: number, signal: AbortSignal) => {
      if (identityRef.current !== memberId) return;
      const requestId = ++requestNumber.current;
      setLoading(true);
      setError(null);
      try {
        const [reportResult, correctionResult] = await Promise.all([
          readPage<Item>(`/api/member/me/reports?page=${reportsPage}&pageSize=10`, signal),
          readPage<Item>(`/api/member/me/corrections?page=${correctionsPage}&pageSize=10`, signal),
        ]);
        if (
          signal.aborted ||
          requestId !== requestNumber.current ||
          identityRef.current !== memberId
        )
          return;
        setReports(reportResult);
        setCorrections(correctionResult);
      } catch (cause) {
        if (
          requestId === requestNumber.current &&
          identityRef.current === memberId &&
          !signal.aborted &&
          (cause as Error).name !== 'AbortError'
        ) {
          setError(cause instanceof Error ? cause.message : 'Your status could not be loaded.');
        }
      } finally {
        if (requestId === requestNumber.current && identityRef.current === memberId)
          setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    requestNumber.current += 1;
    setReports(null);
    setCorrections(null);
    setError(null);
    if (pageIdentity !== identityKey) {
      setPageIdentity(identityKey);
      setReportPage(1);
      setCorrectionPage(1);
      setLoading(Boolean(user && identityKey));
      return;
    }
    if (!user || !identityKey) {
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    void load(identityKey, reportPage, correctionPage, controller.signal);
    return () => {
      controller.abort();
      requestNumber.current += 1;
    };
  }, [correctionPage, identityKey, load, pageIdentity, reportPage, user]);

  function changeReportPage(page: number) {
    setReportPage(page);
  }

  function changeCorrectionPage(page: number) {
    setCorrectionPage(page);
  }

  if (sessionLoading)
    return (
      <main className="page-shell">
        <p className="notice">Checking your session…</p>
      </main>
    );
  if (!user) {
    return (
      <main className="page-shell">
        <section className="hero">
          <p className="eyebrow">Account</p>
          <h1>Reports and corrections</h1>
          <p className="lead">
            Sign in to see private status updates for requests submitted from your account.
          </p>
        </section>
        <MemberAuthPanel heading="Sign in to view private status" />
      </main>
    );
  }

  return (
    <main className="page-shell">
      <section className="hero">
        <p className="eyebrow">Account</p>
        <h1>My reports and corrections</h1>
        <p className="lead">Status is shown for the signed-in account returned by JainConnect.</p>
      </section>
      {loading ? (
        <p className="notice" role="status">
          Loading your private requests…
        </p>
      ) : null}
      {error ? (
        <p className="notice notice-error" role="alert">
          {error}
        </p>
      ) : null}
      <section className="section" aria-labelledby="reports-status-title">
        <h2 id="reports-status-title">Reports</h2>
        {loading && !reports ? (
          <p className="notice">Loading reports…</p>
        ) : !reports || reports.data.length === 0 ? (
          <p className="notice">No reports have been submitted from this account.</p>
        ) : (
          <>
            <div className="admin-card-list">
              {reports.data.map((item) => (
                <RequestCard item={item} kind="Report" key={item.id} />
              ))}
            </div>
            <Pager
              page={reports.pagination.page}
              totalPages={reports.pagination.totalPages}
              onChange={changeReportPage}
            />
          </>
        )}
      </section>
      <section className="section" aria-labelledby="corrections-status-title">
        <h2 id="corrections-status-title">Corrections</h2>
        {loading && !corrections ? (
          <p className="notice">Loading corrections…</p>
        ) : !corrections || corrections.data.length === 0 ? (
          <p className="notice">No corrections have been submitted from this account.</p>
        ) : (
          <>
            <div className="admin-card-list">
              {corrections.data.map((item) => (
                <RequestCard item={item} kind="Correction" key={item.id} />
              ))}
            </div>
            <Pager
              page={corrections.pagination.page}
              totalPages={corrections.pagination.totalPages}
              onChange={changeCorrectionPage}
            />
          </>
        )}
      </section>
    </main>
  );
}

function RequestCard({ item, kind }: { item: Item; kind: string }) {
  return (
    <article className="admin-card">
      <div className="admin-card-main">
        <p className="eyebrow">
          {kind} · {label(item.status)}
        </p>
        <h3>{item.organization?.name ?? item.temple?.name ?? 'Record'}</h3>
        <p>{item.description}</p>
      </div>
      <span className="status">{label(item.status)}</span>
    </article>
  );
}
