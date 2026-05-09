import styles from './SignalLedgerHeader.module.css';

const tabs = [
  { value: null, label: 'All', href: '/hertz' },
  { value: 'trading', label: 'Trading Room', href: '/hertz?category=trading' },
  { value: 'life_story', label: 'Life & Coffee', href: '/hertz?category=life_story' },
  { value: 'general', label: 'General', href: '/hertz?category=general' },
] as const;

export function SignalLedgerHeader({
  activeCategory,
}: {
  activeCategory?: string | null;
}) {
  return (
    <div className={styles.header}>
      <div className={styles.top}>
        <a className={styles.feedTitleActive} href="/hertz" aria-current="page">For You</a>
        <a className={styles.feedTitle} href="/hertz?sort=trending">Trending</a>
      </div>
      <nav className={styles.tabs} aria-label="HERTZ categories">
        {tabs.map((tab) => {
          const active = (tab.value ?? null) === (activeCategory ?? null);
          return (
            <a key={tab.label} href={tab.href} className={active ? styles.activeTab : ''}>
              {tab.label}
            </a>
          );
        })}
      </nav>
    </div>
  );
}
