'use client';

import { useState } from 'react';
import styles from './ToolShell.module.css';
import { useToolsLanguage } from './useToolsLanguage';

type Inputs = {
  balance: number;
  riskPercent: number | '';
  winRate: number | '';
  rewardRisk: number | '';
  trades: number | '';
  simulations: number | '';
};

type NormalizedInputs = {
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

type CurrencyCode = 'IDR' | 'USD_USC';

type LanguageCode = 'id' | 'en';

const toolCopy = {
  id: {
    fields: {
      currency: 'Mata uang akun',
      balance: 'Balance awal',
      riskPercent: 'Risk per trade (%)',
      winRate: 'Win rate (%)',
      rewardRisk: 'Reward risk',
      trades: 'Jumlah trade',
      simulations: 'Simulasi',
    },
    currencyOptions: {
      IDR: 'IDR - Rupiah',
      USD_USC: 'USD / USC - Dollar atau akun cent',
    },
    run: 'Jalankan simulasi',
    validation:
      'Beberapa nilai disesuaikan ke batas aman sesuai mata uang akun: balance, risk 0.1-25%, win rate 0-100%, trade 1-1000, simulasi 100-5000.',
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
      drawdown: 'Drawdown saat ini',
      win: 'Menang',
      loss: 'Rugi',
    },
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
    },
    currencyOptions: {
      IDR: 'IDR - Rupiah',
      USD_USC: 'USD / USC - Dollar or cent account',
    },
    run: 'Run simulation',
    validation:
      'Some values were adjusted to safe limits for the selected account currency: balance, risk 0.1-25%, win rate 0-100%, trades 1-1000, simulations 100-5000.',
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
      drawdown: 'Current drawdown',
      win: 'Win',
      loss: 'Loss',
    },
  },
};

const currencyConfigs: Record<
  CurrencyCode,
  {
    defaultBalance: number;
    minBalance: number;
    maxBalance: number;
    inputFractionDigits: number;
    outputFractionDigits: number;
  }
> = {
  IDR: {
    defaultBalance: 10000000,
    minBalance: 100000,
    maxBalance: 100000000000,
    inputFractionDigits: 0,
    outputFractionDigits: 0,
  },
  USD_USC: {
    defaultBalance: 1000,
    minBalance: 1,
    maxBalance: 100000000,
    inputFractionDigits: 2,
    outputFractionDigits: 2,
  },
};

function percentile(values: number[], pct: number) {
  const index = Math.min(values.length - 1, Math.max(0, Math.floor(values.length * pct)));
  return values[index] ?? 0;
}

function getLocale(language: LanguageCode) {
  return language === 'id' ? 'id-ID' : 'en-US';
}

function isCurrencyCode(value: string): value is CurrencyCode {
  return value === 'IDR' || value === 'USD_USC';
}

function parseIdrInput(value: string) {
  const normalized = value.replace(/\./g, '').replace(',', '.').replace(/[^\d.]/g, '');
  return Math.round(Number(normalized) || 0);
}

function parseSingleSeparatorDecimal(cleaned: string, separator: '.' | ',') {
  const parts = cleaned.split(separator);

  if (parts.length === 1) {
    return Number(cleaned.replace(/[^\d]/g, '')) || 0;
  }

  const lastPart = parts[parts.length - 1] ?? '';
  const thousandsLike =
    lastPart.length === 3 &&
    parts.slice(0, -1).every((part, index) => (index === 0 ? part.length >= 1 && part.length <= 3 : part.length === 3));

  if (thousandsLike) {
    return Number(parts.join('').replace(/[^\d]/g, '')) || 0;
  }

  const integer = parts.slice(0, -1).join('').replace(/[^\d]/g, '');
  const decimal = lastPart.replace(/[^\d]/g, '');
  return Number(`${integer || '0'}.${decimal}`) || 0;
}

function parseDecimalCurrencyInput(value: string) {
  const cleaned = value.replace(/[^\d.,]/g, '');

  if (!cleaned) return 0;

  const lastComma = cleaned.lastIndexOf(',');
  const lastDot = cleaned.lastIndexOf('.');

  if (lastComma >= 0 && lastDot >= 0) {
    const decimalSeparator = lastComma > lastDot ? ',' : '.';
    const thousandsSeparator = decimalSeparator === ',' ? '.' : ',';
    const decimalIndex = cleaned.lastIndexOf(decimalSeparator);
    const integer = cleaned.slice(0, decimalIndex).split(thousandsSeparator).join('').replace(/[^\d]/g, '');
    const decimal = cleaned.slice(decimalIndex + 1).replace(/[^\d]/g, '');

    return Number(`${integer || '0'}.${decimal}`) || 0;
  }

  if (lastComma >= 0) return parseSingleSeparatorDecimal(cleaned, ',');
  if (lastDot >= 0) return parseSingleSeparatorDecimal(cleaned, '.');

  return Number(cleaned.replace(/[^\d]/g, '')) || 0;
}

function parseBalanceInput(value: string, currency: CurrencyCode) {
  if (currency === 'IDR') return parseIdrInput(value);
  return parseDecimalCurrencyInput(value);
}

function formatNumberInput(value: number, currency: CurrencyCode, language: LanguageCode) {
  if (!value) return '';
  const config = currencyConfigs[currency];

  return new Intl.NumberFormat(getLocale(language), {
    maximumFractionDigits: config.inputFractionDigits,
    minimumFractionDigits: 0,
  }).format(value);
}

