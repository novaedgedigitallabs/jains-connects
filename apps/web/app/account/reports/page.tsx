import type { Metadata } from 'next';
import AccountReports from './reports';

export const metadata: Metadata = {
  title: 'My reports and corrections',
  robots: { index: false, follow: false },
};

export default function AccountReportsPage() {
  return <AccountReports />;
}
