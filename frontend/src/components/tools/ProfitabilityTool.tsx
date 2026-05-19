'use client';

import { useId, useMemo, useState } from 'react';
import styles from './toolShellProfitabilityStyles';
import { useToolsLanguage } from './useToolsLanguage';
import {
  analyzeSimulation,
  buildInputsFromPreset,
  currencyConfigs,
  formatCurrency,
  formatNumberInput,
  getLocale,
  normalizeInputs,
  parseBalanceInput,
  parseEditableNumber,
  presets,
  runSimulation,
  type CurrencyCode,
  type GoalMode,
  type Inputs,
  type NormalizedInputs,
  type PresetId,
  type SimulationResult,
} from './profitabilityModel';
import { ProfitabilityCharts } from './profitability/ProfitabilityCharts';
import { ProfitabilityInsightPanel } from './profitability/ProfitabilityInsightPanel';
import { ProfitabilityResultsSummary } from './profitability/ProfitabilityResultsSummary';

const toolCopy = {
  id: {
    fields: {
      currency: 'Mata uang akun',
      balance: 'Saldo awal',
      riskPercent: 'Risiko per trade (%)',
      winRate: 'Win rate (%)',
      rewardRisk: 'Rasio reward-risk',
      trades: 'Jumlah trade',
      simulations: 'Simulasi',
      goal: 'Tujuan simulasi',
    },
    currencyOptions: {
      IDR: 'IDR - Rupiah',
      USD_USC: 'USD / USC - Dolar atau akun cent',
    },
    goals: {
      balanced: 'Seimbang',
      growth: 'Pertumbuhan cepat',
      low_drawdown: 'Drawdown rendah',
      prop_firm_safe: 'Aman prop firm',
      strategy_test: 'Uji strategi',
    },
    presetsTitle: 'Preset cepat',
    presets: {
      conservative: 'Konservatif',
      balanced: 'Seimbang',
      aggressive: 'Agresif',
      high_rr: 'High RR',
      scalping: 'Scalping',
      swing: 'Swing',
      prop_firm_safe: 'Prop Firm Safe',
    },
    run: 'Jalankan simulasi',
    previewNote: 'Parameter berubah. Klik «Jalankan simulasi» untuk memperbarui hasil resmi.',
    stickyLabel: 'Ringkasan hasil',
    validation:
      'Beberapa nilai disesuaikan ke batas aman sesuai mata uang akun: saldo, risiko 0.1-25%, win rate 0-100%, trade 1-1000, simulasi 100-5000.',
    insight: {
      title: 'Insight strategi',
      subtitle: 'Ringkasan otomatis dari hasil simulasi terakhir.',
      verdicts: {
        healthy: 'Setup sehat: ekspektasi positif dengan tekanan drawdown masih terkendali.',
        usable_with_control: 'Setup bisa digunakan, tetapi perlu kontrol risiko dan disiplin eksekusi.',
        reduce_risk: 'Setup agresif: turunkan risiko atau perbaiki win rate/RR sebelum dipakai serius.',
        dangerous: 'Setup berbahaya: probabilitas rugi/drawdown terlalu besar untuk dipakai apa adanya.',
      },
      riskLevels: {
        safe: 'Aman',
        moderate: 'Sedang',
        aggressive: 'Agresif',
        danger: 'Bahaya',
      },
      recommendation: 'Rekomendasi risiko',
      expectancy: 'Expectancy per 1R',
      profile: 'Profil',
      warningTitle: 'Peringatan',
      strengthTitle: 'Kekuatan',
      emptyWarnings: 'Tidak ada peringatan besar dari simulasi ini.',
      labels: {
        conservative: 'Konservatif',
        balanced: 'Seimbang',
        aggressive: 'Agresif',
      },
      warnings: {
        negative_expectancy: 'Expectancy negatif: kombinasi win rate dan reward-risk belum cukup mengimbangi kerugian.',
        low_profitability: 'Probabilitas profitable masih rendah pada simulasi ini.',
        severe_drawdown: 'Risiko drawdown ekstrem muncul di cukup banyak skenario.',
        high_drawdown: 'Drawdown cukup tinggi; pertimbangkan risiko lebih kecil.',
        oversized_risk: 'Risiko per trade besar, rawan merusak modal saat losing streak.',
        goal_risk_mismatch: 'Risiko terlalu besar untuk tujuan drawdown rendah / prop firm safe.',
        weak_worst_case: '10% terburuk menunjukkan skenario buruk yang perlu diantisipasi.',
      },
      strengths: {
        positive_expectancy: 'Expectancy strategi positif.',
        strong_profitability: 'Mayoritas skenario berakhir profitable.',
        controlled_drawdown: 'Drawdown rata-rata relatif terkendali.',
      },
    },
    metrics: {
      expected: 'Estimasi saldo',
      median: 'Median',
      best: '10% terbaik',
      worst: '10% terburuk',
      profitable: 'Peluang profit',
      roi: 'Rata-rata ROI',
      drawdown: 'Rata-rata drawdown',
    },
    danger: {
      title: 'Zona bahaya',
      dd10: 'Peluang DD ≥ 10%',
      dd20: 'Peluang DD ≥ 20%',
      dd30: 'Peluang DD ≥ 30%',
      p90: 'Drawdown terburuk P90',
    },
    charts: {
      title: 'Visual simulasi',
      equity: 'Contoh kurva ekuitas',
      distribution: 'Distribusi hasil akhir',
      drawdown: 'Contoh kurva drawdown',
      low: 'Rendah',
      high: 'Tinggi',
    },
    note: (simulations: string, trades: string) =>
      `Hasil terakhir berdasarkan ${simulations} simulasi dan ${trades} trade per simulasi. Fungsi tool ini membantu membaca ekspektasi dan drawdown, bukan prediksi profit.`,
    detailTitle: 'Rincian trade',
    detailDescription:
      'Contoh jalur trade dari simulasi pertama. Tabel ini menjadi dasar sebelum fitur export CSV/PDF ditambahkan.',
    detailCount: (trades: string) => `${trades} trade`,
    table: {
      result: 'Hasil',
      balanceBefore: 'Saldo awal trade',
      risk: 'Risiko',
      pnl: 'P/L',
      balanceAfter: 'Saldo akhir',
      drawdown: 'Drawdown saat ini',
      win: 'Menang',
      loss: 'Rugi',
    },
    grade: 'Grade',
    presetSummary: (risk: number, winRate: number, rewardRisk: number) =>
      `${risk}% risiko · ${winRate}% WR · ${rewardRisk}R`,
  },
  en: {
    fields: {
      currency: 'Account currency',
      balance: 'Starting balance',
      riskPercent: 'Risk per trade (%)',
      winRate: 'Win rate (%)',
      rewardRisk: 'Reward-risk',
      trades: 'Trade count',
      simulations: 'Simulations',
      goal: 'Simulation goal',
    },
    currencyOptions: {
      IDR: 'IDR - Rupiah',
      USD_USC: 'USD / USC - Dollar or cent account',
    },
    goals: {
      balanced: 'Balanced',
      growth: 'Fast growth',
      low_drawdown: 'Low drawdown',
      prop_firm_safe: 'Prop firm safe',
      strategy_test: 'Strategy test',
    },
    presetsTitle: 'Quick presets',
    presets: {
      conservative: 'Conservative',
      balanced: 'Balanced',
      aggressive: 'Aggressive',
      high_rr: 'High RR',
      scalping: 'Scalping',
      swing: 'Swing',
      prop_firm_safe: 'Prop Firm Safe',
    },
    run: 'Run simulation',
    previewNote: 'Inputs changed. Click «Run simulation» to refresh official results.',
    stickyLabel: 'Results summary',
    validation:
      'Some values were adjusted to safe limits for the selected account currency: balance, risk 0.1-25%, win rate 0-100%, trades 1-1000, simulations 100-5000.',
    insight: {
      title: 'Strategy insight',
      subtitle: 'Automatic summary from the latest simulation result.',
      verdicts: {
        healthy: 'Healthy setup: positive expectancy with controlled drawdown pressure.',
        usable_with_control: 'Usable setup, but it needs strict risk control and execution discipline.',
        reduce_risk: 'Aggressive setup: reduce risk or improve win rate/RR before serious use.',
        dangerous: 'Dangerous setup: loss/drawdown probability is too high as-is.',
      },
      riskLevels: {
        safe: 'Safe',
        moderate: 'Moderate',
        aggressive: 'Aggressive',
        danger: 'Danger',
      },
      recommendation: 'Risk recommendation',
      expectancy: 'Expectancy per 1R',
      profile: 'Profile',
      warningTitle: 'Warnings',
      strengthTitle: 'Strengths',
      emptyWarnings: 'No major warnings from this simulation.',
      labels: {
        conservative: 'Conservative',
        balanced: 'Balanced',
        aggressive: 'Aggressive',
      },
      warnings: {
        negative_expectancy: 'Negative expectancy: win rate and reward-risk do not offset losses yet.',
        low_profitability: 'Profitability probability is still low in this simulation.',
        severe_drawdown: 'Extreme drawdown risk appears in many scenarios.',
        high_drawdown: 'Drawdown is elevated; consider smaller risk.',
        oversized_risk: 'Risk per trade is large and vulnerable to losing streaks.',
        goal_risk_mismatch: 'Risk is too large for low-drawdown / prop firm safe goals.',
        weak_worst_case: 'Worst 10% shows a bad scenario that needs planning.',
      },
      strengths: {
        positive_expectancy: 'Strategy expectancy is positive.',
        strong_profitability: 'Most scenarios end profitable.',
        controlled_drawdown: 'Average drawdown is relatively controlled.',
      },
    },
    metrics: {
      expected: 'Expected balance',
      median: 'Median',
      best: 'Best 10%',
      worst: 'Worst 10%',
      profitable: 'Profitable',
      roi: 'Average ROI',
      drawdown: 'Avg drawdown',
    },
    danger: {
      title: 'Danger zone',
      dd10: 'Chance DD ≥ 10%',
      dd20: 'Chance DD ≥ 20%',
      dd30: 'Chance DD ≥ 30%',
      p90: 'Worst drawdown P90',
    },
    charts: {
      title: 'Simulation visuals',
      equity: 'Sample equity curve',
      distribution: 'Final result distribution',
      drawdown: 'Sample drawdown curve',
      low: 'Low',
      high: 'High',
    },
    note: (simulations: string, trades: string) =>
      `Last result uses ${simulations} simulations and ${trades} trades per simulation. This tool helps read expectancy and drawdown, not predict profit.`,
    detailTitle: 'Trade details',
    detailDescription:
      'A sample trade path from the first simulation. This table is the base before CSV/PDF export is added.',
    detailCount: (trades: string) => `${trades} trades`,
    table: {
      result: 'Result',
      balanceBefore: 'Starting trade balance',
      risk: 'Risk',
      pnl: 'P/L',
      balanceAfter: 'Ending balance',
      drawdown: 'Current drawdown',
      win: 'Win',
      loss: 'Loss',
    },
    grade: 'Grade',
    presetSummary: (risk: number, winRate: number, rewardRisk: number) =>
      `${risk}% risk · ${winRate}% WR · ${rewardRisk}R`,
  },
};

