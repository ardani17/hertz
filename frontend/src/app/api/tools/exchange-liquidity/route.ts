import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const validPairs = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'BNB/USDT', 'XRP/USDT'];
const validExchanges = ['Bi**ce', 'Gate', 'O**X', 'By**it'];
const validTimeTypes = ['1D', '7D', '30D'];

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const pair = params.get('pair') ?? 'BTC/USDT';
  const exchange = params.get('exchange') ?? 'Bi**ce';
  const timeType = params.get('timeType') ?? '1D';

  if (!validPairs.includes(pair) || !validExchanges.includes(exchange) || !validTimeTypes.includes(timeType)) {
    return NextResponse.json(
      { success: false, error: 'Invalid exchange liquidity parameters' },
      { status: 400, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  const upstream = new URL('https://liquidity.quantapi.vip/api/liquidity-map');
  upstream.searchParams.set('pair', pair);
  upstream.searchParams.set('exchange', exchange);
  upstream.searchParams.set('timeType', timeType);

  try {
    const response = await fetch(upstream.toString(), {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'HorizonTraderPlatform/1.0',
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      throw new Error(`Upstream status ${response.status}`);
    }

    const body = await response.text();
    return new NextResponse(body, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch exchange liquidity data',
      },
      { status: 502, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
