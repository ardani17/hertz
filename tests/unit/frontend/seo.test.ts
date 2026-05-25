import { describe, expect, it } from 'vitest';
import { buildHertzPostSocialMetadata } from '../../../shared/services/hertzPostService';

describe('HERTZ post social metadata', () => {
  it('uses post author and content instead of only the short id', () => {
    const metadata = buildHertzPostSocialMetadata({
      shortId: 'hz_123',
      authorName: 'ARDANI | vastara.id',
      contentText: 'Setup XAUUSD pullback area London session dengan risk ketat.',
      imageUrl: '/uploads/chart.png',
      siteUrl: 'https://hertz.cloudnexify.com',
    });

    expect(metadata.title).toContain('ARDANI | vastara.id');
    expect(metadata.description).toBe('Setup XAUUSD pullback area London session dengan risk ketat.');
    expect(metadata.alternates).toEqual({ canonical: 'https://hertz.cloudnexify.com/hertz/post/hz_123' });
    expect(metadata.openGraph?.url).toBe('https://hertz.cloudnexify.com/hertz/post/hz_123');
    expect(metadata.twitter?.card).toBe('summary_large_image');
  });

  it('uses a safe fallback for hidden or missing posts', () => {
    expect(buildHertzPostSocialMetadata(null).title).toBe('HERTZ post');
  });
});
