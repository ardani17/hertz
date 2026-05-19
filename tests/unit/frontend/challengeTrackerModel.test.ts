import { describe, expect, it } from 'vitest';
import {
  buildAIReviewContext,
  calculateChallengeAnalytics,
  calculateDisciplineScore,
  calculateRiskStatus,
  challengePresets,
} from '@/components/tools/challengeTrackerModel';

describe('challengeTrackerModel', () => {
  it('computes discipline score penalties', () => {
    const score = calculateDisciplineScore(
      {
        followedPlan: false,
        mistakeCategory: 'moved_sl',
        emotionalState: 'revenge',
        riskPercent: 2.5,
        tradeQuality: 'c',
      },
      { maxRiskPerTradePercent: 1 },
    );
    expect(score).toBe(35);
  });

  it('returns failed risk status when daily loss breaches limit', () => {
    const status = calculateRiskStatus(
      { initialBalance: 10000, currentBalance: 9450, currentEquity: 9450, maxDailyLossAmount: 500, maxOverallDrawdownAmount: 1000, maxTradesPerDay: 5, maxRiskPerTradePercent: 1 },
      [{ tradeDate: '2026-05-19', pnlAmount: -550, result: 'loss', riskPercent: 0.5 }],
      '2026-05-19',
    );
    expect(status.status).toBe('failed');
    expect(status.dailyLossUsagePct).toBeGreaterThan(100);
  });

  it('calculates analytics from journal trades', () => {
    const analytics = calculateChallengeAnalytics([
      { tradeDate: '2026-05-19', symbol: 'XAUUSD', session: 'london', result: 'win', pnlAmount: 200, rrRealized: 2, setupName: 'breakout' },
      { tradeDate: '2026-05-19', symbol: 'XAUUSD', session: 'london', result: 'loss', pnlAmount: -100, rrRealized: -1, setupName: 'breakout' },
      { tradeDate: '2026-05-20', symbol: 'EURUSD', session: 'asia', result: 'be', pnlAmount: 0, rrRealized: 0, setupName: 'retest' },
    ]);
    expect(analytics.totalTrades).toBe(3);
    expect(analytics.winRate).toBeCloseTo(33.333, 2);
    expect(analytics.netProfit).toBe(100);
    expect(analytics.profitFactor).toBe(2);
  });

  it('builds AI review context with persona, account, analytics, and user prompt', () => {
    const context = buildAIReviewContext({
      challengeConfig: { name: 'Phase 1', accountCurrency: 'USD', initialBalance: 10000 },
      trades: [{ symbol: 'XAUUSD', result: 'loss', pnlAmount: -100 }],
      analytics: { totalTrades: 1, netProfit: -100, winRate: 0 },
      riskStatus: { status: 'warning', warnings: ['Daily loss mendekati batas.'] },
      selectedPersona: 'Risk Manager',
      customPersonaText: '',
      reviewScope: 'last_trade',
      reviewStyle: 'Action plan',
      userMessage: 'Review trade terakhir saya.',
    });
    expect(context.systemPrompt.toLowerCase()).toContain('risk manager');
    expect(context.contextPrompt).toContain('Phase 1');
    expect(context.userPrompt).toContain('Review trade terakhir saya.');
  });

  it('exposes creation presets', () => {
    expect(challengePresets.map((preset) => preset.id)).toContain('prop_firm_standard');
    expect(challengePresets.map((preset) => preset.id)).toContain('custom_manual');
  });
});
