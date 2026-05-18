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
