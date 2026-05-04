import { NextResponse } from 'next/server';

const API_BASE_URL = 'https://mf.ohlc.dev/api/v1';

// 7 indices symbols (same count as commodities and currencies)
const DEFAULT_SYMBOLS = [
  '^DJI',    // Dow Jones Industrial Average
  '^GSPC',   // S&P 500
  '^IXIC',   // NASDAQ Composite
  '^NDX',    // NASDAQ-100
  '^RUT',    // Russell 2000
  '^NYA',    // NYSE Composite Index
  '^VIX',    // CBOE Volatility Index
];

export async function GET() {
  try {
    const apiKey = process.env.MF_TOKEN;
    if (!apiKey) {
      throw new Error('MF_TOKEN is not configured');
    }

    const symbolsParam = DEFAULT_SYMBOLS.join(',');
    const apiUrl = `${API_BASE_URL}/indices?symbols=${encodeURIComponent(symbolsParam)}`;
    
    const fetchResponse = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      },
    });

    if (!fetchResponse.ok) {
      throw new Error(`HTTP error! status: ${fetchResponse.status}`);
    }

    const apiData = await fetchResponse.json();
    
    // Transform data to match frontend structure
    const transformedData = {
      success: true,
      data: apiData.data?.map((item: { symbol: string; name: string; price?: number; rate?: number; lastPrice?: number; change: number; changePercent: number }) => ({
        symbol: item.symbol,
        name: item.name,
        lastPrice: item.price ?? item.rate ?? item.lastPrice ?? 0,
        change: item.change ?? 0,
        changePercent: item.changePercent ?? 0,
      })) || []
    };
    
    const response = NextResponse.json(transformedData);
    
    const origin = process.env.NODE_ENV === 'production' 
      ? process.env.NEXTAUTH_URL || 'https://yourdomain.com'
      : 'http://localhost:3000';
    
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('Cache-Control', 'public, max-age=60');
    
    return response;
  } catch (error) {
    console.error('Error fetching indices:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch indices data', data: [] },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  const origin = process.env.NODE_ENV === 'production' 
    ? process.env.NEXTAUTH_URL || 'https://yourdomain.com'
    : 'http://localhost:3000';
    
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
    },
  });
}
