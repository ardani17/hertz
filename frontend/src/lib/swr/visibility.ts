import { useEffect, useState } from 'react';

export type VisibilityStateLike = 'visible' | 'hidden' | 'prerender' | undefined;

export function resolveVisibilityRefreshInterval(intervalMs: number, visibilityState: VisibilityStateLike): number {
  return visibilityState === 'hidden' ? 0 : intervalMs;
}

export function useVisibilityRefreshInterval(intervalMs: number): number {
  const [visible, setVisible] = useState(() => (typeof document === 'undefined' ? true : document.visibilityState !== 'hidden'));
  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    const onVisibilityChange = () => setVisible(document.visibilityState !== 'hidden');
    document.addEventListener('visibilitychange', onVisibilityChange);
    onVisibilityChange();
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, []);
  return visible ? intervalMs : 0;
}
