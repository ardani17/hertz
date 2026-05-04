"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { RefreshCw, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

interface Bucket {
  price: number;
  longCountPercent: number;
  shortCountPercent: number;
}

interface OrderBookData {
  bucketWidth: number;
  price: number;
  time: string;
  buckets: Bucket[];
}

const INSTRUMENTS = [
  { value: "XAUUSD", label: "XAU/USD" },
  { value: "XAGUSD", label: "XAG/USD" },
  { value: "EURUSD", label: "EUR/USD" },
  { value: "GBPUSD", label: "GBP/USD" },
  { value: "USDJPY", label: "USD/JPY" },
  { value: "USDCHF", label: "USD/CHF" },
  { value: "USDCAD", label: "USD/CAD" },
  { value: "AUDUSD", label: "AUD/USD" },
  { value: "NZDUSD", label: "NZD/USD" },
  { value: "EURJPY", label: "EUR/JPY" },
  { value: "EURGBP", label: "EUR/GBP" },
  { value: "EURAUD", label: "EUR/AUD" },
  { value: "EURCHF", label: "EUR/CHF" },
  { value: "GBPJPY", label: "GBP/JPY" },
  { value: "GBPCHF", label: "GBP/CHF" },
  { value: "AUDJPY", label: "AUD/JPY" },
];

const BOOK_TYPES = [
  { value: "ORDER", label: "Open Orders" },
  { value: "POSITION", label: "Open Positions" },
] as const;

type BookType = "ORDER" | "POSITION";

