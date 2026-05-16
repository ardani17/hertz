import type { Metadata } from 'next';
import { ElliottWaveToolPage } from '@/components/tools/ElliottWaveToolPage';
import { HertzAppShell } from '@/components/hertz/HertzAppShell';
import { getCurrentMember } from '@/lib/memberAuth';

export const metadata: Metadata = {
  title: 'Elliott Wave Calculator',
  description: 'Hitung level Elliott Wave berbasis range dan Fibonacci.',
};

export default async function ElliottWavePage() {
  const currentUser = await getCurrentMember();

  return (
    <HertzAppShell active="tools" title="Tools" description="Kalkulator level observasi berbasis range dan Fibonacci." currentUser={currentUser}>
      <ElliottWaveToolPage />
    </HertzAppShell>
  );
}
