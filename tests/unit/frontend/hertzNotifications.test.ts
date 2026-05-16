import { describe, expect, it } from 'vitest';
import { getDmBadgeLabel } from '../../../frontend/src/components/hertz/MobileBottomNav';
import { getHertzActivityIndicatorCopy } from '../../../frontend/src/components/feed/HertzRightRail';

describe('HERTZ notification indicators', () => {
  it('formats DM badge labels compactly', () => {
    expect(getDmBadgeLabel(0)).toBe(null);
    expect(getDmBadgeLabel(4)).toBe('4');
    expect(getDmBadgeLabel(120)).toBe('99+');
  });

  it('shows a clear activity empty state', () => {
    expect(getHertzActivityIndicatorCopy(0)).toEqual({
      title: 'Aktivitas',
      body: 'Tidak ada DM baru.',
    });
  });
});
