import { NextRequest } from 'next/server';
import { ChallengeTrackerService } from '@shared/services/challengeTrackerService';
import { apiError, apiErrorFromUnknown, apiSuccess } from '@/lib/apiResponse';
import { getCurrentMember } from '@/lib/memberAuth';
import { buildAIReviewContext, calculateChallengeAnalytics, calculateRiskStatus, defaultPersonas } from '@/components/tools/challengeTrackerModel';
import type { ChallengeTradeDto } from '@shared/types/challengeTracker';

interface RouteContext { params: Promise<{ accountId: string }> }
export const dynamic = 'force-dynamic';
const service = new ChallengeTrackerService();

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
    const selectedPersona = String(body?.selectedPersona ?? 'Calm Trading Mentor');
    const customPersonaText = typeof body?.customPersonaText === 'string' ? body.customPersonaText : '';
    const reviewStyle = String(body?.reviewStyle ?? 'Action plan');
    const userMessage = typeof body?.userMessage === 'string' ? body.userMessage : '';
    const prompts = buildAIReviewContext({
      challengeConfig: account,
      trades: selectedTrades as unknown as Array<Record<string, unknown>>,
      analytics,
      riskStatus,
      selectedPersona,
      customPersonaText,
      reviewScope,
      reviewStyle,
      userMessage,
    });
    const systemPrompt = customPersonaText.trim() || defaultPersonas[selectedPersona] || prompts.systemPrompt;
    const assistantResponse = 'AI Review belum terhubung ke provider. Context sudah berhasil dibuat dan siap dikirim ke adapter AI pilihan Anda.';
    const review = await service.createAIReview(user.id, accountId, {
      personaId: typeof body?.personaId === 'string' ? body.personaId : null,
      provider: typeof body?.provider === 'string' ? body.provider : 'mock',
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
    return apiErrorFromUnknown(error);
  }
}
