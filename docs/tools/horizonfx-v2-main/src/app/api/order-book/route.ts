import { NextRequest, NextResponse } from 'next/server';

const OANDA_GRAPHQL_URL = 'https://labs-api.oanda.com/graphql';

const GRAPHQL_QUERY = `
query GetOrderPositionBook($instrument: String!, $bookType: BookType!, $recentHours: Int) {
  orderPositionBook(
    instrument: $instrument
    bookType: $bookType
    recentHours: $recentHours
  ) {
    bucketWidth
    price
    time
    buckets {
      price
      longCountPercent
      shortCountPercent
      __typename
    }
    __typename
  }
}
`;

// Whitelist untuk validasi
const VALID_INSTRUMENTS = [
  'XAUUSD', 'XAGUSD', 'EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF', 
  'USDCAD', 'AUDUSD', 'NZDUSD', 'EURJPY', 'EURGBP', 'EURAUD', 
  'EURCHF', 'GBPJPY', 'GBPCHF', 'AUDJPY'
];

const VALID_BOOK_TYPES = ['ORDER', 'POSITION'];

export async function POST(request: NextRequest) {
  try {
    // Rate limiting bisa ditambahkan di sini jika perlu
    const body = await request.json();
    const { instrument, bookType, recentHours = 1 } = body;

    // Validasi parameter required
    if (!instrument || !bookType) {
      return NextResponse.json(
        { error: 'Missing required parameters: instrument and bookType' },
        { status: 400 }
      );
    }

    // Validasi whitelist instrument
    if (!VALID_INSTRUMENTS.includes(instrument)) {
      return NextResponse.json(
        { error: 'Invalid instrument' },
        { status: 400 }
      );
    }

    // Validasi whitelist bookType
    if (!VALID_BOOK_TYPES.includes(bookType)) {
      return NextResponse.json(
        { error: 'Invalid book type' },
        { status: 400 }
      );
    }

    // Validasi recentHours (harus number dan dalam range wajar)
    const hours = parseInt(recentHours);
    if (isNaN(hours) || hours < 1 || hours > 24) {
      return NextResponse.json(
        { error: 'Invalid recentHours: must be between 1 and 24' },
        { status: 400 }
      );
    }

    // Fetch dengan timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 detik timeout

    try {
      const response = await fetch(OANDA_GRAPHQL_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operationName: 'GetOrderPositionBook',
          variables: {
            instrument,
            bookType,
            recentHours: hours,
          },
          query: GRAPHQL_QUERY,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`OANDA API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Validasi response structure
      if (!data || !data.data || !data.data.orderPositionBook) {
        throw new Error('Invalid response structure from OANDA API');
      }

      return NextResponse.json(data, {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      });
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        return NextResponse.json(
          { error: 'Request timeout' },
          { status: 504 }
        );
      }
      throw fetchError;
    }
  } catch (error) {
    console.error('Order book API error:', error);
    
    // Jangan expose detail error ke client
    return NextResponse.json(
      { error: 'Failed to fetch order book data' },
      { status: 500 }
    );
  }
}
