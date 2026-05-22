import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { buildHertzPostSocialMetadata, HertzPostService } from '@shared/services/hertzPostService';
import { getCurrentMember } from '@/lib/memberAuth';
import { HertzFeedView } from '@/components/feed/HertzFeedView';

interface PageProps {
  params: Promise<{ shortId: string }>;
}

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { shortId } = await params;
  try {
    const post = await new HertzPostService().getPostDetail(shortId, null);
    return buildHertzPostSocialMetadata({
      shortId: post.shortId,
      authorName: post.author.name,
      contentText: post.content.text,
      imageUrl: post.media[0]?.url ?? null,
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
    }) as Metadata;
  } catch {
    return buildHertzPostSocialMetadata(null) as Metadata;
  }
}

/** Deep link: same HERTZ feed shell + post modal (SPA), not a separate full-page layout. */
export default async function HertzPostDetailPage({ params }: PageProps) {
  const { shortId } = await params;
  const viewer = await getCurrentMember();
  const feed = new HertzPostService();

  try {
    await feed.getPostDetail(shortId, viewer);
  } catch {
    notFound();
  }

  return <HertzFeedView currentUser={viewer} initialPostShortId={shortId} />;
}
