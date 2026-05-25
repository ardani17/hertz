/** Session key for opening a DM conversation without query params in the URL bar. */
export const DM_CONVERSATION_SESSION_KEY = 'hertz:dm-conversation';

export function replaceCanonicalPath(path: string): void {
  if (typeof window === 'undefined') return;
  const next = new URL(path, window.location.origin);
  const current = `${window.location.pathname}${window.location.search}`;
  const target = `${next.pathname}${next.search}`;
  if (current === target) return;
  window.history.replaceState(window.history.state, '', target);
}

export function readSessionValue(key: string): string | null {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

export function consumeSessionValue(key: string): string | null {
  const value = readSessionValue(key);
  if (value !== null) {
    try {
      sessionStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  }
  return value;
}

export function setSessionValue(key: string, value: string): void {
  try {
    sessionStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}
