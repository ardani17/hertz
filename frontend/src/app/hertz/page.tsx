import type { Metadata } from 'next';
import { HertzFeedView } from '@/components/feed/HertzFeedView';
import { normalizeHertzCategory } from '@shared/services/hertzPostService';
import { getCurrentMember } from '@/lib/memberAuth';

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

  return (
    <HertzFeedView
      currentUser={currentUser}
      activeCategory={category}
      activeSearch={search}
      activeSort={sort}
    />
  );
}
