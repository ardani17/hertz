'use client';

import { useEffect } from 'react';

export function HertzViewTracker({ shortId }: { shortId: string }) {
  useEffect(() => {
    const controller = new AbortController();
    void fetch(`/api/hertz/posts/${shortId}/view`, {
      method: 'POST',
      signal: controller.signal,
    }).catch(() => undefined);
    return () => controller.abort();
  }, [shortId]);

  return null;
}
