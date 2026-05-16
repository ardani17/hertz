import type { HertzProfileActivity } from '@shared/services/hertzProfileService';

export const profileActivityTabKeys = ['posts', 'saved', 'reposts', 'comments', 'credit', 'session'] as const;

export type ProfileActivityTabKey = typeof profileActivityTabKeys[number];

export interface ProfileActivityTab {
  key: ProfileActivityTabKey;
  label: string;
  count: number | null;
}

export function getDefaultProfileActivityTab(): ProfileActivityTabKey {
  return 'posts';
}

export function getProfileActivityPanel(activity: HertzProfileActivity, active: ProfileActivityTabKey) {
  switch (active) {
    case 'saved':
      return { title: 'Disimpan', empty: 'Belum ada postingan yang disimpan.', items: activity.saved };
    case 'reposts':
      return { title: 'Repost saya', empty: 'Belum ada repost yang aktif.', items: activity.reposts };
    case 'comments':
      return { title: 'Komentar saya', empty: 'Belum ada komentar yang tercatat.', items: activity.comments };
    case 'credit':
      return { title: 'Credit/history', empty: 'Riwayat credit tampil di panel transaksi credit.', items: [] };
    case 'session':
      return { title: 'Setting Telegram/session', empty: 'Session Telegram aktif mengikuti login member saat ini.', items: [] };
    case 'posts':
    default:
      return { title: 'Post saya', empty: 'Belum ada postingan yang dibuat.', items: activity.posts };
  }
}
