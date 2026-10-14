export default function OrganizationLoading() {
  return (
    <div className="page-shell" aria-busy="true" aria-live="polite">
      <p className="eyebrow">Organization directory</p>
      <div className="detail-panel">
        <span className="status">Loading</span>
        <h1>Loading organization information</h1>
        <p className="lead">Loading the approved public record.</p>
      </div>
    </div>
  );
}