function formatCurrency(value: number, currency: CurrencyCode, language: LanguageCode) {
  const config = currencyConfigs[currency];
  const locale = getLocale(language);

  if (currency === 'USD_USC') {
    return `USD/USC ${new Intl.NumberFormat(locale, {
      minimumFractionDigits: config.outputFractionDigits,
      maximumFractionDigits: config.outputFractionDigits,
    }).format(value)}`;
  }

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: config.outputFractionDigits,
    maximumFractionDigits: config.outputFractionDigits,
  }).format(value);
}

function createSeededRandom(seed: number) {
  let state = seed >>> 0;

  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function readNumber(value: number | '') {
  return value === '' ? 0 : value;
}

function parseEditableNumber(value: string) {
  if (value === '') return '';
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : '';
}

function normalizeInputs(inputs: Inputs, currency: CurrencyCode): NormalizedInputs {
  const config = currencyConfigs[currency];

  return {
    balance: Math.min(Math.max(inputs.balance, config.minBalance), config.maxBalance),
    riskPercent: Math.min(Math.max(readNumber(inputs.riskPercent), 0.1), 25),
    winRate: Math.min(Math.max(readNumber(inputs.winRate), 0), 100),
    rewardRisk: Math.min(Math.max(readNumber(inputs.rewardRisk), 0.1), 20),
    trades: Math.min(Math.max(Math.round(readNumber(inputs.trades)), 1), 1000),
    simulations: Math.min(Math.max(Math.round(readNumber(inputs.simulations)), 100), 5000),
  };
}

function runSimulation(inputs: Inputs, seed = 1729, currency: CurrencyCode = 'IDR'): SimulationResult {
  const normalized = normalizeInputs(inputs, currency);
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
      const currentDrawdown = ((peak - balance) / peak) * 100;
      maxDrawdown = Math.max(maxDrawdown, currentDrawdown);

      if (sim === 0) {
        tradeDetails.push({
          trade: trade + 1,
          outcome: win ? 'Win' : 'Loss',
          balanceBefore,
          riskAmount: risk,
          pnl,
          balanceAfter: balance,
          drawdown: currentDrawdown,
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
  const numberLocale = getLocale(language);
  const [currency, setCurrency] = useState<CurrencyCode>('IDR');
  const [inputs, setInputs] = useState<Inputs>({
    balance: currencyConfigs.IDR.defaultBalance,
    riskPercent: 2,
    winRate: 35,
    rewardRisk: 2,
    trades: 100,
    simulations: 1000,
  });
  const [result, setResult] = useState<SimulationResult>(() => runSimulation(inputs, 1729, currency));
  const [validationNote, setValidationNote] = useState<string | null>(null);

  const update = (field: Exclude<keyof Inputs, 'balance'>, value: string) => {
    setInputs((prev) => ({
      ...prev,
      [field]: parseEditableNumber(value),
    }));
  };

  const updateBalance = (value: string) => {
    setInputs((prev) => ({
      ...prev,
      balance: parseBalanceInput(value, currency),
    }));
  };

  const handleCurrencyChange = (value: string) => {
    const nextCurrency = isCurrencyCode(value) ? value : 'IDR';
    const nextInputs = {
      ...inputs,
      balance: currencyConfigs[nextCurrency].defaultBalance,
    };

    setCurrency(nextCurrency);
    setInputs(nextInputs);
    setValidationNote(null);
    setResult(runSimulation(nextInputs, 1729, nextCurrency));
  };

  const handleRun = () => {
    const normalized = normalizeInputs(inputs, currency);
    const changed = Object.entries(normalized).some(([key, value]) => {
      const current = inputs[key as keyof Inputs];
      return (current === '' ? 0 : current) !== value;
    });

    setInputs(normalized);
    setValidationNote(changed ? copy.validation : null);
    setResult(runSimulation(normalized, Date.now(), currency));
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

      <div className={styles.actions}>
        <button className="btn btn-primary" onClick={handleRun} type="button">
          {copy.run}
        </button>
      </div>

      {validationNote ? <p className={styles.note}>{validationNote}</p> : null}

      <div className={styles.resultGrid}>
        <div className={`${styles.metric} ${styles.metricPrimary}`}>
          <span>{copy.metrics.expected}</span>
          <strong>{formatCurrency(result.average, currency, language)}</strong>
        </div>
        <div className={styles.metric}>
          <span>{copy.metrics.median}</span>
          <strong>{formatCurrency(result.median, currency, language)}</strong>
        </div>
        <div className={styles.metric}>
          <span>{copy.metrics.best}</span>
          <strong>{formatCurrency(result.best, currency, language)}</strong>
        </div>
        <div className={styles.metric}>
          <span>{copy.metrics.worst}</span>
          <strong>{formatCurrency(result.worst, currency, language)}</strong>
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
        {copy.note(result.simulations.toLocaleString(numberLocale), result.trades.toLocaleString(numberLocale))}
      </p>

      <section className={styles.detailSection}>
        <div className={styles.sectionHeader}>
          <div>
            <h2>{copy.detailTitle}</h2>
            <p>{copy.detailDescription}</p>
          </div>
          <span className={styles.badgeMuted}>
            {copy.detailCount(result.tradeDetails.length.toLocaleString(numberLocale))}
          </span>
        </div>

        <div className={styles.tableWrap} data-mobile-cards="true">
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
    </section>
  );
}
