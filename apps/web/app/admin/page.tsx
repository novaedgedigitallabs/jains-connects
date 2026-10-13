import type { Metadata } from 'next';
import AdminDashboard from './dashboard';

export const metadata: Metadata = {
  title: 'Administration',
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AdminDashboard />;
}
