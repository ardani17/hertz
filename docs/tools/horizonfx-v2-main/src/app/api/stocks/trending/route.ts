import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getFromCache, setToCache, generateCacheKey } from '@/lib/redis';

const API_BASE_URL = 'https://mf.ohlc.dev/api/v1';

interface APIStockItem {
  symbol: string;
  shortName: string;
  regularMarketPrice: number;
  regularMarketChange: number;
  regularMarketChangePercent: number;
  regularMarketVolume: number;
}

interface StockItem {
  symbol: string;
  name: string;
  lastPrice: number;
  change: number;
  changePercent: number;
  volume?: string;
}

export async function GET() {
  try {
    headers();
    
    const apiKey = process.env.MF_TOKEN;
    if (!apiKey) {
      throw new Error('MF_TOKEN is not configured');
    }
    
    const cacheKey = generateCacheKey('stocks:trending');
    
    const cachedData = await getFromCache<{
      success: boolean;
      data: StockItem[];
      total: number;
    }>(cacheKey);
    
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
    
    const apiUrl = `${API_BASE_URL}/stocks/trending?count=25`;
    
    const apiResponse = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      },
    });

    if (!apiResponse.ok) {
      throw new Error(`HTTP error! status: ${apiResponse.status}`);
    }

    const data = await apiResponse.json();

    if (!data.success || !data.data) {
      throw new Error('Invalid API response format');
    }

    const formattedData: StockItem[] = data.data.map((item: APIStockItem) => ({
      symbol: item.symbol,
      name: item.shortName,
      lastPrice: item.regularMarketPrice ?? 0,
      change: item.regularMarketChange ?? 0,
      changePercent: item.regularMarketChangePercent ?? 0,
      volume: item.regularMarketVolume?.toLocaleString() ?? '0',
    }));

    const responseData = {
      success: true,
      data: formattedData,
      total: formattedData.length,
    };
    
    await setToCache(cacheKey, responseData);

    return NextResponse.json(responseData, {
      headers: {
        'Cache-Control': 'public, max-age=7200',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-Cache': 'MISS'
      },
    });

  } catch (error) {
    console.error('Error fetching trending stocks:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch trending stocks data',
        data: [],
        total: 0,
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
