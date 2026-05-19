import type { Metadata } from 'next';
import { ElliottWaveToolPage } from '@/components/tools/ElliottWaveToolPage';

export const metadata: Metadata = {
  title: 'Elliott Wave',
  description: 'Kalkulator level observasi berbasis range dan Fibonacci.',
};

export default function ElliottWavePage() {
  return <ElliottWaveToolPage />;
}
