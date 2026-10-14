'use client';

import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import MemberAuthPanel, { useMemberSession } from '../../components/member-session';

type Organization = {
  id: string;
  name: string;
  slug?: string;
  description?: string | null;
  publicEmail?: string | null;
  publicPhone?: string | null;
  websiteUrl?: string | null;
  city?: string | null;
  state?: string | null;
  [key: string]: unknown;
};

type Membership = {
  id: string;
  membershipRole?: string;
  status?: string;
  organizationId?: string;
  organization?: Organization | null;
};

type Claim = {
  id: string;
  status: string;
  requestedRole?: string;
  applicantStatement?: string;
  submittedAt?: string;
  organization?: Organization | null;
};

type Page<T> = {
  data: T[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
};

const editableFields = [
  'name',
  'description',
  'publicEmail',
  'publicPhone',
  'websiteUrl',
  'city',
  'state',
] as const;

async function readJson<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(path, { ...options, cache: 'no-store' });
  const payload = (await response.json()) as T & { error?: { message?: string } };
  if (!response.ok)
    throw new Error(payload.error?.message ?? 'The account data could not be loaded.');
  return payload;
}

function pageData<T>(payload: Page<T>) {
  return Array.isArray(payload.data) ? payload.data : [];
}

function label(value: string | undefined) {
  return (value ?? 'Unknown')
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/(^|\s)\S/g, (letter) => letter.toUpperCase());
}

