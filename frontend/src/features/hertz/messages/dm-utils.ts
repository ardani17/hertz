import type { MemberSessionUser } from '@shared/types';

export const HERTZ_DM_POLL_INTERVAL_MS = 7000;

export const filterLabels = {
  inbox: 'Semua',
  unread: 'Belum dibaca',
  admin: 'Admin',
  archived: 'Arsip',
} as const;

export type DmMessageSide = 'incoming' | 'outgoing';

export function getDmAccessState(user: Pick<MemberSessionUser, 'id'> | null) {
  if (!user) {
    return {
      mode: 'guest' as const,
      title: 'Login Telegram untuk pesan langsung',
      body: 'Pesan langsung hanya tersedia untuk member HERTZ yang sudah login.',
    };
  }
  return {
    mode: 'member' as const,
    title: 'Pesan langsung',
    body: 'Percakapan privat antar member HERTZ.',
  };
}

export function canAddDmImages(currentCount: number, incomingCount: number) {
  return currentCount < 4 && currentCount + incomingCount <= 4;
}

export function getDmInitial(displayName: string | null | undefined, username: string | null | undefined) {
  return (displayName?.trim().charAt(0) || username?.trim().charAt(0) || 'H').toUpperCase();
}

export function getDmMessageSide(senderId: string, currentUserId: string | null | undefined): DmMessageSide {
  return senderId === currentUserId ? 'outgoing' : 'incoming';
}

export function getDmPreviewText(body: string | null | undefined, maxLength = 70) {
  const text = body?.trim() || 'Gambar';
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trimEnd()}...`;
}

export function formatDmTimestamp(value: string | null | undefined) {
  if (!value) return '';
  return new Date(value).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Ringkas untuk daftar percakapan (hari ini → jam, minggu ini → hari). */
export function formatDmListTime(value: string | null | undefined) {
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

export function getDmThreadMenuActions({ active, archived }: { active: boolean; archived: boolean }) {
  if (!active) return [];
  return [archived ? 'Buka arsip' : 'Arsipkan', 'Blokir'];
}
