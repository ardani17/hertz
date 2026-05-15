import type { Metadata } from 'next';
import { SignalLedgerPage } from '@/components/feed';
import { HertzPostService, normalizeHertzCategory } from '@shared/services/hertzPostService';
import { getCurrentMember } from '@/lib/memberAuth';
import type { SignalPost } from '@shared/types';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'HERTZ | Horizon',
  description: 'Social trading room Horizon untuk jurnal, chart setup, dan catatan komunitas.',
  alternates: { canonical: '/hertz' },
};

interface HertzPageProps {
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

export default async function HertzPage({ searchParams }: HertzPageProps) {
  const currentUser = await getCurrentMember();
  const params = await searchParams;
  const category = selectedCategory(params?.category);
  const search = params?.q?.trim() || null;
  const sort = params?.sort === 'trending' ? 'trending' : 'latest';
  let items: SignalPost[] = [];

  try {
    const feed = new HertzPostService();
    const result = await feed.listFeed({ viewer: currentUser, limit: 20, category, search, sort });
    items = result.items;
  } catch {
    items = [];
  }

  return <SignalLedgerPage posts={items} currentUser={currentUser} activeCategory={category} activeSearch={search} activeSort={sort} />;
}
