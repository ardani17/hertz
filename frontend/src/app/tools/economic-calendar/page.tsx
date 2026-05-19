import type { Metadata } from 'next';
import { EconomicCalendarTool } from '@/components/tools/EconomicCalendarTool';
import { ToolNav } from '@/components/tools/ToolNav';
import styles from '@/components/tools/ToolShell.module.css';

export const metadata: Metadata = {
  title: 'Economic Calendar',
  description: 'Economic calendar untuk event market-moving.',
};

export default function EconomicCalendarPage() {
  return (
    <section className={styles.shell}>
      <ToolNav />
      <section className={styles.header}>
        <p className={styles.eyebrow}>Live Data</p>
        <h1>Economic Calendar</h1>
        <p>Filter event ekonomi berdasarkan periode, impact, dan negara.</p>
      </section>
      <EconomicCalendarTool />
    </section>
  );
}
