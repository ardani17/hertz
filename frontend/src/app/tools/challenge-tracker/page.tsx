import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { getCurrentMember } from '@/lib/memberAuth';

const ChallengeTrackerToolPage = dynamic(
  () => import('@/components/tools/ChallengeTrackerToolPage').then((mod) => mod.ChallengeTrackerToolPage),
  { loading: () => <p role="status">Memuat challenge tracker…</p> },
);

export const metadata: Metadata = {
  title: 'Challenge Tracker',
  description: 'Lacak progres challenge trading Anda.',
};

export default async function ChallengeTrackerPage() {
  const currentUser = await getCurrentMember();
  return <ChallengeTrackerToolPage isAuthenticated={Boolean(currentUser)} />;
}
