import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  TrendingUp,
  Activity,
  Clock,
  CheckCircle,
  AlertTriangle,
  Server,
  Database,
  Cpu,
  Wifi,
  Download,
  RotateCcw,
  Pause,
  Play,
  Trash2
} from 'lucide-react';

interface DatabaseStats {
  collections: number;
  totalDocuments: number;
  databaseSize: string;
  indexes: number;
}

interface DashboardStats {
  totalNews: number;
  todayNews: number;
  schedulerStatus: 'running' | 'stopped';
  lastFetch: string;
  apiHealth: {
    news: boolean;
    stocks: boolean;
    calendar: boolean;
  };
  systemHealth: {
    database: boolean;
    scheduler: boolean;
    memory: number;
  };
  databaseStats: DatabaseStats;
}

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

interface OverviewTabProps {
  stats: DashboardStats | null;
  news: NewsItem[];
  onManualFetch: () => void;
  onSchedulerControl: (action: 'start' | 'stop' | 'restart') => void;
  onDeleteLogs?: () => void;
}

export default function OverviewTab({ stats, news, onManualFetch, onSchedulerControl, onDeleteLogs }: OverviewTabProps) {
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total News</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalNews || 0}</div>
            <p className="text-xs text-muted-foreground">
              Articles in database
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today&apos;s News</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.todayNews || 0}</div>
            <p className="text-xs text-muted-foreground">
              New articles today
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduler Status</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Badge variant={stats?.schedulerStatus === 'running' ? 'default' : 'secondary'}>
                {stats?.schedulerStatus === 'running' ? (
                  <><CheckCircle className="w-3 h-3 mr-1" />Running</>
                ) : (
                  <><AlertTriangle className="w-3 h-3 mr-1" />Stopped</>
                )}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Auto fetch news
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Fetch</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">
              {stats?.lastFetch 
                ? new Date(stats.lastFetch).toLocaleString()
                : 'Never'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              Last news update
            </p>
          </CardContent>
        </Card>
      </div>

      {/* System Health */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              System Health
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                Database
              </span>
              <Badge variant={stats?.systemHealth.database ? 'default' : 'destructive'}>
                {stats?.systemHealth.database ? 'Connected' : 'Disconnected'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Scheduler
              </span>
              <Badge variant={stats?.systemHealth.scheduler ? 'default' : 'secondary'}>
                {stats?.systemHealth.scheduler ? 'Running' : 'Stopped'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Cpu className="h-4 w-4" />
                Memory Usage
              </span>
              <span className="text-sm font-medium">
                {stats?.systemHealth.memory || 0}%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wifi className="h-5 w-5" />
              API Health
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span>News API</span>
              <Badge variant={stats?.apiHealth.news ? 'default' : 'destructive'}>
                {stats?.apiHealth.news ? 'Healthy' : 'Error'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Stocks API</span>
              <Badge variant={stats?.apiHealth.stocks ? 'default' : 'destructive'}>
                {stats?.apiHealth.stocks ? 'Healthy' : 'Error'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Calendar API</span>
              <Badge variant={stats?.apiHealth.calendar ? 'default' : 'destructive'}>
                {stats?.apiHealth.calendar ? 'Healthy' : 'Error'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button onClick={onManualFetch}>
              <Download className="h-4 w-4 mr-2" />
              Fetch News Now
            </Button>
            <Button 
              variant="outline" 
              onClick={() => onSchedulerControl('restart')}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Restart Scheduler
            </Button>
            {stats?.schedulerStatus === 'running' ? (
              <Button 
                variant="destructive" 
                onClick={() => onSchedulerControl('stop')}
              >
                <Pause className="h-4 w-4 mr-2" />
                Stop Scheduler
              </Button>
            ) : (
              <Button 
                variant="default" 
                onClick={() => onSchedulerControl('start')}
              >
                <Play className="h-4 w-4 mr-2" />
                Start Scheduler
              </Button>
            )}
            {onDeleteLogs && (
              <Button 
                variant="outline" 
                onClick={onDeleteLogs}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Logs 1+ Days Old
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent News */}
      <Card>
        <CardHeader>
          <CardTitle>Recent News</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {news.length > 0 ? (
              news.slice(0, 5).map((item) => (
                <div key={item._id} className="flex items-start space-x-3 p-3 border border-border rounded-lg">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium truncate">{item.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      {item.providerId} • {new Date(item.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {item.marketType}
                  </Badge>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No news available</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}