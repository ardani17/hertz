import type { Metadata } from 'next';
import { CftcToolPage as CftcToolPageContent } from '@/components/tools/CftcToolPage';

export const metadata: Metadata = {
  title: 'CFTC COT Viewer',
  description:
    'Viewer CFTC Commitment of Traders untuk membaca positioning futures market.',
  alternates: {
    canonical: '/tools/cftc',
  },
};

export default function CftcPage() {
  return <CftcToolPageContent />;
}
