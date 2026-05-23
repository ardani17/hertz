'use client';

import type { MemberSessionUser } from '@shared/types';
import { ToolsHub } from './ToolsHub';
import { PivotPointToolPage } from './PivotPointToolPage';
import { ProfitabilityToolPage } from './ProfitabilityToolPage';
import { ChallengeTrackerToolPage } from './ChallengeTrackerToolPage';
import { ElliottWaveToolPage } from './ElliottWaveToolPage';
import { useToolsSpa } from './ToolsSpaContext';
import styles from './ToolShell.module.css';

export function ToolsRouteContent({ currentUser }: { currentUser: MemberSessionUser | null }) {
  const { activeTool } = useToolsSpa();

  if (!activeTool) {
    return <ToolsHub />;
  }

  switch (activeTool) {
    case 'pivot-point':
      return <PivotPointToolPage />;
    case 'profitability':
      return <ProfitabilityToolPage />;
    case 'challenge-tracker':
      return <ChallengeTrackerToolPage isAuthenticated={Boolean(currentUser)} />;
    case 'elliott-wave':
      return <ElliottWaveToolPage />;
    default:
      return (
        <section className={styles.shell}>
          <p className={styles.muted}>Tool tidak ditemukan.</p>
        </section>
      );
  }
}
