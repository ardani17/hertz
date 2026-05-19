'use client';

import styles from '@/components/feed/HertzComposer.module.css';

export type ComposerMarketState = {
  pair: string;
  timeframe: string;
  direction: string;
  riskPercent: string;
  entryPrice: string;
  stopLoss: string;
  takeProfit: string;
  confidencePercent: string;
};

type ComposerMarketFieldsProps = {
  market: ComposerMarketState;
  disabled?: boolean;
  onChange: (field: keyof ComposerMarketState, value: string) => void;
};

export function ComposerMarketFields({ market, disabled, onChange }: ComposerMarketFieldsProps) {
  return (
    <>
      <label className={styles.inlineField}>
        <span>Pair</span>
        <input
          value={market.pair}
          onChange={(event) => onChange('pair', event.target.value)}
          placeholder="XAUUSD"
          disabled={disabled}
        />
      </label>
      <label className={styles.inlineField}>
        <span>TF</span>
        <input
          value={market.timeframe}
          onChange={(event) => onChange('timeframe', event.target.value)}
          placeholder="H4"
          disabled={disabled}
        />
      </label>
      <label className={styles.inlineField}>
        <span>Arah</span>
        <input
          value={market.direction}
          onChange={(event) => onChange('direction', event.target.value)}
          placeholder="Buy"
          disabled={disabled}
        />
      </label>
      <label className={styles.inlineField}>
        <span>Risk</span>
        <input
          value={market.riskPercent}
          onChange={(event) => onChange('riskPercent', event.target.value)}
          placeholder="2"
          inputMode="decimal"
          disabled={disabled}
        />
      </label>
      <label className={styles.inlineField}>
        <span>Entry</span>
        <input
          value={market.entryPrice}
          onChange={(event) => onChange('entryPrice', event.target.value)}
          placeholder="0.00"
          inputMode="decimal"
          disabled={disabled}
        />
      </label>
      <label className={styles.inlineField}>
        <span>SL</span>
        <input
          value={market.stopLoss}
          onChange={(event) => onChange('stopLoss', event.target.value)}
          placeholder="0.00"
          inputMode="decimal"
          disabled={disabled}
        />
      </label>
      <label className={styles.inlineField}>
        <span>TP</span>
        <input
          value={market.takeProfit}
          onChange={(event) => onChange('takeProfit', event.target.value)}
          placeholder="0.00"
          inputMode="decimal"
          disabled={disabled}
        />
      </label>
      <label className={styles.inlineField}>
        <span>Conf</span>
        <input
          value={market.confidencePercent}
          onChange={(event) => onChange('confidencePercent', event.target.value)}
          placeholder="70"
          inputMode="decimal"
          disabled={disabled}
        />
      </label>
    </>
  );
}
