export type HertzNotificationType = 'pulse' | 'comment' | 'repost' | 'quote' | 'dm';

export interface HertzNotificationDto {
  id: string;
  type: HertzNotificationType;
  href: string;
  readAt: string | Date | null;
  createdAt: string | Date;
  metadata?: Record<string, unknown>;
  actor?: { displayName: string; username?: string | null; avatarUrl?: string | null } | null;
  post?: { preview?: string | null } | null;
}

export function getNotificationBadgeLabel(count: number) {
  if (count <= 0) return null;
  return count > 99 ? '99+' : String(count);
}

export function getNotificationActionCopy(item: Pick<HertzNotificationDto, 'type' | 'actor'>) {
  const actor = item.actor?.displayName ?? 'Seseorang';
  if (item.type === 'pulse') return `${actor} menyukai postingan Anda.`;
  if (item.type === 'comment') return `${actor} mengomentari postingan Anda.`;
  if (item.type === 'repost') return `${actor} me-repost postingan Anda.`;
  if (item.type === 'quote') return `${actor} mengutip postingan Anda.`;
  return 'Anda menerima DM baru.';
}

export function formatNotificationTime(value: string | Date | null | undefined) {
  if (!value) return '';
  return new Date(value).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

/** Waktu ringkas untuk daftar notifikasi. */
export function formatNotificationListTime(value: string | Date | null | undefined) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const now = new Date();
  const sameDay =
    date.getDate() === now.getDate()
    && date.getMonth() === now.getMonth()
    && date.getFullYear() === now.getFullYear();
  if (sameDay) {
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  }
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);
  if (diffDays < 7) {
    return date.toLocaleDateString('id-ID', { weekday: 'short' });
  }
  return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
}

export function getNotificationTypeLabel(type: HertzNotificationType) {
  if (type === 'pulse') return 'Suka';
  if (type === 'comment') return 'Komentar';
  if (type === 'repost') return 'Repost';
  if (type === 'quote') return 'Kutipan';
  return 'DM';
}
