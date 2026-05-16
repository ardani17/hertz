import type { Metadata } from 'next';
import { CftcToolPage as CftcToolPageContent } from '@/components/tools/CftcToolPage';
import { HertzAppShell } from '@/components/hertz/HertzAppShell';
import { getCurrentMember } from '@/lib/memberAuth';

export const metadata: Metadata = {
  title: 'CFTC COT Viewer',
  description:
    'Viewer CFTC Commitment of Traders untuk membaca positioning futures market.',
  alternates: {
    canonical: '/tools/cftc',
  },
};

export default async function CftcPage() {
  const currentUser = await getCurrentMember();

  return (
    <HertzAppShell active="tools" title="Tools" description="Viewer positioning futures dari CFTC COT." currentUser={currentUser}>
      <CftcToolPageContent />
    </HertzAppShell>
  );
}