function Pager({
  page,
  totalPages,
  label: ariaLabel,
  onChange,
}: {
  page: number;
  totalPages: number;
  label: string;
  onChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <nav className="pagination" aria-label={ariaLabel}>
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

export default function AccountOrganizations() {
  const { user, loading: sessionLoading } = useMemberSession();
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [membershipPage, setMembershipPage] = useState(1);
  const [claimPage, setClaimPage] = useState(1);
  const [membershipPagination, setMembershipPagination] = useState<Page<Membership>['pagination']>({
    page: 1,
    pageSize: 25,
    total: 0,
    totalPages: 0,
  });
  const [claimPagination, setClaimPagination] = useState<Page<Claim>['pagination']>({
    page: 1,
    pageSize: 25,
    total: 0,
    totalPages: 0,
  });
  const [details, setDetails] = useState<Record<string, Organization>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const requestNumber = useRef(0);
  const identityKey = user?.id ?? user?.email ?? null;
  const identityRef = useRef(identityKey);
  identityRef.current = identityKey;
  const [pageIdentity, setPageIdentity] = useState(identityKey);

  const load = useCallback(
    async (memberId: string, membershipsPage: number, claimsPage: number, signal?: AbortSignal) => {
      if (identityRef.current !== memberId) return;
      const requestId = ++requestNumber.current;
      setLoading(true);
      setError(null);
      try {
        const [membershipPayload, claimPayload] = await Promise.all([
          readJson<Page<Membership>>(
            `/api/member/me/organization-memberships?page=${membershipsPage}&pageSize=25`,
            { signal },
          ),
          readJson<Page<Claim>>(
            `/api/member/me/representative-claims?page=${claimsPage}&pageSize=25`,
            { signal },
          ),
        ]);
        const nextMemberships = pageData(membershipPayload);
        if (
          signal?.aborted ||
          requestId !== requestNumber.current ||
          identityRef.current !== memberId
        )
          return;
        setMemberships(nextMemberships);
        setClaims(pageData(claimPayload));
        setMembershipPagination(membershipPayload.pagination);
        setClaimPagination(claimPayload.pagination);
        const organizationIds = nextMemberships
          .map((membership) => membership.organization?.id ?? membership.organizationId)
          .filter((id): id is string => Boolean(id))
          .filter((id, index, values) => values.indexOf(id) === index);
        const organizationResults = await Promise.all(
          organizationIds.map(async (id) => {
            try {
              const payload = await readJson<{ data?: Organization }>(
                `/api/member/me/organizations/${id}`,
                { signal },
              );
              return payload.data ? ([id, payload.data] as const) : null;
            } catch {
              return null;
            }
          }),
        );
        if (
          signal?.aborted ||
          requestId !== requestNumber.current ||
          identityRef.current !== memberId
        )
          return;
        setDetails(
          Object.fromEntries(
            organizationResults.filter((entry): entry is readonly [string, Organization] =>
              Boolean(entry),
            ),
          ),
        );
      } catch (cause) {
        if (
          requestId === requestNumber.current &&
          identityRef.current === memberId &&
          (cause as Error).name !== 'AbortError'
        ) {
          setError(
            cause instanceof Error ? cause.message : 'The account data could not be loaded.',
          );
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
    setMemberships([]);
    setClaims([]);
    setDetails({});
    setMembershipPagination({ page: 1, pageSize: 25, total: 0, totalPages: 0 });
    setClaimPagination({ page: 1, pageSize: 25, total: 0, totalPages: 0 });
    if (pageIdentity !== identityKey) {
      setPageIdentity(identityKey);
      setMembershipPage(1);
      setClaimPage(1);
      setEditingId(null);
      setBusyId(null);
      setNotice(null);
      setLoading(Boolean(user && identityKey));
      return;
    }
    if (!user || !identityKey) {
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    void load(identityKey, membershipPage, claimPage, controller.signal);
    return () => {
      controller.abort();
      requestNumber.current += 1;
    };
  }, [claimPage, identityKey, load, membershipPage, pageIdentity, user]);

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
          <h1>Representative access</h1>
          <p className="lead">
            Sign in to view memberships, claim statuses, and permitted organization management
            fields.
          </p>
        </section>
        <MemberAuthPanel heading="Sign in to manage representative access" />
      </main>
    );
  }

  return (
    <main className="page-shell">
      <section className="hero">
        <p className="eyebrow">Account</p>
        <h1>Representative memberships</h1>
        <p className="lead">
          Manage only the public organization fields permitted for your approved membership.
        </p>
      </section>
      {loading ? (
        <p className="notice" role="status">
          Loading memberships and claims…
        </p>
      ) : null}
      {error ? (
        <p className="notice notice-error" role="alert">
          {error}
        </p>
      ) : null}
      {notice ? (
        <p className="notice notice-success" role="status">
          {notice}
        </p>
      ) : null}
      <section className="section" aria-labelledby="memberships-title">
        <h2 id="memberships-title">Approved memberships</h2>
        {loading && memberships.length === 0 ? (
          <p className="notice">Loading memberships…</p>
        ) : memberships.length === 0 ? (
          <p className="notice">No approved representative memberships were found.</p>
        ) : (
          <div className="admin-card-list">
            {memberships.map((membership) => {
              const organizationId = membership.organization?.id ?? membership.organizationId;
              if (!organizationId) return null;
              const organization = details[organizationId] ??
                membership.organization ?? { id: organizationId, name: 'Organization' };
              return (
                <article className="admin-card" key={membership.id}>
                  <div className="admin-card-main">
                    <p className="eyebrow">
                      {label(membership.membershipRole)} · {label(membership.status ?? 'ACTIVE')}
                    </p>
                    <h3>{organization.name}</h3>
                    <p className="muted">Only representative-safe public fields are editable.</p>
                  </div>
                  <div className="admin-card-actions">
                    <button
                      type="button"
                      onClick={() =>
                        setEditingId((current) =>
                          current === organizationId ? null : organizationId,
                        )
                      }
                    >
                      {editingId === organizationId ? 'Close edit' : 'Edit public details'}
                    </button>
                  </div>
                  {editingId === organizationId ? (
                    <OrganizationMemberEditor
                      organization={organization}
                      onSaved={() => {
                        setEditingId(null);
                        setNotice('The permitted organization details were updated.');
                        if (identityRef.current)
                          void load(identityRef.current, membershipPage, claimPage);
                      }}
                      onBusy={setBusyId}
                      busy={busyId === organizationId}
                      onError={setError}
                    />
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
        <Pager
          page={membershipPagination.page}
          totalPages={membershipPagination.totalPages}
          label="Membership pages"
          onChange={setMembershipPage}
        />
      </section>
      <section className="section" aria-labelledby="claims-title">
        <h2 id="claims-title">Representative claims</h2>
        {loading && claims.length === 0 ? (
          <p className="notice">Loading claims…</p>
        ) : claims.length === 0 ? (
          <p className="notice">No representative claims were found.</p>
        ) : (
          <div className="admin-card-list">
            {claims.map((claim) => (
              <article className="admin-card" key={claim.id}>
                <div className="admin-card-main">
                  <p className="eyebrow">
                    {label(claim.status)} · {label(claim.requestedRole)}
                  </p>
                  <h3>{claim.organization?.name ?? 'Organization'}</h3>
                  {claim.applicantStatement ? <p>{claim.applicantStatement}</p> : null}
                  {claim.submittedAt ? (
                    <p className="muted">
                      Submitted {new Date(claim.submittedAt).toLocaleDateString('en-IN')}
                    </p>
                  ) : null}
                </div>
                <span className="status">{label(claim.status)}</span>
              </article>
            ))}
          </div>
        )}
        <Pager
          page={claimPagination.page}
          totalPages={claimPagination.totalPages}
          label="Claim pages"
          onChange={setClaimPage}
        />
      </section>
    </main>
  );
}

function OrganizationMemberEditor({
  organization,
  onSaved,
  onBusy,
  busy,
  onError,
}: {
  organization: Organization;
  onSaved: () => void;
  onBusy: (id: string | null) => void;
  busy: boolean;
  onError: (message: string) => void;
}) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      editableFields.map((field) => [
        field,
        typeof organization[field] === 'string' ? organization[field] : '',
      ]),
    ),
  );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onBusy(organization.id);
    try {
      const payload = Object.fromEntries(
        editableFields.map((field) => [field, values[field]?.trim() || null]),
      );
      await readJson(`/api/member/organizations/${organization.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      onSaved();
    } catch (cause) {
      onError(cause instanceof Error ? cause.message : 'The organization could not be updated.');
    } finally {
      onBusy(null);
    }
  }

  return (
    <form className="admin-edit-form" onSubmit={submit} aria-label={`Edit ${organization.name}`}>
      <p className="muted">
        Verification, publication, roles, and membership status cannot be changed here.
      </p>
      {editableFields.map((field) => (
        <div className="field" key={field}>
          <label htmlFor={`member-${field}-${organization.id}`}>{label(field)}</label>
          {field === 'description' ? (
            <textarea
              id={`member-${field}-${organization.id}`}
              maxLength={4000}
              value={values[field]}
              onChange={(event) =>
                setValues((current) => ({ ...current, [field]: event.target.value }))
              }
            />
          ) : (
            <input
              id={`member-${field}-${organization.id}`}
              type={field === 'publicEmail' ? 'email' : field === 'websiteUrl' ? 'url' : 'text'}
              value={values[field]}
              onChange={(event) =>
                setValues((current) => ({ ...current, [field]: event.target.value }))
              }
            />
          )}
        </div>
      ))}
      <button type="submit" disabled={busy}>
        {busy ? 'Saving…' : 'Save permitted details'}
      </button>
    </form>
  );
}
