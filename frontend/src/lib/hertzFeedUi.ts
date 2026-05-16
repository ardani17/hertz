export const HERTZ_CARD_OUTLINE = 'rgba(19, 210, 123, 0.26)';

export interface HertzFeedStateCopy {
  title: string;
  body: string;
}

export function getHertzFeedEmptyState({
  activeSearch,
  activeCategory,
}: {
  activeSearch?: string | null;
  activeCategory?: string | null;
}): HertzFeedStateCopy {
  if (activeSearch) {
    return {
      title: 'Tidak ada hasil',
      body: `Belum ada post yang cocok dengan "${activeSearch}". Coba kata kunci, pair, atau hashtag lain.`,
    };
  }

  if (activeCategory) {
    return {
      title: 'Kategori masih kosong',
      body: 'Belum ada post di kategori ini. Jadilah member pertama yang mengisi timeline.',
    };
  }

  return {
    title: 'Belum ada post',
    body: 'Postingan Telegram dan web member akan muncul di sini.',
  };
}

export function getHertzFeedErrorState(message?: string | null): HertzFeedStateCopy {
  return {
    title: 'Feed belum bisa dimuat',
    body: message?.trim() || 'Terjadi gangguan saat mengambil timeline. Coba muat ulang halaman.',
  };
}
