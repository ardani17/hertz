import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { NextRequest } from 'next/server';
import { ChallengeTrackerService } from '@shared/services/challengeTrackerService';
import { apiError, apiErrorFromUnknown, apiSuccess } from '@/lib/apiResponse';
import { getCurrentMember } from '@/lib/memberAuth';
import { buildAIReviewContext, calculateChallengeAnalytics, calculateRiskStatus } from '@/components/tools/challengeTrackerModel';
import type { ChallengeTradeDto } from '@shared/types/challengeTracker';

interface RouteContext { params: Promise<{ accountId: string }> }
export const dynamic = 'force-dynamic';
const service = new ChallengeTrackerService();
const configuredProvider = process.env.CHALLENGE_AI_PROVIDER || process.env.AI_REVIEW_PROVIDER || 'mock';
const configuredBaseUrl = process.env.CHALLENGE_AI_BASE_URL || process.env.AI_REVIEW_BASE_URL || '';
const configuredApiKey = process.env.CHALLENGE_AI_API_KEY || process.env.AI_REVIEW_API_KEY || '';
const configuredModel = process.env.CHALLENGE_AI_MODEL || process.env.AI_REVIEW_MODEL || 'glm-5-turbo';
const configuredTimeoutMs = Number(process.env.CHALLENGE_AI_TIMEOUT_MS || process.env.AI_REVIEW_TIMEOUT_MS || 90000);
const configuredMaxTokens = Number(process.env.CHALLENGE_AI_MAX_TOKENS || process.env.AI_REVIEW_MAX_TOKENS || 900);


function readTradingProfessionalPersona() {
  try {
    return readFileSync(join(process.cwd(), 'shared', 'prompts', 'challengeTradingProfessionalPersona.md'), 'utf8').trim();
  } catch {
    return 'Kamu adalah AI Trading Professional yang fokus pada review jurnal, risk management, disiplin trading, dan action plan praktis.';
  }
}

type ChatCompletionMessage = { role: 'system' | 'user' | 'assistant'; content: string };

type ChatCompletionResponse = {
  choices?: Array<{ message?: { content?: string } }>;
  error?: { message?: string };
};

function providerReady() {
  return Boolean(configuredBaseUrl && configuredApiKey && configuredModel && configuredProvider !== 'mock');
}

async function requestAIReview(prompts: { systemPrompt: string; contextPrompt: string; userPrompt: string }, history: ChatCompletionMessage[] = []) {
  if (!providerReady()) {
    return 'AI Review belum terhubung ke provider. Context sudah berhasil dibuat dan siap dikirim ke adapter AI pilihan admin.';
  }

  const endpoint = `${configuredBaseUrl.replace(/\/$/, '')}/chat/completions`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${configuredApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: configuredModel,
      temperature: 0.2,
      max_tokens: Number.isFinite(configuredMaxTokens) ? configuredMaxTokens : 900,
      messages: [
        { role: 'system', content: prompts.systemPrompt },
        { role: 'user', content: prompts.contextPrompt },
        ...history,
        { role: 'user', content: prompts.userPrompt },
      ],
    }),
    signal: AbortSignal.timeout(Number.isFinite(configuredTimeoutMs) ? configuredTimeoutMs : 90000),
  });
  const json = await response.json().catch(() => null) as ChatCompletionResponse | null;
  if (!response.ok) {
    throw new Error(json?.error?.message || `AI provider error ${response.status}`);
  }
  const content = json?.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error('AI provider tidak mengembalikan review');
  return content;
}



function clampPromptText(value: string, maxLength: number) {
  const text = value.trim();
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
}

function buildConversationHistory(reviews: Awaited<ReturnType<ChallengeTrackerService['listAIReviews']>>): ChatCompletionMessage[] {
  return reviews.slice(0, 3).reverse().flatMap((review) => {
    const userMessage = clampPromptText(review.userMessage || review.userPrompt || '', 360);
    const assistantResponse = clampPromptText(review.assistantResponse, 700);
    const messages: ChatCompletionMessage[] = [];
    if (userMessage) messages.push({ role: 'user', content: userMessage });
    if (assistantResponse) messages.push({ role: 'assistant', content: assistantResponse });
    return messages;
  });
}

function compactAccountForAI(account: Record<string, unknown>) {
  return {
    name: account.name,
    currency: account.accountCurrency,
    initialBalance: account.initialBalance,
    currentBalance: account.currentBalance,
    currentEquity: account.currentEquity,
    profitTargetAmount: account.profitTargetAmount,
    maxDailyLossAmount: account.maxDailyLossAmount,
    maxOverallDrawdownAmount: account.maxOverallDrawdownAmount,
    maxRiskPerTradePercent: account.maxRiskPerTradePercent,
    maxTradesPerDay: account.maxTradesPerDay,
    accountType: account.accountType,
    drawdownMode: account.drawdownMode,
  };
}

