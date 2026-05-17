import styles from './OutlookSnapshot.module.css';
import type { OutlookSnapshotItem } from '@/lib/outlookContent';

export function OutlookSnapshot({
  items,
  variant = 'chips',
}: {
  items: OutlookSnapshotItem[];
  variant?: 'chips' | 'panel';
}) {
  if (items.length === 0) return null;

  return (
    <dl className={variant === 'panel' ? styles.panel : styles.chips}>
      {items.map((item) => (
        <div key={item.label} className={styles.item}>
          <dt>{item.label}</dt>
          <dd>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
