import type { Metadata } from 'next';
import { ExchangeLiquidityToolPage } from '@/components/tools/ExchangeLiquidityToolPage';
import { HertzAppShell } from '@/components/hertz/HertzAppShell';
import { getCurrentMember } from '@/lib/memberAuth';

export const metadata: Metadata = {
  title: 'Exchange Liquidity',
  description: 'Liquidity map crypto untuk membaca klaster likuidasi.',
};

export default async function ExchangeLiquidityPage() {
  const currentUser = await getCurrentMember();

  return (
    <HertzAppShell active="tools" title="Tools" description="Peta likuidasi leverage untuk pair crypto." currentUser={currentUser}>
      <ExchangeLiquidityToolPage />
    </HertzAppShell>
  );
}
