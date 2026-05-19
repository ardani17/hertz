import { TabBar } from '@/components/ui/TabBar';
import { SearchIcon } from './HertzIcons';
import styles from './HertzHeader.module.css';

const categoryTabs = [
  { id: 'all', value: null, label: 'Semua' },
  { id: 'trading', value: 'trading_room', label: 'Trading' },
  { id: 'life', value: 'life_coffee', label: 'Life' },
  { id: 'general', value: 'general', label: 'Umum' },
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

  const sortItems = [
    { id: 'latest', label: 'Untuk Anda', href: forYouHref, active: activeSort === 'latest' },
    { id: 'trending', label: 'Trending', href: trendingHref, active: activeSort === 'trending' },
  ];

  const categoryItems = categoryTabs.map((tab) => ({
    id: tab.id,
    label: tab.label,
    href: hertzHref(tab.value),
    active: (tab.value ?? null) === (activeCategory ?? null),
  }));

  return (
    <div className={styles.header}>
      <div className={styles.top}>
        <TabBar items={sortItems} ariaLabel="Urutan feed HERTZ" />
      </div>
      <TabBar items={categoryItems} ariaLabel="Kategori HERTZ" />
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
          <a href={hertzHref(activeCategory ?? null)}>Hapus</a>
        </div>
      ) : null}
    </div>
  );
}
