export default function OrganizationsLoading() {
  return (
    <div className="page-shell" aria-busy="true" aria-live="polite">
      <section className="hero">
        <p className="eyebrow">Public directory</p>
        <h1>Loading organizations</h1>
        <p className="lead">Loading approved Jain organizations and trusts.</p>
      </section>
      <div className="notice">Directory results are loading…</div>
    </div>
  );
}
