import type {
  AIReviewContextResult,
  ChallengeAccountDto,
  ChallengeAnalyticsSummary,
  ChallengeMistakeCategory,
  ChallengeRiskStatus,
  ChallengeTradeQuality,
  ChallengeTradeResult,
  ChallengeStatus,
} from '@shared/types/challengeTracker';

type MinimalTrade = {
  tradeDate?: string;
  symbol?: string | null;
  session?: string | null;
  result?: ChallengeTradeResult | string;
  pnlAmount?: number;
  rrRealized?: number | null;
  setupName?: string | null;
  emotionalState?: string | null;
  mistakeCategory?: string | null;
  disciplineScore?: number | null;
  riskPercent?: number | null;
};

type MinimalAccount = {
  name?: string;
  accountCurrency?: string;
  initialBalance?: number;
  currentBalance?: number;
  currentEquity?: number;
  profitTargetAmount?: number | null;
  maxDailyLossAmount?: number | null;
  maxOverallDrawdownAmount?: number | null;
  maxTradesPerDay?: number | null;
  maxRiskPerTradePercent?: number | null;
  minTradingDays?: number | null;
};

export const challengePresets = [
  { id: 'prop_firm_standard', name: 'Prop Firm Standard', profitTargetPercent: 10, maxDailyLossPercent: 5, maxOverallDrawdownPercent: 10, minTradingDays: 5, accountType: 'evaluation', drawdownMode: 'static' },
  { id: 'prop_firm_conservative', name: 'Prop Firm Conservative', profitTargetPercent: 8, maxDailyLossPercent: 4, maxOverallDrawdownPercent: 8, minTradingDays: 5, accountType: 'evaluation', drawdownMode: 'static' },
  { id: 'funded_account', name: 'Funded Account', profitTargetPercent: 0, maxDailyLossPercent: 5, maxOverallDrawdownPercent: 10, minTradingDays: 0, accountType: 'funded', drawdownMode: 'static' },
  { id: 'personal_account', name: 'Personal Account', profitTargetPercent: 0, maxDailyLossPercent: 3, maxOverallDrawdownPercent: 10, minTradingDays: 0, accountType: 'personal', drawdownMode: 'balance_based' },
  { id: 'custom_manual', name: 'Custom Manual', profitTargetPercent: 0, maxDailyLossPercent: 0, maxOverallDrawdownPercent: 0, minTradingDays: 0, accountType: 'personal', drawdownMode: 'static' },
] as const;

export const defaultPersonas: Record<string, string> = {
  'Strict Prop Firm Coach': 'Kamu adalah pelatih prop firm yang tegas. Fokus pada kepatuhan rules, drawdown, daily loss, risk per trade, overtrade, dan konsistensi.',
  'Calm Trading Mentor': 'Kamu adalah mentor trading yang tenang dan analitis. Fokus pada proses, kesabaran, evaluasi setup, dan perbaikan bertahap.',
  'Risk Manager': 'Kamu adalah risk manager profesional. Fokus utama pada exposure, drawdown, position sizing, risk of ruin, daily loss, dan batas akun.',
  'Psychology Coach': 'Kamu adalah coach psikologi trading. Fokus pada emosi, disiplin, impuls, FOMO, revenge trading, rasa takut, dan overconfidence.',
  'Scalping Coach': 'Kamu adalah coach scalping. Fokus pada eksekusi cepat, session, spread, overtrade, entry timing, RR realistis, dan kualitas setup intraday.',
  'Swing Trading Coach': 'Kamu adalah coach swing trading. Fokus pada struktur market, kesabaran entry, RR besar, hold position, invalidation level, dan konsistensi setup.',
};

export function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function calculateDisciplineScore(
  trade: {
    followedPlan?: boolean | null;
    mistakeCategory?: ChallengeMistakeCategory | string | null;
    emotionalState?: string | null;
    riskPercent?: number | null;
    tradeQuality?: ChallengeTradeQuality | string | null;
  },
  account: { maxRiskPerTradePercent?: number | null } = {},
) {
  let score = 100;
  if (trade.followedPlan === false) score -= 20;
  if (trade.mistakeCategory && trade.mistakeCategory !== 'no_mistake') score -= 15;
  if (['fomo', 'revenge', 'greedy', 'fear', 'overconfident'].includes(String(trade.emotionalState ?? ''))) score -= 10;
  if (account.maxRiskPerTradePercent && trade.riskPercent && trade.riskPercent > account.maxRiskPerTradePercent) score -= 10;
  if (trade.tradeQuality === 'c' || trade.tradeQuality === 'd') score -= 10;
  return clamp(score, 0, 100);
}

function pct(part: number, total: number) {
  return total > 0 ? (part / total) * 100 : 0;
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}

