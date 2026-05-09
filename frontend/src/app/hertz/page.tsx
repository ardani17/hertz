import type { Metadata } from 'next';
import { SignalLedgerPage } from '@/components/feed';
import { getHertzDemoPosts, getHertzDemoUser } from '@/components/feed/demoPosts';
import { HertzPostService, normalizeHertzCategory } from '@shared/services/hertzPostService';
import { getCurrentMember } from '@/lib/memberAuth';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'HERTZ | Horizon',
  description: 'Social trading room Horizon untuk jurnal, chart setup, dan catatan komunitas.',
  alternates: { canonical: '/hertz' },
};

interface HertzPageProps {
  searchParams?: Promise<{ category?: string }>;
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
  try {
    const feed = new HertzPostService();
    const result = await feed.listFeed({ viewer: currentUser, limit: 20, category });
    const items = result.items.length > 0 ? result.items : getHertzDemoPosts();
    const visualUser = result.items.length > 0 ? currentUser : (currentUser ?? getHertzDemoUser());
    return <SignalLedgerPage posts={items} currentUser={visualUser} activeCategory={category} />;
  } catch {
    return <SignalLedgerPage posts={getHertzDemoPosts()} currentUser={currentUser ?? getHertzDemoUser()} activeCategory={category} />;
  }
}
