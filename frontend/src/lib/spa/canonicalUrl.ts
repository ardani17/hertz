/** Session key for opening a DM conversation without query params in the URL bar. */
export const DM_CONVERSATION_SESSION_KEY = 'hertz:dm-conversation';
export const LEGACY_DM_CONVERSATION_SESSION_KEY = 'horizon:dm-conversation';

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
    const value = sessionStorage.getItem(key);
    if (value !== null) return value;
    if (key !== DM_CONVERSATION_SESSION_KEY) return null;
    const legacyValue = sessionStorage.getItem(LEGACY_DM_CONVERSATION_SESSION_KEY);
    if (legacyValue !== null) {
      sessionStorage.setItem(DM_CONVERSATION_SESSION_KEY, legacyValue);
      sessionStorage.removeItem(LEGACY_DM_CONVERSATION_SESSION_KEY);
    }
    return legacyValue;
  } catch {
    return null;
  }
}

export function consumeSessionValue(key: string): string | null {
  const value = readSessionValue(key);
  if (value !== null) {
    try {
      sessionStorage.removeItem(key);
      if (key === DM_CONVERSATION_SESSION_KEY) {
        sessionStorage.removeItem(LEGACY_DM_CONVERSATION_SESSION_KEY);
      }
    } catch {
      /* ignore */
    }
  }
  return value;
}

export function setSessionValue(key: string, value: string): void {
  try {
    sessionStorage.setItem(key, value);
    if (key === DM_CONVERSATION_SESSION_KEY) {
      sessionStorage.removeItem(LEGACY_DM_CONVERSATION_SESSION_KEY);
    }
  } catch {
    /* ignore */
  }
}
