'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

type Temple = {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  state: string | null;
  verificationStatus: string;
  publicationStatus: string;
  lastReviewedAt: string | null;
};

type Report = {
  id: string;
  reasonCode: string;
  description: string;
  status: string;
  createdAt: string;
};

type Organization = {
  id: string;
  name: string;
  slug: string;
  organizationType: string;
  city: string | null;
  state: string | null;
  verificationStatus: string;
  publicationStatus: string;
};

type ListResponse<T> = {
  data: T[];
  pagination: { total: number };
};

type ErrorPayload = { error?: { message?: string; code?: string } };

async function readJson<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(path, { ...options, cache: 'no-store' });
  const payload = (await response.json()) as T & ErrorPayload;
  if (!response.ok) {
    const error = new Error(payload.error?.message ?? 'The request could not be completed.');
    error.name = payload.error?.code ?? 'REQUEST_FAILED';
    throw error;
  }
  return payload;
}

function statusLabel(value: string) {
  return value
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/(^|\s)\S/g, (letter) => letter.toUpperCase());
}

function isAllowed(roles: string[], role: string) {
  return roles.includes('ADMIN') || roles.includes(role);
}

export default function AdminDashboard() {
  const router = useRouter();
  const [roles, setRoles] = useState<string[]>([]);
  const [temples, setTemples] = useState<Temple[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [verificationFilter, setVerificationFilter] = useState('ALL');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editingTempleId, setEditingTempleId] = useState<string | null>(null);
  const [editingOrganizationId, setEditingOrganizationId] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [organizationReviewNotes, setOrganizationReviewNotes] = useState<Record<string, string>>(
    {},
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const access = await readJson<{ data: { roles: string[] } }>('/api/admin/access');
      setRoles(access.data.roles);
      const templeResult = await readJson<ListResponse<Temple>>(
        '/api/admin/temples?page=1&pageSize=50',
      );
      setTemples(templeResult.data);
      const organizationResult = await readJson<ListResponse<Organization>>(
        '/api/admin/organizations?page=1&pageSize=50',
      );
      setOrganizations(organizationResult.data);
      if (isAllowed(access.data.roles, 'MODERATOR')) {
        const reportResult = await readJson<ListResponse<Report>>(
          '/api/admin/reports?page=1&pageSize=25',
        );
        setReports(reportResult.data);
      } else {
        setReports([]);
      }
    } catch (cause) {
      if (
        cause instanceof Error &&
        ['AUTHENTICATION_REQUIRED', 'INVALID_SESSION'].includes(cause.name)
      ) {
        router.replace('/admin/login');
        return;
      }
      setError(
        cause instanceof Error ? cause.message : 'The administration service is unavailable.',
      );
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  const visibleTemples = useMemo(
    () =>
      verificationFilter === 'ALL'
        ? temples
        : temples.filter((temple) => temple.verificationStatus === verificationFilter),
    [temples, verificationFilter],
  );

  async function changeTempleState(
    id: string,
    action: 'verification' | 'publication',
    status: string,
    notes?: string,
  ) {
    setBusyId(id);
    setError(null);
    setNotice(null);
    try {
      await readJson(`/api/admin/temples/${id}/${action}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ status, ...(notes?.trim() ? { notes: notes.trim() } : {}) }),
      });
      setNotice('The record was updated and the audit event was recorded.');
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The record could not be updated.');
    } finally {
      setBusyId(null);
    }
  }

  async function changeReportState(id: string, status: string) {
    setBusyId(id);
    setError(null);
    try {
      await readJson(`/api/admin/reports/${id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      setNotice('The report status was updated.');
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The report could not be updated.');
    } finally {
      setBusyId(null);
    }
  }

  async function changeOrganizationState(id: string, status: string, notes?: string) {
    setBusyId(id);
    setError(null);
    setNotice(null);
    try {
      await readJson(`/api/admin/organizations/${id}/verification`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ status, ...(notes?.trim() ? { notes: notes.trim() } : {}) }),
      });
      setNotice('The organization review state was updated.');
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The organization could not be updated.');
    } finally {
      setBusyId(null);
    }
  }

  async function signOut() {
    await fetch('/api/admin/session', { method: 'DELETE' });
    router.replace('/admin/login');
  }

  return (
    <main className="page-shell admin-shell">
      <div className="admin-heading">
        <div>
          <p className="eyebrow">Protected workspace</p>
          <h1>Community records</h1>
          <p className="lead">
            Review, correct, and publish Jain community information with a clear audit trail.
          </p>
        </div>
        <button className="button-secondary" type="button" onClick={signOut}>
          Sign out
        </button>
      </div>

      <div className="role-list" aria-label="Active staff roles">
        {roles.map((role) => (
          <span className="role-chip" key={role}>
            {statusLabel(role)}
          </span>
        ))}
      </div>

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

      <section className="admin-section" aria-labelledby="temple-queue-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Verification queue</p>
            <h2 id="temple-queue-title">Temples</h2>
          </div>
          <div className="admin-actions">
            <label className="filter-field" htmlFor="verification-filter">
              Show
            </label>
            <select
              id="verification-filter"
              value={verificationFilter}
              onChange={(event) => setVerificationFilter(event.target.value)}
            >
              <option value="ALL">All states</option>
              <option value="PENDING">Pending</option>
              <option value="NEEDS_REVIEW">Needs review</option>
              <option value="VERIFIED">Verified</option>
              <option value="REJECTED">Rejected</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
            {isAllowed(roles, 'CONTENT_EDITOR') ? (
              <button type="button" onClick={() => setShowCreate((value) => !value)}>
                {showCreate ? 'Close form' : 'New temple'}
              </button>
            ) : null}
          </div>
        </div>
        {showCreate ? (
          <CreateTemple
            onCreated={() => {
              setShowCreate(false);
              void load();
            }}
            onError={setError}
          />
        ) : null}
        {loading ? <p className="notice">Loading the review queue…</p> : null}
        {!loading && visibleTemples.length === 0 ? (
          <p className="notice">No temple records match this filter.</p>
        ) : null}
        <div className="admin-card-list">
          {visibleTemples.map((temple) => (
            <article className="admin-card" key={temple.id}>
              <div className="admin-card-main">
                <p className="eyebrow">
                  {temple.city ?? 'Location unknown'}
                  {temple.state ? ` · ${temple.state}` : ''}
                </p>
                <h3>{temple.name}</h3>
                <p className="muted">/{temple.slug}</p>
              </div>
              <div className="admin-card-statuses">
                <span className={`status status-${temple.verificationStatus.toLowerCase()}`}>
                  {statusLabel(temple.verificationStatus)}
                </span>
                <span className={`status status-${temple.publicationStatus.toLowerCase()}`}>
                  {statusLabel(temple.publicationStatus)}
                </span>
              </div>
              <div className="admin-card-actions">
                {isAllowed(roles, 'CONTENT_EDITOR') ? (
                  <button
                    className="button-secondary"
                    type="button"
                    onClick={() =>
                      setEditingTempleId((current) => (current === temple.id ? null : temple.id))
                    }
                  >
                    {editingTempleId === temple.id ? 'Close edit' : 'Edit'}
                  </button>
                ) : null}
                {isAllowed(roles, 'VERIFIER') ? (
                  <>
                    <button
                      type="button"
                      disabled={busyId === temple.id}
                      onClick={() =>
                        void changeTempleState(
                          temple.id,
                          'verification',
                          'VERIFIED',
                          reviewNotes[temple.id],
                        )
                      }
                    >
                      Verify
                    </button>
                    <button
                      className="button-secondary"
                      type="button"
                      disabled={busyId === temple.id}
                      onClick={() =>
                        void changeTempleState(
                          temple.id,
                          'verification',
                          'NEEDS_REVIEW',
                          reviewNotes[temple.id],
                        )
                      }
                    >
                      Needs review
                    </button>
                    <button
                      className="button-danger"
                      type="button"
                      disabled={busyId === temple.id}
                      onClick={() =>
                        void changeTempleState(
                          temple.id,
                          'verification',
                          'REJECTED',
                          reviewNotes[temple.id],
                        )
                      }
                    >
                      Reject
                    </button>
                  </>
                ) : null}
                {isAllowed(roles, 'CONTENT_EDITOR') && temple.verificationStatus === 'VERIFIED' ? (
                  <button
                    type="button"
                    disabled={busyId === temple.id}
                    onClick={() =>
                      void changeTempleState(
                        temple.id,
                        'publication',
                        temple.publicationStatus === 'PUBLISHED' ? 'UNPUBLISHED' : 'PUBLISHED',
                      )
                    }
                  >
                    {temple.publicationStatus === 'PUBLISHED' ? 'Unpublish' : 'Publish'}
                  </button>
                ) : null}
              </div>
              {isAllowed(roles, 'VERIFIER') ? (
                <div className="admin-review-note">
                  <label htmlFor={`review-note-${temple.id}`}>Private review note</label>
                  <textarea
                    id={`review-note-${temple.id}`}
                    maxLength={2000}
                    value={reviewNotes[temple.id] ?? ''}
                    onChange={(event) =>
                      setReviewNotes((current) => ({ ...current, [temple.id]: event.target.value }))
                    }
                    placeholder="Optional note for authorized reviewers"
                  />
                </div>
              ) : null}
              {editingTempleId === temple.id ? (
                <TempleEditor
                  temple={temple}
                  onSaved={() => {
                    setEditingTempleId(null);
                    void load();
                  }}
                  onError={setError}
                />
              ) : null}
            </article>
          ))}
        </div>
      </section>

      <section className="admin-section" aria-labelledby="organizations-title">
        <div className="section-heading admin-organization-heading">
          <div>
            <p className="eyebrow">Trusts and community groups</p>
            <h2 id="organizations-title">Organizations</h2>
          </div>
          {isAllowed(roles, 'CONTENT_EDITOR') ? (
            <CreateOrganization onCreated={() => void load()} onError={setError} />
          ) : null}
        </div>
        {organizations.length === 0 ? (
          <p className="notice">No organization records are available.</p>
        ) : (
          <div className="admin-card-list">
            {organizations.map((organization) => (
              <article className="admin-card" key={organization.id}>
                <div className="admin-card-main">
                  <p className="eyebrow">
                    {statusLabel(organization.organizationType)} ·{' '}
                    {organization.city ?? 'Location unknown'}
                  </p>
                  <h3>{organization.name}</h3>
                  <p className="muted">
                    /{organization.slug}
                    {organization.state ? ` · ${organization.state}` : ''}
                  </p>
                </div>
                <div className="admin-card-statuses">
                  <span
                    className={`status status-${organization.verificationStatus.toLowerCase()}`}
                  >
                    {statusLabel(organization.verificationStatus)}
                  </span>
                  <span className={`status status-${organization.publicationStatus.toLowerCase()}`}>
                    {statusLabel(organization.publicationStatus)}
                  </span>
                </div>
                {isAllowed(roles, 'VERIFIER') ? (
                  <div className="admin-card-actions">
                    {isAllowed(roles, 'CONTENT_EDITOR') ? (
                      <button
                        className="button-secondary"
                        type="button"
                        onClick={() =>
                          setEditingOrganizationId((current) =>
                            current === organization.id ? null : organization.id,
                          )
                        }
                      >
                        {editingOrganizationId === organization.id ? 'Close edit' : 'Edit'}
                      </button>
                    ) : null}
                    <button
                      type="button"
                      disabled={busyId === organization.id}
                      onClick={() =>
                        void changeOrganizationState(
                          organization.id,
                          'VERIFIED',
                          organizationReviewNotes[organization.id],
                        )
                      }
                    >
                      Verify
                    </button>
                    <button
                      className="button-secondary"
                      type="button"
                      disabled={busyId === organization.id}
                      onClick={() =>
                        void changeOrganizationState(
                          organization.id,
                          'NEEDS_REVIEW',
                          organizationReviewNotes[organization.id],
                        )
                      }
                    >
                      Needs review
                    </button>
                    <button
                      className="button-danger"
                      type="button"
                      disabled={busyId === organization.id}
                      onClick={() =>
                        void changeOrganizationState(
                          organization.id,
                          'REJECTED',
                          organizationReviewNotes[organization.id],
                        )
                      }
                    >
                      Reject
                    </button>
                  </div>
                ) : isAllowed(roles, 'CONTENT_EDITOR') ? (
                  <div className="admin-card-actions">
                    <button
                      className="button-secondary"
                      type="button"
                      onClick={() =>
                        setEditingOrganizationId((current) =>
                          current === organization.id ? null : organization.id,
                        )
                      }
                    >
                      {editingOrganizationId === organization.id ? 'Close edit' : 'Edit'}
                    </button>
                  </div>
                ) : null}
                {isAllowed(roles, 'VERIFIER') ? (
                  <div className="admin-review-note">
                    <label htmlFor={`organization-review-note-${organization.id}`}>
                      Private review note
                    </label>
                    <textarea
                      id={`organization-review-note-${organization.id}`}
                      maxLength={2000}
                      value={organizationReviewNotes[organization.id] ?? ''}
                      onChange={(event) =>
                        setOrganizationReviewNotes((current) => ({
                          ...current,
                          [organization.id]: event.target.value,
                        }))
                      }
                      placeholder="Optional note for authorized reviewers"
                    />
                  </div>
                ) : null}
                {editingOrganizationId === organization.id ? (
                  <OrganizationEditor
                    organization={organization}
                    onSaved={() => {
                      setEditingOrganizationId(null);
                      void load();
                    }}
                    onError={setError}
                  />
                ) : null}
              </article>
            ))}
          </div>
        )}
      </section>

      {isAllowed(roles, 'MODERATOR') ? (
        <section className="admin-section" aria-labelledby="reports-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Trust and safety</p>
              <h2 id="reports-title">Community reports</h2>
            </div>
          </div>
          {reports.length === 0 ? (
            <p className="notice">There are no open reports in this view.</p>
          ) : (
            <div className="admin-card-list">
              {reports.map((report) => (
                <article className="admin-card" key={report.id}>
                  <div className="admin-card-main">
                    <p className="eyebrow">
                      {statusLabel(report.reasonCode)} ·{' '}
                      {new Date(report.createdAt).toLocaleDateString()}
                    </p>
                    <h3>{report.description}</h3>
                  </div>
                  <span className={`status status-${report.status.toLowerCase()}`}>
                    {statusLabel(report.status)}
                  </span>
                  <div className="admin-card-actions">
                    <button
                      type="button"
                      disabled={busyId === report.id}
                      onClick={() => void changeReportState(report.id, 'IN_REVIEW')}
                    >
                      Review
                    </button>
                    <button
                      className="button-secondary"
                      type="button"
                      disabled={busyId === report.id}
                      onClick={() => void changeReportState(report.id, 'DISMISSED')}
                    >
                      Dismiss
                    </button>
                    <button
                      type="button"
                      disabled={busyId === report.id}
                      onClick={() => void changeReportState(report.id, 'ACTIONED')}
                    >
                      Actioned
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      ) : null}
    </main>
  );
}

function CreateTemple({
  onCreated,
  onError,
}: {
  onCreated: () => void;
  onError: (message: string) => void;
}) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [city, setCity] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      await readJson('/api/admin/temples', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name, slug, city: city || null }),
      });
      onCreated();
    } catch (cause) {
      onError(cause instanceof Error ? cause.message : 'The temple could not be created.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="admin-create-form" onSubmit={submit} aria-label="Create temple">
      <div className="field">
        <label htmlFor="new-temple-name">Name</label>
        <input
          id="new-temple-name"
          required
          minLength={2}
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor="new-temple-slug">Slug</label>
        <input
          id="new-temple-slug"
          required
          pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
          value={slug}
          onChange={(event) => setSlug(event.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor="new-temple-city">
          City <span className="muted">(optional)</span>
        </label>
        <input
          id="new-temple-city"
          value={city}
          onChange={(event) => setCity(event.target.value)}
        />
      </div>
      <button type="submit" disabled={busy}>
        {busy ? 'Saving…' : 'Save pending temple'}
      </button>
    </form>
  );
}

function TempleEditor({
  temple,
  onSaved,
  onError,
}: {
  temple: Temple;
  onSaved: () => void;
  onError: (message: string) => void;
}) {
  const [name, setName] = useState(temple.name);
  const [slug, setSlug] = useState(temple.slug);
  const [city, setCity] = useState(temple.city ?? '');
  const [state, setState] = useState(temple.state ?? '');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      await readJson(`/api/admin/temples/${temple.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name,
          slug,
          city: city || null,
          state: state || null,
        }),
      });
      onSaved();
    } catch (cause) {
      onError(cause instanceof Error ? cause.message : 'The temple could not be updated.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="admin-edit-form" onSubmit={submit} aria-label={`Edit ${temple.name}`}>
      <div className="field">
        <label htmlFor={`edit-temple-name-${temple.id}`}>Name</label>
        <input
          id={`edit-temple-name-${temple.id}`}
          required
          minLength={2}
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor={`edit-temple-slug-${temple.id}`}>Slug</label>
        <input
          id={`edit-temple-slug-${temple.id}`}
          required
          pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
          value={slug}
          onChange={(event) => setSlug(event.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor={`edit-temple-city-${temple.id}`}>City</label>
        <input
          id={`edit-temple-city-${temple.id}`}
          value={city}
          onChange={(event) => setCity(event.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor={`edit-temple-state-${temple.id}`}>State</label>
        <input
          id={`edit-temple-state-${temple.id}`}
          value={state}
          onChange={(event) => setState(event.target.value)}
        />
      </div>
      <button type="submit" disabled={busy}>
        {busy ? 'Saving…' : 'Save changes'}
      </button>
    </form>
  );
}

function OrganizationEditor({
  organization,
  onSaved,
  onError,
}: {
  organization: Organization;
  onSaved: () => void;
  onError: (message: string) => void;
}) {
  const [name, setName] = useState(organization.name);
  const [slug, setSlug] = useState(organization.slug);
  const [city, setCity] = useState(organization.city ?? '');
  const [state, setState] = useState(organization.state ?? '');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      await readJson(`/api/admin/organizations/${organization.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name, slug, city: city || null, state: state || null }),
      });
      onSaved();
    } catch (cause) {
      onError(cause instanceof Error ? cause.message : 'The organization could not be updated.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="admin-edit-form" onSubmit={submit} aria-label={`Edit ${organization.name}`}>
      <div className="field">
        <label htmlFor={`edit-organization-name-${organization.id}`}>Name</label>
        <input
          id={`edit-organization-name-${organization.id}`}
          required
          minLength={2}
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor={`edit-organization-slug-${organization.id}`}>Slug</label>
        <input
          id={`edit-organization-slug-${organization.id}`}
          required
          pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
          value={slug}
          onChange={(event) => setSlug(event.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor={`edit-organization-city-${organization.id}`}>City</label>
        <input
          id={`edit-organization-city-${organization.id}`}
          value={city}
          onChange={(event) => setCity(event.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor={`edit-organization-state-${organization.id}`}>State</label>
        <input
          id={`edit-organization-state-${organization.id}`}
          value={state}
          onChange={(event) => setState(event.target.value)}
        />
      </div>
      <button type="submit" disabled={busy}>
        {busy ? 'Saving…' : 'Save changes'}
      </button>
    </form>
  );
}

function CreateOrganization({
  onCreated,
  onError,
}: {
  onCreated: () => void;
  onError: (message: string) => void;
}) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [type, setType] = useState('TEMPLE_TRUST');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      await readJson('/api/admin/organizations', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name, slug, organizationType: type }),
      });
      setName('');
      setSlug('');
      onCreated();
    } catch (cause) {
      onError(cause instanceof Error ? cause.message : 'The organization could not be created.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="admin-inline-form" onSubmit={submit} aria-label="Create organization">
      <input
        aria-label="Organization name"
        required
        minLength={2}
        placeholder="New organization name"
        value={name}
        onChange={(event) => setName(event.target.value)}
      />
      <input
        aria-label="Organization slug"
        required
        pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
        placeholder="slug"
        value={slug}
        onChange={(event) => setSlug(event.target.value)}
      />
      <select
        aria-label="Organization type"
        value={type}
        onChange={(event) => setType(event.target.value)}
      >
        <option value="TEMPLE_TRUST">Temple trust</option>
        <option value="COMMUNITY_GROUP">Community group</option>
        <option value="CHARITY">Charity</option>
        <option value="OTHER">Other</option>
      </select>
      <button type="submit" disabled={busy}>
        {busy ? 'Saving…' : 'Add organization'}
      </button>
    </form>
  );
}
