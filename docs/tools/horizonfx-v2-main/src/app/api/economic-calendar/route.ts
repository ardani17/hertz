import { NextRequest, NextResponse } from 'next/server';

// Helper function to calculate date ranges based on period
function getDateRangeForPeriod(period: string, timezone: string = 'Asia/Jakarta'): { startDate: string; endDate: string } {
  const now = new Date();
  const jakartaDate = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
  
  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };
  
  const addDays = (date: Date, days: number) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  };
  
  const getStartOfWeek = (date: Date) => {
    const result = new Date(date);
    const day = result.getDay();
    const diff = result.getDate() - day + (day === 0 ? -6 : 1); // Monday as start
    result.setDate(diff);
    return result;
  };
  
  const getEndOfWeek = (date: Date) => {
    const startOfWeek = getStartOfWeek(date);
    return addDays(startOfWeek, 6);
  };
  
  const getStartOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  };
  
  const getEndOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
  };
  
  switch (period) {
    case 'yesterday':
      const yesterday = addDays(jakartaDate, -1);
      return { startDate: formatDate(yesterday), endDate: formatDate(yesterday) };
      
    case 'today':
      return { startDate: formatDate(jakartaDate), endDate: formatDate(jakartaDate) };
      
    case 'tomorrow':
      const tomorrow = addDays(jakartaDate, 1);
      return { startDate: formatDate(tomorrow), endDate: formatDate(tomorrow) };
      
    case 'this-week':
      return { 
        startDate: formatDate(getStartOfWeek(jakartaDate)), 
        endDate: formatDate(getEndOfWeek(jakartaDate)) 
      };
      
    case 'next-week':
      const nextWeekStart = addDays(getStartOfWeek(jakartaDate), 7);
      const nextWeekEnd = addDays(nextWeekStart, 6);
      return { startDate: formatDate(nextWeekStart), endDate: formatDate(nextWeekEnd) };
      
    case 'last-week':
      const lastWeekStart = addDays(getStartOfWeek(jakartaDate), -7);
      const lastWeekEnd = addDays(lastWeekStart, 6);
      return { startDate: formatDate(lastWeekStart), endDate: formatDate(lastWeekEnd) };
      
    case 'this-month':
      return { 
        startDate: formatDate(getStartOfMonth(jakartaDate)), 
        endDate: formatDate(getEndOfMonth(jakartaDate)) 
      };
      
    case 'next-month':
      const nextMonth = new Date(jakartaDate.getFullYear(), jakartaDate.getMonth() + 1, 1);
      return { 
        startDate: formatDate(getStartOfMonth(nextMonth)), 
        endDate: formatDate(getEndOfMonth(nextMonth)) 
      };
      
    case 'last-month':
      const lastMonth = new Date(jakartaDate.getFullYear(), jakartaDate.getMonth() - 1, 1);
      return { 
        startDate: formatDate(getStartOfMonth(lastMonth)), 
        endDate: formatDate(getEndOfMonth(lastMonth)) 
      };
      
    default:
      return { startDate: formatDate(jakartaDate), endDate: formatDate(jakartaDate) };
  }
}

