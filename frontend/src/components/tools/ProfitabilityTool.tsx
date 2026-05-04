'use client';

import { useState } from 'react';
import styles from './ToolShell.module.css';
import { useToolsLanguage } from './useToolsLanguage';

type Inputs = {
  balance: number;
  riskPercent: number;
  winRate: number;
  rewardRisk: number;
  trades: number;
  simulations: number;
};

type TradeDetail = {
  trade: number;
  outcome: 'Win' | 'Loss';
  balanceBefore: number;
  riskAmount: number;
  pnl: number;
  balanceAfter: number;
  drawdown: number;
};

type SimulationResult = {
  average: number;
  best: number;
  worst: number;
  median: number;
  profitablePct: number;
  avgDrawdown: number;
  roi: number;
  simulations: number;
  trades: number;
  tradeDetails: TradeDetail[];
};

const toolCopy = {
  id: {
    fields: {
      balance: 'Balance awal',
      riskPercent: 'Risk per trade (%)',
      winRate: 'Win rate (%)',
      rewardRisk: 'Reward risk',
      trades: 'Jumlah trade',
      simulations: 'Simulasi',
    },
    run: 'Jalankan simulasi',
    validation:
      'Beberapa nilai disesuaikan ke batas aman: risk 0.1-25%, win rate 0-100%, trade 1-1000, simulasi 100-5000.',
    metrics: {
      expected: 'Expected balance',
      median: 'Median',
      best: 'Best 10%',
      worst: 'Worst 10%',
      profitable: 'Profitable',
      roi: 'Average ROI',
      drawdown: 'Avg drawdown',
    },
    note: (simulations: string, trades: string) =>
      `Hasil terakhir berdasarkan ${simulations} simulasi dan ${trades} trade per simulasi. Fungsi tool ini membantu membaca ekspektasi dan drawdown, bukan prediksi profit.`,
    detailTitle: 'Rincian trade',
    detailDescription:
      'Contoh jalur trade dari simulasi pertama. Tabel ini menjadi dasar sebelum fitur export CSV/PDF ditambahkan.',
    detailCount: (trades: string) => `${trades} trade`,
    table: {
      result: 'Result',
      balanceBefore: 'Balance awal trade',
      risk: 'Risk',
      pnl: 'P/L',
      balanceAfter: 'Balance akhir',
      drawdown: 'Drawdown',
      win: 'Menang',
      loss: 'Rugi',
    },
  },
  en: {
    fields: {
      balance: 'Starting balance',
      riskPercent: 'Risk per trade (%)',
      winRate: 'Win rate (%)',
      rewardRisk: 'Reward-risk',
      trades: 'Trade count',
      simulations: 'Simulations',
    },
    run: 'Run simulation',
    validation:
      'Some values were adjusted to safe limits: risk 0.1-25%, win rate 0-100%, trades 1-1000, simulations 100-5000.',
    metrics: {
      expected: 'Expected balance',
      median: 'Median',
      best: 'Best 10%',
      worst: 'Worst 10%',
      profitable: 'Profitable',
      roi: 'Average ROI',
      drawdown: 'Avg drawdown',
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
      drawdown: 'Drawdown',
      win: 'Win',
      loss: 'Loss',
    },
  },
};

function percentile(values: number[], pct: number) {
  const index = Math.min(values.length - 1, Math.max(0, Math.floor(values.length * pct)));
  return values[index] ?? 0;
}

function parseFormattedNumber(value: string) {
  const normalized = value.replace(/\./g, '').replace(',', '.').replace(/[^\d.]/g, '');
  return Number(normalized) || 0;
}

function formatNumberInput(value: number) {
  if (!value) return '';
  return new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: 0,
  }).format(value);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value);
}

