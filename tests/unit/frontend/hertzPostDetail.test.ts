import { describe, expect, it } from 'vitest';
import {
  getHertzPostDetailMobileMarketPosition,
  shouldOpenDesktopPostModal,
} from '../../../frontend/src/components/feed/HertzPostDetailModal';

describe('HERTZ post detail behavior', () => {
  it('opens the detail modal only on desktop width', () => {
    expect(shouldOpenDesktopPostModal(1280)).toBe(true);
    expect(shouldOpenDesktopPostModal(1025)).toBe(true);
    expect(shouldOpenDesktopPostModal(1024)).toBe(false);
    expect(shouldOpenDesktopPostModal(390)).toBe(false);
  });

  it('keeps mobile detail route focused on the post before market widgets', () => {
    expect(getHertzPostDetailMobileMarketPosition()).toBe('after');
  });
});
