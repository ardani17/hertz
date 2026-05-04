import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Clock,
  Cpu,
  Monitor,
  Shield,
  Server,
  Database,
  Activity,
  RefreshCw
} from 'lucide-react';

interface SystemInfo {
  uptime: string;
  memoryUsage: number;
  freeMemory: string;
  totalMemory: string;
  cpuUsage: number;
  environment: string;
  version: string;
  platform: string;
  architecture: string;
  nodeVersion: string;
  serverTime: string;
  loadAverage?: number[];
}

interface SecurityStatus {
  securityScore: number;
  sslCertificate: {
    status: string;
  };
  rateLimiting: {
    status: string;
  };
  csrfProtection: {
    status: string;
  };
  failedLogins24h: number;
}

interface DashboardStats {
  systemHealth: {
    database: boolean;
    scheduler: boolean;
    memory: number;
  };
  apiHealth: {
    news: boolean;
    stocks: boolean;
    calendar: boolean;
  };
  schedulerStatus: 'running' | 'stopped';
  databaseStats: {
    collections: number;
    totalDocuments: number;
    databaseSize: string;
  };
}

interface SystemTabProps {
  systemInfo: SystemInfo | null;
  securityStatus: SecurityStatus | null;
  stats: DashboardStats | null;
}

export default function SystemTab({ systemInfo, securityStatus, stats }: SystemTabProps) {
  return (
    <div className="space-y-6">
      {/* System Information */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Server Uptime</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemInfo?.uptime || 'Loading...'}</div>
            <p className="text-xs text-muted-foreground">Since last restart</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemInfo?.memoryUsage || 0}%</div>
            <p className="text-xs text-muted-foreground">
              {systemInfo?.freeMemory} / {systemInfo?.totalMemory}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
            <Monitor className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemInfo?.cpuUsage || 0}%</div>
            <p className="text-xs text-muted-foreground">Current load</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Score</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{securityStatus?.securityScore || 0}/100</div>
            <p className="text-xs text-muted-foreground">Security rating</p>
          </CardContent>
        </Card>
      </div>

      {/* System Details */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              System Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium text-muted-foreground">Environment</p>
                <p className="font-mono">{systemInfo?.environment || 'N/A'}</p>
              </div>
              <div>
                <p className="font-medium text-muted-foreground">Version</p>
                <p className="font-mono">{systemInfo?.version || 'N/A'}</p>
              </div>
              <div>
                <p className="font-medium text-muted-foreground">Platform</p>
                <p className="font-mono">{systemInfo?.platform || 'N/A'}</p>
              </div>
              <div>
                <p className="font-medium text-muted-foreground">Architecture</p>
                <p className="font-mono">{systemInfo?.architecture || 'N/A'}</p>
              </div>
              <div>
                <p className="font-medium text-muted-foreground">Node.js</p>
                <p className="font-mono">{systemInfo?.nodeVersion || 'N/A'}</p>
              </div>
              <div>
                <p className="font-medium text-muted-foreground">Server Time</p>
                <p className="font-mono">{systemInfo?.serverTime || 'N/A'}</p>
              </div>
            </div>
            
            {systemInfo?.loadAverage && (
              <div>
                <p className="font-medium text-muted-foreground mb-2">Load Average</p>
                <div className="flex gap-4 text-sm">
                  <span>1m: {systemInfo.loadAverage[0]?.toFixed(2)}</span>
                  <span>5m: {systemInfo.loadAverage[1]?.toFixed(2)}</span>
                  <span>15m: {systemInfo.loadAverage[2]?.toFixed(2)}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {securityStatus && (
              <>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">SSL Certificate</span>
                    <Badge variant={securityStatus.sslCertificate.status === 'valid' ? 'default' : 'destructive'}>
                      {securityStatus.sslCertificate.status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Rate Limiting</span>
                    <Badge variant={securityStatus.rateLimiting.status === 'active' ? 'default' : 'destructive'}>
                      {securityStatus.rateLimiting.status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">CSRF Protection</span>
                    <Badge variant={securityStatus.csrfProtection.status === 'active' ? 'default' : 'destructive'}>
                      {securityStatus.csrfProtection.status}
                    </Badge>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Failed Logins (24h)</span>
                    <span className="text-sm font-bold text-red-600">{securityStatus.failedLogins24h}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Security Score</span>
                    <span className="text-sm font-bold">{securityStatus.securityScore}/100</span>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Database & Cache Management */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Database Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">MongoDB Connection</span>
                <Badge variant={stats?.systemHealth?.database ? 'default' : 'destructive'}>
                  {stats?.systemHealth?.database ? 'Connected' : 'Disconnected'}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Collections</span>
                  <span className="font-mono">{stats?.databaseStats?.collections || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Total Documents</span>
                  <span className="font-mono">{stats?.databaseStats?.totalDocuments || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Database Size</span>
                  <span className="font-mono">{stats?.databaseStats?.databaseSize || '0 MB'}</span>
                </div>
              </div>
              
              <Button variant="outline" size="sm" className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Stats
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              System Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">API Services</span>
                  <div className="flex gap-1">
                    <div className={`w-2 h-2 rounded-full ${stats?.apiHealth?.news ? 'bg-green-500' : 'bg-red-500'}`} title="News API" />
                    <div className={`w-2 h-2 rounded-full ${stats?.apiHealth?.stocks ? 'bg-green-500' : 'bg-red-500'}`} title="Stocks API" />
                    <div className={`w-2 h-2 rounded-full ${stats?.apiHealth?.calendar ? 'bg-green-500' : 'bg-red-500'}`} title="Calendar API" />
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">News Scheduler</span>
                  <Badge variant={stats?.schedulerStatus === 'running' ? 'default' : 'destructive'}>
                    {stats?.schedulerStatus || 'Unknown'}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Memory Usage</span>
                  <span className="text-sm font-mono">{stats?.systemHealth?.memory || 0}%</span>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <p className="text-xs text-muted-foreground mb-2">Last Health Check</p>
                <p className="text-xs font-mono">{new Date().toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}