import { NextResponse } from 'next/server';

const API_BASE_URL = 'https://mf.ohlc.dev/api/v1';

// 7 commodity symbols (same count as currencies)
const DEFAULT_SYMBOLS = [
  'GC=F',   // Gold
  'SI=F',   // Silver
  'CL=F',   // Crude Oil WTI
  'NG=F',   // Natural Gas
  'HG=F',   // Copper
  'PL=F',   // Platinum
  'BZ=F',   // Brent Crude Oil
];

// Clean commodity name by removing contract dates
const cleanCommodityName = (name: string): string => {
  return name
    .replace(/\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{2,4}/gi, '')
    .replace(/\s+\d{4}$/g, '')
    .trim();
};

export async function GET() {
  try {
    const apiKey = process.env.MF_TOKEN;
    if (!apiKey) {
      throw new Error('MF_TOKEN is not configured');
    }

    const symbolsParam = DEFAULT_SYMBOLS.join(',');
    const apiUrl = `${API_BASE_URL}/commodities?symbols=${encodeURIComponent(symbolsParam)}`;
    
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
    
    // Transform data to match existing frontend structure
    const transformedData = {
      success: true,
      data: apiData.data?.map((item: { symbol: string; name: string; rate?: number; price?: number; lastPrice?: number; change: number; changePercent: number }) => ({
        symbol: item.symbol,
        name: cleanCommodityName(item.name),
        lastPrice: item.rate ?? item.price ?? item.lastPrice ?? 0,
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
    console.error('Error fetching commodities:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch commodities data', data: [] },
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