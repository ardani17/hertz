import type { Metadata } from 'next';
import { PivotPointTool } from '@/components/tools/PivotPointTool';
import { ToolNav } from '@/components/tools/ToolNav';
import styles from '@/components/tools/ToolShell.module.css';
import { HertzAppShell } from '@/components/hertz/HertzAppShell';
import { getCurrentMember } from '@/lib/memberAuth';

export const metadata: Metadata = {
  title: 'Pivot Point Calculator',
  description: 'Hitung pivot point, support, dan resistance dari data OHLC.',
};

export default async function PivotPointPage() {
  const currentUser = await getCurrentMember();

  return (
    <HertzAppShell active="tools" title="Tools" description="Kalkulator pivot, support, dan resistance." currentUser={currentUser}>
      <section className={styles.shell}>
        <ToolNav />
        <section className={styles.header}>
          <p className={styles.eyebrow}>Calculator</p>
          <h1>Pivot Point Calculator</h1>
          <p>Masukkan data OHLC periode sebelumnya untuk menghitung pivot, support, dan resistance.</p>
        </section>
        <PivotPointTool />
      </section>
    </HertzAppShell>
  );
}
