import type { Metadata } from 'next';
import { ChallengeTrackerToolPage } from '@/components/tools/ChallengeTrackerToolPage';
import { getCurrentMember } from '@/lib/memberAuth';

export const metadata: Metadata = {
  title: 'Challenge Tracker',
  description: 'Pantau target profit, drawdown, rules, risk harian, dan jurnal trading challenge.',
};

export default async function ChallengeTrackerPage() {
  const currentUser = await getCurrentMember();
  return <ChallengeTrackerToolPage isAuthenticated={Boolean(currentUser)} />;
}
