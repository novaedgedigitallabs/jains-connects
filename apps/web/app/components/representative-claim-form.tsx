'use client';

import { FormEvent, useState } from 'react';
import MemberAuthPanel, { useMemberSession } from './member-session';

export default function RepresentativeClaimForm({
  organizationId,
  organizationName,
}: {
  organizationId: string;
  organizationName: string;
}) {
  const [requestedRole, setRequestedRole] = useState('EDITOR');
  const [statement, setStatement] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { user, loading } = useMemberSession();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      if (!user) throw new Error('Sign in before requesting management access.');
      const response = await fetch(
        `/api/member/organizations/${organizationId}/representative-claims`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            requestedRole,
            applicantStatement: statement,
            ...(sourceUrl ? { sourceUrl } : {}),
          }),
        },
      );
      const payload = (await response.json()) as { error?: { message?: string } };
      if (!response.ok)
        throw new Error(
          payload.error?.message ?? 'The representative request could not be submitted.',
        );
      setMessage(`Your request to manage ${organizationName} is pending reviewer approval.`);
      setStatement('');
      setSourceUrl('');
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'The representative request could not be submitted.',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="workflow-panel" aria-labelledby="claim-title">
      <p className="eyebrow">Authorized representatives</p>
      <h2 id="claim-title">Request management access</h2>
      <p className="muted">
        Requests are reviewed separately from the organization’s public verification. Approval does
        not change public status by itself.
      </p>
      {loading ? <p className="notice">Checking your session…</p> : null}
      {!loading && !user ? (
        <MemberAuthPanel heading="Sign in to request management access" />
      ) : null}
      <form className="workflow-form" onSubmit={submit}>
        <div className="field">
          <label htmlFor="claim-role">Requested access</label>
          <select
            id="claim-role"
            value={requestedRole}
            onChange={(event) => setRequestedRole(event.target.value)}
          >
            <option value="EDITOR">Editor</option>
            <option value="MANAGER">Manager</option>
            <option value="OWNER">Owner</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="claim-statement">Why should you manage this record?</label>
          <textarea
            id="claim-statement"
            minLength={20}
            maxLength={2000}
            required
            value={statement}
            onChange={(event) => setStatement(event.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="claim-source">
            Supporting public source URL <span className="muted">(optional)</span>
          </label>
          <input
            id="claim-source"
            type="url"
            value={sourceUrl}
            onChange={(event) => setSourceUrl(event.target.value)}
          />
        </div>
        {error ? (
          <p className="notice notice-error" role="alert">
            {error}
          </p>
        ) : null}
        {message ? (
          <p className="notice notice-success" role="status">
            {message}
          </p>
        ) : null}
        <button type="submit" disabled={busy || loading || !user}>
          {busy ? 'Submitting…' : 'Request access'}
        </button>
      </form>
    </section>
  );
}
