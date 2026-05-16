import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { HertzPostService } from '@shared/services/hertzPostService';
import { getCurrentMember } from '@/lib/memberAuth';
import { HertzPostCard } from '@/components/feed/HertzPost';
import { HertzDetailInteractions } from '@/components/feed/HertzDetailInteractions';
import { HertzViewTracker } from '@/components/feed/HertzViewTracker';
import { HertzAppShell } from '@/components/hertz/HertzAppShell';
import { getHertzPostDetailMobileMarketPosition } from '@/lib/hertzPostDetailUi';
import styles from './post-detail.module.css';

interface PageProps {
  params: Promise<{ shortId: string }>;
}

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { shortId } = await params;
  return {
    title: `HERTZ ${shortId}`,
    alternates: { canonical: `/hertz/post/${shortId}` },
  };
}

export default async function HertzPostDetailPage({ params }: PageProps) {
  const { shortId } = await params;
  const viewer = await getCurrentMember();
  const feed = new HertzPostService();
  let post;
  try {
    post = await feed.getPostDetail(shortId, viewer);
  } catch {
    notFound();
  }

  return (
    <HertzAppShell
      active="home"
      title="HERTZ"
      description="Detail postingan HERTZ."
      currentUser={viewer}
      mobileMarketPosition={getHertzPostDetailMobileMarketPosition()}
    >
      <div className={styles.container}>
        <a className={styles.back} href="/hertz">Kembali ke HERTZ</a>
        <HertzViewTracker shortId={post.shortId} />
        <HertzPostCard post={post} currentUser={viewer} enableDesktopModal={false} />
        <HertzDetailInteractions post={post} currentUser={viewer} />
      </div>
    </HertzAppShell>
  );
}
