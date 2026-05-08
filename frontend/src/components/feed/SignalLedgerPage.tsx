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
}

export function SignalLedgerPage({ posts, currentUser, activeCategory }: SignalLedgerPageProps) {
  return (
    <main className={styles.main}>
      <div className={styles.shell}>
        <SignalLeftRail currentUser={currentUser} />
        <section className={styles.timeline} aria-label="Signal Ledger timeline">
          <SignalLedgerHeader activeCategory={activeCategory} currentUser={currentUser} />
          <SignalComposer currentUser={currentUser} />
          <div className={styles.feed}>
            {posts.length > 0 ? posts.map((post) => (
              <SignalPostCard key={post.id} post={post} currentUser={currentUser} />
            )) : (
              <div className={styles.empty}>
                <h2>Belum ada signal</h2>
                <p>Postingan Telegram dan web member akan muncul di sini.</p>
              </div>
            )}
          </div>
        </section>
        <SignalRightRail currentUser={currentUser} />
      </div>
      <nav className={styles.mobileNav} aria-label="Mobile navigation">
        <a className={styles.mobileNavActive} href="/" aria-current="page"><PulseIcon /><span>Signal</span></a>
        <a href="/tools"><SearchIcon /><span>Tools</span></a>
        <a href="/gallery"><ImageIcon /><span>Gallery</span></a>
        <a href={currentUser ? '/admin' : '#telegram-login'}><UsersIcon /><span>{currentUser ? 'Profile' : 'Login'}</span></a>
      </nav>
    </main>
  );
}
