import { afterEach, describe, expect, it, vi } from 'vitest';
import { expectEnvelope, mockMemberSessionService, request, unmockCommon } from './helpers';

describe('mobile notifications contract', () => {
  afterEach(unmockCommon);

  it('lists notifications with summary', async () => {
    mockMemberSessionService();
    vi.doMock('@shared/services/hertzInAppNotificationService', () => ({
      HertzInAppNotificationService: vi.fn().mockImplementation(() => ({
        list: vi.fn(async () => ({ notifications: [], nextCursor: null, summary: { unreadCount: 0, hasUnread: false, unreadDmCount: 0, hasUnreadDm: false } })),
      })),
    }));
    const { GET } = await import('../../../frontend/src/app/api/mobile/v1/hertz/notifications/route');
    const body = await expectEnvelope(await GET(request('/api/mobile/v1/hertz/notifications', { headers: { authorization: 'Bearer valid-token' } })));
    expect(body.data.summary.unreadCount).toBe(0);
  });

  it('marks notifications read', async () => {
    mockMemberSessionService();
    vi.doMock('@shared/services/hertzInAppNotificationService', () => ({
      HertzInAppNotificationService: vi.fn().mockImplementation(() => ({
        markRead: vi.fn(async () => undefined),
        markAllRead: vi.fn(async () => undefined),
      })),
    }));
    const { POST } = await import('../../../frontend/src/app/api/mobile/v1/hertz/notifications/read/route');
    const body = await expectEnvelope(await POST(request('/api/mobile/v1/hertz/notifications/read', {
      method: 'POST',
      headers: { authorization: 'Bearer valid-token' },
      body: JSON.stringify({ ids: ['notif-1'] }),
    })));
    expect(body.data.marked).toBe(1);
  });

  it('returns notifications summary envelope', async () => {
    mockMemberSessionService();
    vi.doMock('@shared/services/hertzInAppNotificationService', () => ({
      HertzInAppNotificationService: vi.fn().mockImplementation(() => ({
        summary: vi.fn(async () => ({ unreadCount: 2, hasUnread: true, unreadDmCount: 1, hasUnreadDm: true })),
      })),
    }));
    const { GET } = await import('../../../frontend/src/app/api/mobile/v1/hertz/notifications/summary/route');
    const body = await expectEnvelope(await GET(request('/api/mobile/v1/hertz/notifications/summary', { headers: { authorization: 'Bearer valid-token' } })));
    expect(body.data.unreadCount).toBe(2);
  });
});

