import { ChallengeTrackerRepository, type ChallengeAIReviewRow, type ChallengeAccountRow, type ChallengePersonaRow, type ChallengeTradeRow } from '../repositories/challengeTrackerRepository';
import type {
  ChallengeAccountDto,
  ChallengeAccountInput,
  ChallengeAIReviewDto,
  ChallengePersonaDto,
  ChallengeTradeDto,
  ChallengeTradeInput,
} from '../types/challengeTracker';

const toNumber = (value: unknown, fallback = 0): number => {
  if (value === null || value === undefined || value === '') return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};
const toNullableNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};
const toInt = (value: unknown, fallback = 0): number => Math.max(0, Math.trunc(toNumber(value, fallback)));
const text = (value: unknown, fallback = '') => (typeof value === 'string' && value.trim() ? value.trim() : fallback);
const nullableText = (value: unknown) => (typeof value === 'string' && value.trim() ? value.trim() : null);
const dateString = (value: unknown): string | null => {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
};
const dateTimeString = (value: unknown): string => value instanceof Date ? value.toISOString() : String(value ?? new Date().toISOString());

export function normalizeChallengeAccountInput(input: ChallengeAccountInput) {
  const initialBalance = toNumber(input.initialBalance, 10000);
  const currentBalance = toNumber(input.currentBalance, initialBalance);
  const currentEquity = toNumber(input.currentEquity, currentBalance);
  const profitTargetPercent = toNullableNumber(input.profitTargetPercent);
  const maxDailyLossPercent = toNullableNumber(input.maxDailyLossPercent);
  const maxOverallDrawdownPercent = toNullableNumber(input.maxOverallDrawdownPercent);
  const profitTargetAmount = toNullableNumber(input.profitTargetAmount) ?? (profitTargetPercent === null ? null : (initialBalance * profitTargetPercent) / 100);
  const maxDailyLossAmount = toNullableNumber(input.maxDailyLossAmount) ?? (maxDailyLossPercent === null ? null : (initialBalance * maxDailyLossPercent) / 100);
  const maxOverallDrawdownAmount = toNullableNumber(input.maxOverallDrawdownAmount) ?? (maxOverallDrawdownPercent === null ? null : (initialBalance * maxOverallDrawdownPercent) / 100);
  return {
    name: text(input.name, 'Challenge Baru').slice(0, 120),
    accountCurrency: input.accountCurrency ?? 'USD',
    initialBalance,
    currentBalance,
    currentEquity,
    profitTargetPercent,
    profitTargetAmount,
    maxDailyLossPercent,
    maxDailyLossAmount,
    maxOverallDrawdownPercent,
    maxOverallDrawdownAmount,
    minTradingDays: toInt(input.minTradingDays, 0),
    startDate: input.startDate || null,
    endDate: input.endDate || null,
    accountType: input.accountType ?? 'evaluation',
    drawdownMode: input.drawdownMode ?? 'static',
    newsTradingAllowed: Boolean(input.newsTradingAllowed),
    holdOvernightAllowed: Boolean(input.holdOvernightAllowed),
    holdWeekendAllowed: Boolean(input.holdWeekendAllowed),
    consistencyRulePercent: toNullableNumber(input.consistencyRulePercent),
    maxLot: toNullableNumber(input.maxLot),
    maxRiskPerTradePercent: toNullableNumber(input.maxRiskPerTradePercent),
    maxTradesPerDay: input.maxTradesPerDay === null || input.maxTradesPerDay === undefined || input.maxTradesPerDay === '' ? null : toInt(input.maxTradesPerDay, 0),
    presetId: input.presetId ?? null,
  };
}

