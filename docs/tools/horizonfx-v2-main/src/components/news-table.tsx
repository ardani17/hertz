"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { NewsModal } from "./news-modal";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { sanitizeSearchInput, sanitizeNewsContent, clientRateLimit, decodeHtmlEntities } from "@/lib/security";

interface NewsItem {
  _id: string;
  id: string;
  title: string;
  body: string;
  providerId: string;
  marketType: string;
  createdAt: string;
  updatedAt: string;
}

interface NewsResponse {
  success: boolean;
  data: NewsItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export function NewsTable() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const isInitialLoad = useRef(true);
  const lastSearchRef = useRef("");
  const lastPageRef = useRef(1);

  const fetchNews = useCallback(async (searchTerm: string = "", page: number = 1, isAutoRefresh: boolean = false) => {
    try {
      // Rate limiting for API calls - more lenient for auto-refresh
      const rateLimitKey = isAutoRefresh ? 'news_auto_refresh' : 'news_fetch';
      const rateLimitCount = isAutoRefresh ? 100 : 30; // Higher limit for auto-refresh
      if (!clientRateLimit(rateLimitKey, rateLimitCount, 60000)) {
        // Silent operation - logs removed to reduce terminal noise
        return;
      }

      setLoading(true);
      // Sanitize search input before sending to API
      const sanitizedSearch = sanitizeSearchInput(searchTerm);
      
      const params = new URLSearchParams({
        search: sanitizedSearch,
        page: page.toString(),
        limit: "10"
      });
      
      const response = await fetch(`/api/news?${params}`);
      const data: NewsResponse = await response.json();
      
      if (data.success) {
        // Only try to fetch fresh data on manual requests (not auto-refresh)
        // Server-side scheduler now handles automatic external API fetching
        if (data.data.length === 0 && page === 1 && !searchTerm && !isAutoRefresh) {
          try {
            await fetch('/api/news/fetch', { method: 'POST' });
            // Retry fetching after attempting to populate database
            const retryResponse = await fetch(`/api/news?${params}`);
            const retryData: NewsResponse = await retryResponse.json();
            if (retryData.success && retryData.data.length > 0) {
              const sanitizedNews = retryData.data.map(item => ({
                ...item,
                ...sanitizeNewsContent({
                  title: item.title,
                  body: item.body,
                  providerId: item.providerId
                })
              }));
              setNews(sanitizedNews);
              setTotalPages(retryData.pagination.pages);
              setCurrentPage(retryData.pagination.page);
              return;
            }
          } catch {
            // Silent operation - logs removed to reduce terminal noise
          }
        }
        
        // Sanitize news content before setting state
        const sanitizedNews = data.data.map(item => ({
          ...item,
          ...sanitizeNewsContent({
            title: item.title,
            body: item.body,
            providerId: item.providerId
          })
        }));
        setNews(sanitizedNews);
        setTotalPages(data.pagination.pages);
        setCurrentPage(data.pagination.page);
      }
    } catch {
      // Silent operation - logs removed to reduce terminal noise
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    if (isInitialLoad.current) {
      fetchNews();
      isInitialLoad.current = false;
      lastSearchRef.current = search;
      lastPageRef.current = currentPage;
    }
  }, [fetchNews, search, currentPage]);

  // Auto refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchNews(search, currentPage, true);
    }, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [fetchNews, search, currentPage]);

  // Handle search changes
  useEffect(() => {
    if (!isInitialLoad.current && lastSearchRef.current !== search) {
      const timeoutId = setTimeout(() => {
        setCurrentPage(1);
        fetchNews(search, 1);
        lastSearchRef.current = search;
        lastPageRef.current = 1;
      }, 300);

      return () => clearTimeout(timeoutId);
    }
  }, [search, fetchNews]);

  // Handle page changes
  useEffect(() => {
    if (!isInitialLoad.current && lastPageRef.current !== currentPage && lastSearchRef.current === search) {
      fetchNews(search, currentPage);
      lastPageRef.current = currentPage;
    }
  }, [currentPage, fetchNews, search]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      setCurrentPage(page);
    }
  };

  const handleNewsClick = (newsItem: NewsItem) => {
    setSelectedNews(newsItem);
    setIsModalOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <div className="w-full space-y-4">
      {/* Search Field */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search news..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60%]">Title</TableHead>
              <TableHead className="w-[20%]">Provider</TableHead>
              <TableHead className="w-[20%]">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              // Skeleton loading rows
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell className="py-4">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell className="py-4">
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                </TableRow>
              ))
            ) : news.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                  No news found
                </TableCell>
              </TableRow>
            ) : (
              news.map((item) => (
                <TableRow key={item.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell 
                    className="font-medium"
                    onClick={() => handleNewsClick(item)}
                  >
                    <div className="line-clamp-2">
                      {decodeHtmlEntities(item.title)}
                    </div>
                  </TableCell>
                  <TableCell className="capitalize">
                    {item.providerId}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(item.createdAt)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Custom Pagination Slider */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-1">
          {/* Previous Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="h-8 w-8 p-0 hover:bg-muted"
          >
            <ChevronLeft className="h-3 w-3" />
          </Button>
          
          {/* Page Numbers */}
          <div className="flex items-center space-x-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
              const isActive = page === currentPage;
              const showPage = 
                page === 1 || 
                page === totalPages || 
                (page >= currentPage - 1 && page <= currentPage + 1);
              
              if (!showPage) {
                if (page === currentPage - 2 || page === currentPage + 2) {
                  return (
                    <span key={page} className="px-1 text-muted-foreground text-sm">
                      ...
                    </span>
                  );
                }
                return null;
              }
              
              return (
                <Button
                  key={page}
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  onClick={() => handlePageChange(page)}
                  className={`h-8 w-8 p-0 text-sm ${
                    isActive 
                      ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                      : "hover:bg-muted"
                  }`}
                >
                  {page}
                </Button>
              );
            })}
          </div>
          
          {/* Next Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="h-8 w-8 p-0 hover:bg-muted"
          >
            <ChevronRight className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Modal */}
      {selectedNews && (
        <NewsModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedNews(null);
          }}
          title={selectedNews.title}
          body={selectedNews.body}
        />
      )}
    </div>
  );
}