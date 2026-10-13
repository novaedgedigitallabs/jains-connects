import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Support JainConnect',
  description: 'Learn what optional JainConnect operating-cost support is intended to cover.',
  alternates: { canonical: '/support-jainconnect' },
};

export default function SupportJainConnectPage() {
  return (
    <div className="page-shell">
      <section className="hero" aria-labelledby="support-title">
        <p className="eyebrow">Optional platform support</p>
        <h1 id="support-title">Support JainConnect when you choose.</h1>
        <p className="lead">
          Contributions, when a verified support configuration is available, may help cover hosting,
          storage, backups, security, monitoring, and maintenance.
        </p>
      </section>
      <section className="detail-panel" aria-labelledby="separation-title">
        <h2 id="separation-title">Separate from temple or trust donations</h2>
        <p>
          Platform support is optional and never required to use core features. It is separate from
          any direct donation instructions published for a verified temple or trust.
        </p>
        <p>
          Payment instructions are not published on this page until recipient, legal, accounting,
          and operational review requirements are met. JainConnect will not treat a QR display or
          redirect as proof of payment success.
        </p>
      </section>
    </div>
  );
}
