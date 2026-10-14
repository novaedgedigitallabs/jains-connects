import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="page-shell">
      <section className="hero" aria-labelledby="home-title">
        <p className="eyebrow">Community-first discovery</p>
        <h1 id="home-title">Find useful Jain community information with clarity.</h1>
        <p className="lead">
          JainConnect brings approved community listings, temple information, events, and resources
          into one shareable place. Public information stays available on the web without requiring
          an app installation.
        </p>
      </section>

      <section className="section" aria-labelledby="quick-actions-title">
        <div className="section-heading">
          <div>
            <h2 id="quick-actions-title">Start with a useful directory</h2>
            <p>Explore what is currently available in the public directory.</p>
          </div>
        </div>
        <div className="quick-grid">
          <Link className="quick-card" href="/temples">
            <h3>Find a temple</h3>
            <p>
              Search published temple records with their available public details and review date.
            </p>
          </Link>
          <Link className="quick-card" href="/organizations">
            <h3>Find an organization</h3>
            <p>
              Explore verified Jain trusts, community groups, and charities with available public
              details.
            </p>
          </Link>
          <div className="quick-card">
            <h3>Calendar and events</h3>
            <p>
              Calendar and event publishing will be added after their source and review workflows
              are in place.
            </p>
          </div>
          <div className="quick-card">
            <h3>Community resources</h3>
            <p>
              More directories will be introduced in dependency-aware phases with clear publication
              states.
            </p>
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="trust-title">
        <div className="notice">
          <h2 id="trust-title">Information should be useful and honest</h2>
          <p>
            A listing is shown publicly only when its backend record is both published and verified.
            Verification means a defined review was completed; it is not a permanent guarantee that
            every detail is always current.
          </p>
          <Link className="text-link" href="/about">
            Learn how JainConnect is being built
          </Link>
        </div>
      </section>
    </div>
  );
}
