import type { Metadata } from 'next';
import { ChallengeTrackerToolPage } from '@/components/tools/ChallengeTrackerToolPage';
import { HertzAppShell } from '@/components/hertz/HertzAppShell';
import { getCurrentMember } from '@/lib/memberAuth';

export const metadata: Metadata = {
  title: 'Challenge Tracker',
  description: 'Pantau target profit, drawdown, rules, risk harian, dan jurnal trading challenge.',
};

export default async function ChallengeTrackerPage() {
  const currentUser = await getCurrentMember();

  return (
    <HertzAppShell active="tools" title="Tools" description="Tracker challenge trading untuk member Horizon." currentUser={currentUser}>
      <ChallengeTrackerToolPage isAuthenticated={Boolean(currentUser)} />
    </HertzAppShell>
  );
}
