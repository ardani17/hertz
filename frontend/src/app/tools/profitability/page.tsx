import type { Metadata } from 'next';
import { ProfitabilityToolPage } from '@/components/tools/ProfitabilityToolPage';

export const metadata: Metadata = {
  title: 'Profitability Simulator',
  description: 'Simulasi probabilitas trading dengan Monte Carlo.',
};

export default function ProfitabilityPage() {
  return <ProfitabilityToolPage />;
}
