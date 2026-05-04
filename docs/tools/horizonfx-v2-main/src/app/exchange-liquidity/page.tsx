'use client'

import React, { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { RefreshCcw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { trackToolAccess, trackToolUsage } from '@/lib/analytics'
import type { EChartsOption } from 'echarts'
import * as echarts from 'echarts'

// Dynamically load ECharts on the client
const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false })

type RawGroup = {
  data: Array<{
    liq_price: string[]
    liq_level: string[]
    price: string[]
  }>
}

type ApiResponse = {
  success: boolean
  data: {
    status: number
    success: string
    message: string
    data: {
      liq_10x_map_data: RawGroup
      liq_25x_map_data: RawGroup
      liq_50x_map_data: RawGroup
      liq_100x_map_data: RawGroup
      cur_price_data: { data: Array<{ cur_price: string }> }
    }
  }
}

type ChartPoint = {
  price: number
  '10x'?: number
  '25x'?: number
  '50x'?: number
  '100x'?: number
  'Cum. Long Leverage'?: number
  'Cum. Short Leverage'?: number
}

export default function ExchangeLiquidityPage() {
  // header controls
  const exchanges = ['B**gX', 'B**it', 'Bi**ce', 'Bi**et', 'Bi**ex', 'Bi**ix', 'Co**Ex', 'Co**se', 'Cr**om', 'd**X', 'De**it', 'Gate', 'H**X', 'Hy**id', 'Kr**en', 'Ku**in', 'M**C', 'O**X', 'Wh**IT']
  const pairs = ['BTC/USDT', 'BTC/USDC', 'ETH/USDT', 'ETH/USDC', 'XRP/USDT', 'XRP/USDC', 'BNB/USDT', 'BNB/USDC', 'SOL/USDT', 'SOL/USDC', 'HYPE/USDT', 'SUI/USDT', 'SUI/USDC', 'ADA/USDT', 'ADA/USDC', 'DOGE/USDT', 'DOGE/USDC']
  const [exchange, setExchange] = useState(exchanges[2]) // Default to 'Bi**ce'
  const [pair, setPair] = useState(pairs[0])
  const [timeType, setTimeType] = useState<'1D' | '7D' | '30D'>('1D')

  // chart data state
  const [data, setData] = useState<ChartPoint[]>([])
  const [currentPrice, setCurrentPrice] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // fetch & transform whenever controls change
  useEffect(() => {
    setLoading(true)
    setError(null)
    fetch(`/api/exchange-liquidity?exchange=${exchange}&pair=${pair}&timeType=${timeType}`)
      .then((r) => {
        if (!r.ok) {
          throw new Error(`HTTP ${r.status}: ${r.statusText}`)
        }
        return r.json() as Promise<ApiResponse>
      })
      .then((json) => {
        const {
          liq_10x_map_data,
          liq_25x_map_data,
          liq_50x_map_data,
          liq_100x_map_data,
          cur_price_data,
        } = json.data.data

        // parse current price safely
        const cpRaw = cur_price_data.data[0]?.cur_price ?? '0'
        const curP = parseFloat(cpRaw)
        setCurrentPrice(curP)

        // collect & sort unique prices, skipping empty data arrays
        const prices = new Set<string>()
        ;[
          liq_10x_map_data,
          liq_25x_map_data,
          liq_50x_map_data,
          liq_100x_map_data,
        ].forEach((grp) => {
          const arr = grp.data[0]?.liq_price ?? []
          arr.forEach((p) => prices.add(p))
        })
        const sorted = Array.from(prices).map(Number).sort((a, b) => a - b)

        // build base points
        const pts: ChartPoint[] = sorted.map((p) => ({ price: p }))

        // helper: fill each leverage tier, guard against missing entry
        const fillTier = (grp: RawGroup, key: keyof ChartPoint) => {
          const entry = grp.data[0]
          if (!entry) return
          entry.liq_price.forEach((p, i) => {
            const lvl = parseFloat(entry.liq_level[i] ?? '0')
            const pt = pts.find((x) => x.price === Number(p))
            if (pt) pt[key] = lvl
          })
        }
        fillTier(liq_10x_map_data, '10x')
        fillTier(liq_25x_map_data, '25x')
        fillTier(liq_50x_map_data, '50x')
        fillTier(liq_100x_map_data, '100x')

        // compute cumulative sums
        let cumLong = 0
        let cumShort = 0
        pts.forEach((pt) => {
          const vol =
            (pt['10x'] || 0) +
            (pt['25x'] || 0) +
            (pt['50x'] || 0) +
            (pt['100x'] || 0)
          if (pt.price < curP) {
            cumLong += vol
            pt['Cum. Long Leverage'] = cumLong
          } else {
            cumShort += vol
            pt['Cum. Short Leverage'] = cumShort
          }
        })

        setData(pts)
        setLoading(false)
        
        // Track tool usage
        trackToolUsage({
          toolName: 'Exchange Liquidity',
          toolType: 'data',
          usageData: {
            inputParams: {
              exchange,
              pair,
              timeType,
              currentPrice: curP,
              dataPoints: pts.length
            },
            calculationTime: Date.now(),
            success: true
          }
        })
      })
      .catch((err) => {
        console.error('Failed to fetch exchange liquidity data:', err)
        setError(err.message || 'Failed to fetch data')
        setLoading(false)
      })
  }, [exchange, pair, timeType])

  // Track tool access on component mount
  useEffect(() => {
    trackToolAccess('Exchange Liquidity', 'data')
  }, [])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                🫧
              </div>
              Exchange Liquidity Map
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                ⚠️
              </div>
              Error Loading Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600 mb-4">{error}</p>
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCcw className="w-4 h-4" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // buat gradient untuk garis
  const longGradient = new echarts.graphic.LinearGradient(0, 0, 1, 0, [
    { offset: 0, color: 'rgba(239,68,68,0.8)' },
    { offset: 1, color: 'rgba(239,68,68,0.2)' },
  ])
  const shortGradient = new echarts.graphic.LinearGradient(0, 0, 1, 0, [
    { offset: 0, color: 'rgba(34,197,94,0.8)' },
    { offset: 1, color: 'rgba(34,197,94,0.2)' },
  ])

  // ECharts configuration
  const option: EChartsOption = {
    tooltip: { 
      trigger: 'axis', 
      axisPointer: { type: 'shadow' },
      backgroundColor: 'rgba(0,0,0,0.8)',
      borderColor: 'rgba(255,255,255,0.2)',
      textStyle: { color: '#fff' }
    },
    legend: {
      type: 'scroll',
      orient: 'horizontal',
      top: 25,
      itemGap: 16,
      icon: 'circle',
      itemWidth: 8,
      itemHeight: 8,
      textStyle: { fontSize: 12, color: '#64748b' },
    },
    grid: {
      top: 60,
      left: 60,
      right: 60,
      bottom: 80,
    },
    xAxis: {
      type: 'category',
      data: data.map((p) => `$${p.price.toLocaleString()}`),
      axisLine: { lineStyle: { color: '#e2e8f0' } },
      axisTick: { show: false },
      axisLabel: { color: '#64748b', fontSize: 10, interval: 'auto' },
    },
    yAxis: [
      {
        type: 'value',
        position: 'left',
        axisLine: { lineStyle: { color: '#e2e8f0' } },
        axisTick: { show: false },
        axisLabel: {
          formatter: (v: number) => `$${(v / 1e6).toFixed(1)}M`,
          color: '#64748b',
          fontSize: 10,
        },
        splitLine: { lineStyle: { color: '#f1f5f9' } },
      },
      {
        type: 'value',
        position: 'right',
        axisLine: { lineStyle: { color: '#e2e8f0' } },
        axisTick: { show: false },
        axisLabel: {
          formatter: (v: number) => `$${(v / 1e6).toFixed(1)}M`,
          color: '#64748b',
          fontSize: 10,
        },
        splitLine: { show: false },
      },
    ],
    dataZoom: [
      { type: 'inside', start: 0, end: 100 },
      {
        type: 'slider',
        start: 0,
        end: 100,
        height: 16,
        bottom: 20,
        backgroundColor: '#f8fafc',
        fillerColor: 'rgba(59,130,246,0.1)',
        showDataShadow: false,
        handleSize: '80%',
        borderColor: '#e2e8f0',
      },
    ],
    series: [
      {
        name: '10x',
        type: 'bar',
        stack: 'vol',
        barWidth: 4,
        barCategoryGap: '80%',
        itemStyle: { color: '#06b6d4' },
        data: data.map((p) => p['10x'] || 0),
      },
      {
        name: '25x',
        type: 'bar',
        stack: 'vol',
        barWidth: 4,
        barCategoryGap: '80%',
        itemStyle: { color: '#3b82f6' },
        data: data.map((p) => p['25x'] || 0),
      },
      {
        name: '50x',
        type: 'bar',
        stack: 'vol',
        barWidth: 4,
        barCategoryGap: '80%',
        itemStyle: { color: '#f59e0b' },
        data: data.map((p) => p['50x'] || 0),
      },
      {
        name: '100x',
        type: 'bar',
        stack: 'vol',
        barWidth: 4,
        barCategoryGap: '80%',
        itemStyle: { color: '#f97316' },
        data: data.map((p) => p['100x'] || 0),
      },
      {
        name: 'Cum. Long Leverage',
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        showSymbol: false,
        symbol: 'circle',
        symbolSize: 6,
        emphasis: { focus: 'series', scale: true },
        lineStyle: { color: longGradient, width: 2 },
        areaStyle: { color: 'rgba(239,68,68,0.1)' },
        data: data.map((p) => p['Cum. Long Leverage'] || 0),
        markLine: {
          silent: true,
          symbol: ['none', 'arrow'],
          lineStyle: { type: 'dashed', color: '#374151', width: 2 },
          data: [{
            xAxis: `$${currentPrice.toLocaleString()}`,
            label: {
              formatter: `Current: $${currentPrice.toLocaleString()}`,
              position: 'insideEndTop',
              fontSize: 11,
              distance: 10,
              color: '#374151',
              fontWeight: 'bold'
            },
          }],
        },
      },
      {
        name: 'Cum. Short Leverage',
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        showSymbol: false,
        symbol: 'circle',
        symbolSize: 6,
        emphasis: { focus: 'series', scale: true },
        lineStyle: { color: shortGradient, width: 2 },
        areaStyle: { color: 'rgba(34,197,94,0.1)' },
        data: data.map((p) => p['Cum. Short Leverage'] || 0),
      },
    ],
  }

  return (
    <>
      <Header />
      <div className="container mx-auto px-4 py-8">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <CardTitle className="flex items-center gap-3 text-2xl">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-lg">
                  🫧
                </div>
                Exchange Liquidity Map
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.reload()}
                className="w-10 h-10 p-0 flex items-center justify-center"
              >
                <RefreshCcw className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 mt-4 md:mt-0">
              <div className="flex flex-wrap gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-600">Exchange</label>
                  <Select value={exchange} onValueChange={setExchange}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {exchanges.map((ex) => (
                        <SelectItem key={ex} value={ex}>
                          {ex}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-600">Pair</label>
                  <Select value={pair} onValueChange={setPair}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {pairs.map((symbol) => (
                        <SelectItem key={symbol} value={symbol}>
                          {symbol}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-600">Timeframe</label>
                  <div className="flex gap-1">
                    {(['1D', '7D', '30D'] as const).map((tt) => (
                      <Button
                        key={tt}
                        variant={timeType === tt ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setTimeType(tt)}
                        className="px-3 py-1 text-xs"
                      >
                        {tt}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="mb-6">
            <div className="flex items-center justify-center">
              <Badge variant="secondary" className="text-lg px-4 py-2">
                🧬 Current Price: ${currentPrice.toLocaleString()}
              </Badge>
            </div>
          </div>
          
          <div className="h-96 w-full">
            <ReactECharts 
              option={option} 
              style={{ height: '100%', width: '100%' }}
              opts={{ renderer: 'canvas' }}
            />
          </div>
        </CardContent>
      </Card>
      
      <Card className="mt-8 shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg">About Liquidity Map</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none">
          <p className="text-gray-600 mb-4">
            The Liquidity Map visualizes liquidation prices based on traders&apos; positions and the distribution of long and short positions at different price levels. This chart predicts liquidation prices and quantifies the liquidation strength of both long and short positions.
          </p>
          <p className="text-gray-600 mb-4">
            When different leverage combinations of long and short positions are shown as price-level liquidation clusters, denser clusters indicate higher liquidation intensity. This tool is especially useful for traders on cryptocurrency derivative exchanges, where liquidation risks are significant.
          </p>
          <p className="text-gray-600 mb-4">
            The X-axis represents price levels, while the Y-axis represents relative liquidation strength. Higher liquidation bars indicate that reaching those price levels could trigger stronger market reactions due to liquidity waves.
          </p>
          <p className="text-gray-600">
            <strong>Note:</strong> Different colors distinguish between liquidation clusters and leverage levels. The more compact and taller the liquidation clusters, the more significant their potential impact on price behavior once those levels are reached.
          </p>
        </CardContent>
      </Card>
      </div>
      <Footer />
    </>
  )
}