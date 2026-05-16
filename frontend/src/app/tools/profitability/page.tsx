import type { Metadata } from 'next';
import { ProfitabilityToolPage } from '@/components/tools/ProfitabilityToolPage';
import { HertzAppShell } from '@/components/hertz/HertzAppShell';
import { getCurrentMember } from '@/lib/memberAuth';

export const metadata: Metadata = {
  title: 'Profitability Simulator',
  description: 'Simulasi probabilitas trading dengan Monte Carlo.',
};

export default async function ProfitabilityPage() {
  const currentUser = await getCurrentMember();

  return (
    <HertzAppShell active="tools" title="Tools" description="Simulator Monte Carlo untuk risk, win rate, dan reward-risk." currentUser={currentUser}>
      <ProfitabilityToolPage />
    </HertzAppShell>
  );
}
