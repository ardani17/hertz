'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { trackPageViewWithTiming } from '@/lib/page-tracking';

export function PageTracker() {
  const pathname = usePathname();

  useEffect(() => {
    // Track the current page view
    trackPageViewWithTiming(pathname);
  }, [pathname]);

  // This component doesn't render anything
  return null;
}