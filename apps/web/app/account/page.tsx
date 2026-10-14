import type { Metadata } from 'next';
import Link from 'next/link';
import MemberAuthPanel from '../components/member-session';

export const metadata: Metadata = {
  title: 'Member account',
  robots: { index: false, follow: false },
};

export default function AccountPage() {
  return (
    <main className="page-shell">
      <section className="hero">
        <p className="eyebrow">Private member area</p>
        <h1>Your JainConnect account</h1>
        <p className="lead">
          Sign in once to follow reports, corrections, representative claims, and organization
          memberships submitted from your account.
        </p>
      </section>
      <MemberAuthPanel heading="Sign in to manage your requests" />
      <section className="detail-panel account-links" aria-labelledby="account-links-title">
        <h2 id="account-links-title">Account tools</h2>
        <ul className="link-list">
          <li>
            <Link href="/account/reports">Reports and corrections status</Link>
          </li>
          <li>
            <Link href="/account/organizations">Representative memberships and claims</Link>
          </li>
        </ul>
      </section>
    </main>
  );
}
