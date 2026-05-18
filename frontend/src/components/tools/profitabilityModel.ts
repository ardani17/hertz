export type CurrencyCode = 'IDR' | 'USD_USC';

export type LanguageCode = 'id' | 'en';

export type GoalMode = 'balanced' | 'growth' | 'low_drawdown' | 'prop_firm_safe' | 'strategy_test';

export type PresetId = 'conservative' | 'balanced' | 'aggressive' | 'high_rr' | 'scalping' | 'swing' | 'prop_firm_safe';

export type Inputs = {
  balance: number;
  riskPercent: number | '';
  winRate: number | '';
  rewardRisk: number | '';
  trades: number | '';
  simulations: number | '';
};

export type NormalizedInputs = {
  balance: number;
  riskPercent: number;
  winRate: number;
  rewardRisk: number;
  trades: number;
  simulations: number;
};

export type TradeDetail = {
  trade: number;
  outcome: 'Win' | 'Loss';
  balanceBefore: number;
  riskAmount: number;
  pnl: number;
  balanceAfter: number;
  drawdown: number;
};

export type SimulationResult = {
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
  finalBalances: number[];
  drawdowns: number[];
  maxDrawdownP10: number;
  maxDrawdownP50: number;
  maxDrawdownP90: number;
  drawdownBreach10Pct: number;
  drawdownBreach20Pct: number;
  drawdownBreach30Pct: number;
};

export type Preset = {
  id: PresetId;
  riskPercent: number;
  winRate: number;
  rewardRisk: number;
  trades: number;
  simulations: number;
};

export type SimulationAnalysis = {
  grade: 'A' | 'B' | 'C' | 'D';
  riskLevel: 'safe' | 'moderate' | 'aggressive' | 'danger';
  verdictId: string;
  riskRecommendation: number;
  recommendedRiskLabel: 'conservative' | 'balanced' | 'aggressive';
  warnings: string[];
  strengths: string[];
  expectancyPerRisk: number;
};

export const currencyConfigs: Record<
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

export const presets: Preset[] = [
  { id: 'conservative', riskPercent: 0.5, winRate: 45, rewardRisk: 1.5, trades: 100, simulations: 1000 },
  { id: 'balanced', riskPercent: 1, winRate: 40, rewardRisk: 2, trades: 100, simulations: 1000 },
  { id: 'aggressive', riskPercent: 2.5, winRate: 35, rewardRisk: 2.2, trades: 100, simulations: 1500 },
  { id: 'high_rr', riskPercent: 1, winRate: 30, rewardRisk: 3, trades: 80, simulations: 1500 },
  { id: 'scalping', riskPercent: 0.75, winRate: 55, rewardRisk: 1.1, trades: 200, simulations: 1500 },
  { id: 'swing', riskPercent: 1, winRate: 38, rewardRisk: 2.5, trades: 60, simulations: 1500 },
  { id: 'prop_firm_safe', riskPercent: 0.5, winRate: 40, rewardRisk: 2, trades: 80, simulations: 2000 },
];

function percentile(values: number[], pct: number) {
  const index = Math.min(values.length - 1, Math.max(0, Math.floor(values.length * pct)));
  return values[index] ?? 0;
}

export function getLocale(language: LanguageCode) {
  return language === 'id' ? 'id-ID' : 'en-US';
}

