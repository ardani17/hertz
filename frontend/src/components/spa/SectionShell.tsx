'use client';

import type { ReactNode } from 'react';

/** Marks a persistent layout region for SPA navigation (shell survives client route changes). */
export function SectionShell({
  section,
  children,
}: {
  section: 'blog' | 'outlook' | 'tools' | 'hertz' | 'messages' | 'admin';
  children: ReactNode;
}) {
  return <div data-spa-section={section}>{children}</div>;
}
