import { describe, expect, it, vi } from 'vitest';
import {
  buildCanonicalPostUrl,
  buildHertzShareTargets,
  canUseNativeShare,
} from '../../../frontend/src/components/feed/HertzShareSheet';

describe('HERTZ share sheet targets', () => {
  it('builds canonical social share targets for a HERTZ post', () => {
    const canonicalUrl = buildCanonicalPostUrl('hz_abc', 'https://horizon.cloudnexify.com');
    const targets = buildHertzShareTargets({
      shortId: 'hz_abc',
      text: 'Setup XAUUSD #gold',
      origin: 'https://horizon.cloudnexify.com',
    });

    expect(canonicalUrl).toBe('https://horizon.cloudnexify.com/hertz/post/hz_abc');
    expect(targets.map((target) => target.label)).toEqual(['Telegram', 'WhatsApp', 'X', 'Facebook']);
    expect(targets[0].href).toContain('https://t.me/share/url?');
    expect(targets[0].href).toContain(encodeURIComponent(canonicalUrl));
    expect(targets[1].href).toContain('https://wa.me/?text=');
    expect(targets[2].href).toContain('https://twitter.com/intent/tweet?');
    expect(targets[3].href).toContain('https://www.facebook.com/sharer/sharer.php?');
  });

  it('only enables native share when the browser exposes navigator.share', () => {
    expect(canUseNativeShare({ share: vi.fn() })).toBe(true);
    expect(canUseNativeShare({ clipboard: { writeText: vi.fn() } })).toBe(false);
    expect(canUseNativeShare(null)).toBe(false);
  });
});
