import { describe, expect, it } from 'vitest';
import { buildSocialUrl } from '../../../shared/lib/socialLinks';
import {
  mapProfileRowToDto,
  TRADING_LEVEL_LABELS,
} from '../../../shared/types/memberProfile';
import { sanitizeMemberProfileInput } from '../../../shared/lib/memberProfileValidation';

describe('memberProfile validation', () => {
  it('accepts valid profile input', () => {
    expect(
      sanitizeMemberProfileInput({
        bio: 'Trader swing pasif.',
        location: 'Jakarta, ID',
        hobbies: ['hiking', 'fotografi'],
        socialLinks: { x: 'horizontrader', instagram: '' },
        tradingExperienceLevel: 'intermediate',
        tradingMarkets: ['forex', 'crypto'],
        tradingSinceYear: 2019,
        tradingStyle: 'Swing trading',
      }),
    ).toEqual({
      bio: 'Trader swing pasif.',
      location: 'Jakarta, ID',
      hobbies: ['hiking', 'fotografi'],
      socialLinks: { x: 'horizontrader' },
      tradingExperienceLevel: 'intermediate',
      tradingMarkets: ['forex', 'crypto'],
      tradingSinceYear: 2019,
      tradingStyle: 'Swing trading',
    });
  });

  it('rejects bio that is too long', () => {
    expect(() => sanitizeMemberProfileInput({ bio: 'a'.repeat(281) })).toThrow('Bio maksimal 280 karakter');
  });

  it('rejects invalid social handles', () => {
    expect(() =>
      sanitizeMemberProfileInput({
        socialLinks: { x: 'bad handle!' },
      }),
    ).toThrow('Handle x hanya boleh huruf, angka, titik, strip, dan underscore');
  });

  it('rejects unknown social platforms', () => {
    expect(() =>
      sanitizeMemberProfileInput({
        socialLinks: { tiktok: 'horizon' },
      }),
    ).toThrow('Platform sosial "tiktok" tidak didukung');
  });

  it('rejects more than eight hobbies', () => {
    expect(() =>
      sanitizeMemberProfileInput({
        hobbies: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'],
      }),
    ).toThrow('Maksimal 8 hobi');
  });

  it('maps database row to public profile dto', () => {
    const dto = mapProfileRowToDto({
      profile_bio: '  Bio singkat  ',
      profile_location: 'Bandung',
      profile_hobbies: ['travel', 'membaca'],
      profile_social_links: { youtube: 'horizontube', x: 'horizon' },
      profile_trading: {
        experienceLevel: 'advanced',
        markets: ['forex'],
        sinceYear: 2015,
        style: 'Position trading',
      },
      profile_updated_at: new Date('2026-05-20T00:00:00.000Z'),
    });

    expect(dto.bio).toBe('Bio singkat');
    expect(dto.location).toBe('Bandung');
    expect(dto.hobbies).toEqual(['travel', 'membaca']);
    expect(dto.socialLinks).toEqual({ youtube: 'horizontube', x: 'horizon' });
    expect(dto.trading.experienceLevel).toBe('advanced');
    expect(TRADING_LEVEL_LABELS[dto.trading.experienceLevel!]).toBe('Mahir');
    expect(dto.updatedAt).toBe('2026-05-20T00:00:00.000Z');
  });
});

describe('socialLinks helper', () => {
  it('builds safe platform urls from handles', () => {
    expect(buildSocialUrl('instagram', 'horizon.id')).toBe('https://instagram.com/horizon.id');
    expect(buildSocialUrl('telegram', 'horizon_group')).toBe('https://t.me/horizon_group');
  });
});
