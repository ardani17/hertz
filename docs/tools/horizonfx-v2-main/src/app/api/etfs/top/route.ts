import { NextResponse } from 'next/server';
import { getFromCache, setToCache, generateCacheKey } from '@/lib/redis';

const API_BASE_URL = 'https://mf.ohlc.dev/api/v1';

interface APIETFItem {
  symbol: string;
  shortName: string;
  regularMarketPrice: number;
  regularMarketChange: number;
  regularMarketChangePercent: number;
  regularMarketVolume: number;
}

interface ETFData {
  symbol: string;
  name: string;
  lastPrice: number;
  change: number;
  changePercent: number;
  volume: string;
}

export async function GET() {
  try {
    const apiKey = process.env.MF_TOKEN;
    if (!apiKey) {
      throw new Error('MF_TOKEN is not configured');
    }

    // Generate cache key for top ETFs
    const cacheKey = generateCacheKey('etfs:top');
    
    // Try to get data from cache first
    const cachedData = await getFromCache<ETFData[]>(cacheKey);
    
    if (cachedData) {
      return NextResponse.json(cachedData, {
        headers: {
          'Cache-Control': 'public, max-age=7200',
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'X-Cache': 'HIT'
        },
      });
    }
    
    const apiUrl = `${API_BASE_URL}/etfs/top-us?count=25`;
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const apiData = await response.json();
    
    if (!apiData.success || !apiData.data) {
      throw new Error('Invalid response structure');
    }

    const etfs: ETFData[] = apiData.data.map((item: APIETFItem) => ({
      symbol: item.symbol,
      name: item.shortName,
      lastPrice: item.regularMarketPrice ?? 0,
      change: item.regularMarketChange ?? 0,
      changePercent: item.regularMarketChangePercent ?? 0,
      volume: item.regularMarketVolume?.toLocaleString() ?? '0',
    }));

    // Cache the response data for 2 hours
    await setToCache(cacheKey, etfs);

    return NextResponse.json(etfs, {
      headers: {
        'Cache-Control': 'public, max-age=7200',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-Cache': 'MISS'
      },
    });
  } catch (error) {
    console.error('Error fetching top ETFs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch top ETFs data' },
      { status: 500 }
    );
  }
}