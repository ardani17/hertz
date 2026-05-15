import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const OANDA_GRAPHQL_URL = 'https://labs-api.oanda.com/graphql';
const validInstruments = ['XAUUSD', 'XAGUSD', 'EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF', 'USDCAD', 'AUDUSD', 'NZDUSD', 'EURJPY', 'EURGBP', 'EURAUD', 'EURCHF', 'GBPJPY', 'GBPCHF', 'AUDJPY'];
const validBookTypes = ['ORDER', 'POSITION'];

const query = `
query GetOrderPositionBook($instrument: String!, $bookType: BookType!, $recentHours: Int) {
  orderPositionBook(instrument: $instrument, bookType: $bookType, recentHours: $recentHours) {
    bucketWidth
    price
    time
    buckets {
      price
      longCountPercent
      shortCountPercent
    }
  }
}
`;

function normalizeInstrument(value: unknown) {
  return String(value ?? '').replace(/[^a-zA-Z]/g, '').toUpperCase();
}

function normalizeBookType(value: unknown) {
  const normalized = String(value ?? '').replace(/[^a-zA-Z]/g, '').toUpperCase();
  if (normalized === 'ORDERS') return 'ORDER';
  if (normalized === 'POSITIONS') return 'POSITION';
  return normalized;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const instrument = normalizeInstrument(body.instrument);
    const bookType = normalizeBookType(body.bookType);
    const recentHours = Math.min(Math.max(Number(body.recentHours ?? 1), 1), 24);

    if (!validInstruments.includes(instrument) || !validBookTypes.includes(bookType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid order book parameters' },
        { status: 400, headers: { 'Cache-Control': 'no-store' } },
      );
    }

    const response = await fetch(OANDA_GRAPHQL_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify({
        operationName: 'GetOrderPositionBook',
        variables: { instrument, bookType, recentHours },
        query,
      }),
      signal: AbortSignal.timeout(12000),
    });

    if (!response.ok) {
      throw new Error(`OANDA status ${response.status}`);
    }

    const json = await response.json();
    const book = json.data?.orderPositionBook?.[0];
    if (!book || !Array.isArray(book.buckets)) {
      throw new Error('OANDA response is empty');
    }

    return NextResponse.json({
      success: true,
      data: json.data,
      mode: 'live',
      lastUpdated: new Date().toISOString(),
    }, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Order book upstream is unavailable';
    return NextResponse.json(
      { success: false, error: message },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
