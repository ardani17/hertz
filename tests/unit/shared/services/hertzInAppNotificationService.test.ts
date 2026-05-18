import { describe, expect, it } from 'vitest';
import {
  buildHertzInAppNotificationSummary,
  getHertzNotificationHref,
  shouldNotifyRecipient,
} from '../../../../shared/services/hertzInAppNotificationService';

describe('HERTZ in-app notification helpers', () => {
  it('normalizes unread counts for badge summaries', () => {
    expect(buildHertzInAppNotificationSummary({ unreadCount: 3, unreadDmCount: 2 })).toEqual({
      unreadCount: 3,
      hasUnread: true,
      unreadDmCount: 2,
      hasUnreadDm: true,
    });

    expect(buildHertzInAppNotificationSummary({ unreadCount: -5, unreadDmCount: Number.NaN })).toEqual({
      unreadCount: 0,
      hasUnread: false,
      unreadDmCount: 0,
      hasUnreadDm: false,
    });
  });

  it('builds target hrefs from notification target metadata', () => {
    expect(getHertzNotificationHref({ type: 'dm', metadata: {}, postShortId: null })).toBe('/hertz/messages');
    expect(getHertzNotificationHref({ type: 'comment', metadata: { postShortId: 'hzx_live01' }, postShortId: null })).toBe('/hertz/post/hzx_live01');
    expect(getHertzNotificationHref({ type: 'pulse', metadata: {}, postShortId: 'hzx_short' })).toBe('/hertz/post/hzx_short');
    expect(getHertzNotificationHref({ type: 'quote', metadata: {}, postShortId: null })).toBe('/hertz');
  });

  it('skips self and missing-recipient notifications', () => {
    expect(shouldNotifyRecipient('user-1', 'user-2')).toBe(true);
    expect(shouldNotifyRecipient('user-1', 'user-1')).toBe(false);
    expect(shouldNotifyRecipient(null, 'user-2')).toBe(false);
  });
});
