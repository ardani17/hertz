import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Play,
  Pause,
  RefreshCw,
  Search,
  Trash2,
  Download
} from 'lucide-react';

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

interface DashboardStats {
  schedulerStatus: 'running' | 'stopped';
}

interface NewsTabProps {
  stats: DashboardStats | null;
  news: NewsItem[];
  newsLoading: boolean;
  refreshing: boolean;
  loading: boolean;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
  sortOrder: string;
  setSortOrder: (order: string) => void;
  selectedNews: string[];
  currentPage: number;
  totalPages: number;
  onSchedulerControl: (action: 'start' | 'stop' | 'restart') => void;
  onManualFetch: () => void;
  onBulkDelete: () => void;
  onDeleteOldNews: (days: number) => void;
  onDeleteNews: (id: string) => void;
  onToggleAllNews: () => void;
  onToggleNewsSelection: (id: string) => void;
  onFetchNews: (page: number) => void;
}

export default function NewsTab({
  stats,
  news,
  newsLoading,
  refreshing,
  loading,
  searchTerm,
  setSearchTerm,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  selectedNews,
  currentPage,
  totalPages,
  onSchedulerControl,
  onManualFetch,
  onBulkDelete,
  onDeleteOldNews,
  onDeleteNews,
  onToggleAllNews,
  onToggleNewsSelection,
  onFetchNews
}: NewsTabProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>News Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Scheduler Controls */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h3 className="font-medium">News Scheduler</h3>
              <p className="text-sm text-muted-foreground">
                Status: {stats?.schedulerStatus || 'Unknown'} • Interval: 10 minutes
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onSchedulerControl('start')}
                disabled={loading || stats?.schedulerStatus === 'running'}
              >
                <Play className="w-4 h-4 mr-1" />
                Start
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onSchedulerControl('stop')}
                disabled={loading || stats?.schedulerStatus === 'stopped'}
              >
                <Pause className="w-4 h-4 mr-1" />
                Stop
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onSchedulerControl('restart')}
                disabled={loading}
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                Restart
              </Button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search news..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt">Date</SelectItem>
                <SelectItem value="title">Title</SelectItem>
                <SelectItem value="marketType">Market Type</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortOrder} onValueChange={setSortOrder}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Desc</SelectItem>
                <SelectItem value="asc">Asc</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bulk Actions */}
          {selectedNews.length > 0 && (
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <span className="text-sm font-medium">
                {selectedNews.length} selected
              </span>
              <Button
                size="sm"
                variant="destructive"
                onClick={onBulkDelete}
                disabled={newsLoading}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Delete Selected
              </Button>
            </div>
          )}

          {/* Quick Actions */}
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onDeleteOldNews(30)}
              disabled={newsLoading}
            >
              Delete 30+ days old
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onDeleteOldNews(7)}
              disabled={newsLoading}
            >
              Delete 7+ days old
            </Button>
            <Button
              onClick={onManualFetch}
              disabled={refreshing}
            >
              {refreshing ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              Fetch Now
            </Button>
          </div>

          {/* News Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedNews.length === news.length && news.length > 0}
                      onCheckedChange={onToggleAllNews}
                    />
                  </TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Market Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {newsLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                      Loading news...
                    </TableCell>
                  </TableRow>
                ) : news.length > 0 ? (
                  news.map((item) => (
                    <TableRow key={item._id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedNews.includes(item._id)}
                          onCheckedChange={() => onToggleNewsSelection(item._id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="max-w-md">
                          <p className="font-medium text-sm truncate">{item.title}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {item.body?.substring(0, 100)}...
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.marketType}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onDeleteNews(item._id)}
                          disabled={newsLoading}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No news found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onFetchNews(currentPage - 1)}
                  disabled={currentPage === 1 || newsLoading}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onFetchNews(currentPage + 1)}
                  disabled={currentPage === totalPages || newsLoading}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}