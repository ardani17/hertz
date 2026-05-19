import type { MemberSessionUser, HertzPost, HertzPostCategory } from '@shared/types';
import { HertzLayout } from '@/components/layout/HertzLayout';
import { HertzComposer } from './HertzComposer';
import { HertzHeader } from './HertzHeader';
import { HertzPostCard } from './HertzPost';
import { getHertzFeedEmptyState, getHertzFeedErrorState } from '@/lib/hertzFeedUi';
import styles from './HertzFeedView.module.css';

export interface HertzFeedViewProps {
  posts: HertzPost[];
  currentUser: MemberSessionUser | null;
  activeCategory?: HertzPostCategory | string | null;
  activeSearch?: string | null;
  activeSort?: 'latest' | 'trending';
  errorMessage?: string | null;
}

export function HertzFeedView({
  posts,
  currentUser,
  activeCategory,
  activeSearch,
  activeSort = 'latest',
  errorMessage,
}: HertzFeedViewProps) {
  const stateCopy = errorMessage
    ? getHertzFeedErrorState(errorMessage)
    : getHertzFeedEmptyState({ activeCategory, activeSearch });

  return (
    <HertzLayout variant="feed" active="home" currentUser={currentUser}>
      <HertzHeader activeCategory={activeCategory} activeSearch={activeSearch} activeSort={activeSort} />
      <HertzComposer currentUser={currentUser} activeCategory={activeCategory} />
      <div className={styles.feed}>
        {posts.length > 0 ? (
          posts.map((post) => <HertzPostCard key={post.id} post={post} currentUser={currentUser} />)
        ) : (
          <div
            className={errorMessage ? `${styles.empty} ${styles.error}` : styles.empty}
            role={errorMessage ? 'alert' : 'status'}
          >
            <h2>{stateCopy.title}</h2>
            <p>{stateCopy.body}</p>
          </div>
        )}
      </div>
    </HertzLayout>
  );
}
