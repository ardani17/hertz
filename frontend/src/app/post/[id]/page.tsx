import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { FeedService } from '@shared/services/feedService';
import { getCurrentMember } from '@/lib/memberAuth';
import { SignalPostCard } from '@/components/feed/SignalPost';
import { SignalDetailInteractions } from '@/components/feed/SignalDetailInteractions';
import styles from './post-detail.module.css';

interface PageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Signal ${id.slice(0, 8)}`,
    alternates: { canonical: `/post/${id}` },
  };
}

export default async function PostDetailPage({ params }: PageProps) {
  const { id } = await params;
  const viewer = await getCurrentMember();
  const feed = new FeedService();
  let post;
  try {
    post = await feed.getPostDetail(id, viewer);
  } catch {
    notFound();
  }

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <a className={styles.back} href="/">Kembali</a>
        <SignalPostCard post={post} currentUser={viewer} />
        <SignalDetailInteractions post={post} currentUser={viewer} />
      </div>
    </main>
  );
}
