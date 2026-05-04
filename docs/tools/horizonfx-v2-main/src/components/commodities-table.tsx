"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface CommodityItem {
  symbol: string;
  name: string;
  lastPrice: number;
  change: number;
  changePercent: number;
}

interface CommoditiesResponse {
  data: CommodityItem[];
}

export function CommoditiesTable() {
  const [commodities, setCommodities] = useState<CommodityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchCommodities = async (isInitialLoad = false) => {
    try {
      if (isInitialLoad) {
        setLoading(true);
      } else {
        setIsUpdating(true);
      }
      
      const response = await fetch('/api/commodities', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: CommoditiesResponse = await response.json();
      if (data && data.data && Array.isArray(data.data)) {
        setCommodities(data.data);
        setLastUpdated(new Date());
      } else {
        console.error('Invalid data structure:', data);
        setCommodities([]);
      }
    } catch (error) {
      console.error("Error fetching commodities:", error);
      setCommodities([]);
    } finally {
      if (isInitialLoad) {
        setLoading(false);
      }
      setIsUpdating(false);
    }
  };

  useEffect(() => {
    fetchCommodities(true); // Initial load
    // Refresh data every 1 minute
    const interval = setInterval(() => fetchCommodities(false), 60000);
    return () => clearInterval(interval);
  }, []);

  const formatPrice = (price: number) => {
    if (price === undefined || price === null) return '0.00';
    return price.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const formatChange = (change: number) => {
    if (change === undefined || change === null) return '+0.00';
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)}`;
  };

  return (
    <div className="w-full space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Commodities Price</h3>
        <div className="text-sm text-muted-foreground flex items-center gap-2">
          {isUpdating && (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span>Updating...</span>
            </div>
          )}
          {lastUpdated && (
            <span>Last: {lastUpdated.toLocaleTimeString()}</span>
          )}
        </div>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50%]">Name</TableHead>
              <TableHead className="w-[25%] text-right">Last Price</TableHead>
              <TableHead className="w-[25%] text-right">Change</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : commodities.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                  No data available
                </TableCell>
              </TableRow>
            ) : (
              commodities.map((item) => (
                <TableRow key={item.symbol}>
                  <TableCell 
                    className={`font-medium ${
                      item.change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {item.name}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    ${formatPrice(item.lastPrice)}
                  </TableCell>
                  <TableCell 
                    className={`text-right font-mono ${
                      item.change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {formatChange(item.change)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}