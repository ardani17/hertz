import { beforeEach, describe, expect, it, vi } from 'vitest';

const { fetcherMock } = vi.hoisted(() => ({
  fetcherMock: vi.fn(),
}));

vi.mock('swr', () => ({
  mutate: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../../frontend/src/lib/swr/fetcher', () => ({
  fetcher: (...args: unknown[]) => fetcherMock(...args),
}));

import {
  NOTIFICATION_READ_ENDPOINT,
  decrementUnreadSummary,
  markAllNotificationsRead,
  markAllNotificationsReadInList,
  markNotificationRead,
  markNotificationReadInList,
} from '../../../frontend/src/lib/swr/hooks/useNotifications';

describe('notification mark-read helpers', () => {
  beforeEach(() => {
    fetcherMock.mockReset();
    fetcherMock.mockResolvedValue({ ok: true });
  });

  it('decrements unread summary without going below zero', () => {
    expect(decrementUnreadSummary({ unreadCount: 3 })).toEqual({ unreadCount: 2 });
    expect(decrementUnreadSummary({ unreadCount: 0 })).toEqual({ unreadCount: 0 });
    expect(decrementUnreadSummary(undefined)).toEqual({ unreadCount: 0 });
  });

  it('marks a single notification read in list cache and decrements summary', () => {
    const readAt = '2026-05-25T10:00:00.000Z';
    const next = markNotificationReadInList(
      {
        notifications: [
          { id: 'a', readAt: null },
          { id: 'b', readAt: null },
        ],
        summary: { unreadCount: 2 },
      },
      'a',
      readAt,
    );

    expect(next?.notifications[0]).toMatchObject({ id: 'a', readAt });
    expect(next?.notifications[1]).toMatchObject({ id: 'b', readAt: null });
    expect(next?.summary).toEqual({ unreadCount: 1 });
  });

  it('leaves list cache unchanged when notification is already read', () => {
    const current = {
      notifications: [{ id: 'a', readAt: '2026-05-25T09:00:00.000Z' }],
      summary: { unreadCount: 0 },
    };
    expect(markNotificationReadInList(current, 'a', '2026-05-25T10:00:00.000Z')).toBe(current);
  });

  it('marks all notifications read in list cache', () => {
    const readAt = '2026-05-25T10:00:00.000Z';
    const next = markAllNotificationsReadInList(
      {
        notifications: [
          { id: 'a', readAt: null },
          { id: 'b', readAt: '2026-05-25T09:00:00.000Z' },
        ],
        summary: { unreadCount: 1 },
      },
      readAt,
    );

    expect(next?.notifications[0]).toMatchObject({ id: 'a', readAt });
    expect(next?.notifications[1]).toMatchObject({ id: 'b', readAt: '2026-05-25T09:00:00.000Z' });
    expect(next?.summary).toEqual({ unreadCount: 0 });
  });

  it('posts to the shared read endpoint with notification id in body', async () => {
    await markNotificationRead('notif-123');

    expect(fetcherMock).toHaveBeenCalledTimes(1);
    expect(fetcherMock).toHaveBeenCalledWith(
      NOTIFICATION_READ_ENDPOINT,
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: 'notif-123' }),
      }),
    );
    expect(fetcherMock.mock.calls[0]?.[0]).toBe('/api/hertz/notifications/read');
    expect(String(fetcherMock.mock.calls[0]?.[0])).not.toContain('notif-123');
  });

  it('marks all notifications read through the shared endpoint', async () => {
    await markAllNotificationsRead();

    expect(fetcherMock).toHaveBeenCalledWith(
      NOTIFICATION_READ_ENDPOINT,
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      }),
    );
  });
});