export function normalizeChallengeTradeInput(input: ChallengeTradeInput, account: { maxRiskPerTradePercent?: number | null } = {}) {
  const riskPercent = toNullableNumber(input.riskPercent);
  const mistakeCategory = input.mistakeCategory ?? 'no_mistake';
  const emotionalState = input.emotionalState ?? 'calm';
  const tradeQuality = input.tradeQuality ?? 'b';
  let disciplineScore = 100;
  if (input.followedPlan === false) disciplineScore -= 20;
  if (mistakeCategory !== 'no_mistake') disciplineScore -= 15;
  if (['fomo', 'revenge', 'greedy', 'fear', 'overconfident'].includes(emotionalState)) disciplineScore -= 10;
  if (account.maxRiskPerTradePercent && riskPercent && riskPercent > account.maxRiskPerTradePercent) disciplineScore -= 10;
  if (tradeQuality === 'c' || tradeQuality === 'd') disciplineScore -= 10;
  return {
    tradeDate: input.tradeDate || new Date().toISOString().slice(0, 10),
    symbol: text(input.symbol, 'XAUUSD').slice(0, 30).toUpperCase(),
    session: input.session ?? null,
    direction: input.direction ?? null,
    entryPrice: toNullableNumber(input.entryPrice),
    stopLoss: toNullableNumber(input.stopLoss),
    takeProfit: toNullableNumber(input.takeProfit),
    exitPrice: toNullableNumber(input.exitPrice),
    lotSize: toNullableNumber(input.lotSize),
    riskAmount: toNullableNumber(input.riskAmount),
    riskPercent,
    result: input.result ?? 'loss',
    pnlAmount: toNumber(input.pnlAmount, 0),
    pnlPercent: toNullableNumber(input.pnlPercent),
    rrPlanned: toNullableNumber(input.rrPlanned),
    rrRealized: toNullableNumber(input.rrRealized),
    setupName: nullableText(input.setupName),
    entryReason: nullableText(input.entryReason),
    exitReason: nullableText(input.exitReason),
    emotionalState,
    mistakeCategory,
    confidenceLevel: input.confidenceLevel === null || input.confidenceLevel === undefined || input.confidenceLevel === '' ? null : Math.min(5, Math.max(1, toInt(input.confidenceLevel, 3))),
    disciplineInputScore: input.disciplineInputScore === null || input.disciplineInputScore === undefined || input.disciplineInputScore === '' ? null : Math.min(5, Math.max(1, toInt(input.disciplineInputScore, 3))),
    tradeQuality,
    followedPlan: input.followedPlan ?? null,
    disciplineScore: Math.max(0, Math.min(100, disciplineScore)),
    screenshotUrl: nullableText(input.screenshotUrl),
    evaluationNotes: nullableText(input.evaluationNotes),
  };
}

function mapAccount(row: ChallengeAccountRow): ChallengeAccountDto {
  return {
    id: row.id, userId: row.user_id, name: row.name, accountCurrency: row.account_currency as ChallengeAccountDto['accountCurrency'],
    initialBalance: toNumber(row.initial_balance), currentBalance: toNumber(row.current_balance), currentEquity: toNumber(row.current_equity),
    profitTargetPercent: toNullableNumber(row.profit_target_percent), profitTargetAmount: toNullableNumber(row.profit_target_amount), maxDailyLossPercent: toNullableNumber(row.max_daily_loss_percent), maxDailyLossAmount: toNullableNumber(row.max_daily_loss_amount), maxOverallDrawdownPercent: toNullableNumber(row.max_overall_drawdown_percent), maxOverallDrawdownAmount: toNullableNumber(row.max_overall_drawdown_amount), minTradingDays: row.min_trading_days,
    startDate: dateString(row.start_date), endDate: dateString(row.end_date), accountType: row.account_type as ChallengeAccountDto['accountType'], drawdownMode: row.drawdown_mode as ChallengeAccountDto['drawdownMode'], newsTradingAllowed: row.news_trading_allowed, holdOvernightAllowed: row.hold_overnight_allowed, holdWeekendAllowed: row.hold_weekend_allowed, consistencyRulePercent: toNullableNumber(row.consistency_rule_percent), maxLot: toNullableNumber(row.max_lot), maxRiskPerTradePercent: toNullableNumber(row.max_risk_per_trade_percent), maxTradesPerDay: row.max_trades_per_day, presetId: row.preset_id, archivedAt: row.archived_at ? dateTimeString(row.archived_at) : null, createdAt: dateTimeString(row.created_at), updatedAt: dateTimeString(row.updated_at),
  };
}
function mapTrade(row: ChallengeTradeRow): ChallengeTradeDto {
  return { id: row.id, challengeAccountId: row.challenge_account_id, userId: row.user_id, tradeDate: dateString(row.trade_date) ?? '', symbol: row.symbol, session: row.session as ChallengeTradeDto['session'], direction: row.direction as ChallengeTradeDto['direction'], entryPrice: toNullableNumber(row.entry_price), stopLoss: toNullableNumber(row.stop_loss), takeProfit: toNullableNumber(row.take_profit), exitPrice: toNullableNumber(row.exit_price), lotSize: toNullableNumber(row.lot_size), riskAmount: toNullableNumber(row.risk_amount), riskPercent: toNullableNumber(row.risk_percent), result: row.result as ChallengeTradeDto['result'], pnlAmount: toNumber(row.pnl_amount), pnlPercent: toNullableNumber(row.pnl_percent), rrPlanned: toNullableNumber(row.rr_planned), rrRealized: toNullableNumber(row.rr_realized), setupName: row.setup_name, entryReason: row.entry_reason, exitReason: row.exit_reason, emotionalState: row.emotional_state as ChallengeTradeDto['emotionalState'], mistakeCategory: row.mistake_category as ChallengeTradeDto['mistakeCategory'], confidenceLevel: row.confidence_level, disciplineInputScore: row.discipline_input_score, tradeQuality: row.trade_quality as ChallengeTradeDto['tradeQuality'], followedPlan: row.followed_plan, disciplineScore: row.discipline_score, screenshotUrl: row.screenshot_url, evaluationNotes: row.evaluation_notes, createdAt: dateTimeString(row.created_at), updatedAt: dateTimeString(row.updated_at) };
}
function mapPersona(row: ChallengePersonaRow): ChallengePersonaDto { return { id: row.id, userId: row.user_id, name: row.name, description: row.description, content: row.content, isDefault: row.is_default, createdAt: dateTimeString(row.created_at), updatedAt: dateTimeString(row.updated_at) }; }
function mapReview(row: ChallengeAIReviewRow): ChallengeAIReviewDto { return { id: row.id, challengeAccountId: row.challenge_account_id, userId: row.user_id, personaId: row.persona_id, provider: row.provider, reviewScope: row.review_scope, reviewStyle: row.review_style, userMessage: row.user_message, systemPrompt: row.system_prompt, contextPrompt: row.context_prompt, userPrompt: row.user_prompt, assistantResponse: row.assistant_response, createdAt: dateTimeString(row.created_at) }; }

