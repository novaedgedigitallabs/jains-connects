import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About JainConnect',
  description:
    'Learn how JainConnect is being built as a free, community-first information platform.',
  alternates: { canonical: '/about' },
};

export default function AboutPage() {
  return (
    <div className="page-shell">
      <section className="hero" aria-labelledby="about-title">
        <p className="eyebrow">About JainConnect</p>
        <h1 id="about-title">Useful information before promotion.</h1>
        <p className="lead">
          JainConnect is being built to make temples, community services, religious resources, and
          events easier to discover and share while keeping verification and privacy visible.
        </p>
      </section>
      <section className="detail-panel" aria-labelledby="trust-title">
        <h2 id="trust-title">How information is handled</h2>
        <p>
          Public records are intended to be sourced, reviewed, and clearly labeled. A verified
          record reflects a defined review; it does not promise that every changing detail will
          remain current.
        </p>
        <p>
          Sensitive workflows such as blood-donor participation, moderation, and payment
          instructions require additional consent, access control, and review before they are
          exposed.
        </p>
      </section>
    </div>
  );
}
