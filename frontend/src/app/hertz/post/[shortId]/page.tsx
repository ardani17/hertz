import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { HertzPostService } from '@shared/services/hertzPostService';
import { getCurrentMember } from '@/lib/memberAuth';
import { SignalPostCard } from '@/components/feed/SignalPost';
import { SignalDetailInteractions } from '@/components/feed/SignalDetailInteractions';
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
    <main className={styles.main}>
      <div className={styles.container}>
        <a className={styles.back} href="/hertz">Kembali ke HERTZ</a>
        <SignalPostCard post={post} currentUser={viewer} />
        <SignalDetailInteractions post={post} currentUser={viewer} />
      </div>
    </main>
  );
}
