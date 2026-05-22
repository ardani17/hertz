import type { ReactNode } from 'react';
import { BlogShell } from '@/components/blog/BlogShell';
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
      <BlogShell currentUser={currentUser}>{children}</BlogShell>
    </HertzLayout>
  );
}
