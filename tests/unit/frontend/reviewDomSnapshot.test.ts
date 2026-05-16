import { describe, expect, it } from 'vitest';
import { normalizeSnapshotText } from '../../../scripts/review-dom-snapshot.mjs';

describe('review DOM snapshot normalization', () => {
  it('stabilizes volatile market update timestamps', () => {
    expect(normalizeSnapshotText({
      ancestorClassName: '',
      className: 'HertzRails-module__hash__marketSource',
      tagName: 'p',
      text: 'GlobalData: Binance · Update 16.49 WIB',
    })).toBe('GlobalData: Binance · Update [time] WIB');
  });

  it('stabilizes volatile market prices and percentage values while keeping symbols readable', () => {
    expect(normalizeSnapshotText({
      ancestorClassName: 'HertzRails-module__hash__marketRow nested-container',
      className: '',
      tagName: 'b',
      text: '78,050.00',
    })).toBe('[market-price]');

    expect(normalizeSnapshotText({
      ancestorClassName: 'HertzRails-module__hash__mobileMarketItem',
      className: 'HertzRails-module__hash__down',
      tagName: 'em',
      text: '-2.96%',
    })).toBe('[market-change]');

    expect(normalizeSnapshotText({
      ancestorClassName: 'HertzRails-module__hash__marketRow',
      className: '',
      tagName: 'strong',
      text: 'BTC/USDT',
    })).toBe('BTC/USDT');
  });

  it('stabilizes relative post ages', () => {
    expect(normalizeSnapshotText({
      ancestorClassName: '',
      className: '',
      tagName: 'span',
      text: '7h',
    })).toBe('[relative-time]');
  });
});
