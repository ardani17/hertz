import { describe, expect, it, vi } from 'vitest';
import {
  SHARE_LINK_ERROR_MESSAGE,
  SHARE_LINK_SUCCESS_MESSAGE,
  buildCanonicalPostUrl,
  copyShareLinkWithFeedback,
  copyTextToClipboard,
} from '../../../frontend/src/lib/shareLink';

describe('share link helpers', () => {
  it('builds canonical HERTZ post URLs', () => {
    expect(buildCanonicalPostUrl('hz_abc', 'https://horizon.cloudnexify.com')).toBe(
      'https://horizon.cloudnexify.com/hertz/post/hz_abc',
    );
    expect(buildCanonicalPostUrl('hz_abc', 'https://horizon.cloudnexify.com/')).toBe(
      'https://horizon.cloudnexify.com/hertz/post/hz_abc',
    );
  });

  it('copies text to the clipboard when available', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });

    await expect(copyTextToClipboard('https://example.com/post/1')).resolves.toBe(true);
    expect(writeText).toHaveBeenCalledWith('https://example.com/post/1');

    vi.unstubAllGlobals();
  });

  it('returns false when clipboard write fails', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('denied'));
    vi.stubGlobal('navigator', { clipboard: { writeText } });

    await expect(copyTextToClipboard('https://example.com/post/1')).resolves.toBe(false);

    vi.unstubAllGlobals();
  });

  it('shows HERTZ-style toast feedback after copying a share link', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    const showToast = vi.fn();
    vi.stubGlobal('navigator', { clipboard: { writeText } });

    await expect(copyShareLinkWithFeedback('https://example.com/blog/post', showToast)).resolves.toBe(true);
    expect(showToast).toHaveBeenCalledWith(SHARE_LINK_SUCCESS_MESSAGE, 'success');

    writeText.mockRejectedValueOnce(new Error('denied'));
    await expect(copyShareLinkWithFeedback('https://example.com/blog/post', showToast)).resolves.toBe(false);
    expect(showToast).toHaveBeenCalledWith(SHARE_LINK_ERROR_MESSAGE, 'error');

    vi.unstubAllGlobals();
  });
});
