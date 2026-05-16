import type { Metadata } from 'next';
import { HertzMessagesClient } from './MessagesClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Direct Message | HERTZ',
  description: 'Percakapan privat antar member HERTZ.',
  alternates: { canonical: '/hertz/messages' },
};

export default function HertzMessagesPage() {
  return <HertzMessagesClient />;
}
