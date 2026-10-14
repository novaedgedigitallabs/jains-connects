import type { Metadata } from 'next';
import AccountOrganizations from './organizations';

export const metadata: Metadata = {
  title: 'Representative memberships and claims',
  robots: { index: false, follow: false },
};

export default function AccountOrganizationsPage() {
  return <AccountOrganizations />;
}
