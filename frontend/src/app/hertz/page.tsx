import type { Metadata } from 'next';
import { SignalLedgerPage } from '@/components/feed';
import { getHertzDemoPosts, getHertzDemoUser } from '@/components/feed/demoPosts';
import { FeedService } from '@shared/services/feedService';
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

export default async function HertzPage({ searchParams }: HertzPageProps) {
  const currentUser = await getCurrentMember();
  const params = await searchParams;
  const category = params?.category && ['trading', 'life_story', 'general'].includes(params.category)
    ? params.category
    : null;
  try {
    const feed = new FeedService();
    const result = await feed.listFeed({ viewer: currentUser, limit: 20, category });
    const items = result.items.length > 0 ? result.items : getHertzDemoPosts();
    const visualUser = result.items.length > 0 ? currentUser : (currentUser ?? getHertzDemoUser());
    return <SignalLedgerPage posts={items} currentUser={visualUser} activeCategory={category} />;
  } catch {
    return <SignalLedgerPage posts={getHertzDemoPosts()} currentUser={currentUser ?? getHertzDemoUser()} activeCategory={category} />;
  }
}
