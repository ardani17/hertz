import type { ReactNode } from 'react';
import { HertzLayout } from '@/components/layout/HertzLayout';
import { getCurrentMember } from '@/lib/memberAuth';

export default async function BlogLayout({ children }: { children: ReactNode }) {
  const currentUser = await getCurrentMember();
  return (
    <HertzLayout
      variant="page"
      active="blog"
      title="Blog"
      description="Artikel blog Horizon hasil import WordPress."
      currentUser={currentUser}
    >
      {children}
    </HertzLayout>
  );
}
