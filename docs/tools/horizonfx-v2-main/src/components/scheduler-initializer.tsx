"use client";

import { useEffect } from 'react';

export function SchedulerInitializer() {
  useEffect(() => {
    // Initialize scheduler after a short delay to ensure server is ready
    const timer = setTimeout(async () => {
      try {
        const response = await fetch('/api/scheduler/init', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        const result = await response.json();
        
        if (!result.success) {
          console.error('[Client] Failed to initialize scheduler:', result.error);
        }
      } catch (error) {
        console.error('[Client] Error initializing scheduler:', error);
      }
    }, 3000); // 3 second delay to ensure server is fully ready

    return () => clearTimeout(timer);
  }, []);

  return null; // This component doesn't render anything
}