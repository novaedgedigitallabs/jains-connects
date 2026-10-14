'use client';

export default function OrganizationsError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="page-shell">
      <div className="notice notice-error" role="alert">
        <h1>Organization directory unavailable</h1>
        <p>The public organization directory could not be displayed.</p>
        <button type="button" onClick={reset}>
          Try again
        </button>
      </div>
    </div>
  );
}
