import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

const siteUrl = process.env.PUBLIC_SITE_URL ?? 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'JainConnect — Community information and services',
    template: '%s — JainConnect',
  },
  description:
    'Discover approved Jain community information, temples, events, resources, and services through JainConnect.',
  openGraph: {
    type: 'website',
    siteName: 'JainConnect',
    title: 'JainConnect — Community information and services',
    description:
      'Discover approved Jain community information, temples, events, resources, and services through JainConnect.',
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <div className="header-inner">
            <Link className="brand" href="/" aria-label="JainConnect home">
              JainConnect
            </Link>
            <nav className="primary-nav" aria-label="Primary navigation">
              <Link href="/temples">Temples</Link>
              <Link href="/about">About</Link>
              <Link href="/support-jainconnect">Support JainConnect</Link>
            </nav>
          </div>
        </header>
        <main>{children}</main>
        <footer className="site-footer">
          <div className="site-footer-inner">
            <p>Useful Jain community information, published with care.</p>
            <p>Developed and maintained by NovaEdge Digital Labs.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
