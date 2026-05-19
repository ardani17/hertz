import { execute, query, queryOne, type DbClient } from '../db';

export interface ChallengeAccountRow {
  id: string; user_id: string; name: string; account_currency: string; initial_balance: string | number; current_balance: string | number; current_equity: string | number;
  profit_target_percent: string | number | null; profit_target_amount: string | number | null; max_daily_loss_percent: string | number | null; max_daily_loss_amount: string | number | null;
  max_overall_drawdown_percent: string | number | null; max_overall_drawdown_amount: string | number | null; min_trading_days: number;
  start_date: Date | string | null; end_date: Date | string | null; account_type: string; drawdown_mode: string; news_trading_allowed: boolean; hold_overnight_allowed: boolean; hold_weekend_allowed: boolean;
  consistency_rule_percent: string | number | null; max_lot: string | number | null; max_risk_per_trade_percent: string | number | null; max_trades_per_day: number | null; preset_id: string | null;
  archived_at: Date | string | null; created_at: Date | string; updated_at: Date | string;
}

export interface ChallengeTradeRow {
  id: string; challenge_account_id: string; user_id: string; trade_date: Date | string; symbol: string; session: string | null; direction: string | null;
  entry_price: string | number | null; stop_loss: string | number | null; take_profit: string | number | null; exit_price: string | number | null; lot_size: string | number | null;
  risk_amount: string | number | null; risk_percent: string | number | null; result: string; pnl_amount: string | number; pnl_percent: string | number | null; rr_planned: string | number | null; rr_realized: string | number | null;
  setup_name: string | null; entry_reason: string | null; exit_reason: string | null; emotional_state: string | null; mistake_category: string | null; confidence_level: number | null; discipline_input_score: number | null;
  trade_quality: string | null; followed_plan: boolean | null; discipline_score: number; screenshot_url: string | null; evaluation_notes: string | null; created_at: Date | string; updated_at: Date | string;
}

export interface ChallengePersonaRow { id: string; user_id: string; name: string; description: string | null; content: string; is_default: boolean; created_at: Date | string; updated_at: Date | string; }
export interface ChallengeAIReviewRow { id: string; challenge_account_id: string; user_id: string; persona_id: string | null; provider: string | null; review_scope: string; review_style: string; user_message: string | null; system_prompt: string; context_prompt: string; user_prompt: string; assistant_response: string; created_at: Date | string; }

type AccountWrite = Record<string, unknown>;
type TradeWrite = Record<string, unknown>;
type PersonaWrite = Record<string, unknown>;
type ReviewWrite = Record<string, unknown>;

const accountColumns = `id, user_id, name, account_currency, initial_balance, current_balance, current_equity,
  profit_target_percent, profit_target_amount, max_daily_loss_percent, max_daily_loss_amount,
  max_overall_drawdown_percent, max_overall_drawdown_amount, min_trading_days, start_date, end_date,
  account_type, drawdown_mode, news_trading_allowed, hold_overnight_allowed, hold_weekend_allowed,
  consistency_rule_percent, max_lot, max_risk_per_trade_percent, max_trades_per_day, preset_id,
  archived_at, created_at, updated_at`;
const tradeColumns = `id, challenge_account_id, user_id, trade_date, symbol, session, direction, entry_price, stop_loss, take_profit, exit_price,
  lot_size, risk_amount, risk_percent, result, pnl_amount, pnl_percent, rr_planned, rr_realized, setup_name,
  entry_reason, exit_reason, emotional_state, mistake_category, confidence_level, discipline_input_score,
  trade_quality, followed_plan, discipline_score, screenshot_url, evaluation_notes, created_at, updated_at`;
const personaColumns = `id, user_id, name, description, content, is_default, created_at, updated_at`;
const reviewColumns = `id, challenge_account_id, user_id, persona_id, provider, review_scope, review_style, user_message, system_prompt, context_prompt, user_prompt, assistant_response, created_at`;

export class ChallengeTrackerRepository {
  async listAccounts(userId: string, client?: DbClient) {
    const result = await query<ChallengeAccountRow>(`SELECT ${accountColumns} FROM challenge_accounts WHERE user_id = $1 ORDER BY archived_at ASC NULLS FIRST, created_at DESC`, [userId], client);
    return result.rows;
  }

  async getAccount(userId: string, accountId: string, client?: DbClient) {
    return queryOne<ChallengeAccountRow>(`SELECT ${accountColumns} FROM challenge_accounts WHERE id = $1 AND user_id = $2`, [accountId, userId], client);
  }

