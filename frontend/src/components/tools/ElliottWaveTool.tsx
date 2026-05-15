'use client';

import { useMemo, useState } from 'react';
import styles from './ToolShell.module.css';
import { useToolsLanguage } from './useToolsLanguage';

type Timeframe = 'daily' | 'weekly' | 'monthly';
type SignalSide = 'buy' | 'sell';

type Signal = {
  label: string;
  side: SignalSide;
  level: number;
  target: number;
  stop: number;
  distance: number;
};

const timeframeConfig = {
  daily: { risk: 0.2, target: 2, detection: 0.15, label: 'Daily' },
  weekly: { risk: 0.35, target: 1.8, detection: 0.08, label: 'Weekly' },
  monthly: { risk: 0.5, target: 1.5, detection: 0.05, label: 'Monthly' },
} as const;

const toolCopy = {
  id: {
    fields: {
      timeframe: 'Timeframe',
      high: 'High sebelumnya',
      low: 'Low sebelumnya',
      close: 'Close sebelumnya',
      current: 'Harga sekarang',
    },
    badges: {
      auto: 'Auto-calculated',
      disclaimer: 'Area observasi, bukan rekomendasi finansial',
      tolerance: (value: string) => `Jarak deteksi: ${value}`,
    },
    errors: {
      invalid:
        'Data tidak valid. High harus di atas Low, Close harus berada di dalam range, dan harga sekarang harus angka positif.',
    },
    levels: {
      wave1: 'Wave 1 resistance',
      wave2: 'Wave 2 support',
      wave3: 'Wave 3 resistance',
      wave4: 'Wave 4 support',
      wave5: 'Wave 5 extension',
      waveA: 'Wave A resistance',
      waveB: 'Wave B support',
      waveC: 'Wave C extension',
    },
    signal: {
      buyTitle: 'Area buy',
      sellTitle: 'Area sell',
      emptyBuy: 'Belum ada support wave yang dekat dengan harga sekarang.',
      emptySell: 'Belum ada resistance wave yang dekat dengan harga sekarang.',
      target: 'Target',
      stop: 'Stop',
      distance: 'Jarak',
    },
    note:
      'Fungsi: membuat level observasi Elliott berbasis rasio Fibonacci dari range sebelumnya. Sinyal hanya muncul ketika harga berada dekat dengan level menurut toleransi timeframe.',
  },
  en: {
    fields: {
      timeframe: 'Timeframe',
      high: 'Previous high',
      low: 'Previous low',
      close: 'Previous close',
      current: 'Current price',
    },
    badges: {
      auto: 'Auto-calculated',
      disclaimer: 'Observation area, not financial advice',
      tolerance: (value: string) => `Detection distance: ${value}`,
    },
    errors: {
      invalid:
        'Invalid data. High must be above Low, Close must be inside the range, and current price must be a positive number.',
    },
    levels: {
      wave1: 'Wave 1 resistance',
      wave2: 'Wave 2 support',
      wave3: 'Wave 3 resistance',
      wave4: 'Wave 4 support',
      wave5: 'Wave 5 extension',
      waveA: 'Wave A resistance',
      waveB: 'Wave B support',
      waveC: 'Wave C extension',
    },
    signal: {
      buyTitle: 'Buy areas',
      sellTitle: 'Sell areas',
      emptyBuy: 'No wave support is close to the current price yet.',
      emptySell: 'No wave resistance is close to the current price yet.',
      target: 'Target',
      stop: 'Stop',
      distance: 'Distance',
    },
    note:
      'Function: builds Elliott observation levels from Fibonacci ratios of the previous range. Setups only appear when price is close to a level according to the selected timeframe tolerance.',
  },
} as const;

