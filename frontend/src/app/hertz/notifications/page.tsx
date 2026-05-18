import type { Metadata } from 'next';
import { NotificationsClient } from './NotificationsClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Notifikasi | HERTZ',
  description: 'Aktivitas sosial terbaru di HERTZ.',
  alternates: { canonical: '/hertz/notifications' },
};

export default function HertzNotificationsPage() {
  return <NotificationsClient />;
}