export default function OrderBookPage() {
  const [instrument, setInstrument] = useState("XAUUSD");
  const [bookType, setBookType] = useState<BookType>("ORDER");
  const [data, setData] = useState<OrderBookData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startPrice, setStartPrice] = useState<string>("");
  const [endPrice, setEndPrice] = useState<string>("");
  const [hoveredBucket, setHoveredBucket] = useState<Bucket | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [zoomLevel, setZoomLevel] = useState(1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/order-book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instrument, bookType, recentHours: 1 }),
      });
      
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        throw new Error(`Rate limit exceeded. Please try again in ${retryAfter || '60'} seconds.`);
      }
      
      if (response.status === 403) {
        throw new Error('Access forbidden. Please refresh the page.');
      }
      
      const result = await response.json();
      if (result.error) throw new Error(result.error);
      const bookData = result.data?.orderPositionBook?.[0];
      if (bookData) setData(bookData);
      else throw new Error("No data available");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }, [instrument, bookType]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const autoRange = useMemo(() => {
    if (!data?.price) return { start: -Infinity, end: Infinity };
    const currentPrice = data.price;
    const isMetals = instrument.startsWith("XAU") || instrument.startsWith("XAG");
    const range = isMetals ? 50 : 0.005;
    return {
      start: currentPrice - range,
      end: currentPrice + range,
    };
  }, [data?.price, instrument]);

  const filteredBuckets = useMemo(() => {
    if (!data?.buckets) return [];
    const useAutoRange = !startPrice && !endPrice;
    const start = startPrice ? parseFloat(startPrice) : (useAutoRange ? autoRange.start : -Infinity);
    const end = endPrice ? parseFloat(endPrice) : (useAutoRange ? autoRange.end : Infinity);
    return data.buckets
      .filter((bucket) => bucket.price >= start && bucket.price <= end)
      .sort((a, b) => b.price - a.price);
  }, [data?.buckets, startPrice, endPrice, autoRange]);

  const maxPercent = useMemo(() => {
    return Math.max(...filteredBuckets.map((b) => Math.max(b.longCountPercent, b.shortCountPercent)), 0.1);
  }, [filteredBuckets]);

  const formatTime = (timeStr: string) => {
    const date = new Date(timeStr);
    return date.toLocaleString("en-US", {
      hour: "2-digit", minute: "2-digit", second: "2-digit",
      day: "2-digit", month: "short", year: "numeric", timeZoneName: "short",
    });
  };

  const getInstrumentLabel = (value: string) => INSTRUMENTS.find((i) => i.value === value)?.label || value;

  const currentPriceIndex = useMemo(() => {
    if (!data?.price || !filteredBuckets.length) return -1;
    return filteredBuckets.findIndex((b) => Math.abs(b.price - data.price) < (data.bucketWidth || 1));
  }, [data?.price, data?.bucketWidth, filteredBuckets]);

  const handleMouseMove = (e: React.MouseEvent, bucket: Bucket) => {
    setHoveredBucket(bucket);
    setTooltipPos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseLeave = () => setHoveredBucket(null);

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.25, 0.5));
  const handleResetZoom = () => setZoomLevel(1);

  const barHeight = Math.round(24 * zoomLevel);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <h1 className="text-2xl md:text-3xl font-bold mb-8 text-center">
          Order Book - {getInstrumentLabel(instrument)}
        </h1>

        {/* Controls */}
        <div className="bg-card border border-border rounded-xl p-4 md:p-6 mb-6 shadow-sm">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">Instrument</label>
              <select
                value={instrument}
                onChange={(e) => setInstrument(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-foreground focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              >
                {INSTRUMENTS.map((inst) => (
                  <option key={inst.value} value={inst.value}>{inst.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">Book Type</label>
              <select
                value={bookType}
                onChange={(e) => setBookType(e.target.value as BookType)}
                className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-foreground focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              >
                {BOOK_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">Start Price</label>
              <input
                type="number"
                value={startPrice}
                onChange={(e) => setStartPrice(e.target.value)}
                placeholder={data?.price ? `Auto: ${autoRange.start.toFixed(2)}` : "Min"}
                className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">End Price</label>
              <input
                type="number"
                value={endPrice}
                onChange={(e) => setEndPrice(e.target.value)}
                placeholder={data?.price ? `Auto: ${autoRange.end.toFixed(2)}` : "Max"}
                className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={fetchData}
                disabled={loading}
                className="w-full bg-green-500 hover:bg-green-600 text-white px-4 py-2.5 rounded-lg disabled:opacity-50 transition-colors flex items-center justify-center gap-2 font-medium"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                {loading ? "Loading..." : "Refresh"}
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Tooltip */}
        {hoveredBucket && (
          <div
            className="fixed z-50 pointer-events-none bg-popover border border-border rounded-lg shadow-xl p-3 text-sm"
            style={{ left: tooltipPos.x + 15, top: tooltipPos.y - 10 }}
          >
            <div className="font-semibold text-foreground mb-2">Price: {hoveredBucket.price.toFixed(2)}</div>
            <div className="flex items-center gap-2 text-red-500">
              <span className="w-3 h-3 bg-red-500 rounded-sm"></span>
              Sell: {hoveredBucket.shortCountPercent.toFixed(4)}%
            </div>
            <div className="flex items-center gap-2 text-green-500 mt-1">
              <span className="w-3 h-3 bg-green-500 rounded-sm"></span>
              Buy: {hoveredBucket.longCountPercent.toFixed(4)}%
            </div>
          </div>
        )}

        {/* Chart */}
        {data && (
          <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
            {/* Chart Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 md:p-6 border-b border-border">
              <div>
                <h2 className="text-lg font-semibold">
                  {bookType === "ORDER" ? "OPEN ORDERS" : "OPEN POSITIONS"}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Current Price: <span className="text-green-500 font-semibold">{data.price?.toFixed(2)}</span>
                </p>
              </div>
              <div className="flex items-center gap-4">
                {/* Zoom Controls */}
                <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                  <button
                    onClick={handleZoomOut}
                    className="p-1.5 hover:bg-background rounded transition-colors"
                    title="Zoom Out"
                  >
                    <ZoomOut className="h-4 w-4" />
                  </button>
                  <span className="px-2 text-xs font-medium min-w-[50px] text-center">{Math.round(zoomLevel * 100)}%</span>
                  <button
                    onClick={handleZoomIn}
                    className="p-1.5 hover:bg-background rounded transition-colors"
                    title="Zoom In"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </button>
                  <button
                    onClick={handleResetZoom}
                    className="p-1.5 hover:bg-background rounded transition-colors"
                    title="Reset Zoom"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
                </div>
                {/* Legend */}
                <div className="flex gap-4 text-sm">
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 bg-red-500 rounded-sm"></span>
                    <span className="text-muted-foreground">Sell</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 bg-green-500 rounded-sm"></span>
                    <span className="text-muted-foreground">Buy</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Chart Body */}
            <div className="p-4 md:p-6">
              <div className="overflow-auto max-h-[600px]">
                <div className="min-w-[600px]">
                  {/* Chart Grid */}
                  <div className="relative">
                    {filteredBuckets.map((bucket, index) => {
                      const isCurrentPrice = currentPriceIndex === index;
                      const shortWidth = (bucket.shortCountPercent / maxPercent) * 100;
                      const longWidth = (bucket.longCountPercent / maxPercent) * 100;

                      return (
                        <div
                          key={`${bucket.price}-${index}`}
                          className={`flex items-center group transition-colors cursor-pointer ${
                            isCurrentPrice ? "bg-green-500/10 dark:bg-green-500/20" : "hover:bg-muted/50"
                          }`}
                          style={{ height: `${barHeight}px` }}
                          onMouseMove={(e) => handleMouseMove(e, bucket)}
                          onMouseLeave={handleMouseLeave}
                        >
                          {/* Sell (Short) - Left side */}
                          <div className="w-[42%] flex justify-end items-center pr-2">
                            <div className="relative w-full flex justify-end" style={{ height: `${Math.round(16 * zoomLevel)}px` }}>
                              <div
                                className="bg-gradient-to-l from-red-500 to-red-400 h-full rounded-l transition-all duration-200"
                                style={{ width: `${shortWidth}%`, minWidth: bucket.shortCountPercent > 0 ? "3px" : "0" }}
                              />
                            </div>
                          </div>

                          {/* Price Column - Center */}
                          <div className="w-[16%] flex justify-center items-center">
                            <span
                              className={`font-mono px-2 py-0.5 rounded transition-all ${
                                isCurrentPrice
                                  ? "bg-green-500 text-white font-semibold"
                                  : "text-muted-foreground group-hover:text-foreground"
                              }`}
                              style={{ fontSize: `${Math.max(10, 12 * zoomLevel)}px` }}
                            >
                              {bucket.price.toFixed(2)}
                            </span>
                          </div>

                          {/* Buy (Long) - Right side */}
                          <div className="w-[42%] flex justify-start items-center pl-2">
                            <div className="relative w-full flex justify-start" style={{ height: `${Math.round(16 * zoomLevel)}px` }}>
                              <div
                                className="bg-gradient-to-r from-green-500 to-green-400 h-full rounded-r transition-all duration-200"
                                style={{ width: `${longWidth}%`, minWidth: bucket.longCountPercent > 0 ? "3px" : "0" }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* X-axis */}
                  <div className="flex items-center mt-4 pt-4 border-t border-border">
                    <div className="w-[42%] flex justify-between text-xs text-muted-foreground px-2">
                      <span>{maxPercent.toFixed(2)}%</span>
                      <span>{(maxPercent * 0.5).toFixed(2)}%</span>
                      <span>0%</span>
                    </div>
                    <div className="w-[16%] text-center text-xs text-muted-foreground">Price</div>
                    <div className="w-[42%] flex justify-between text-xs text-muted-foreground px-2">
                      <span>0%</span>
                      <span>{(maxPercent * 0.5).toFixed(2)}%</span>
                      <span>{maxPercent.toFixed(2)}%</span>
                    </div>
                  </div>

                  {filteredBuckets.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No data in this price range. Try adjusting the filter.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Chart Footer */}
            {data.time && (
              <div className="px-4 md:px-6 py-4 border-t border-border bg-muted/30">
                <p className="text-sm text-muted-foreground">
                  Last updated: <span className="font-medium text-foreground">{formatTime(data.time)}</span>
                  {!startPrice && !endPrice && (
                    <span className="ml-4 text-xs">
                      (Showing: {autoRange.start.toFixed(2)} - {autoRange.end.toFixed(2)})
                    </span>
                  )}
                </p>
              </div>
            )}
          </div>
        )}

        {loading && !data && (
          <div className="flex flex-col justify-center items-center h-64 bg-card border border-border rounded-xl">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-green-500 border-t-transparent"></div>
            <p className="mt-4 text-muted-foreground">Loading order book data...</p>
          </div>
        )}

        {!loading && !data && !error && (
          <div className="flex flex-col justify-center items-center h-64 bg-card border border-border rounded-xl">
            <p className="text-muted-foreground">No data available</p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
