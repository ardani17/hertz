'use client';

import styles from '../toolShellProfitabilityStyles';

type ChartCopy = {
  title: string;
  equity: string;
  distribution: string;
  drawdown: string;
  low: string;
  high: string;
};

type ChartData = {
  equityPath: string;
  drawdownPath: string;
  distribution: { count: number; pct: number }[];
  distributionMin: number;
  distributionMax: number;
};

type ProfitabilityChartsProps = {
  chartData: ChartData;
  copy: ChartCopy;
  distributionDescId: string;
};

export function ProfitabilityCharts({ chartData, copy, distributionDescId }: ProfitabilityChartsProps) {
  return (
    <section className={styles.chartSection} aria-labelledby="simulation-visuals">
      <h2 id="simulation-visuals">{copy.title}</h2>
      <div className={styles.chartGrid}>
        <article className={styles.chartCard}>
          <h3>{copy.equity}</h3>
          <svg className={styles.miniChart} viewBox="0 0 100 36" role="img" aria-label={copy.equity} preserveAspectRatio="none">
            <polyline points={chartData.equityPath} fill="none" stroke="currentColor" strokeWidth="2" vectorEffect="non-scaling-stroke" />
          </svg>
        </article>
        <article className={styles.chartCard} aria-describedby={distributionDescId}>
          <h3>{copy.distribution}</h3>
          <div className={styles.distributionBars} aria-hidden="true">
            {chartData.distribution.map((bucket, index) => (
              <span key={index} style={{ height: `${Math.max(bucket.pct, 4)}%` }} title={`${bucket.count}`} />
            ))}
          </div>
          <div className={styles.chartScale}>
            <span>{copy.low}</span>
            <span>{copy.high}</span>
          </div>
          <p className={styles.chartLegend}>
            {copy.low}: {chartData.distributionMin.toLocaleString()} · {copy.high}: {chartData.distributionMax.toLocaleString()}
          </p>
          <p id={distributionDescId} className={styles.srOnly}>
            Distribusi {chartData.distribution.length} bucket dari {chartData.distributionMin.toLocaleString()} hingga{' '}
            {chartData.distributionMax.toLocaleString()}.
          </p>
        </article>
        <article className={styles.chartCard}>
          <h3>{copy.drawdown}</h3>
          <svg
            className={`${styles.miniChart} ${styles.drawdownChart}`}
            viewBox="0 0 100 36"
            role="img"
            aria-label={copy.drawdown}
            preserveAspectRatio="none"
          >
            <polyline points={chartData.drawdownPath} fill="none" stroke="currentColor" strokeWidth="2" vectorEffect="non-scaling-stroke" />
          </svg>
        </article>
      </div>
    </section>
  );
}
