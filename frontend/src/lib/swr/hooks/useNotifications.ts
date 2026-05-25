'use client';

import { mutate } from 'swr';
import { fetcher } from '../fetcher';
import { useResource } from './useResource';

export type NotificationSummary = { unreadCount: number };
export type NotificationItemData = {
  id: string;
  type?: string;
  title?: string;
  body?: string;
  href?: string;
  readAt?: string | null;
  createdAt?: string;
  post?: { preview?: string | null } | null;
  actor?: { displayName?: string } | null;
  [key: string]: unknown;
};
export type NotificationListData = { notifications: NotificationItemData[]; summary?: NotificationSummary };

export const NOTIFICATION_READ_ENDPOINT = '/api/hertz/notifications/read';
export const NOTIFICATION_SUMMARY_KEY = '/api/hertz/notifications/summary';
export const notificationListKey = (limit = 8) => `/api/hertz/notifications?limit=${limit}`;

function isNotificationListKey(key: unknown): key is string {
  return typeof key === 'string' && key.startsWith('/api/hertz/notifications?');
}

export function decrementUnreadSummary(current: NotificationSummary | undefined): NotificationSummary {
  return { unreadCount: Math.max(0, Number(current?.unreadCount ?? 0) - 1) };
}

export function markNotificationReadInList(
  data: NotificationListData | undefined,
  id: string,
  readAt: string,
): NotificationListData | undefined {
  if (!data?.notifications) return data;
  let didMark = false;
  const notifications = data.notifications.map((item) => {
    if (item.id !== id || item.readAt) return item;
    didMark = true;
    return { ...item, readAt };
  });
  if (!didMark) return data;
  return {
    ...data,
    notifications,
    summary: data.summary ? decrementUnreadSummary(data.summary) : data.summary,
  };
}

export function markAllNotificationsReadInList(
  data: NotificationListData | undefined,
  readAt: string,
): NotificationListData | undefined {
  if (!data?.notifications) return data;
  return {
    ...data,
    notifications: data.notifications.map((item) => ({
      ...item,
      readAt: item.readAt ?? readAt,
    })),
    summary: { unreadCount: 0 },
  };
}

export function useNotificationSummary(enabled = true) {
  return useResource<NotificationSummary>(enabled ? NOTIFICATION_SUMMARY_KEY : null, { refreshIntervalMs: 25_000 });
}

export function useNotificationList(limit = 8, enabled = true) {
  return useResource<NotificationListData>(enabled ? notificationListKey(limit) : null, { refreshIntervalMs: 25_000 });
}

export async function markNotificationRead(id: string) {
  const readAt = new Date().toISOString();
  await fetcher(NOTIFICATION_READ_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  });
  await Promise.all([
    mutate(NOTIFICATION_SUMMARY_KEY, (current) => decrementUnreadSummary(current), { revalidate: true }),
    mutate(isNotificationListKey, (current) => markNotificationReadInList(current, id, readAt), { revalidate: true }),
  ]);
}

export async function markAllNotificationsRead() {
  const readAt = new Date().toISOString();
  await fetcher(NOTIFICATION_READ_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  });
  await Promise.all([
    mutate(NOTIFICATION_SUMMARY_KEY, { unreadCount: 0 }, { revalidate: true }),
    mutate(isNotificationListKey, (current) => markAllNotificationsReadInList(current, readAt), { revalidate: true }),
  ]);
}
