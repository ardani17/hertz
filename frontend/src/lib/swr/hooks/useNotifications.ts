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

export const NOTIFICATION_SUMMARY_KEY = '/api/hertz/notifications/summary';
export const notificationListKey = (limit = 8) => `/api/hertz/notifications?limit=${limit}`;

export function useNotificationSummary(enabled = true) {
  return useResource<NotificationSummary>(enabled ? NOTIFICATION_SUMMARY_KEY : null, { refreshIntervalMs: 25_000 });
}

export function useNotificationList(limit = 8, enabled = true) {
  return useResource<NotificationListData>(enabled ? notificationListKey(limit) : null, { refreshIntervalMs: 25_000 });
}

export async function markAllNotificationsRead() {
  const result = await fetcher('/api/hertz/notifications/read', { method: 'POST' });
  await Promise.all([mutate(NOTIFICATION_SUMMARY_KEY), mutate((key) => typeof key === 'string' && key.startsWith('/api/hertz/notifications?'))]);
  return result;
}
