import type { Metadata } from 'next';
import { CftcToolPage } from '@/components/tools/CftcToolPage';

export const metadata: Metadata = {
  title: 'CFTC COT Viewer',
  description: 'Viewer positioning futures dari CFTC COT.',
};

export default function CftcPage() {
  return <CftcToolPage />;
}
