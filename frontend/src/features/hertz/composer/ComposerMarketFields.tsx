'use client';

import styles from '@/components/feed/HertzComposer.module.css';

export type ComposerMarketState = {
  pair: string;
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
    </>
  );
}
