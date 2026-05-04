// Server-side scheduler for automatic news fetching
let newsScheduler: NodeJS.Timeout | null = null;

// Function to fetch news from external API
async function fetchNewsFromExternal() {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/news/fetch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    await response.json();
    
    // Silent operation - logs removed to reduce terminal noise
  } catch {
    // Silent operation - logs removed to reduce terminal noise
  }
}

// Start the news scheduler
export function startNewsScheduler() {
  // Clear existing scheduler if any
  if (newsScheduler) {
    clearInterval(newsScheduler);
  }

  // Only run scheduler in production or when explicitly enabled
  const enableScheduler = process.env.NODE_ENV === 'production' || process.env.ENABLE_NEWS_SCHEDULER === 'true';
  
  if (!enableScheduler) {
    return;
  }
  
  // Fetch immediately on start
  fetchNewsFromExternal();
  
  // Set up interval for every 10 minutes (600,000 ms)
  newsScheduler = setInterval(fetchNewsFromExternal, 10 * 60 * 1000);
}

// Stop the news scheduler
export function stopNewsScheduler() {
  if (newsScheduler) {
    clearInterval(newsScheduler);
    newsScheduler = null;
  }
}

// Get scheduler status
export function getSchedulerStatus() {
  return {
    isRunning: newsScheduler !== null,
    interval: '10 minutes',
    enabled: process.env.NODE_ENV === 'production' || process.env.ENABLE_NEWS_SCHEDULER === 'true'
  };
}