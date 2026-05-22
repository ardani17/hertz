import { Coins, FileText, Image, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import styles from './StatsCards.module.css';

export interface StatsSummary {
  totalMembers: number;
  totalArticles: number;
  totalMedia: number;
  totalCredits: number;
}

interface StatsCardsProps {
  summary: StatsSummary;
}

const cards: {
  key: keyof StatsSummary;
  label: string;
  Icon: LucideIcon;
}[] = [
  { key: 'totalMembers', label: 'Total Members', Icon: Users },
  { key: 'totalArticles', label: 'Total Articles', Icon: FileText },
  { key: 'totalMedia', label: 'Total Media', Icon: Image },
  { key: 'totalCredits', label: 'Circulating Credits', Icon: Coins },
];

export function StatsCards({ summary }: StatsCardsProps) {
  return (
    <div className={styles.grid}>
      {cards.map((card) => (
        <div key={card.key} className={styles.card}>
          <div className={styles.cardIcon} aria-hidden="true">
            <card.Icon size={20} />
          </div>
          <div className={styles.cardBody}>
            <span className={styles.cardValue}>
              {summary[card.key].toLocaleString()}
            </span>
            <span className={styles.cardLabel}>{card.label}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