export function parseIdrInput(value: string) {
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

export function parseDecimalCurrencyInput(value: string) {
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

export function parseBalanceInput(value: string, currency: CurrencyCode) {
  if (currency === 'IDR') return parseIdrInput(value);
  return parseDecimalCurrencyInput(value);
}

export function formatNumberInput(value: number, currency: CurrencyCode, language: LanguageCode) {
  if (!value) return '';
  const config = currencyConfigs[currency];

  return new Intl.NumberFormat(getLocale(language), {
    maximumFractionDigits: config.inputFractionDigits,
    minimumFractionDigits: 0,
  }).format(value);
}

export function formatCurrency(value: number, currency: CurrencyCode, language: LanguageCode) {
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

export function parseEditableNumber(value: string) {
  if (value === '') return '';
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : '';
}

export function normalizeInputs(inputs: Inputs, currency: CurrencyCode): NormalizedInputs {
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

export function runSimulation(inputs: Inputs, seed = 1729, currency: CurrencyCode = 'IDR'): SimulationResult {
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
  drawdowns.sort((a, b) => a - b);

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
    finalBalances: outcomes,
    drawdowns,
    maxDrawdownP10: percentile(drawdowns, 0.1),
    maxDrawdownP50: percentile(drawdowns, 0.5),
    maxDrawdownP90: percentile(drawdowns, 0.9),
    drawdownBreach10Pct: (drawdowns.filter((value) => value >= 10).length / drawdowns.length) * 100,
    drawdownBreach20Pct: (drawdowns.filter((value) => value >= 20).length / drawdowns.length) * 100,
    drawdownBreach30Pct: (drawdowns.filter((value) => value >= 30).length / drawdowns.length) * 100,
  };
}

export function getPreset(id: PresetId) {
  return presets.find((preset) => preset.id === id) ?? presets[1];
}

export function buildInputsFromPreset(current: Inputs, id: PresetId): Inputs {
  const preset = getPreset(id);

  return {
    ...current,
    riskPercent: preset.riskPercent,
    winRate: preset.winRate,
    rewardRisk: preset.rewardRisk,
    trades: preset.trades,
    simulations: preset.simulations,
  };
}

function getRiskRecommendation(inputs: NormalizedInputs, result: SimulationResult, goal: GoalMode) {
  let recommendation = inputs.riskPercent;

  if (result.drawdownBreach20Pct >= 25 || result.avgDrawdown >= 18 || result.profitablePct < 45) {
    recommendation *= 0.5;
  } else if (result.drawdownBreach10Pct >= 45 || result.avgDrawdown >= 12 || result.profitablePct < 55) {
    recommendation *= 0.75;
  } else if (result.profitablePct >= 70 && result.avgDrawdown < 8 && result.roi > 8 && goal === 'growth') {
    recommendation *= 1.15;
  }

  if (goal === 'prop_firm_safe' || goal === 'low_drawdown') {
    recommendation = Math.min(recommendation, 0.75);
  }

  if (goal === 'growth') {
    recommendation = Math.min(recommendation, 2.5);
  }

  return Math.min(Math.max(Number(recommendation.toFixed(2)), 0.1), 5);
}

export function analyzeSimulation(inputs: NormalizedInputs, result: SimulationResult, goal: GoalMode): SimulationAnalysis {
  const expectancyPerRisk = inputs.winRate / 100 * inputs.rewardRisk - (1 - inputs.winRate / 100);
  const riskRecommendation = getRiskRecommendation(inputs, result, goal);
  const warnings: string[] = [];
  const strengths: string[] = [];

  if (expectancyPerRisk <= 0) warnings.push('negative_expectancy');
  else strengths.push('positive_expectancy');

  if (result.profitablePct < 45) warnings.push('low_profitability');
  else if (result.profitablePct >= 65) strengths.push('strong_profitability');

  if (result.avgDrawdown >= 20 || result.drawdownBreach30Pct >= 10) warnings.push('severe_drawdown');
  else if (result.avgDrawdown >= 12 || result.drawdownBreach20Pct >= 20) warnings.push('high_drawdown');
  else strengths.push('controlled_drawdown');

  if (inputs.riskPercent >= 3) warnings.push('oversized_risk');
  if ((goal === 'prop_firm_safe' || goal === 'low_drawdown') && inputs.riskPercent > 1) warnings.push('goal_risk_mismatch');
  if (result.worst < inputs.balance * 0.85) warnings.push('weak_worst_case');

  const dangerScore =
    (warnings.includes('negative_expectancy') ? 2 : 0) +
    (warnings.includes('low_profitability') ? 2 : 0) +
    (warnings.includes('severe_drawdown') ? 3 : 0) +
    (warnings.includes('high_drawdown') ? 2 : 0) +
    (warnings.includes('oversized_risk') ? 1 : 0) +
    (warnings.includes('goal_risk_mismatch') ? 1 : 0) +
    (warnings.includes('weak_worst_case') ? 1 : 0);

  const riskLevel: SimulationAnalysis['riskLevel'] =
    dangerScore >= 5 ? 'danger' : dangerScore >= 3 ? 'aggressive' : dangerScore >= 1 ? 'moderate' : 'safe';

  const grade: SimulationAnalysis['grade'] = riskLevel === 'safe' ? 'A' : riskLevel === 'moderate' ? 'B' : riskLevel === 'aggressive' ? 'C' : 'D';
  const recommendedRiskLabel: SimulationAnalysis['recommendedRiskLabel'] =
    riskRecommendation <= 0.75 ? 'conservative' : riskRecommendation <= 1.5 ? 'balanced' : 'aggressive';

  const verdictId =
    riskLevel === 'safe'
      ? 'healthy'
      : riskLevel === 'moderate'
        ? 'usable_with_control'
        : riskLevel === 'aggressive'
          ? 'reduce_risk'
          : 'dangerous';

  return {
    grade,
    riskLevel,
    verdictId,
    riskRecommendation,
    recommendedRiskLabel,
    warnings,
    strengths,
    expectancyPerRisk,
  };
}
