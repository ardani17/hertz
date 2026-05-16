import type { Metadata } from 'next';
import { OrderBookToolPage } from '@/components/tools/OrderBookToolPage';
import { HertzAppShell } from '@/components/hertz/HertzAppShell';
import { getCurrentMember } from '@/lib/memberAuth';

export const metadata: Metadata = {
  title: 'Order Book',
  description: 'Open orders dan open positions dari OANDA Labs.',
};

export default async function OrderBookPage() {
  const currentUser = await getCurrentMember();

  return (
    <HertzAppShell active="tools" title="Tools" description="Distribusi open orders dan positions dari OANDA Labs." currentUser={currentUser}>
      <OrderBookToolPage />
    </HertzAppShell>
  );
}
