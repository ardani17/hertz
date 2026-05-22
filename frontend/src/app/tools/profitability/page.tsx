import type { Metadata } from 'next';
import dynamic from 'next/dynamic';

const ProfitabilityToolPage = dynamic(
  () => import('@/components/tools/ProfitabilityToolPage').then((mod) => mod.ProfitabilityToolPage),
  { loading: () => <p role="status">Memuat simulator…</p> },
);

export const metadata: Metadata = {
  title: 'Profitability Simulator',
  description: 'Simulasi probabilitas trading dengan Monte Carlo.',
};

export default function ProfitabilityPage() {
  return <ProfitabilityToolPage />;
}
