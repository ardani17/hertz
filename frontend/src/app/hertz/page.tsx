import type { Metadata } from 'next';
import { HertzFeedView } from '@/components/feed/HertzFeedView';
import { HertzPostService, normalizeHertzCategory } from '@shared/services/hertzPostService';
import { getCurrentMember } from '@/lib/memberAuth';
import type { HertzPost } from '@shared/types';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'HERTZ | Horizon',
  description: 'Social trading room Horizon untuk jurnal dan chart setup komunitas.',
  alternates: { canonical: '/hertz' },
};

interface HertzFeedRouteProps {
  searchParams?: Promise<{ category?: string; q?: string; sort?: string }>;
}

function selectedCategory(value?: string) {
  if (!value) return null;
  try {
    return normalizeHertzCategory(value);
  } catch {
    return null;
  }
}

export default async function HertzFeedRoute({ searchParams }: HertzFeedRouteProps) {
  const currentUser = await getCurrentMember();
  const params = await searchParams;
  const category = selectedCategory(params?.category);
  const search = params?.q?.trim() || null;
  const sort = params?.sort === 'trending' ? 'trending' : 'latest';
  let items: HertzPost[] = [];
  let errorMessage: string | null = null;

  try {
    const feed = new HertzPostService();
    const result = await feed.listFeed({ viewer: currentUser, limit: 20, category, search, sort });
    items = result.items;
  } catch {
    items = [];
    errorMessage = 'Timeline sedang tidak tersedia. Coba muat ulang beberapa saat lagi.';
  }

  return (
    <HertzFeedView
      posts={items}
      currentUser={currentUser}
      activeCategory={category}
      activeSearch={search}
      activeSort={sort}
      errorMessage={errorMessage}
    />
  );
}