function parsePrice(value: string) {
  const parsed = Number(value.replace(',', '.'));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function round(value: number) {
  return Math.round(value * 100000) / 100000;
}

function formatPrice(value: number) {
  const rounded = round(value);
  const decimals = Math.abs(rounded) >= 100 ? 2 : 5;

  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(rounded);
}

function isNear(price: number, level: number, detection: number) {
  return Math.abs(price - level) <= detection;
}

export function ElliottWaveTool() {
  const { language } = useToolsLanguage();
  const copy = toolCopy[language];
  const [timeframe, setTimeframe] = useState<Timeframe>('daily');
  const [high, setHigh] = useState('2420');
  const [low, setLow] = useState('2380');
  const [close, setClose] = useState('2405');
  const [current, setCurrent] = useState('2395');

  const result = useMemo(() => {
    const h = parsePrice(high);
    const l = parsePrice(low);
    const c = parsePrice(close);
    const price = parsePrice(current);

    if (!h || !l || !c || !price || h <= l || c > h || c < l) {
      return { error: copy.errors.invalid, levels: null, buy: [], sell: [], detection: 0 };
    }

    const config = timeframeConfig[timeframe];
    const pivot = (h + l + c) / 3;
    const range = h - l;
    const levels = {
      wave1: pivot + range * 0.236,
      wave2: pivot - range * 0.236,
      wave3: pivot + range * 0.618,
      wave4: pivot - range * 0.382,
      wave5: pivot + range,
      waveA: pivot + range * 0.382,
      waveB: pivot - range * 0.618,
      waveC: pivot - range,
    };
    const detection = range * config.detection;
    const risk = range * config.risk;
    const target = risk * config.target;
    const buy: Signal[] = [];
    const sell: Signal[] = [];

    [
      ['wave2', levels.wave2],
      ['wave4', levels.wave4],
      ['waveB', levels.waveB],
    ].forEach(([key, level]) => {
      const numericLevel = Number(level);
      if (isNear(price, numericLevel, detection)) {
        buy.push({
          label: copy.levels[key as keyof typeof copy.levels],
          side: 'buy',
          level: numericLevel,
          target: numericLevel + target,
          stop: numericLevel - risk,
          distance: Math.abs(price - numericLevel),
        });
      }
    });

    [
      ['wave1', levels.wave1],
      ['wave3', levels.wave3],
      ['waveA', levels.waveA],
    ].forEach(([key, level]) => {
      const numericLevel = Number(level);
      if (isNear(price, numericLevel, detection)) {
        sell.push({
          label: copy.levels[key as keyof typeof copy.levels],
          side: 'sell',
          level: numericLevel,
          target: numericLevel - target,
          stop: numericLevel + risk,
          distance: Math.abs(price - numericLevel),
        });
      }
    });

    return { error: null, levels, buy, sell, detection };
  }, [close, copy, current, high, low, timeframe]);

  const renderSignals = (signals: Signal[], emptyText: string) => {
    if (!signals.length) {
      return <p className={styles.note}>{emptyText}</p>;
    }

    return (
      <div className={styles.signalCards}>
        {signals.map((signal) => (
          <article className={styles.signalCard} key={`${signal.side}-${signal.label}-${signal.level}`}>
            <h4>{signal.label}</h4>
            <dl>
              <div>
                <dt>Level</dt>
                <dd>{formatPrice(signal.level)}</dd>
              </div>
              <div>
                <dt>{copy.signal.target}</dt>
                <dd>{formatPrice(signal.target)}</dd>
              </div>
              <div>
                <dt>{copy.signal.stop}</dt>
                <dd>{formatPrice(signal.stop)}</dd>
              </div>
              <div>
                <dt>{copy.signal.distance}</dt>
                <dd>{formatPrice(signal.distance)}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
    );
  };

  return (
    <section className={styles.panel}>
      <div className={styles.formGrid}>
        <div className={styles.field}>
          <label htmlFor="timeframe">{copy.fields.timeframe}</label>
          <select id="timeframe" value={timeframe} onChange={(e) => setTimeframe(e.target.value as Timeframe)}>
            {Object.entries(timeframeConfig).map(([value, config]) => (
              <option key={value} value={value}>
                {config.label}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.field}>
          <label htmlFor="high">{copy.fields.high}</label>
          <input id="high" inputMode="decimal" value={high} onChange={(e) => setHigh(e.target.value)} />
        </div>
        <div className={styles.field}>
          <label htmlFor="low">{copy.fields.low}</label>
          <input id="low" inputMode="decimal" value={low} onChange={(e) => setLow(e.target.value)} />
        </div>
        <div className={styles.field}>
          <label htmlFor="close">{copy.fields.close}</label>
          <input id="close" inputMode="decimal" value={close} onChange={(e) => setClose(e.target.value)} />
        </div>
        <div className={styles.field}>
          <label htmlFor="current">{copy.fields.current}</label>
          <input id="current" inputMode="decimal" value={current} onChange={(e) => setCurrent(e.target.value)} />
        </div>
      </div>

      {result.error ? <div className={styles.error}>{result.error}</div> : null}

      {result.levels ? (
        <>
          <div className={styles.statusLine}>
            <span className={styles.badge}>{copy.badges.auto}</span>
            <span className={styles.badgeMuted}>{copy.badges.disclaimer}</span>
            <span className={styles.badgeMuted}>{copy.badges.tolerance(formatPrice(result.detection))}</span>
          </div>
          <div className={styles.resultGrid}>
            {Object.entries(result.levels).map(([key, value]) => (
              <div
                className={`${styles.metric} ${['wave2', 'wave3', 'wave4'].includes(key) ? styles.metricPrimary : ''}`}
                key={key}
              >
                <span>{copy.levels[key as keyof typeof copy.levels]}</span>
                <strong>{formatPrice(value)}</strong>
              </div>
            ))}
          </div>
          <div className={styles.signalList}>
            <div className={styles.signal}>
              <h3>{copy.signal.buyTitle}</h3>
              {renderSignals(result.buy, copy.signal.emptyBuy)}
            </div>
            <div className={styles.signal}>
              <h3>{copy.signal.sellTitle}</h3>
              {renderSignals(result.sell, copy.signal.emptySell)}
            </div>
          </div>
        </>
      ) : null}

      <p className={styles.note}>{copy.note}</p>
    </section>
  );
}
