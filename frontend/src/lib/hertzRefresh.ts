import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

/** Refresh server components while keeping scroll position on the feed. */
export function refreshPreserveScroll(router: Pick<AppRouterInstance, 'refresh'>) {
  const scrollY = window.scrollY;
  router.refresh();
  requestAnimationFrame(() => {
    window.scrollTo(0, scrollY);
  });
  window.setTimeout(() => {
    window.scrollTo(0, scrollY);
  }, 80);
}
