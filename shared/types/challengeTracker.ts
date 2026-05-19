export type ChallengeCurrency = 'IDR' | 'USD' | 'EUR' | 'GBP';
export type ChallengeAccountType = 'personal' | 'prop_firm' | 'funded' | 'evaluation';
export type ChallengeDrawdownMode = 'static' | 'trailing' | 'balance_based' | 'equity_based';
export type ChallengeTradeResult = 'win' | 'loss' | 'be';
export type ChallengeSession = 'asia' | 'london' | 'new_york';
export type ChallengeDirection = 'buy' | 'sell';
export type ChallengeEmotionalState = 'calm' | 'fomo' | 'revenge' | 'fear' | 'greedy' | 'hesitant' | 'overconfident';
export type ChallengeMistakeCategory = 'no_mistake' | 'late_entry' | 'early_entry' | 'moved_sl' | 'no_sl' | 'overlot' | 'revenge_trade' | 'news_trade' | 'broke_rules' | 'bad_setup';
export type ChallengeTradeQuality = 'a_plus' | 'a' | 'b' | 'c' | 'd';
export type ChallengeStatus = 'safe' | 'warning' | 'danger' | 'failed';

export interface ChallengeAccountDto {
  id: string;
  userId: string;
  name: string;
  accountCurrency: ChallengeCurrency;
  initialBalance: number;
  currentBalance: number;
  currentEquity: number;
  profitTargetPercent: number | null;
  profitTargetAmount: number | null;
  maxDailyLossPercent: number | null;
  maxDailyLossAmount: number | null;
  maxOverallDrawdownPercent: number | null;
  maxOverallDrawdownAmount: number | null;
  minTradingDays: number;
  startDate: string | null;
  endDate: string | null;
  accountType: ChallengeAccountType;
  drawdownMode: ChallengeDrawdownMode;
  newsTradingAllowed: boolean;
  holdOvernightAllowed: boolean;
  holdWeekendAllowed: boolean;
  consistencyRulePercent: number | null;
  maxLot: number | null;
  maxRiskPerTradePercent: number | null;
  maxTradesPerDay: number | null;
  presetId: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChallengeTradeDto {
  id: string;
  challengeAccountId: string;
  userId: string;
  tradeDate: string;
  symbol: string;
  session: ChallengeSession | null;
  direction: ChallengeDirection | null;
  entryPrice: number | null;
  stopLoss: number | null;
  takeProfit: number | null;
  exitPrice: number | null;
  lotSize: number | null;
  riskAmount: number | null;
  riskPercent: number | null;
  result: ChallengeTradeResult;
  pnlAmount: number;
  pnlPercent: number | null;
  rrPlanned: number | null;
  rrRealized: number | null;
  setupName: string | null;
  entryReason: string | null;
  exitReason: string | null;
  emotionalState: ChallengeEmotionalState | null;
  mistakeCategory: ChallengeMistakeCategory | null;
  confidenceLevel: number | null;
  disciplineInputScore: number | null;
  tradeQuality: ChallengeTradeQuality | null;
  followedPlan: boolean | null;
  disciplineScore: number;
  screenshotUrl: string | null;
  evaluationNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChallengePersonaDto {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  content: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ChallengeAIReviewDto {
  id: string;
  challengeAccountId: string;
  userId: string;
  personaId: string | null;
  provider: string | null;
  reviewScope: string;
  reviewStyle: string;
  userMessage: string | null;
  systemPrompt: string;
  contextPrompt: string;
  userPrompt: string;
  assistantResponse: string;
  createdAt: string;
}

export interface ChallengeAccountInput {
  name?: string;
  accountCurrency?: ChallengeCurrency;
  initialBalance?: number | string;
  currentBalance?: number | string;
  currentEquity?: number | string;
  profitTargetPercent?: number | string | null;
  profitTargetAmount?: number | string | null;
  maxDailyLossPercent?: number | string | null;
  maxDailyLossAmount?: number | string | null;
  maxOverallDrawdownPercent?: number | string | null;
  maxOverallDrawdownAmount?: number | string | null;
  minTradingDays?: number | string;
  startDate?: string | null;
  endDate?: string | null;
  accountType?: ChallengeAccountType;
  drawdownMode?: ChallengeDrawdownMode;
  newsTradingAllowed?: boolean;
  holdOvernightAllowed?: boolean;
  holdWeekendAllowed?: boolean;
  consistencyRulePercent?: number | string | null;
  maxLot?: number | string | null;
  maxRiskPerTradePercent?: number | string | null;
  maxTradesPerDay?: number | string | null;
  presetId?: string | null;
}

export interface ChallengeTradeInput {
  tradeDate?: string;
  symbol?: string;
  session?: ChallengeSession | null;
  direction?: ChallengeDirection | null;
  entryPrice?: number | string | null;
  stopLoss?: number | string | null;
  takeProfit?: number | string | null;
  exitPrice?: number | string | null;
  lotSize?: number | string | null;
  riskAmount?: number | string | null;
  riskPercent?: number | string | null;
  result?: ChallengeTradeResult;
  pnlAmount?: number | string;
  pnlPercent?: number | string | null;
  rrPlanned?: number | string | null;
  rrRealized?: number | string | null;
  setupName?: string | null;
  entryReason?: string | null;
  exitReason?: string | null;
  emotionalState?: ChallengeEmotionalState | null;
  mistakeCategory?: ChallengeMistakeCategory | null;
  confidenceLevel?: number | string | null;
  disciplineInputScore?: number | string | null;
  tradeQuality?: ChallengeTradeQuality | null;
  followedPlan?: boolean | null;
  screenshotUrl?: string | null;
  evaluationNotes?: string | null;
}

export interface ChallengeAnalyticsSummary {
  totalTrades: number;
  wins: number;
  losses: number;
  breakEvens: number;
  winRate: number;
  lossRate: number;
  breakEvenRate: number;
  totalProfit: number;
  totalLoss: number;
  netProfit: number;
  averageWin: number;
  averageLoss: number;
  biggestWin: number;
  biggestLoss: number;
  averageRR: number;
  profitFactor: number;
  expectancy: number;
  maxLosingStreak: number;
  maxWinningStreak: number;
  currentLossStreak: number;
  bestPair: string | null;
  worstPair: string | null;
  bestSession: string | null;
  worstSession: string | null;
  bestSetup: string | null;
  worstSetup: string | null;
  mostFrequentMistake: string | null;
  mostFrequentLossEmotion: string | null;
  tradesToday: number;
  averageRiskPercent: number;
  averageDisciplineScore: number;
  disciplineScoreToday: number;
  bestDisciplineDay: string | null;
  worstDisciplineDay: string | null;
}

export interface ChallengeRiskStatus {
  status: ChallengeStatus;
  dailyLoss: number;
  dailyLossUsagePct: number;
  overallDrawdown: number;
  overallDrawdownUsagePct: number;
  warnings: string[];
}

export interface AIReviewContextResult {
  systemPrompt: string;
  contextPrompt: string;
  userPrompt: string;
}
