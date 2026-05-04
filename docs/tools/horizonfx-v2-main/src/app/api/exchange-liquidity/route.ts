// src/app/api/exchange-liquidity/route.ts
import { NextResponse } from 'next/server'

/**
 * GET /api/exchange-liquidity?exchange=...&pair=...&timeType=...
 */
export async function GET(request: Request) {
  const url = new URL(request.url)
  const exchange = url.searchParams.get('exchange') || 'Bi**ce'
  const pair = url.searchParams.get('pair') || 'BTC/USDT'
  const timeType = url.searchParams.get('timeType') || '1D'
  
  // Encode parameters for URL
  const encodedPair = encodeURIComponent(pair)
  const encodedExchange = encodeURIComponent(exchange)
  const apiUrl = `https://liquidity.quantapi.vip/api/liquidity-map?pair=${encodedPair}&exchange=${encodedExchange}&timeType=${timeType}`

  console.log(`[exchange-liquidity] Incoming request → exchange=${exchange}, pair=${pair}, timeType=${timeType}`)

  // Helper untuk delay (exponential backoff)
  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

  // Fetch upstream dengan retry/backoff
  let response: Response
  const maxAttempts = 3
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log(`[exchange-liquidity] Fetch attempt ${attempt}/${maxAttempts} → ${apiUrl}`)
    try {
      response = await fetch(apiUrl, {
        headers: {
          'User-Agent': 'curl/7.68.0',
          'Accept': '*/*',
        },
      })
      if (response.ok) {
        const body = await response.text()
        console.log(`[exchange-liquidity] Upstream OK`)
        return new NextResponse(body, {
          headers: {
            'Content-Type': 'application/json',
            'X-Cache-Status': attempt === 1 ? 'MISS' : 'RETRY_OK',
          },
        })
      }
      console.warn(`[exchange-liquidity] Upstream responded ${response.status}, will retry if attempts remain`)
      throw new Error(`Upstream returned status ${response.status}`)
    } catch {
      if (attempt < maxAttempts) {
        const delay = 100 * 2 ** (attempt - 1)
        console.log(`[exchange-liquidity] Waiting ${delay}ms before retry`)
        await sleep(delay)
        continue
      }
      console.error(`[exchange-liquidity] All ${maxAttempts} fetch attempts failed`)
    }
  }

  // Kalau benar-benar gagal
  console.error('[exchange-liquidity] No cache available and upstream fetch failed → returning 502')
  return NextResponse.json(
    { error: 'Failed to fetch exchange liquidity data from upstream' },
    { status: 502 }
  )
}