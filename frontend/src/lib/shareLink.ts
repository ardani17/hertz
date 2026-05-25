export function buildCanonicalPostUrl(shortId: string, origin: string) {
  return `${origin.replace(/\/$/, '')}/hertz/post/${shortId}`;
}

export const SHARE_LINK_SUCCESS_MESSAGE = 'Link disalin.';
export const SHARE_LINK_ERROR_MESSAGE = 'Link gagal disalin.';

export async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export async function copyShareLinkWithFeedback(
  url: string,
  showToast: (message: string, type?: 'success' | 'error') => void,
): Promise<boolean> {
  const copied = await copyTextToClipboard(url);
  showToast(
    copied ? SHARE_LINK_SUCCESS_MESSAGE : SHARE_LINK_ERROR_MESSAGE,
    copied ? 'success' : 'error',
  );
  return copied;
}
