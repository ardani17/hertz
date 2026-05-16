import { describe, expect, it } from 'vitest';
import { getFocusTrapNextIndex } from '../../../frontend/src/lib/focusTrap';

describe('focus trap helpers', () => {
  it('wraps Tab from the last focusable element to the first', () => {
    expect(getFocusTrapNextIndex({ currentIndex: 2, itemCount: 3, backwards: false })).toBe(0);
  });

  it('wraps Shift+Tab from the first focusable element to the last', () => {
    expect(getFocusTrapNextIndex({ currentIndex: 0, itemCount: 3, backwards: true })).toBe(2);
  });

  it('starts at the correct edge when current focus is outside the trap', () => {
    expect(getFocusTrapNextIndex({ currentIndex: -1, itemCount: 3, backwards: false })).toBe(0);
    expect(getFocusTrapNextIndex({ currentIndex: -1, itemCount: 3, backwards: true })).toBe(2);
  });
});
