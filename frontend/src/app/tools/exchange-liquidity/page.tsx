import type { Metadata } from 'next';
import { ExchangeLiquidityToolPage } from '@/components/tools/ExchangeLiquidityToolPage';

export const metadata: Metadata = {
  title: 'Exchange Liquidity',
  description: 'Peta likuidasi leverage untuk pair crypto.',
};

export default function ExchangeLiquidityPage() {
  return <ExchangeLiquidityToolPage />;
}
