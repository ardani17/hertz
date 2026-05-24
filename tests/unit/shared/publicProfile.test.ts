import { describe, expect, it } from 'vitest';
import { mapProfileRowToDto } from '../../../shared/types/memberProfile';

describe('public profile dto mapping', () => {
  it('includes editable profile fields for public visitors', () => {
    const profile = mapProfileRowToDto({
      profile_bio: 'Fokus edukasi pasar.',
      profile_location: 'Surabaya',
      profile_hobbies: ['travel', 'coding'],
      profile_social_links: { tradingview: 'horizon_chart' },
      profile_trading: {
        experienceLevel: 'professional',
        markets: ['forex', 'indices'],
        sinceYear: 2012,
        style: 'Multi-timeframe',
      },
      profile_updated_at: new Date('2026-05-21T12:00:00.000Z'),
    });

    expect(profile).toMatchObject({
      bio: 'Fokus edukasi pasar.',
      location: 'Surabaya',
      hobbies: ['travel', 'coding'],
      socialLinks: { tradingview: 'horizon_chart' },
      trading: {
        experienceLevel: 'professional',
        markets: ['forex', 'indices'],
        sinceYear: 2012,
        style: 'Multi-timeframe',
      },
    });
  });
});