  async createAccount(userId: string, input: AccountWrite, client?: DbClient) {
    return queryOne<ChallengeAccountRow>(
      `INSERT INTO challenge_accounts (
        user_id, name, account_currency, initial_balance, current_balance, current_equity,
        profit_target_percent, profit_target_amount, max_daily_loss_percent, max_daily_loss_amount,
        max_overall_drawdown_percent, max_overall_drawdown_amount, min_trading_days, start_date, end_date,
        account_type, drawdown_mode, news_trading_allowed, hold_overnight_allowed, hold_weekend_allowed,
        consistency_rule_percent, max_lot, max_risk_per_trade_percent, max_trades_per_day, preset_id
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25)
      RETURNING ${accountColumns}`,
      [userId, input.name, input.accountCurrency, input.initialBalance, input.currentBalance, input.currentEquity, input.profitTargetPercent, input.profitTargetAmount, input.maxDailyLossPercent, input.maxDailyLossAmount, input.maxOverallDrawdownPercent, input.maxOverallDrawdownAmount, input.minTradingDays, input.startDate, input.endDate, input.accountType, input.drawdownMode, input.newsTradingAllowed, input.holdOvernightAllowed, input.holdWeekendAllowed, input.consistencyRulePercent, input.maxLot, input.maxRiskPerTradePercent, input.maxTradesPerDay, input.presetId],
      client,
    );
  }

  async updateAccount(userId: string, accountId: string, input: AccountWrite, client?: DbClient) {
    return queryOne<ChallengeAccountRow>(
      `UPDATE challenge_accounts SET
        name=$3, account_currency=$4, initial_balance=$5, current_balance=$6, current_equity=$7,
        profit_target_percent=$8, profit_target_amount=$9, max_daily_loss_percent=$10, max_daily_loss_amount=$11,
        max_overall_drawdown_percent=$12, max_overall_drawdown_amount=$13, min_trading_days=$14, start_date=$15, end_date=$16,
        account_type=$17, drawdown_mode=$18, news_trading_allowed=$19, hold_overnight_allowed=$20, hold_weekend_allowed=$21,
        consistency_rule_percent=$22, max_lot=$23, max_risk_per_trade_percent=$24, max_trades_per_day=$25, preset_id=$26, updated_at=NOW()
       WHERE id=$1 AND user_id=$2 RETURNING ${accountColumns}`,
      [accountId, userId, input.name, input.accountCurrency, input.initialBalance, input.currentBalance, input.currentEquity, input.profitTargetPercent, input.profitTargetAmount, input.maxDailyLossPercent, input.maxDailyLossAmount, input.maxOverallDrawdownPercent, input.maxOverallDrawdownAmount, input.minTradingDays, input.startDate, input.endDate, input.accountType, input.drawdownMode, input.newsTradingAllowed, input.holdOvernightAllowed, input.holdWeekendAllowed, input.consistencyRulePercent, input.maxLot, input.maxRiskPerTradePercent, input.maxTradesPerDay, input.presetId],
      client,
    );
  }

  async deleteAccount(userId: string, accountId: string, client?: DbClient) {
    return execute('DELETE FROM challenge_accounts WHERE id = $1 AND user_id = $2', [accountId, userId], client);
  }

  async archiveAccount(userId: string, accountId: string, archived: boolean, client?: DbClient) {
    return queryOne<ChallengeAccountRow>(`UPDATE challenge_accounts SET archived_at = CASE WHEN $3 THEN NOW() ELSE NULL END, updated_at=NOW() WHERE id=$1 AND user_id=$2 RETURNING ${accountColumns}`, [accountId, userId, archived], client);
  }

  async listTrades(userId: string, accountId: string, client?: DbClient) {
    const result = await query<ChallengeTradeRow>(`SELECT ${tradeColumns} FROM challenge_trades WHERE challenge_account_id=$1 AND user_id=$2 ORDER BY trade_date DESC, created_at DESC`, [accountId, userId], client);
    return result.rows;
  }

  async createTrade(userId: string, accountId: string, input: TradeWrite, client?: DbClient) {
    return queryOne<ChallengeTradeRow>(
      `INSERT INTO challenge_trades (challenge_account_id, user_id, trade_date, symbol, session, direction, entry_price, stop_loss, take_profit, exit_price, lot_size, risk_amount, risk_percent, result, pnl_amount, pnl_percent, rr_planned, rr_realized, setup_name, entry_reason, exit_reason, emotional_state, mistake_category, confidence_level, discipline_input_score, trade_quality, followed_plan, discipline_score, screenshot_url, evaluation_notes)
       SELECT $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30
       WHERE EXISTS (SELECT 1 FROM challenge_accounts WHERE id=$1 AND user_id=$2)
       RETURNING ${tradeColumns}`,
      [accountId, userId, input.tradeDate, input.symbol, input.session, input.direction, input.entryPrice, input.stopLoss, input.takeProfit, input.exitPrice, input.lotSize, input.riskAmount, input.riskPercent, input.result, input.pnlAmount, input.pnlPercent, input.rrPlanned, input.rrRealized, input.setupName, input.entryReason, input.exitReason, input.emotionalState, input.mistakeCategory, input.confidenceLevel, input.disciplineInputScore, input.tradeQuality, input.followedPlan, input.disciplineScore, input.screenshotUrl, input.evaluationNotes],
      client,
    );
  }

