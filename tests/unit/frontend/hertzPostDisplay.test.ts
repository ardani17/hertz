import { describe, expect, it } from 'vitest';
import { getHertzPostSpineKind } from '@/lib/hertzPostDisplay';

describe('getHertzPostSpineKind', () => {
  it('maps life categories to coffee', () => {
    expect(getHertzPostSpineKind('life_coffee')).toBe('life');
    expect(getHertzPostSpineKind('life_story')).toBe('life');
  });

  it('maps trading categories to chart', () => {
    expect(getHertzPostSpineKind('trading_room')).toBe('trading');
    expect(getHertzPostSpineKind('trading')).toBe('trading');
  });

  it('maps general categories to message', () => {
    expect(getHertzPostSpineKind('general')).toBe('general');
    expect(getHertzPostSpineKind('community_note')).toBe('general');
  });
});
