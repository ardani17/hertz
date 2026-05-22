export type HertzFeedSort = 'latest' | 'trending';

export type HertzFeedFilters = {
  category: string | null;
  search: string | null;
  sort: HertzFeedSort;
};

export type HertzFeedFilterPatch = Partial<HertzFeedFilters>;

const VALID_CATEGORIES = new Set(['trading_room', 'life_coffee', 'general', 'trading', 'life_story']);

export function parseHertzFeedCategory(value: string | null): string | null {
  if (!value) return null;
  if (value === 'trading') return 'trading_room';
  if (value === 'life_story') return 'life_coffee';
  return VALID_CATEGORIES.has(value) ? value : null;
}

export function hasHertzFeedQueryParams(search: string): boolean {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  return ['category', 'q', 'sort'].some((key) => params.has(key));
}
