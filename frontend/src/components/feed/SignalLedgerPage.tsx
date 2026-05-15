import type { MemberSessionUser, SignalPost } from '@shared/types';
import { SignalComposer } from './SignalComposer';
import { SignalLedgerHeader } from './SignalLedgerHeader';
import { SignalLeftRail } from './SignalLeftRail';
import { SignalPostCard } from './SignalPost';
import { SignalRightRail } from './SignalRightRail';
import { ImageIcon, PulseIcon, SearchIcon, UsersIcon } from './SignalIcons';
import styles from './SignalLedgerPage.module.css';

interface SignalLedgerPageProps {
  posts: SignalPost[];
  currentUser: MemberSessionUser | null;
  activeCategory?: string | null;
  activeSearch?: string | null;
  activeSort?: 'latest' | 'trending';
}

export function SignalLedgerPage({ posts, currentUser, activeCategory, activeSearch, activeSort = 'latest' }: SignalLedgerPageProps) {
  return (
    <main className={styles.main}>
      <div className={styles.shell}>
        <SignalLeftRail currentUser={currentUser} active="home" />
        <section className={styles.timeline} aria-label="HERTZ timeline">
          <SignalLedgerHeader activeCategory={activeCategory} activeSearch={activeSearch} activeSort={activeSort} />
          <SignalComposer currentUser={currentUser} />
          <div className={styles.feed}>
            {posts.length > 0 ? posts.map((post) => (
              <SignalPostCard key={post.id} post={post} currentUser={currentUser} />
            )) : (
              <div className={styles.empty}>
                <h2>Belum ada post</h2>
                <p>Postingan Telegram dan web member akan muncul di sini.</p>
              </div>
            )}
          </div>
        </section>
        <SignalRightRail activeSearch={activeSearch} />
      </div>
      <nav className={styles.mobileNav} aria-label="Mobile navigation">
        <a className={styles.mobileNavActive} href="/hertz" aria-current="page"><PulseIcon /><span>HERTZ</span></a>
        <a href="/tools"><SearchIcon /><span>Tools</span></a>
        <a href="/hertz/messages"><ImageIcon /><span>DM</span></a>
        <a href={currentUser ? '/admin' : '#telegram-login'}><UsersIcon /><span>{currentUser ? 'Profile' : 'Login'}</span></a>
      </nav>
    </main>
  );
}
