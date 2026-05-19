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

export function getDmThreadMenuActions({ active, archived }: { active: boolean; archived: boolean }) {
  if (!active) return [];
  return [archived ? 'Buka arsip' : 'Arsipkan', 'Blokir'];
}
