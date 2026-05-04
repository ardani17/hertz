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

interface IndicesItem {
  symbol: string;
  name: string;
  lastPrice: number;
  change: number;
  changePercent: number;
}

interface IndicesResponse {
  success: boolean;
  data: IndicesItem[];
}

export function IndicesTable() {
  const [indices, setIndices] = useState<IndicesItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchIndices = async (isInitialLoad = false) => {
    try {
      if (isInitialLoad) {
        setLoading(true);
      } else {
        setIsUpdating(true);
      }
      
      const response = await fetch('/api/indices', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: IndicesResponse = await response.json();
      if (data && data.data && Array.isArray(data.data)) {
        setIndices(data.data);
        setLastUpdated(new Date());
      } else {
        console.error('Invalid data structure:', data);
        setIndices([]);
      }
    } catch (error) {
      console.error("Error fetching indices:", error);
      setIndices([]);
    } finally {
      if (isInitialLoad) {
        setLoading(false);
      }
      setIsUpdating(false);
    }
  };

  useEffect(() => {
    fetchIndices(true);
    const interval = setInterval(() => fetchIndices(false), 60000);
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
        <h3 className="text-lg font-semibold">Indices Price</h3>
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
            ) : indices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                  No data available
                </TableCell>
              </TableRow>
            ) : (
              indices.map((item) => (
                <TableRow key={item.symbol}>
                  <TableCell 
                    className={`font-medium ${
                      item.change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {item.name}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatPrice(item.lastPrice)}
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
