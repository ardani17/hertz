import { TabBar } from '@/components/ui/TabBar';
import { buildHertzFeedHref } from '@/lib/hertzFeedNav';
import { SearchIcon } from './HertzIcons';
import styles from './HertzHeader.module.css';

export function HertzHeader({
  activeCategory,
  activeSearch,
  activeSort = 'latest',
}: {
  activeCategory?: string | null;
  activeSearch?: string | null;
  activeSort?: 'latest' | 'trending';
}) {
  const forYouHref = buildHertzFeedHref({
    category: activeCategory ?? null,
    search: activeSearch ?? null,
    sort: 'latest',
  });
  const trendingHref = buildHertzFeedHref({
    category: activeCategory ?? null,
    search: activeSearch ?? null,
    sort: 'trending',
  });

  const sortItems = [
    { id: 'latest', label: 'Untuk Anda', href: forYouHref, active: activeSort === 'latest' },
    { id: 'trending', label: 'Trending', href: trendingHref, active: activeSort === 'trending' },
  ];

  return (
    <div className={styles.header}>
      <div className={styles.navRow}>
        <TabBar
          items={sortItems}
          ariaLabel="Urutan feed HERTZ"
          align="center"
          variant="feedSort"
        />
      </div>
      <form className={styles.mobileSearch} action="/hertz" method="get" role="search">
        {activeCategory ? <input type="hidden" name="category" value={activeCategory} /> : null}
        {activeSort === 'trending' ? <input type="hidden" name="sort" value="trending" /> : null}
        <label className={styles.mobileSearchLabel} htmlFor="hertz-mobile-search">
          <SearchIcon />
          <span className={styles.srOnly}>Cari di HERTZ</span>
        </label>
        <input
          id="hertz-mobile-search"
          type="search"
          name="q"
          defaultValue={activeSearch ?? ''}
          placeholder="Cari postingan, member, pair..."
          autoComplete="off"
          enterKeyHint="search"
        />
      </form>
      {activeSearch ? (
        <div className={styles.searchChip}>
          <span>Pencarian: {activeSearch}</span>
          <a href={buildHertzFeedHref({ category: activeCategory ?? null, sort: activeSort })}>Hapus</a>
        </div>
      ) : null}
    </div>
  );
}
