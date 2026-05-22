'use client';

import type { ReactNode } from 'react';
import { SectionShell } from '@/components/spa/SectionShell';

/** Tools hub shell — sub-routes navigate client-side within the shared Hertz layout. */
export function ToolsShell({ children }: { children: ReactNode }) {
  return <SectionShell section="tools">{children}</SectionShell>;
}
