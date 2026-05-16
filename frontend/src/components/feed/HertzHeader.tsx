import styles from './HertzHeader.module.css';

const tabs = [
  { value: null, label: 'All' },
  { value: 'trading_room', label: 'Trading' },
  { value: 'life_coffee', label: 'Life' },
  { value: 'general', label: 'General' },
] as const;

export function HertzHeader({
  activeCategory,
  activeSearch,
  activeSort = 'latest',
}: {
  activeCategory?: string | null;
  activeSearch?: string | null;
  activeSort?: 'latest' | 'trending';
}) {
  function hertzHref(category: string | null, sort: 'latest' | 'trending' = activeSort) {
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (activeSearch) params.set('q', activeSearch);
    if (sort === 'trending') params.set('sort', 'trending');
    const query = params.toString();
    return query ? `/hertz?${query}` : '/hertz';
  }

  const searchParam = activeSearch ? `q=${encodeURIComponent(activeSearch)}` : '';
  const forYouHref = searchParam ? `/hertz?${searchParam}` : '/hertz';
  const trendingHref = `/hertz?${[searchParam, 'sort=trending'].filter(Boolean).join('&')}`;
  return (
    <div className={styles.header}>
      <div className={styles.top}>
        <a className={activeSort === 'latest' ? styles.feedTitleActive : styles.feedTitle} href={forYouHref} aria-current={activeSort === 'latest' ? 'page' : undefined}>For You</a>
        <a className={activeSort === 'trending' ? styles.feedTitleActive : styles.feedTitle} href={trendingHref} aria-current={activeSort === 'trending' ? 'page' : undefined}>Trending</a>
      </div>
      <nav className={styles.tabs} aria-label="HERTZ categories">
        {tabs.map((tab) => {
          const active = (tab.value ?? null) === (activeCategory ?? null);
          return (
            <a key={tab.label} href={hertzHref(tab.value)} className={active ? styles.activeTab : ''}>
              {tab.label}
            </a>
          );
        })}
      </nav>
      {activeSearch ? (
        <div className={styles.searchChip}>
          <span>Search: {activeSearch}</span>
          <a href="/hertz">Clear</a>
        </div>
      ) : null}
    </div>
  );
}
