'use client';

import type { CSSProperties } from 'react';
import { Activity, BarChart3, Bitcoin, Clock3, Globe2, TrendingDown, TrendingUp } from 'lucide-react';
import clsx from 'clsx';
import { type MarketSidebarCardData } from './MarketSidebarWidget';
import { Sparkline } from './Sparkline';
import styles from './MarketSidebarWidget.module.css';

const MAIN_CHART_HEIGHT = 68;

function formatUpdatedAt(value?: string) {
  if (!value) return 'Real-time';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Real-time';
  return new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Jakarta',
  }).format(date);
}

function MarketIcon({ accent }: { accent: MarketSidebarCardData['accent'] }) {
  if (accent === 'crypto') return <Bitcoin aria-hidden="true" />;
  if (accent === 'stock') return <BarChart3 aria-hidden="true" />;
  return <Activity aria-hidden="true" />;
}

export function MarketCard({ card }: { card: MarketSidebarCardData }) {
  const isDown = card.mainAsset.tone === 'down';
  const changeLabel = `${card.mainAsset.symbol} ${isDown ? 'turun' : 'naik'} ${card.mainAsset.change}`;
  const cssVars = {
    '--market-color': card.color,
    '--market-rgb': card.rgb,
  } as CSSProperties;

  return (
    <section
      className={clsx(styles.card, styles[card.accent])}
      style={cssVars}
      aria-label={`${card.title} market widget`}
    >
      <header className={styles.header}>
        <div className={styles.badge}>
          <span className={styles.iconShell}><MarketIcon accent={card.accent} /></span>
          <span>{card.title}</span>
        </div>
        <span className={styles.live}><span aria-hidden="true" />Live</span>
      </header>

      <div className={styles.mainAsset}>
        <div className={styles.assetTitle}>
          <strong>{card.mainAsset.symbol}</strong>
          <span>{card.mainAsset.description}</span>
        </div>
        <div className={styles.priceStack}>
          <strong>{card.mainAsset.price}</strong>
          <em className={isDown ? styles.negative : styles.positive} aria-label={changeLabel}>
            {isDown ? <TrendingDown aria-hidden="true" /> : <TrendingUp aria-hidden="true" />}
            {card.mainAsset.change}
          </em>
        </div>
      </div>

      <div className={styles.mainChart} aria-hidden="true">
        <Sparkline
          points={card.mainAsset.sparkline}
          color={card.color}
          gradientId={`${card.accent}-main-gradient`}
          height={MAIN_CHART_HEIGHT}
        />
      </div>

      <div className={styles.rows}>
        {card.secondaryAssets.map((asset) => (
          <div className={styles.row} key={asset.symbol}>
            <strong>{asset.symbol}</strong>
            <span className={styles.rowChart} aria-hidden="true">
              <Sparkline
                points={asset.sparkline}
                color={card.color}
                gradientId={`${card.accent}-${asset.symbol.replace(/[^a-z0-9]/gi, '')}-gradient`}
                height={24}
                showFill={false}
              />
            </span>
            <span className={styles.rowPrice}>{asset.price}</span>
            <em className={asset.tone === 'down' ? styles.negativeText : styles.positiveText}>{asset.change}</em>
          </div>
        ))}
      </div>

      <footer className={styles.footer}>
        <span><Globe2 aria-hidden="true" />{card.source}</span>
        <span><Clock3 aria-hidden="true" />Update {formatUpdatedAt(card.updatedAt)} WIB</span>
      </footer>
    </section>
  );
}