function topKey(entries: MinimalTrade[], key: 'symbol' | 'session' | 'setupName', compare: 'max' | 'min') {
  const grouped = new Map<string, number>();
  entries.forEach((trade) => {
    const name = String(trade[key] ?? '').trim();
    if (!name) return;
    grouped.set(name, (grouped.get(name) ?? 0) + (trade.pnlAmount ?? 0));
  });
  let selected: string | null = null;
  let selectedValue = compare === 'max' ? -Infinity : Infinity;
  grouped.forEach((value, keyName) => {
    if ((compare === 'max' && value > selectedValue) || (compare === 'min' && value < selectedValue)) {
      selected = keyName;
      selectedValue = value;
    }
  });
  return selected;
}

function mostFrequent(entries: Array<string | null | undefined>) {
  const grouped = new Map<string, number>();
  entries.forEach((entry) => {
    if (!entry || entry === 'no_mistake') return;
    grouped.set(entry, (grouped.get(entry) ?? 0) + 1);
  });
  let selected: string | null = null;
  let count = 0;
  grouped.forEach((value, key) => {
    if (value > count) {
      selected = key;
      count = value;
    }
  });
  return selected;
}

function streaks(trades: MinimalTrade[]) {
  let loss = 0;
  let win = 0;
  let maxLoss = 0;
  let maxWin = 0;
  trades.forEach((trade) => {
    if (trade.result === 'loss') {
      loss += 1;
      win = 0;
    } else if (trade.result === 'win') {
      win += 1;
      loss = 0;
    } else {
      loss = 0;
      win = 0;
    }
    maxLoss = Math.max(maxLoss, loss);
    maxWin = Math.max(maxWin, win);
  });
  return { maxLoss, maxWin, currentLoss: loss };
}

export function calculateChallengeAnalytics(trades: MinimalTrade[], today = new Date().toISOString().slice(0, 10)): ChallengeAnalyticsSummary {
  const totalTrades = trades.length;
  const wins = trades.filter((trade) => trade.result === 'win');
  const losses = trades.filter((trade) => trade.result === 'loss');
  const breakEvens = trades.filter((trade) => trade.result === 'be');
  const profitValues = trades.map((trade) => trade.pnlAmount ?? 0).filter((value) => value > 0);
  const lossValues = trades.map((trade) => trade.pnlAmount ?? 0).filter((value) => value < 0);
  const totalProfit = sum(profitValues);
  const totalLoss = Math.abs(sum(lossValues));
  const rrValues = trades.map((trade) => trade.rrRealized).filter((value): value is number => typeof value === 'number');
  const tradeStreaks = streaks(trades);
  const disciplineByDay = new Map<string, number[]>();
  trades.forEach((trade) => {
    if (!trade.tradeDate || typeof trade.disciplineScore !== 'number') return;
    const list = disciplineByDay.get(trade.tradeDate) ?? [];
    list.push(trade.disciplineScore);
    disciplineByDay.set(trade.tradeDate, list);
  });
  let bestDisciplineDay: string | null = null;
  let worstDisciplineDay: string | null = null;
  let bestScore = -Infinity;
  let worstScore = Infinity;
  disciplineByDay.forEach((scores, day) => {
    const average = sum(scores) / scores.length;
    if (average > bestScore) {
      bestScore = average;
      bestDisciplineDay = day;
    }
    if (average < worstScore) {
      worstScore = average;
      worstDisciplineDay = day;
    }
  });

  return {
    totalTrades,
    wins: wins.length,
    losses: losses.length,
    breakEvens: breakEvens.length,
    winRate: pct(wins.length, totalTrades),
    lossRate: pct(losses.length, totalTrades),
    breakEvenRate: pct(breakEvens.length, totalTrades),
    totalProfit,
    totalLoss,
    netProfit: totalProfit - totalLoss,
    averageWin: wins.length ? totalProfit / wins.length : 0,
    averageLoss: losses.length ? totalLoss / losses.length : 0,
    biggestWin: profitValues.length ? Math.max(...profitValues) : 0,
    biggestLoss: lossValues.length ? Math.min(...lossValues) : 0,
    averageRR: rrValues.length ? sum(rrValues) / rrValues.length : 0,
    profitFactor: totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? Infinity : 0,
    expectancy: totalTrades ? (totalProfit - totalLoss) / totalTrades : 0,
    maxLosingStreak: tradeStreaks.maxLoss,
    maxWinningStreak: tradeStreaks.maxWin,
    currentLossStreak: tradeStreaks.currentLoss,
    bestPair: topKey(trades, 'symbol', 'max'),
    worstPair: topKey(trades, 'symbol', 'min'),
    bestSession: topKey(trades, 'session', 'max'),
    worstSession: topKey(trades, 'session', 'min'),
    bestSetup: topKey(trades, 'setupName', 'max'),
    worstSetup: topKey(trades, 'setupName', 'min'),
    mostFrequentMistake: mostFrequent(trades.map((trade) => trade.mistakeCategory)),
    mostFrequentLossEmotion: mostFrequent(losses.map((trade) => trade.emotionalState)),
    tradesToday: trades.filter((trade) => trade.tradeDate === today).length,
    averageRiskPercent: trades.length ? sum(trades.map((trade) => trade.riskPercent ?? 0)) / trades.length : 0,
    averageDisciplineScore: trades.length ? sum(trades.map((trade) => trade.disciplineScore ?? 100)) / trades.length : 100,
    disciplineScoreToday: (() => {
      const todayScores = trades.filter((trade) => trade.tradeDate === today).map((trade) => trade.disciplineScore ?? 100);
      return todayScores.length ? sum(todayScores) / todayScores.length : 100;
    })(),
    bestDisciplineDay,
    worstDisciplineDay,
  };
}

