import type { ReactNode } from 'react';
import { HertzLayout } from '@/components/layout/HertzLayout';
import { getCurrentMember } from '@/lib/memberAuth';

export default async function ArtikelLayout({ children }: { children: ReactNode }) {
  const currentUser = await getCurrentMember();
  return (
    <HertzLayout
      variant="page"
      active="home"
      title="Artikel"
      description="Arsip artikel Horizon."
      currentUser={currentUser}
    >
      {children}
    </HertzLayout>
  );
}
