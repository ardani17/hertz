'use client';

import type { ReactNode } from 'react';
import { SectionShell } from '@/components/spa/SectionShell';
import { ToolNav } from './ToolNav';

/** Tools hub shell — persistent ToolNav + client-side sub-route navigation. */
export function ToolsShell({ children }: { children: ReactNode }) {
  return (
    <SectionShell section="tools">
      <ToolNav />
      {children}
    </SectionShell>
  );
}