export class ChallengeTrackerService {
  private readonly repo = new ChallengeTrackerRepository();
  async listAccounts(userId: string) { return (await this.repo.listAccounts(userId)).map(mapAccount); }
  async getAccount(userId: string, accountId: string) { const row = await this.repo.getAccount(userId, accountId); return row ? mapAccount(row) : null; }
  async createAccount(userId: string, input: ChallengeAccountInput) { const row = await this.repo.createAccount(userId, normalizeChallengeAccountInput(input)); if (!row) throw new Error('Gagal membuat challenge'); return mapAccount(row); }
  async updateAccount(userId: string, accountId: string, input: ChallengeAccountInput) { const row = await this.repo.updateAccount(userId, accountId, normalizeChallengeAccountInput(input)); if (!row) throw new Error('Challenge tidak ditemukan'); return mapAccount(row); }
  async deleteAccount(userId: string, accountId: string) { await this.repo.deleteAccount(userId, accountId); }
  async archiveAccount(userId: string, accountId: string, archived: boolean) { const row = await this.repo.archiveAccount(userId, accountId, archived); if (!row) throw new Error('Challenge tidak ditemukan'); return mapAccount(row); }
  async listTrades(userId: string, accountId: string) { return (await this.repo.listTrades(userId, accountId)).map(mapTrade); }
  async createTrade(userId: string, accountId: string, input: ChallengeTradeInput) { const account = await this.getAccount(userId, accountId); if (!account) throw new Error('Challenge tidak ditemukan'); const row = await this.repo.createTrade(userId, accountId, normalizeChallengeTradeInput(input, account)); if (!row) throw new Error('Gagal menyimpan trade'); return mapTrade(row); }
  async updateTrade(userId: string, tradeId: string, input: ChallengeTradeInput) { const normalized = normalizeChallengeTradeInput(input); const row = await this.repo.updateTrade(userId, tradeId, normalized); if (!row) throw new Error('Trade tidak ditemukan'); return mapTrade(row); }
  async deleteTrade(userId: string, tradeId: string) { await this.repo.deleteTrade(userId, tradeId); }
  async listPersonas(userId: string) { return (await this.repo.listPersonas(userId)).map(mapPersona); }
  async createPersona(userId: string, input: { name?: string; description?: string | null; content?: string; isDefault?: boolean }) { const row = await this.repo.createPersona(userId, { name: text(input.name, 'Persona Baru'), description: nullableText(input.description), content: text(input.content, 'Kamu adalah reviewer jurnal trading.'), isDefault: Boolean(input.isDefault) }); if (!row) throw new Error('Gagal membuat persona'); return mapPersona(row); }
  async updatePersona(userId: string, personaId: string, input: { name?: string; description?: string | null; content?: string; isDefault?: boolean }) { const row = await this.repo.updatePersona(userId, personaId, { name: text(input.name, 'Persona Baru'), description: nullableText(input.description), content: text(input.content, 'Kamu adalah reviewer jurnal trading.'), isDefault: Boolean(input.isDefault) }); if (!row) throw new Error('Persona tidak ditemukan'); return mapPersona(row); }
  async deletePersona(userId: string, personaId: string) { await this.repo.deletePersona(userId, personaId); }
  async listAIReviews(userId: string, accountId: string) { return (await this.repo.listAIReviews(userId, accountId)).map(mapReview); }
  async createAIReview(userId: string, accountId: string, input: { personaId?: string | null; provider?: string | null; reviewScope: string; reviewStyle: string; userMessage?: string | null; systemPrompt: string; contextPrompt: string; userPrompt: string; assistantResponse: string }) { const row = await this.repo.createAIReview(userId, accountId, input); if (!row) throw new Error('Gagal menyimpan AI review'); return mapReview(row); }
}
