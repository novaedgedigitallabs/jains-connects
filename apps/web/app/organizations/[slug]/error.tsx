'use client';

export default function OrganizationError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="page-shell">
      <div className="notice notice-error" role="alert">
        <h1>Organization information unavailable</h1>
        <p>The public organization record could not be displayed.</p>
        <button type="button" onClick={reset}>
          Try again
        </button>
      </div>
    </div>
  );
}
