'use client';

import {
  formatCurrency,
  type CurrencyCode,
  type SimulationResult,
} from '../profitabilityModel';
import styles from '../toolShellProfitabilityStyles';

type ProfitabilityResultsSummaryProps = {
  result: SimulationResult;
  currency: CurrencyCode;
  language: 'id' | 'en';
  metrics: {
    expected: string;
    median: string;
    best: string;
    worst: string;
    profitable: string;
    roi: string;
    drawdown: string;
  };
  danger: {
    title: string;
    dd10: string;
    dd20: string;
    dd30: string;
    p90: string;
  };
};

export function ProfitabilityResultsSummary({
  result,
  currency,
  language,
  metrics,
  danger,
}: ProfitabilityResultsSummaryProps) {
  return (
    <>
      <div className={styles.resultGrid}>
        <div className={`${styles.metric} ${styles.metricPrimary}`}>
          <span>{metrics.expected}</span>
          <strong>{formatCurrency(result.average, currency, language)}</strong>
        </div>
        <div className={styles.metric}>
          <span>{metrics.median}</span>
          <strong>{formatCurrency(result.median, currency, language)}</strong>
        </div>
        <div className={styles.metric}>
          <span>{metrics.best}</span>
          <strong>{formatCurrency(result.best, currency, language)}</strong>
        </div>
        <div className={styles.metric}>
          <span>{metrics.worst}</span>
          <strong>{formatCurrency(result.worst, currency, language)}</strong>
        </div>
        <div className={styles.metric}>
          <span>{metrics.profitable}</span>
          <strong>{result.profitablePct.toFixed(1)}%</strong>
        </div>
        <div className={`${styles.metric} ${styles.metricPrimary}`}>
          <span>{metrics.roi}</span>
          <strong>{result.roi.toFixed(1)}%</strong>
        </div>
        <div className={`${styles.metric} ${styles.metricPrimary}`}>
          <span>{metrics.drawdown}</span>
          <strong>{result.avgDrawdown.toFixed(1)}%</strong>
        </div>
      </div>

      <section className={styles.dangerSection} aria-labelledby="danger-zone">
        <h2 id="danger-zone">{danger.title}</h2>
        <div className={styles.dangerGrid}>
          <div className={styles.metric}>
            <span>{danger.dd10}</span>
            <strong>{result.drawdownBreach10Pct.toFixed(1)}%</strong>
          </div>
          <div className={styles.metric}>
            <span>{danger.dd20}</span>
            <strong>{result.drawdownBreach20Pct.toFixed(1)}%</strong>
          </div>
          <div className={styles.metric}>
            <span>{danger.dd30}</span>
            <strong>{result.drawdownBreach30Pct.toFixed(1)}%</strong>
          </div>
          <div className={styles.metric}>
            <span>{danger.p90}</span>
            <strong>{result.maxDrawdownP90.toFixed(1)}%</strong>
          </div>
        </div>
      </section>
    </>
  );
}
