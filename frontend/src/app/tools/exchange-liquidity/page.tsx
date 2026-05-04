import type { Metadata } from 'next';
import { ExchangeLiquidityToolPage } from '@/components/tools/ExchangeLiquidityToolPage';

export const metadata: Metadata = {
  title: 'Exchange Liquidity',
  description: 'Liquidity map crypto untuk membaca klaster likuidasi.',
};

export default function ExchangeLiquidityPage() {
  return <ExchangeLiquidityToolPage />;
}