function createSeededRandom(seed: number) {
  let state = seed >>> 0;

  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function normalizeInputs(inputs: Inputs) {
  return {
    balance: Math.min(Math.max(inputs.balance, 100000), 100000000000),
    riskPercent: Math.min(Math.max(inputs.riskPercent, 0.1), 25),
    winRate: Math.min(Math.max(inputs.winRate, 0), 100),
    rewardRisk: Math.min(Math.max(inputs.rewardRisk, 0.1), 20),
    trades: Math.min(Math.max(Math.round(inputs.trades), 1), 1000),
    simulations: Math.min(Math.max(Math.round(inputs.simulations), 100), 5000),
  };
}

function runSimulation(inputs: Inputs, seed = 1729): SimulationResult {
  const normalized = normalizeInputs(inputs);
  const outcomes: number[] = [];
  const drawdowns: number[] = [];
  const tradeDetails: TradeDetail[] = [];
  const random = createSeededRandom(seed);

  for (let sim = 0; sim < normalized.simulations; sim++) {
    let balance = normalized.balance;
    let peak = balance;
    let maxDrawdown = 0;

    for (let trade = 0; trade < normalized.trades; trade++) {
      const balanceBefore = balance;
      const risk = balance * (normalized.riskPercent / 100);
      const win = random() < normalized.winRate / 100;
      const pnl = win ? risk * normalized.rewardRisk : -risk;
      balance += pnl;
      peak = Math.max(peak, balance);
      maxDrawdown = Math.max(maxDrawdown, ((peak - balance) / peak) * 100);

      if (sim === 0) {
        tradeDetails.push({
          trade: trade + 1,
          outcome: win ? 'Win' : 'Loss',
          balanceBefore,
          riskAmount: risk,
          pnl,
          balanceAfter: balance,
          drawdown: maxDrawdown,
        });
      }
    }

    outcomes.push(balance);
    drawdowns.push(maxDrawdown);
  }

  outcomes.sort((a, b) => a - b);
  const average = outcomes.reduce((sum, value) => sum + value, 0) / outcomes.length;
  const profitable = outcomes.filter((value) => value > normalized.balance).length;
  const avgDrawdown = drawdowns.reduce((sum, value) => sum + value, 0) / drawdowns.length;

  return {
    average,
    best: percentile(outcomes, 0.9),
    worst: percentile(outcomes, 0.1),
    median: percentile(outcomes, 0.5),
    profitablePct: (profitable / outcomes.length) * 100,
    avgDrawdown,
    roi: ((average - normalized.balance) / normalized.balance) * 100,
    simulations: normalized.simulations,
    trades: normalized.trades,
    tradeDetails,
  };
}

export function ProfitabilityTool() {
  const { language } = useToolsLanguage();
  const copy = toolCopy[language];
  const [inputs, setInputs] = useState<Inputs>({
    balance: 10000000,
    riskPercent: 2,
    winRate: 35,
    rewardRisk: 2,
    trades: 100,
    simulations: 1000,
  });
  const [result, setResult] = useState<SimulationResult>(() => runSimulation(inputs));
  const [validationNote, setValidationNote] = useState<string | null>(null);

  const update = (field: keyof Inputs, value: string) => {
    setInputs((prev) => ({
      ...prev,
      [field]: Number(value) || 0,
    }));
  };

  const updateBalance = (value: string) => {
    setInputs((prev) => ({
      ...prev,
      balance: parseFormattedNumber(value),
    }));
  };

  const handleRun = () => {
    const normalized = normalizeInputs(inputs);
    const changed = Object.entries(normalized).some(([key, value]) => inputs[key as keyof Inputs] !== value);
    setInputs(normalized);
    setValidationNote(changed ? copy.validation : null);
    setResult(runSimulation(normalized, Date.now()));
  };

  return (
    <section className={styles.panel}>
      <div className={styles.formGridThree}>
        <div className={styles.field}>
          <label htmlFor="balance">{copy.fields.balance}</label>
          <input
            id="balance"
            inputMode="numeric"
            value={formatNumberInput(inputs.balance)}
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

      <div className={styles.actions}>
        <button className="btn btn-primary" onClick={handleRun} type="button">
          {copy.run}
        </button>
      </div>

      {validationNote ? <p className={styles.note}>{validationNote}</p> : null}

      <div className={styles.resultGrid}>
        <div className={`${styles.metric} ${styles.metricPrimary}`}>
          <span>{copy.metrics.expected}</span>
          <strong>{formatCurrency(result.average)}</strong>
        </div>
        <div className={styles.metric}>
          <span>{copy.metrics.median}</span>
          <strong>{formatCurrency(result.median)}</strong>
        </div>
        <div className={styles.metric}>
          <span>{copy.metrics.best}</span>
          <strong>{formatCurrency(result.best)}</strong>
        </div>
        <div className={styles.metric}>
          <span>{copy.metrics.worst}</span>
          <strong>{formatCurrency(result.worst)}</strong>
        </div>
        <div className={styles.metric}>
          <span>{copy.metrics.profitable}</span>
          <strong>{result.profitablePct.toFixed(1)}%</strong>
        </div>
        <div className={`${styles.metric} ${styles.metricPrimary}`}>
          <span>{copy.metrics.roi}</span>
          <strong>{result.roi.toFixed(1)}%</strong>
        </div>
        <div className={`${styles.metric} ${styles.metricPrimary}`}>
          <span>{copy.metrics.drawdown}</span>
          <strong>{result.avgDrawdown.toFixed(1)}%</strong>
        </div>
      </div>

      <p className={styles.note}>
        {copy.note(result.simulations.toLocaleString('id-ID'), result.trades.toLocaleString('id-ID'))}
      </p>

      <section className={styles.detailSection}>
        <div className={styles.sectionHeader}>
          <div>
            <h2>{copy.detailTitle}</h2>
            <p>{copy.detailDescription}</p>
          </div>
          <span className={styles.badgeMuted}>
            {copy.detailCount(result.tradeDetails.length.toLocaleString('id-ID'))}
          </span>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
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
                  <td>{formatCurrency(trade.balanceBefore)}</td>
                  <td>{formatCurrency(trade.riskAmount)}</td>
                  <td className={trade.pnl >= 0 ? styles.positiveValue : styles.negativeValue}>
                    {formatCurrency(trade.pnl)}
                  </td>
                  <td>{formatCurrency(trade.balanceAfter)}</td>
                  <td>{trade.drawdown.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}
