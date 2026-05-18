import { describe, expect, it } from 'vitest';
import {
  analyzeSimulation,
  buildInputsFromPreset,
  normalizeInputs,
  parseBalanceInput,
  runSimulation,
  type Inputs,
} from '@/components/tools/profitabilityModel';

const baseInputs: Inputs = {
  balance: 10000,
  riskPercent: 1,
  winRate: 45,
  rewardRisk: 2,
  trades: 40,
  simulations: 300,
};

describe('profitability model', () => {
  it('clamps unsafe inputs into supported ranges', () => {
    const normalized = normalizeInputs(
      {
        balance: 10,
        riskPercent: 0,
        winRate: 120,
        rewardRisk: 50,
        trades: 0,
        simulations: 10,
      },
      'IDR',
    );

    expect(normalized).toEqual({
      balance: 100000,
      riskPercent: 0.1,
      winRate: 100,
      rewardRisk: 20,
      trades: 1,
      simulations: 100,
    });
  });

  it('parses IDR and decimal currency formats', () => {
    expect(parseBalanceInput('10.500.000', 'IDR')).toBe(10500000);
    expect(parseBalanceInput('1,250.75', 'USD_USC')).toBe(1250.75);
    expect(parseBalanceInput('1.250,75', 'USD_USC')).toBe(1250.75);
  });

  it('runs deterministic simulations for the same seed', () => {
    const first = runSimulation(baseInputs, 99, 'USD_USC');
    const second = runSimulation(baseInputs, 99, 'USD_USC');

    expect(first.average).toBeCloseTo(second.average, 8);
    expect(first.tradeDetails).toEqual(second.tradeDetails);
    expect(first.finalBalances).toHaveLength(300);
    expect(first.drawdowns).toHaveLength(300);
    expect(first.profitablePct).toBeGreaterThan(0);
  });

  it('reports danger for oversized negative-expectancy setups', () => {
    const inputs = normalizeInputs(
      {
        balance: 10000,
        riskPercent: 5,
        winRate: 25,
        rewardRisk: 1,
        trades: 100,
        simulations: 500,
      },
      'USD_USC',
    );
    const result = runSimulation(inputs, 123, 'USD_USC');
    const analysis = analyzeSimulation(inputs, result, 'balanced');

    expect(analysis.riskLevel).toBe('danger');
    expect(analysis.warnings).toContain('negative_expectancy');
    expect(analysis.riskRecommendation).toBeLessThan(inputs.riskPercent);
  });

  it('keeps prop firm preset conservative', () => {
    const presetInputs = buildInputsFromPreset(baseInputs, 'prop_firm_safe');
    const normalized = normalizeInputs(presetInputs, 'USD_USC');
    const result = runSimulation(normalized, 77, 'USD_USC');
    const analysis = analyzeSimulation(normalized, result, 'prop_firm_safe');

    expect(normalized.riskPercent).toBeLessThanOrEqual(0.5);
    expect(analysis.riskRecommendation).toBeLessThanOrEqual(0.75);
  });
});