// Helper function to fetch with retry
async function fetchWithRetry(url: string, options: RequestInit, maxRetries: number = 2): Promise<Response> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      return response;
    } catch (error) {
      lastError = error as Error;
      console.log(`Attempt ${attempt + 1} failed for ${url}:`, error);
      
      if (attempt < maxRetries) {
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
  }
  
  throw lastError;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Get period parameter or use date range
    const period = searchParams.get('period');
    
    let startDate: string;
    let endDate: string;
    
    if (period) {
      const dateRange = getDateRangeForPeriod(period);
      startDate = dateRange.startDate;
      endDate = dateRange.endDate;
    } else {
      // Get current date in Jakarta timezone if no date provided
      const currentDate = new Date().toLocaleDateString('en-CA', {
        timeZone: 'Asia/Jakarta'
      });
      startDate = searchParams.get('startDate') || currentDate;
      endDate = searchParams.get('endDate') || currentDate;
    }
    
    const volatility = searchParams.get('volatility') || 'MEDIUM';
    const limit = searchParams.get('limit') || '500';
    const timezone = searchParams.get('timezone') || 'GMT+7';
    const countryCode = searchParams.get('countryCode');

    // Handle multiple volatility values by making separate API calls
    if (volatility.includes(',')) {
      const volatilityValues = volatility.split(',');
       const allData = [];
       const volatilityBreakdown = { NONE: 0, LOW: 0, MEDIUM: 0, HIGH: 0 };
      
      for (const vol of volatilityValues) {
        let apiUrl = `https://calendar.quantapi.vip/calendar?volatility=${vol.trim()}&startDate=${startDate}&endDate=${endDate}&limit=${limit}&timezone=${encodeURIComponent(timezone)}`;
        
        if (countryCode && countryCode !== 'all') {
          apiUrl += `&countryCode=${encodeURIComponent(countryCode)}`;
        }
        
        console.log('Fetching from:', apiUrl);
        
        try {
          const response = await fetchWithRetry(apiUrl, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            signal: AbortSignal.timeout(30000) // 30 seconds timeout
          });

          if (response.ok) {
            const data = await response.json();
            console.log('API Response for volatility:', vol.trim(), 'Data length:', data?.data?.length || 0);
            
            if (data.success && data.data) {
               allData.push(...data.data);
               
               // Merge volatility breakdown
               if (data.volatilityBreakdown) {
                 Object.keys(data.volatilityBreakdown).forEach(key => {
                   const typedKey = key as keyof typeof volatilityBreakdown;
                   volatilityBreakdown[typedKey] += data.volatilityBreakdown[typedKey] || 0;
                 });
               }
             }
          }
        } catch (fetchError) {
          console.error(`Failed to fetch volatility ${vol}:`, fetchError);
          // Continue with other volatility values
        }
      }
      
      // Remove duplicates based on eventId
      const uniqueData = allData.filter((event, index, self) => 
        index === self.findIndex(e => e.eventId === event.eventId)
      );
      
      // Sort by time
      uniqueData.sort((a, b) => new Date(a.dateUtc).getTime() - new Date(b.dateUtc).getTime());
      
      return NextResponse.json({
        success: true,
        message: 'Success',
        data: uniqueData,
        lastUpdated: new Date().toISOString(),
        totalEvents: uniqueData.length,
        timezone: timezone,
        volatilityBreakdown: volatilityBreakdown,
        dateRange: { start: startDate, end: endDate },
        maxLimit: parseInt(limit)
      });
    }

    // Single volatility value - original logic
    let apiUrl = `https://calendar.quantapi.vip/calendar?volatility=${volatility}&startDate=${startDate}&endDate=${endDate}&limit=${limit}&timezone=${encodeURIComponent(timezone)}`;
    
    if (countryCode && countryCode !== 'all') {
      apiUrl += `&countryCode=${encodeURIComponent(countryCode)}`;
    }
    
    console.log('Fetching from:', apiUrl);
    
    const response = await fetchWithRetry(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      signal: AbortSignal.timeout(30000) // 30 seconds timeout
    });

    if (!response.ok) {
      console.error(`API responded with status: ${response.status}`);
      // Return fallback data instead of throwing error
      return NextResponse.json({
        success: false,
        message: `External API unavailable (status: ${response.status})`,
        data: [],
        lastUpdated: new Date().toISOString(),
        totalEvents: 0,
        timezone: timezone,
        volatilityBreakdown: { NONE: 0, LOW: 0, MEDIUM: 0, HIGH: 0 },
        dateRange: { start: startDate, end: endDate },
        maxLimit: parseInt(limit)
      });
    }

    const data = await response.json();
    
    console.log('API Response for volatility:', volatility, 'Data length:', data?.data?.length || 0);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching economic calendar data:', error);
    
    // Return fallback data for any error (network, timeout, etc.)
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'External API unavailable',
      data: [],
      lastUpdated: new Date().toISOString(),
      totalEvents: 0,
      timezone: 'GMT+7',
      volatilityBreakdown: { NONE: 0, LOW: 0, MEDIUM: 0, HIGH: 0 },
      dateRange: { 
        start: new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' }), 
        end: new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' }) 
      },
      maxLimit: 500
    });
  }
}