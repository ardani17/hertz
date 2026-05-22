import type { ReactNode } from 'react';
import { ToolsShell } from '@/components/tools/ToolsShell';
import { HertzLayout } from '@/components/layout/HertzLayout';
import { getCurrentMember } from '@/lib/memberAuth';

export default async function ToolsLayout({ children }: { children: ReactNode }) {
  const currentUser = await getCurrentMember();

  return (
    <HertzLayout
      variant="page"
      active="tools"
      title="Tools"
      description="Trading research utilities untuk membaca market dengan cepat."
      currentUser={currentUser}
    >
      <ToolsShell>{children}</ToolsShell>
    </HertzLayout>
  );
}
