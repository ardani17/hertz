import type { Metadata } from 'next';
import { PivotPointTool } from '@/components/tools/PivotPointTool';
import { ToolNav } from '@/components/tools/ToolNav';
import styles from '@/components/tools/ToolShell.module.css';

export const metadata: Metadata = {
  title: 'Pivot Point Calculator',
  description: 'Hitung pivot point, support, dan resistance dari data OHLC.',
};

export default function PivotPointPage() {
  return (
    <section className={styles.shell}>
      <ToolNav />
      <section className={styles.header}>
        <p className={styles.eyebrow}>Calculator</p>
        <h1>Pivot Point Calculator</h1>
        <p>Masukkan data OHLC periode sebelumnya untuk menghitung pivot, support, dan resistance.</p>
      </section>
      <PivotPointTool />
    </section>
  );
}
