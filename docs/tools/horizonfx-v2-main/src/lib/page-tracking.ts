// Client-side page tracking utility

interface PageTrackingData {
  path: string;
  responseTime?: number;
  statusCode?: number;
}

// Track page view
export async function trackPageView(data: PageTrackingData): Promise<void> {
  try {
    // Only track in browser environment
    if (typeof window === 'undefined') return;
    
    // Don't track admin pages or API routes
    if (data.path.startsWith('/ghost-admin') || data.path.startsWith('/api/')) {
      return;
    }
    
    // Send tracking data asynchronously
    fetch('/api/analytics/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    }).catch(error => {
      // Silently fail to avoid disrupting user experience
      console.warn('Failed to track page view:', error);
    });
  } catch (error) {
    console.warn('Page tracking error:', error);
  }
}

// Track page view with performance timing
export function trackPageViewWithTiming(path: string): void {
  try {
    if (typeof window === 'undefined') return;
    
    // Use Navigation Timing API if available
    if ('performance' in window && 'getEntriesByType' in performance) {
      // Wait for page load to complete
      window.addEventListener('load', () => {
        setTimeout(() => {
          const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
          if (navigation) {
            const responseTime = Math.round(navigation.loadEventEnd - navigation.fetchStart);
            trackPageView({
              path,
              responseTime,
              statusCode: 200
            });
          } else {
            trackPageView({ path });
          }
        }, 100); // Small delay to ensure timing is complete
      });
    } else {
      // Fallback for browsers without Navigation Timing API
      trackPageView({ path });
    }
  } catch (error) {
    console.warn('Page tracking with timing error:', error);
  }
}

// Hook for Next.js App Router
export function usePageTracking(path: string): void {
  if (typeof window !== 'undefined') {
    // Track on component mount
    trackPageViewWithTiming(path);
  }
}