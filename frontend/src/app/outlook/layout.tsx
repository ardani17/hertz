import type { ReactNode } from 'react';
import { HertzLayout } from '@/components/layout/HertzLayout';
import { getCurrentMember } from '@/lib/memberAuth';

export default async function OutlookLayout({ children }: { children: ReactNode }) {
  const currentUser = await getCurrentMember();
  return (
    <HertzLayout
      variant="page"
      active="outlook"
      title="Outlook"
      description="Ringkasan narasi market, ide besar, dan konteks sebelum eksekusi."
      currentUser={currentUser}
    >
      {children}
    </HertzLayout>
  );
}
