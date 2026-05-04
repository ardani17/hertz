// Analytics utility for tracking tool usage

interface ToolUsageData {
  inputParams?: Record<string, unknown>;
  calculationTime?: number;
  success?: boolean;
}

interface TrackUsageParams {
  toolName: string;
  toolType?: string;
  usageData?: ToolUsageData;
}

export async function trackToolUsage({
  toolName,
  toolType = 'calculator',
  usageData
}: TrackUsageParams): Promise<boolean> {
  try {
    const response = await fetch('/api/tools/usage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        toolName,
        toolType,
        usageData
      })
    });

    if (!response.ok) {
      console.warn('Failed to track tool usage:', response.statusText);
      return false;
    }

    const result = await response.json();
    return result.success;
  } catch (error) {
    console.warn('Error tracking tool usage:', error);
    return false;
  }
}

// Helper function to track calculator usage with timing
export function withUsageTracking<T extends unknown[], R>(
  toolName: string,
  calculatorFunction: (...args: T) => R
) {
  return async (...args: T): Promise<R> => {
    const startTime = performance.now();
    let success = true;
    let result: R;

    try {
      result = calculatorFunction(...args);
    } catch (error) {
      success = false;
      throw error;
    } finally {
      const endTime = performance.now();
      const calculationTime = endTime - startTime;

      // Track usage asynchronously (don't block the main function)
      trackToolUsage({
        toolName,
        toolType: 'calculator',
        usageData: {
          calculationTime,
          success,
          inputParams: args.length > 0 ? { argsCount: args.length } : undefined
        }
      }).catch(() => {
      // Silent operation - logs removed to reduce terminal noise
    });
    }

    return result!;
  };
}

// Simple usage tracking for page visits or tool access
export function trackToolAccess(toolName: string, toolType: string = 'calculator'): void {
  // Use setTimeout to make it non-blocking
  setTimeout(() => {
    trackToolUsage({
      toolName,
      toolType,
      usageData: {
        success: true
      }
    }).catch(console.warn);
  }, 0);
}