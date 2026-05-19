'use client';

import type { analyzeSimulation } from '../profitabilityModel';
import styles from '../toolShellProfitabilityStyles';

type InsightCopy = {
  title: string;
  subtitle: string;
  verdicts: Record<string, string>;
  riskLevels: Record<string, string>;
  recommendation: string;
  expectancy: string;
  profile: string;
  warningTitle: string;
  strengthTitle: string;
  emptyWarnings: string;
  labels: Record<string, string>;
  warnings: Record<string, string>;
  strengths: Record<string, string>;
  grade: string;
};

type ProfitabilityInsightPanelProps = {
  analysis: ReturnType<typeof analyzeSimulation>;
  copy: InsightCopy;
};

export function ProfitabilityInsightPanel({ analysis, copy }: ProfitabilityInsightPanelProps) {
  return (
    <section className={`${styles.insightPanel} ${styles[`risk-${analysis.riskLevel}`]}`} aria-labelledby="strategy-insight">
      <div className={styles.insightHeader}>
        <div>
          <p className={styles.eyebrow}>{copy.subtitle}</p>
          <h2 id="strategy-insight">{copy.title}</h2>
        </div>
        <span className={styles.gradeBadge}>
          {copy.grade} {analysis.grade}
        </span>
      </div>
      <p className={styles.insightVerdict}>{copy.verdicts[analysis.verdictId as keyof typeof copy.verdicts]}</p>
      <div className={styles.insightGrid}>
        <div>
          <span>{copy.profile}</span>
          <strong>{copy.riskLevels[analysis.riskLevel]}</strong>
        </div>
        <div>
          <span>{copy.recommendation}</span>
          <strong>{analysis.riskRecommendation.toFixed(2)}%</strong>
          <small>{copy.labels[analysis.recommendedRiskLabel]}</small>
        </div>
        <div>
          <span>{copy.expectancy}</span>
          <strong>{analysis.expectancyPerRisk.toFixed(2)}R</strong>
        </div>
      </div>
      <div className={styles.insightLists}>
        <div>
          <h3>{copy.warningTitle}</h3>
          {analysis.warnings.length ? (
            <ul>
              {analysis.warnings.map((warning) => (
                <li key={warning}>{copy.warnings[warning as keyof typeof copy.warnings]}</li>
              ))}
            </ul>
          ) : (
            <p>{copy.emptyWarnings}</p>
          )}
        </div>
        <div>
          <h3>{copy.strengthTitle}</h3>
          <ul>
            {analysis.strengths.map((strength) => (
              <li key={strength}>{copy.strengths[strength as keyof typeof copy.strengths]}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
