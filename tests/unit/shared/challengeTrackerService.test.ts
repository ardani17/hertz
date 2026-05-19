import { describe, expect, it } from 'vitest';
import { normalizeChallengeAccountInput, normalizeChallengeTradeInput } from '@shared/services/challengeTrackerService';

describe('challengeTrackerService normalization', () => {
  it('derives target and loss amounts from percentages', () => {
    const input = normalizeChallengeAccountInput({
      name: 'Phase 1',
      accountCurrency: 'USD',
      initialBalance: 10000,
      profitTargetPercent: 10,
      maxDailyLossPercent: 5,
      maxOverallDrawdownPercent: 10,
      accountType: 'evaluation',
      drawdownMode: 'static',
    });
    expect(input.profitTargetAmount).toBe(1000);
    expect(input.maxDailyLossAmount).toBe(500);
    expect(input.maxOverallDrawdownAmount).toBe(1000);
    expect(input.currentBalance).toBe(10000);
    expect(input.currentEquity).toBe(10000);
  });

  it('computes discipline score for trade input', () => {
    const trade = normalizeChallengeTradeInput(
      { tradeDate: '2026-05-19', symbol: 'XAUUSD', result: 'loss', pnlAmount: -100, followedPlan: false, mistakeCategory: 'bad_setup', emotionalState: 'fomo', riskPercent: 2, tradeQuality: 'd' },
      { maxRiskPerTradePercent: 1 },
    );
    expect(trade.disciplineScore).toBe(35);
  });
});
