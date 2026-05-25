'use client';

import { useEffect, useRef } from 'react';
import type { HertzPost, MemberSessionUser } from '@shared/types';
import { HertzPostCard } from '@/components/feed/HertzPost';
import { HertzPostCardSkeleton } from '@/components/feed/HertzPostCardSkeleton';
import { useAuthorPostsFeed } from '@/lib/swr/hooks/useAuthorPostsFeed';
import feedStyles from '@/components/feed/HertzFeedView.module.css';
import styles from './PublicProfileView.module.css';

export function PublicProfilePosts({
  username,
  currentUser,
  initialPosts,
  initialNextCursor,
}: {
  username: string;
  currentUser: MemberSessionUser | null;
  initialPosts: HertzPost[];
  initialNextCursor: string | null;
}) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const {
    posts,
    error,
    isLoadingInitialData,
    isLoadingMore,
    hasReachedEnd,
    loadMore,
    retry,
  } = useAuthorPostsFeed({
    username,
    initialPosts,
    initialNextCursor,
  });

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || hasReachedEnd || isLoadingMore) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) loadMore();
      },
      { rootMargin: '600px 0px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasReachedEnd, isLoadingMore, loadMore]);

  return (
    <section className={styles.postsSection}>
      <h3>Postingan</h3>
      <div className={feedStyles.feed}>
        {isLoadingInitialData ? (
          Array.from({ length: 2 }).map((_, index) => <HertzPostCardSkeleton key={index} />)
        ) : posts.length > 0 ? (
          posts.map((post) => <HertzPostCard key={post.id} post={post} currentUser={currentUser} />)
        ) : (
          <p className={styles.emptyPosts}>Belum ada postingan publik.</p>
        )}
        {error ? (
          <button type="button" className={feedStyles.retry} onClick={() => void retry()}>
            Coba lagi
          </button>
        ) : null}
        {isLoadingMore ? <HertzPostCardSkeleton /> : null}
        {!hasReachedEnd && posts.length > 0 ? <div ref={sentinelRef} aria-hidden="true" /> : null}
        {hasReachedEnd && posts.length > 0 ? <p className={feedStyles.endMarker}>Akhir postingan</p> : null}
      </div>
    </section>
  );
}
