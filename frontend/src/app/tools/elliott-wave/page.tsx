import type { Metadata } from 'next';
import dynamic from 'next/dynamic';

const ElliottWaveToolPage = dynamic(
  () => import('@/components/tools/ElliottWaveToolPage').then((mod) => mod.ElliottWaveToolPage),
  { loading: () => <p role="status">Memuat kalkulator Elliott…</p> },
);

export const metadata: Metadata = {
  title: 'Elliott Wave Calculator',
  description: 'Kalkulator gelombang Elliott untuk analisis struktur pasar.',
};

export default function ElliottWavePage() {
  return <ElliottWaveToolPage />;
}
