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

function fallbackBook(instrument: string) {
  const basePrice = instrument.startsWith('XAU')
    ? 2325
    : instrument.endsWith('JPY')
      ? 155
      : 1.08;
  const bucketWidth = instrument.startsWith('XAU') ? 2.5 : instrument.endsWith('JPY') ? 0.05 : 0.0005;
  const buckets = Array.from({ length: 81 }, (_, index) => {
    const distance = index - 40;
    const price = Number((basePrice + distance * bucketWidth).toFixed(5));
    const intensity = Math.max(0.2, 1 - Math.abs(distance) / 45);
    return {
      price,
      longCountPercent: Number((Math.abs(Math.sin(index * 0.7)) * 12 * intensity + 0.2).toFixed(4)),
      shortCountPercent: Number((Math.abs(Math.cos(index * 0.55)) * 12 * intensity + 0.2).toFixed(4)),
    };
  });

  return {
    success: true,
    data: {
      orderPositionBook: [
        {
          bucketWidth,
          price: basePrice,
          time: new Date().toISOString(),
          buckets,
        },
      ],
    },
    mode: 'demo',
    warning: 'OANDA Labs upstream is unavailable, showing generated demo distribution.',
    lastUpdated: new Date().toISOString(),
  };
}

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
  let fallbackInstrument = 'EURUSD';

  try {
    const body = await request.json();
    const instrument = normalizeInstrument(body.instrument);
    const bookType = normalizeBookType(body.bookType);
    const recentHours = Math.min(Math.max(Number(body.recentHours ?? 1), 1), 24);
    fallbackInstrument = validInstruments.includes(instrument) ? instrument : fallbackInstrument;

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
  } catch {
    return NextResponse.json(fallbackBook(fallbackInstrument), {
      headers: { 'Cache-Control': 'no-store' },
    });
  }
}
