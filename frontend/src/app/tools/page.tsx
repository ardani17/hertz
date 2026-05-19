import type { Metadata } from 'next';
import { ToolsHub } from '@/components/tools/ToolsHub';

export const metadata: Metadata = {
  title: 'Tools',
  description:
    'Kumpulan tool market Horizon: CFTC COT viewer dan referensi suite HorizonFX.',
  alternates: {
    canonical: '/tools',
  },
};

export default function ToolsPage() {
  return <ToolsHub />;
}
