'use client';

import { FormEvent, useState } from 'react';
import MemberAuthPanel, { useMemberSession } from './member-session';

type TargetType = 'organizations' | 'temples';

export default function RecordWorkflowForm({
  targetType,
  targetId,
  targetName,
}: {
  targetType: TargetType;
  targetId: string;
  targetName: string;
}) {
  const [mode, setMode] = useState<'report' | 'correction'>('report');
  const [reasonCode, setReasonCode] = useState('OUTDATED');
  const [description, setDescription] = useState('');
  const [proposedName, setProposedName] = useState('');
  const [proposedDescription, setProposedDescription] = useState('');
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
      if (!user) throw new Error('Sign in before submitting a request.');
      const base = `/api/member/reports/${targetType}/${targetId}`;
      const payload =
        mode === 'report'
          ? { reasonCode, description }
          : {
              reasonCode: 'CORRECTION_REQUEST',
              description,
              sourceUrl: sourceUrl || undefined,
              proposedChanges: {
                ...(proposedName ? { name: proposedName } : {}),
                ...(proposedDescription ? { description: proposedDescription } : {}),
              },
            };
      const response = await fetch(`${base}${mode === 'correction' ? '/corrections' : ''}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const responsePayload = (await response.json()) as { error?: { message?: string } };
      if (!response.ok)
        throw new Error(responsePayload.error?.message ?? 'The request could not be submitted.');
      setMessage(
        mode === 'report'
          ? 'Your report was submitted for review. It has not been marked resolved.'
          : 'Your correction was submitted for review. The public record has not been changed yet.',
      );
      setDescription('');
      setProposedName('');
      setProposedDescription('');
      setSourceUrl('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The request could not be submitted.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="workflow-panel" aria-labelledby="record-workflow-title">
      <p className="eyebrow">Help keep this record accurate</p>
      <h2 id="record-workflow-title">Report or suggest a correction</h2>
      <p className="muted">
        You will need a JainConnect account. Your account identity is shared only with authorized
        reviewers.
      </p>
      <div className="workflow-tabs" role="tablist" aria-label="Record feedback type">
        <button
          className={mode === 'report' ? 'workflow-tab active' : 'workflow-tab'}
          type="button"
          role="tab"
          aria-selected={mode === 'report'}
          onClick={() => setMode('report')}
        >
          Report an issue
        </button>
        <button
          className={mode === 'correction' ? 'workflow-tab active' : 'workflow-tab'}
          type="button"
          role="tab"
          aria-selected={mode === 'correction'}
          onClick={() => setMode('correction')}
        >
          Suggest a correction
        </button>
      </div>
      {loading ? <p className="notice">Checking your session…</p> : null}
      {!loading && !user ? <MemberAuthPanel heading="Sign in to report this record" /> : null}
      <form className="workflow-form" onSubmit={submit}>
        {mode === 'report' ? (
          <div className="field">
            <label htmlFor="workflow-reason">Reason</label>
            <select
              id="workflow-reason"
              value={reasonCode}
              onChange={(event) => setReasonCode(event.target.value)}
            >
              <option value="OUTDATED">Information is outdated</option>
              <option value="INCORRECT">Information is incorrect</option>
              <option value="DUPLICATE">Duplicate record</option>
              <option value="ABUSIVE">Abusive or inappropriate content</option>
            </select>
          </div>
        ) : null}
        <div className="field">
          <label htmlFor="workflow-description">
            {mode === 'report' ? 'What is wrong?' : 'Explain the correction'}
          </label>
          <textarea
            id="workflow-description"
            minLength={10}
            maxLength={2000}
            required
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder={`Tell reviewers what should be checked about ${targetName}.`}
          />
        </div>
        {mode === 'correction' ? (
          <>
            <div className="field">
              <label htmlFor="workflow-name">
                Suggested name <span className="muted">(optional)</span>
              </label>
              <input
                id="workflow-name"
                maxLength={200}
                value={proposedName}
                onChange={(event) => setProposedName(event.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="workflow-description-value">
                Suggested description <span className="muted">(optional)</span>
              </label>
              <textarea
                id="workflow-description-value"
                maxLength={4000}
                value={proposedDescription}
                onChange={(event) => setProposedDescription(event.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="workflow-source">
                Supporting public source URL <span className="muted">(optional)</span>
              </label>
              <input
                id="workflow-source"
                type="url"
                value={sourceUrl}
                onChange={(event) => setSourceUrl(event.target.value)}
                placeholder="https://example.org/source"
              />
            </div>
          </>
        ) : null}
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
          {busy ? 'Submitting…' : mode === 'report' ? 'Submit report' : 'Submit correction'}
        </button>
      </form>
    </section>
  );
}
