export const hertzCategoryTabs = [
  { id: 'all', value: null, label: 'Semua' },
  { id: 'trading', value: 'trading_room', label: 'Trading' },
  { id: 'life', value: 'life_coffee', label: 'Life' },
  { id: 'general', value: 'general', label: 'Umum' },
] as const;

export function buildHertzFeedHref(options: {
  category?: string | null;
  search?: string | null;
  sort?: 'latest' | 'trending';
}) {
  const params = new URLSearchParams();
  if (options.category) params.set('category', options.category);
  if (options.search) params.set('q', options.search);
  if (options.sort === 'trending') params.set('sort', 'trending');
  const query = params.toString();
  return query ? `/hertz?${query}` : '/hertz';
}