const goalModes: GoalMode[] = ['balanced', 'growth', 'low_drawdown', 'prop_firm_safe', 'strategy_test'];

function isCurrencyCode(value: string): value is CurrencyCode {
  return value === 'IDR' || value === 'USD_USC';
}

function buildLinePath(values: number[], width = 100, height = 36) {
  if (values.length < 2) return '';
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  return values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');
}

function buildDistribution(values: number[], buckets = 8) {
  if (!values.length) return [];
  const min = values[0] ?? 0;
  const max = values[values.length - 1] ?? min;
  const range = max - min || 1;
  const counts = Array.from({ length: buckets }, () => 0);

  values.forEach((value) => {
    const index = Math.min(buckets - 1, Math.max(0, Math.floor(((value - min) / range) * buckets)));
    counts[index] += 1;
  });

  const peak = Math.max(...counts, 1);
  return counts.map((count) => ({ count, pct: (count / peak) * 100 }));
}

function getChartData(result: SimulationResult, startingBalance: number) {
  const equityValues = [startingBalance, ...result.tradeDetails.map((trade) => trade.balanceAfter)];
  const drawdownValues = result.tradeDetails.map((trade) => -trade.drawdown);

  const sortedBalances = [...result.finalBalances].sort((a, b) => a - b);
  const distributionMin = sortedBalances[0] ?? startingBalance;
  const distributionMax = sortedBalances.at(-1) ?? startingBalance;

  return {
    equityPath: buildLinePath(equityValues),
    drawdownPath: buildLinePath(drawdownValues.length ? drawdownValues : [0, 0]),
    distribution: buildDistribution(result.finalBalances),
    distributionMin,
    distributionMax,
  };
}

