import type { Metadata } from 'next';
import { ToolsHub } from '@/components/tools/ToolsHub';
import { HertzAppShell } from '@/components/hertz/HertzAppShell';
import { getCurrentMember } from '@/lib/memberAuth';

export const metadata: Metadata = {
  title: 'Tools',
  description:
    'Kumpulan tool market Horizon: CFTC COT viewer dan referensi suite HorizonFX.',
  alternates: {
    canonical: '/tools',
  },
};

export default async function ToolsPage() {
  const currentUser = await getCurrentMember();

  return (
    <HertzAppShell active="tools" title="Tools" description="Trading research utilities untuk membaca market dengan cepat." currentUser={currentUser}>
      <ToolsHub />
    </HertzAppShell>
  );
}
