import { validateSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { AdminShell } from './AdminShell';

/**
 * Admin dashboard layout — sidebar/header persist; content swaps via client navigation (SPA).
 */
export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await validateSession();

  if (!user) {
    redirect('/admin/login');
  }

  return <AdminShell username={user.username ?? 'Admin'}>{children}</AdminShell>;
}
