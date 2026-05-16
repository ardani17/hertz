import type { HertzPostCategory } from '@shared/types';

export type HertzPostSpineKind = 'life' | 'trading' | 'general';

export function getHertzPostSpineKind(category: HertzPostCategory): HertzPostSpineKind {
  if (category === 'life_coffee' || category === 'life_story') return 'life';
  if (category === 'trading_room' || category === 'trading') return 'trading';
  return 'general';
}
