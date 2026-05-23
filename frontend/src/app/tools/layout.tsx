import type { ReactNode } from 'react';
import { ToolsLayoutChrome } from '@/components/tools/ToolsLayoutChrome';
import { getCurrentMember } from '@/lib/memberAuth';

export default async function ToolsLayout({ children }: { children: ReactNode }) {
  const currentUser = await getCurrentMember();

  return <ToolsLayoutChrome currentUser={currentUser}>{children}</ToolsLayoutChrome>;
}