  async updateTrade(userId: string, tradeId: string, input: TradeWrite, client?: DbClient) {
    return queryOne<ChallengeTradeRow>(
      `UPDATE challenge_trades t SET trade_date=$3, symbol=$4, session=$5, direction=$6, entry_price=$7, stop_loss=$8, take_profit=$9, exit_price=$10, lot_size=$11, risk_amount=$12, risk_percent=$13, result=$14, pnl_amount=$15, pnl_percent=$16, rr_planned=$17, rr_realized=$18, setup_name=$19, entry_reason=$20, exit_reason=$21, emotional_state=$22, mistake_category=$23, confidence_level=$24, discipline_input_score=$25, trade_quality=$26, followed_plan=$27, discipline_score=$28, screenshot_url=$29, evaluation_notes=$30, updated_at=NOW()
       FROM challenge_accounts a WHERE t.id=$1 AND t.challenge_account_id=a.id AND a.user_id=$2 RETURNING t.${tradeColumns.replaceAll(', ', ', t.')}`,
      [tradeId, userId, input.tradeDate, input.symbol, input.session, input.direction, input.entryPrice, input.stopLoss, input.takeProfit, input.exitPrice, input.lotSize, input.riskAmount, input.riskPercent, input.result, input.pnlAmount, input.pnlPercent, input.rrPlanned, input.rrRealized, input.setupName, input.entryReason, input.exitReason, input.emotionalState, input.mistakeCategory, input.confidenceLevel, input.disciplineInputScore, input.tradeQuality, input.followedPlan, input.disciplineScore, input.screenshotUrl, input.evaluationNotes],
      client,
    );
  }

  async deleteTrade(userId: string, tradeId: string, client?: DbClient) {
    return execute('DELETE FROM challenge_trades t USING challenge_accounts a WHERE t.id=$1 AND t.challenge_account_id=a.id AND a.user_id=$2', [tradeId, userId], client);
  }

  async listPersonas(userId: string, client?: DbClient) {
    const result = await query<ChallengePersonaRow>(`SELECT ${personaColumns} FROM challenge_personas WHERE user_id=$1 ORDER BY is_default DESC, created_at DESC`, [userId], client);
    return result.rows;
  }

  async createPersona(userId: string, input: PersonaWrite, client?: DbClient) {
    return queryOne<ChallengePersonaRow>(`INSERT INTO challenge_personas (user_id, name, description, content, is_default) VALUES ($1,$2,$3,$4,$5) RETURNING ${personaColumns}`, [userId, input.name, input.description, input.content, input.isDefault], client);
  }

  async updatePersona(userId: string, personaId: string, input: PersonaWrite, client?: DbClient) {
    return queryOne<ChallengePersonaRow>(`UPDATE challenge_personas SET name=$3, description=$4, content=$5, is_default=$6, updated_at=NOW() WHERE id=$1 AND user_id=$2 RETURNING ${personaColumns}`, [personaId, userId, input.name, input.description, input.content, input.isDefault], client);
  }

  async deletePersona(userId: string, personaId: string, client?: DbClient) {
    return execute('DELETE FROM challenge_personas WHERE id=$1 AND user_id=$2', [personaId, userId], client);
  }

  async listAIReviews(userId: string, accountId: string, client?: DbClient) {
    const result = await query<ChallengeAIReviewRow>(`SELECT ${reviewColumns} FROM challenge_ai_reviews WHERE challenge_account_id=$1 AND user_id=$2 ORDER BY created_at DESC LIMIT 50`, [accountId, userId], client);
    return result.rows;
  }

  async createAIReview(userId: string, accountId: string, input: ReviewWrite, client?: DbClient) {
    return queryOne<ChallengeAIReviewRow>(
      `INSERT INTO challenge_ai_reviews (challenge_account_id, user_id, persona_id, provider, review_scope, review_style, user_message, system_prompt, context_prompt, user_prompt, assistant_response)
       SELECT $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11 WHERE EXISTS (SELECT 1 FROM challenge_accounts WHERE id=$1 AND user_id=$2) RETURNING ${reviewColumns}`,
      [accountId, userId, input.personaId, input.provider, input.reviewScope, input.reviewStyle, input.userMessage, input.systemPrompt, input.contextPrompt, input.userPrompt, input.assistantResponse],
      client,
    );
  }
}