export function ProfitabilityTool() {
  const { language } = useToolsLanguage();
  const copy = toolCopy[language];
  const numberLocale = getLocale(language);
  const [currency, setCurrency] = useState<CurrencyCode>('IDR');
  const [goalMode, setGoalMode] = useState<GoalMode>('balanced');
  const [activePreset, setActivePreset] = useState<PresetId | null>(null);
  const [inputs, setInputs] = useState<Inputs>({
    balance: currencyConfigs.IDR.defaultBalance,
    riskPercent: 2,
    winRate: 35,
    rewardRisk: 2,
    trades: 100,
    simulations: 1000,
  });
  const [hasRun, setHasRun] = useState(false);
  const [lastInputs, setLastInputs] = useState<NormalizedInputs | null>(null);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [validationNote, setValidationNote] = useState<string | null>(null);
  const distributionDescId = useId();

  const analysis = useMemo(
    () => (hasRun && result && lastInputs ? analyzeSimulation(lastInputs, result, goalMode) : null),
    [hasRun, lastInputs, result, goalMode],
  );
  const chartData = useMemo(
    () => (hasRun && result && lastInputs ? getChartData(result, lastInputs.balance) : null),
    [hasRun, lastInputs, result],
  );
  const inputsStale = useMemo(() => {
    if (!hasRun || !lastInputs) return false;
    const current = normalizeInputs(inputs, currency);
    return (Object.keys(current) as (keyof Inputs)[]).some((key) => current[key] !== lastInputs[key]);
  }, [hasRun, inputs, currency, lastInputs]);

  const update = (field: Exclude<keyof Inputs, 'balance'>, value: string) => {
    setActivePreset(null);
    setInputs((prev) => ({
      ...prev,
      [field]: parseEditableNumber(value),
    }));
  };

  const updateBalance = (value: string) => {
    setActivePreset(null);
    setInputs((prev) => ({
      ...prev,
      balance: parseBalanceInput(value, currency),
    }));
  };

  const runWithInputs = (nextInputs: Inputs, nextCurrency = currency, seed = Date.now()) => {
    const normalized = normalizeInputs(nextInputs, nextCurrency);
    const nextResult = runSimulation(normalized, seed, nextCurrency);

    setLastInputs(normalized);
    setResult(nextResult);
    return normalized;
  };

  const handleCurrencyChange = (value: string) => {
    const nextCurrency = isCurrencyCode(value) ? value : 'IDR';
    const nextInputs = {
      ...inputs,
      balance: currencyConfigs[nextCurrency].defaultBalance,
    };

    setCurrency(nextCurrency);
    setInputs(nextInputs);
    setActivePreset(null);
    setValidationNote(null);
  };

  const handlePreset = (presetId: PresetId) => {
    const nextInputs = buildInputsFromPreset(inputs, presetId);
    setInputs(nextInputs);
    setActivePreset(presetId);
    setValidationNote(null);
  };

  const handleRun = () => {
    const normalized = runWithInputs(inputs, currency);
    setHasRun(true);
    const changed = Object.entries(normalized).some(([key, value]) => {
      const current = inputs[key as keyof Inputs];
      return (current === '' ? 0 : current) !== value;
    });

    setInputs(normalized);
    setValidationNote(changed ? copy.validation : null);
  };

  return (
    <section className={styles.panel}>
      <div className={styles.formGridThree}>
        <div className={styles.field}>
          <label htmlFor="currency">{copy.fields.currency}</label>
          <select id="currency" value={currency} onChange={(e) => handleCurrencyChange(e.target.value)}>
            <option value="IDR">{copy.currencyOptions.IDR}</option>
            <option value="USD_USC">{copy.currencyOptions.USD_USC}</option>
          </select>
        </div>
        <div className={styles.field}>
          <label htmlFor="goalMode">{copy.fields.goal}</label>
          <select id="goalMode" value={goalMode} onChange={(e) => setGoalMode(e.target.value as GoalMode)}>
            {goalModes.map((mode) => (
              <option key={mode} value={mode}>
                {copy.goals[mode]}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.field}>
          <label htmlFor="balance">{copy.fields.balance}</label>
          <input
            id="balance"
            inputMode={currency === 'IDR' ? 'numeric' : 'decimal'}
            value={formatNumberInput(inputs.balance, currency, language)}
            onChange={(e) => updateBalance(e.target.value)}
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="riskPercent">{copy.fields.riskPercent}</label>
          <input id="riskPercent" type="number" value={inputs.riskPercent} onChange={(e) => update('riskPercent', e.target.value)} />
        </div>
        <div className={styles.field}>
          <label htmlFor="winRate">{copy.fields.winRate}</label>
          <input id="winRate" type="number" value={inputs.winRate} onChange={(e) => update('winRate', e.target.value)} />
        </div>
        <div className={styles.field}>
          <label htmlFor="rewardRisk">{copy.fields.rewardRisk}</label>
          <input id="rewardRisk" type="number" value={inputs.rewardRisk} onChange={(e) => update('rewardRisk', e.target.value)} />
        </div>
        <div className={styles.field}>
          <label htmlFor="trades">{copy.fields.trades}</label>
          <input id="trades" type="number" value={inputs.trades} onChange={(e) => update('trades', e.target.value)} />
        </div>
        <div className={styles.field}>
          <label htmlFor="simulations">{copy.fields.simulations}</label>
          <input id="simulations" type="number" value={inputs.simulations} onChange={(e) => update('simulations', e.target.value)} />
        </div>
      </div>

      <section className={styles.controlSection} aria-labelledby="profitability-presets">
        <h2 id="profitability-presets">{copy.presetsTitle}</h2>
        <div className={styles.presetGrid}>
          {presets.map((preset) => (
            <button
              className={`${styles.presetButton} ${activePreset === preset.id ? styles.presetActive : ''}`}
              key={preset.id}
              onClick={() => handlePreset(preset.id)}
              type="button"
            >
              <strong>{copy.presets[preset.id]}</strong>
              <span>{copy.presetSummary(preset.riskPercent, preset.winRate, preset.rewardRisk)}</span>
            </button>
          ))}
        </div>
      </section>

      <div className={styles.actions}>
        <button className="btn btn-primary" onClick={handleRun} type="button">
          {copy.run}
        </button>
      </div>

      {validationNote ? <p className={styles.note}>{validationNote}</p> : null}
      {inputsStale ? <p className={styles.previewNote}>{copy.previewNote}</p> : null}

      {hasRun && result && analysis && lastInputs ? (
        <>
          <aside className={styles.stickySummary} aria-label={copy.stickyLabel}>
            <div>
              <span>{copy.metrics.expected}</span>
              <strong>{formatCurrency(result.average, currency, language)}</strong>
            </div>
            <div>
              <span>{copy.grade}</span>
              <strong>{analysis.grade}</strong>
            </div>
            <div>
              <span>{copy.insight.profile}</span>
              <strong>{copy.insight.riskLevels[analysis.riskLevel]}</strong>
            </div>
            <div>
              <span>{copy.metrics.roi}</span>
              <strong>{result.roi.toFixed(1)}%</strong>
            </div>
          </aside>

          <ProfitabilityInsightPanel analysis={analysis} copy={{ ...copy.insight, grade: copy.grade }} />

          <ProfitabilityResultsSummary
            result={result}
            currency={currency}
            language={language}
            metrics={copy.metrics}
            danger={copy.danger}
          />

          {chartData ? (
            <ProfitabilityCharts chartData={chartData} copy={copy.charts} distributionDescId={distributionDescId} />
          ) : null}

          <p className={styles.note}>
            {copy.note(result.simulations.toLocaleString(numberLocale), result.trades.toLocaleString(numberLocale))}
          </p>

          <section className={styles.detailSection}>
            <div className={styles.sectionHeader}>
          <div>
            <h2>{copy.detailTitle}</h2>
            <p>{copy.detailDescription}</p>
          </div>
          <span className={styles.badgeMuted}>{copy.detailCount(result.tradeDetails.length.toLocaleString(numberLocale))}</span>
        </div>

        <div className={`${styles.tableWrap} ${styles.tradeTableWrap}`} data-mobile-cards="true">
          <table className={`${styles.table} ${styles.tradeTable}`}>
            <thead>
              <tr>
                <th>#</th>
                <th>{copy.table.result}</th>
                <th>{copy.table.balanceBefore}</th>
                <th>{copy.table.risk}</th>
                <th>{copy.table.pnl}</th>
                <th>{copy.table.balanceAfter}</th>
                <th>{copy.table.drawdown}</th>
              </tr>
            </thead>
            <tbody>
              {result.tradeDetails.map((trade) => (
                <tr key={trade.trade}>
                  <td>{trade.trade}</td>
                  <td>
                    <span className={trade.outcome === 'Win' ? styles.badge : styles.badgeWarning}>
                      {trade.outcome === 'Win' ? copy.table.win : copy.table.loss}
                    </span>
                  </td>
                  <td>{formatCurrency(trade.balanceBefore, currency, language)}</td>
                  <td>{formatCurrency(trade.riskAmount, currency, language)}</td>
                  <td className={trade.pnl >= 0 ? styles.positiveValue : styles.negativeValue}>
                    {formatCurrency(trade.pnl, currency, language)}
                  </td>
                  <td>{formatCurrency(trade.balanceAfter, currency, language)}</td>
                  <td>{trade.drawdown.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className={styles.mobileDataCards} aria-label={copy.detailTitle}>
          {result.tradeDetails.slice(0, 40).map((trade) => (
            <article className={styles.mobileDataCard} key={trade.trade}>
              <div className={styles.mobileDataCardHeader}>
                <strong>#{trade.trade}</strong>
                <span className={trade.outcome === 'Win' ? styles.badge : styles.badgeWarning}>
                  {trade.outcome === 'Win' ? copy.table.win : copy.table.loss}
                </span>
              </div>
              <dl>
                <div>
                  <dt>{copy.table.balanceBefore}</dt>
                  <dd>{formatCurrency(trade.balanceBefore, currency, language)}</dd>
                </div>
                <div>
                  <dt>{copy.table.risk}</dt>
                  <dd>{formatCurrency(trade.riskAmount, currency, language)}</dd>
                </div>
                <div>
                  <dt>{copy.table.pnl}</dt>
                  <dd className={trade.pnl >= 0 ? styles.positiveValue : styles.negativeValue}>{formatCurrency(trade.pnl, currency, language)}</dd>
                </div>
                <div>
                  <dt>{copy.table.balanceAfter}</dt>
                  <dd>{formatCurrency(trade.balanceAfter, currency, language)}</dd>
                </div>
                <div>
                  <dt>{copy.table.drawdown}</dt>
                  <dd>{trade.drawdown.toFixed(1)}%</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      </section>
        </>
      ) : null}
    </section>
  );
}
