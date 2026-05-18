import { describe, expect, it } from 'vitest';
import { getDmBadgeLabel } from '../../../frontend/src/components/hertz/MobileBottomNav';
import { getHertzActivityIndicatorCopy } from '../../../frontend/src/components/feed/HertzRightRail';
import { getNotificationActionCopy, getNotificationBadgeLabel } from '../../../frontend/src/lib/hertzNotifications';

describe('HERTZ notification indicators', () => {
  it('formats DM badge labels compactly', () => {
    expect(getDmBadgeLabel(0)).toBe(null);
    expect(getDmBadgeLabel(4)).toBe('4');
    expect(getDmBadgeLabel(120)).toBe('99+');
  });

  it('formats social notification badge labels compactly', () => {
    expect(getNotificationBadgeLabel(0)).toBe(null);
    expect(getNotificationBadgeLabel(9)).toBe('9');
    expect(getNotificationBadgeLabel(120)).toBe('99+');
  });

  it('shows a clear activity empty state', () => {
    expect(getHertzActivityIndicatorCopy({ unreadCount: 0, unreadDmCount: 0 })).toEqual({
      title: 'Aktivitas',
      body: 'Belum ada aktivitas baru.',
    });
  });

  it('builds Indonesian notification action copy', () => {
    expect(getNotificationActionCopy({ type: 'comment', actor: { displayName: 'Sari' } })).toBe('Sari mengomentari postingan Anda.');
    expect(getNotificationActionCopy({ type: 'dm', actor: null })).toBe('Anda menerima DM baru.');
  });
});
