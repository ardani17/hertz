"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { TrendingUp, Award, ChevronLeft, ChevronRight } from "lucide-react";

interface ETFItem {
  symbol: string;
  name: string;
  lastPrice: number;
  change: number;
  changePercent: number;
  volume: string;
  fiftyDayAvg: string;
  twoHundredDayAvg: string;
  threeMonthReturn: string;
  ytdReturn: string;
  fiftyTwoWeekChange: string;
  fiftyTwoWeekRange: string;
}

interface ETFsTableProps {
  title: string;
  endpoint: string;
  type: 'top' | 'performing';
}

export default function ETFsTable({ title, endpoint, type }: ETFsTableProps) {
  const [etfs, setEtfs] = useState<ETFItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 5;

  const fetchETFs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(endpoint);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: ETFItem[] = await response.json();
      setEtfs(data);
    } catch (error) {
      console.error(`Error fetching ${type} ETFs:`, error);
      setError('Failed to fetch ETFs data');
    } finally {
      setLoading(false);
    }
  }, [endpoint, type]);

  useEffect(() => {
    fetchETFs();
  }, [fetchETFs]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  const formatChange = (change: number) => {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)}`;
  };

  const formatChangePercent = (changePercent: number) => {
    const sign = changePercent >= 0 ? '+' : '';
    return `${sign}${changePercent.toFixed(2)}%`;
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600 dark:text-green-400';
    if (change < 0) return 'text-red-600 dark:text-red-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  const getIcon = () => {
    if (type === 'top') return <TrendingUp className="h-5 w-5 text-blue-600" />;
    if (type === 'performing') return <Award className="h-5 w-5 text-purple-600" />;
    return <TrendingUp className="h-5 w-5 text-blue-600" />;
  };

  const getDescription = () => {
    if (type === 'top') return "ETF dengan performa terbaik berdasarkan persentase perubahan. Data diperbarui secara real-time untuk memberikan informasi terkini tentang pergerakan pasar ETF.";
    if (type === 'performing') return "ETF dengan rating performa Morningstar 4 atau 5 bintang. ETF ini menunjukkan kinerja yang konsisten dan berkualitas tinggi.";
    return "ETF pilihan dengan performa terbaik di pasar saat ini.";
  };

  const totalPages = Math.ceil(etfs.length / itemsPerPage);
  const startIndex = currentPage * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentETFs = etfs.slice(startIndex, endIndex);

  const handlePrevious = () => {
    setCurrentPage(prev => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentPage(prev => Math.min(totalPages - 1, prev + 1));
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-6 w-32" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <Skeleton className="h-4 w-16 mb-1" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <div className="text-right">
                  <Skeleton className="h-4 w-20 mb-1" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getIcon()}
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">{error}</p>
            <button 
              onClick={fetchETFs}
              className="mt-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Try Again
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (etfs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getIcon()}
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">No ETFs data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getIcon()}
          {title}
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-2">
          {getDescription()}
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {currentETFs.map((etf) => (
            <div key={etf.symbol} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors">
              <div className="flex-1">
                <div className="font-semibold text-sm">{etf.symbol}</div>
                <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                  {etf.name}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Vol: {etf.volume} | YTD: {etf.ytdReturn}
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium text-sm">
                  {formatPrice(etf.lastPrice)}
                </div>
                <div className={`text-xs ${getChangeColor(etf.change)}`}>
                  {formatChange(etf.change)} ({formatChangePercent(etf.changePercent)})
                </div>
                <div className="text-xs text-muted-foreground">
                  3M: {etf.threeMonthReturn}
                </div>
              </div>
            </div>
          ))}
        </div>
        {etfs.length > itemsPerPage && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-xs text-muted-foreground">
              Showing {startIndex + 1}-{Math.min(endIndex, etfs.length)} of {etfs.length} ETFs
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevious}
                disabled={currentPage === 0}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs text-muted-foreground">
                {currentPage + 1} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNext}
                disabled={currentPage === totalPages - 1}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}