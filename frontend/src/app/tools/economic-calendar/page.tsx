import type { Metadata } from 'next';
import { EconomicCalendarTool } from '@/components/tools/EconomicCalendarTool';
import { ToolNav } from '@/components/tools/ToolNav';
import styles from '@/components/tools/ToolShell.module.css';
import { HertzAppShell } from '@/components/hertz/HertzAppShell';
import { getCurrentMember } from '@/lib/memberAuth';

export const metadata: Metadata = {
  title: 'Economic Calendar',
  description: 'Economic calendar untuk event market-moving.',
};

export default async function EconomicCalendarPage() {
  const currentUser = await getCurrentMember();

  return (
    <HertzAppShell active="tools" title="Tools" description="Kalender event ekonomi untuk membaca risiko berita." currentUser={currentUser}>
      <section className={styles.shell}>
        <ToolNav />
        <section className={styles.header}>
          <p className={styles.eyebrow}>Live Data</p>
          <h1>Economic Calendar</h1>
          <p>Filter event ekonomi berdasarkan periode, impact, dan negara.</p>
        </section>
        <EconomicCalendarTool />
      </section>
    </HertzAppShell>
  );
}
