import type { MemberSessionUser, HertzPost, HertzPostCategory } from '@shared/types';
import { HertzComposer } from './HertzComposer';
import { HertzHeader } from './HertzHeader';
import { HertzLeftRail } from './HertzLeftRail';
import { HertzPostCard } from './HertzPost';
import { HertzRightRail } from './HertzRightRail';
import { MobileBottomNav } from '@/components/hertz/MobileBottomNav';
import { getHertzFeedEmptyState, getHertzFeedErrorState } from '@/lib/hertzFeedUi';
import styles from './HertzPage.module.css';

interface HertzPageProps {
  posts: HertzPost[];
  currentUser: MemberSessionUser | null;
  activeCategory?: HertzPostCategory | string | null;
  activeSearch?: string | null;
  activeSort?: 'latest' | 'trending';
  errorMessage?: string | null;
}

export function HertzPage({ posts, currentUser, activeCategory, activeSearch, activeSort = 'latest', errorMessage }: HertzPageProps) {
  const stateCopy = errorMessage
    ? getHertzFeedErrorState(errorMessage)
    : getHertzFeedEmptyState({ activeCategory, activeSearch });

  return (
    <main className={styles.main}>
      <div className={styles.shell}>
        <HertzLeftRail currentUser={currentUser} active="home" />
        <section className={styles.timeline} aria-label="HERTZ timeline">
          <HertzHeader activeCategory={activeCategory} activeSearch={activeSearch} activeSort={activeSort} />
          <HertzComposer currentUser={currentUser} activeCategory={activeCategory} />
          <div className={styles.feed}>
            {posts.length > 0 ? posts.map((post) => (
              <HertzPostCard key={post.id} post={post} currentUser={currentUser} />
            )) : (
              <div className={errorMessage ? `${styles.empty} ${styles.error}` : styles.empty} role={errorMessage ? 'alert' : 'status'}>
                <h2>{stateCopy.title}</h2>
                <p>{stateCopy.body}</p>
              </div>
            )}
          </div>
        </section>
        <HertzRightRail activeSearch={activeSearch} />
      </div>
      <MobileBottomNav active="home" currentUser={currentUser} />
    </main>
  );
}