export function calculateRiskStatus(account: MinimalAccount, trades: MinimalTrade[], today = new Date().toISOString().slice(0, 10)): ChallengeRiskStatus {
  const todayLoss = Math.abs(sum(trades.filter((trade) => trade.tradeDate === today && (trade.pnlAmount ?? 0) < 0).map((trade) => trade.pnlAmount ?? 0)));
  const dailyLimit = account.maxDailyLossAmount ?? 0;
  const currentEquity = account.currentEquity ?? account.currentBalance ?? account.initialBalance ?? 0;
  const initialBalance = account.initialBalance ?? currentEquity;
  const overallDrawdown = Math.max(0, initialBalance - currentEquity);
  const overallLimit = account.maxOverallDrawdownAmount ?? 0;
  const dailyLossUsagePct = dailyLimit > 0 ? (todayLoss / dailyLimit) * 100 : 0;
  const overallDrawdownUsagePct = overallLimit > 0 ? (overallDrawdown / overallLimit) * 100 : 0;
  const warnings: string[] = [];
  let status: ChallengeStatus = 'safe';

  if ((dailyLimit > 0 && todayLoss > dailyLimit) || (overallLimit > 0 && overallDrawdown > overallLimit)) status = 'failed';
  else if (dailyLossUsagePct >= 90 || overallDrawdownUsagePct >= 90) status = 'danger';
  else if (dailyLossUsagePct >= 70 || overallDrawdownUsagePct >= 70) status = 'warning';

  if (dailyLossUsagePct >= 70) warnings.push(`Daily loss sudah mencapai ${dailyLossUsagePct.toFixed(1)}% dari batas harian.`);
  if (overallDrawdownUsagePct >= 70) warnings.push(`Overall drawdown sudah mencapai ${overallDrawdownUsagePct.toFixed(1)}% dari batas maksimum.`);
  const todayTrades = trades.filter((trade) => trade.tradeDate === today);
  if (account.maxTradesPerDay && todayTrades.length > account.maxTradesPerDay) warnings.push('Overtrade terdeteksi: jumlah trade hari ini melebihi batas.');
  if (streaks(trades).currentLoss >= 3) warnings.push('Loss streak terdeteksi. Evaluasi setup sebelum entry berikutnya.');
  if (account.maxRiskPerTradePercent && trades.some((trade) => (trade.riskPercent ?? 0) > account.maxRiskPerTradePercent!)) warnings.push('Risk per trade melebihi aturan challenge.');

  return { status, dailyLoss: todayLoss, dailyLossUsagePct, overallDrawdown, overallDrawdownUsagePct, warnings };
}

export function calculateChallengeOverview(account: MinimalAccount, trades: MinimalTrade[]) {
  const analytics = calculateChallengeAnalytics(trades);
  const riskStatus = calculateRiskStatus(account, trades);
  const initial = account.initialBalance ?? 0;
  const current = account.currentEquity ?? account.currentBalance ?? initial;
  const runningPnl = current - initial;
  const target = account.profitTargetAmount ?? 0;
  const targetProgressPct = target > 0 ? clamp((runningPnl / target) * 100, 0, 999) : 0;
  return { analytics, riskStatus, runningPnl, targetProgressPct, remainingTarget: Math.max(0, target - runningPnl) };
}

export function buildAIReviewContext(input: {
  challengeConfig: Partial<ChallengeAccountDto> | Record<string, unknown>;
  trades: Array<Record<string, unknown>>;
  analytics: Partial<ChallengeAnalyticsSummary> | Record<string, unknown>;
  riskStatus: Partial<ChallengeRiskStatus> | Record<string, unknown>;
  selectedPersona: string;
  customPersonaText?: string;
  reviewScope: string;
  reviewStyle: string;
  userMessage: string;
}): AIReviewContextResult {
  const defaultPersona = defaultPersonas[input.selectedPersona] ?? defaultPersonas['Calm Trading Mentor'];
  const systemPrompt = input.customPersonaText?.trim() || defaultPersona || 'Kamu adalah reviewer jurnal trading.';
  const contextPrompt = [
    `Challenge: ${JSON.stringify(input.challengeConfig, null, 2)}`,
    `Risk status: ${JSON.stringify(input.riskStatus, null, 2)}`,
    `Analytics: ${JSON.stringify(input.analytics, null, 2)}`,
    `Trades: ${JSON.stringify(input.trades, null, 2)}`,
    `Review scope: ${input.reviewScope}`,
    `Review style: ${input.reviewStyle}`,
  ].join('\n\n');
  const userPrompt = input.userMessage || 'Review jurnal dan status challenge saya.';
  return { systemPrompt, contextPrompt, userPrompt };
}
