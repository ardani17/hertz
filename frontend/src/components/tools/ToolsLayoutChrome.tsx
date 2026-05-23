'use client';

import { useEffect, type ReactNode } from 'react';
import type { MemberSessionUser } from '@shared/types';
import { HertzLayout } from '@/components/layout/HertzLayout';
import { SectionShell } from '@/components/spa/SectionShell';
import { ToolNav } from './ToolNav';
import { ToolsRouteContent } from './ToolsRouteContent';
import { ToolsSpaProvider } from './ToolsSpaContext';
import styles from './ToolShell.module.css';

function ToolsLayoutFrame({
  currentUser,
  children,
}: {
  currentUser: MemberSessionUser | null;
  children: ReactNode;
}) {
  useEffect(() => {
    void Promise.all([
      import('./PivotPointToolPage'),
      import('./ProfitabilityToolPage'),
      import('./ChallengeTrackerToolPage'),
      import('./ElliottWaveToolPage'),
    ]);
  }, []);

  return (
    <HertzLayout
      variant="page"
      active="tools"
      title="Tools"
      description="Trading research utilities untuk membaca market dengan cepat."
      currentUser={currentUser}
      hidePageHeader
    >
      <SectionShell section="tools">
        <ToolNav />
        <div className={styles.toolSpaPane}>
          <ToolsRouteContent currentUser={currentUser} />
        </div>
      </SectionShell>
      {children}
    </HertzLayout>
  );
}

export function ToolsLayoutChrome({
  currentUser,
  children,
}: {
  currentUser: MemberSessionUser | null;
  children: ReactNode;
}) {
  return (
    <ToolsSpaProvider>
      <ToolsLayoutFrame currentUser={currentUser}>{children}</ToolsLayoutFrame>
    </ToolsSpaProvider>
  );
}
