import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getFromCache, setToCache, generateCacheKey } from '@/lib/redis';

interface StockItem {
  symbol: string;
  name: string;
  lastPrice: number;
  change: number;
  changePercent: number;
  marketCap: string;
  volume: string;
}

interface StockData {
  trending: StockItem[];
  gainers: StockItem[];
  losers: StockItem[];
  total: number;
}

export async function GET() {
  try {
    // Add security headers
    headers();
    
    // Generate cache key for stocks data
    const cacheKey = generateCacheKey('stocks:all');
    
    // Try to get data from cache first
    const cachedData = await getFromCache<{
      success: boolean;
      data: StockData;
      message: string;
      lastUpdated: string;
    }>(cacheKey);
    
    if (cachedData) {
      return NextResponse.json(cachedData, {
        headers: {
          'Cache-Control': 'public, max-age=7200', // Cache for 2 hours
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'X-Cache': 'HIT'
        },
      });
    }
    
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://your-domain.com' 
      : 'http://localhost:3000';
    
    // Fetch data from sub-endpoints
    const [trendingRes, gainersRes, losersRes] = await Promise.allSettled([
      fetch(`${baseUrl}/api/stocks/trending`),
      fetch(`${baseUrl}/api/stocks/gainers`),
      fetch(`${baseUrl}/api/stocks/losers`)
    ]);
    
    const trending = trendingRes.status === 'fulfilled' && trendingRes.value.ok 
      ? await trendingRes.value.json() 
      : { data: [], total: 0 };
      
    const gainers = gainersRes.status === 'fulfilled' && gainersRes.value.ok 
      ? await gainersRes.value.json() 
      : { data: [], total: 0 };
      
    const losers = losersRes.status === 'fulfilled' && losersRes.value.ok 
      ? await losersRes.value.json() 
      : { data: [], total: 0 };
    
    const stockData: StockData = {
      trending: trending.data || [],
      gainers: gainers.data || [],
      losers: losers.data || [],
      total: (trending.total || 0) + (gainers.total || 0) + (losers.total || 0)
    };
    
    // Prepare response data
    const responseData = {
      success: true,
      data: stockData,
      message: 'Stocks data retrieved successfully',
      lastUpdated: new Date().toISOString()
    };
    
    // Cache the response data for 2 hours
    await setToCache(cacheKey, responseData);
    
    return NextResponse.json(responseData, {
      headers: {
        'Cache-Control': 'public, max-age=7200', // Cache for 2 hours
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-Cache': 'MISS'
      },
    });
    
  } catch (error) {
    console.error('Error fetching stocks data:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch stocks data',
        data: {
          trending: [],
          gainers: [],
          losers: [],
          total: 0
        }
      },
      { 
        status: 500,
        headers: {
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
        },
      }
    );
  }
}