function compactTradesForAI(trades: ChallengeTradeDto[]) {
  return {
    totalSelectedTrades: trades.length,
    latestTrades: trades.slice(0, 12).map((trade) => ({
      date: trade.tradeDate,
      symbol: trade.symbol,
      session: trade.session,
      direction: trade.direction,
      result: trade.result,
      pnlAmount: trade.pnlAmount,
      riskPercent: trade.riskPercent,
      rrRealized: trade.rrRealized,
      setupName: trade.setupName,
      emotion: trade.emotionalState,
      mistake: trade.mistakeCategory,
      disciplineScore: trade.disciplineScore,
      notes: trade.evaluationNotes ? clampPromptText(trade.evaluationNotes, 180) : null,
    })),
  };
}

function isTimeoutError(error: unknown) {
  return error instanceof Error && (error.name === 'TimeoutError' || error.message.toLowerCase().includes('timeout'));
}

function filterTrades(scope: string, trades: ChallengeTradeDto[]) {
  const today = new Date().toISOString().slice(0, 10);
  const since = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString().slice(0, 10);
  };
  if (scope === 'today') return trades.filter((trade) => trade.tradeDate === today);
  if (scope === 'week') return trades.filter((trade) => trade.tradeDate >= since(7));
  if (scope === 'month') return trades.filter((trade) => trade.tradeDate >= since(30));
  if (scope === 'last_trade') return trades.slice(0, 1);
  if (scope === 'losses') return trades.filter((trade) => trade.result === 'loss');
  if (scope === 'mistakes') return trades.filter((trade) => trade.mistakeCategory && trade.mistakeCategory !== 'no_mistake');
  return trades;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentMember();
    if (!user) return apiError('AUTH_REQUIRED', 'Login member diperlukan', 401);
    const { accountId } = await context.params;
    const account = await service.getAccount(user.id, accountId);
    if (!account) return apiError('RESOURCE_NOT_FOUND', 'Challenge tidak ditemukan', 404);
    return apiSuccess({ reviews: await service.listAIReviews(user.id, accountId) });
  } catch (error) {
    console.error('[challenge-ai-review] GET failed', error);
    return apiErrorFromUnknown(error);
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentMember();
    if (!user) return apiError('AUTH_REQUIRED', 'Login member diperlukan', 401);
    const { accountId } = await context.params;
    const body = await request.json().catch(() => null) as Record<string, unknown> | null;
    const account = await service.getAccount(user.id, accountId);
    if (!account) return apiError('RESOURCE_NOT_FOUND', 'Challenge tidak ditemukan', 404);
    const trades = await service.listTrades(user.id, accountId);
    const reviewScope = String(body?.reviewScope ?? 'all');
    const selectedTrades = filterTrades(reviewScope, trades);
    const analytics = calculateChallengeAnalytics(trades);
    const riskStatus = calculateRiskStatus(account, trades);
    const personaPrompt = readTradingProfessionalPersona();
    const reviewStyle = String(body?.reviewStyle ?? 'Action plan');
    const userMessage = typeof body?.userMessage === 'string' ? body.userMessage : '';
    const previousReviews = await service.listAIReviews(user.id, accountId);
    const conversationHistory = buildConversationHistory(previousReviews);
    const prompts = buildAIReviewContext({
      challengeConfig: compactAccountForAI(account as unknown as Record<string, unknown>),
      trades: [compactTradesForAI(selectedTrades)] as unknown as Array<Record<string, unknown>>,
      analytics,
      riskStatus,
      selectedPersona: 'Trading Professional',
      customPersonaText: personaPrompt,
      reviewScope,
      reviewStyle,
      userMessage,
    });
    const systemPrompt = personaPrompt;
    const assistantResponse = await requestAIReview({ ...prompts, systemPrompt }, conversationHistory);
    const review = await service.createAIReview(user.id, accountId, {
      personaId: typeof body?.personaId === 'string' ? body.personaId : null,
      provider: configuredProvider,
      reviewScope,
      reviewStyle,
      userMessage,
      systemPrompt,
      contextPrompt: prompts.contextPrompt,
      userPrompt: prompts.userPrompt,
      assistantResponse,
    });
    return apiSuccess({ review, prompts: { ...prompts, systemPrompt } }, 201);
  } catch (error) {
    console.error('[challenge-ai-review] POST failed', error);
    if (isTimeoutError(error)) return apiError('AI_PROVIDER_TIMEOUT', 'AI provider timeout. Coba kirim ulang, atau gunakan pertanyaan yang lebih spesifik.', 504);
    if (error instanceof Error) return apiError('AI_REVIEW_FAILED', error.message, 502);
    return apiErrorFromUnknown(error);
  }
}
