import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calculator, TrendingUp, Star, BarChart3, Activity, RefreshCw } from 'lucide-react';

interface AnalyticsData {
  newsAnalytics: {
    dailyNews: Array<{ _id: string; count: number }>;
    totalNews: number;
    newsByMarket: Array<{ _id: string; count: number }>;
  };
  trafficData: Array<{
    date: string;
    visitors: number;
    pageViews: number;
    bounceRate: number;
  }>;
  performanceMetrics: {
    avgResponseTime: number;
    uptime: number;
    errorRate: number;
    totalRequests: number;
  };
  toolsUsage: Array<{
    name: string;
    visits: number;
  }>;
}

interface ActivityLog {
  id: string;
  action: string;
  description: string;
  username: string;
  status: 'success' | 'warning' | 'error';
  category: string;
  timestamp: string;
  ip: string;
  metadata?: Record<string, unknown>;
}

interface ToolsTabProps {
  analytics: AnalyticsData | null;
  recentActivities?: ActivityLog[];
  activitiesLoading?: boolean;
}

export default function ToolsTab({ analytics, recentActivities = [], activitiesLoading = false }: ToolsTabProps) {
  return (
    <>
      {/* Tools Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tools</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.toolsUsage?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Available calculators
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Usage</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics?.toolsUsage?.reduce((sum, tool) => sum + tool.visits, 0)?.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              Total calculator uses
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Most Popular</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics?.toolsUsage?.[0]?.name?.split(' ')[0] || 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics?.toolsUsage?.[0]?.visits?.toLocaleString() || '0'} uses
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Usage</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics?.toolsUsage && analytics.toolsUsage.length > 0 
                ? Math.round(analytics.toolsUsage.reduce((sum, tool) => sum + tool.visits, 0) / analytics.toolsUsage.length)
                : 0
              }
            </div>
            <p className="text-xs text-muted-foreground">
              Uses per tool
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Calculator Usage Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Calculator Usage Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics?.toolsUsage?.map((tool, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="font-medium">{tool.name}</span>
                </div>
                <div className="text-right">
                  <div className="font-bold">{tool.visits.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">uses</div>
                </div>
              </div>
            )) || (
              <div className="text-center py-8 text-muted-foreground">
                No usage data available
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tool Categories */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Tool Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span>Financial Calculators</span>
                <span className="font-bold">4</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Trading Tools</span>
                <span className="font-bold">2</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Analysis Tools</span>
                <span className="font-bold">1</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Activity
              {activitiesLoading && <RefreshCw className="h-4 w-4 animate-spin" />}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivities.length > 0 ? (
                recentActivities.slice(0, 5).map((activity, index) => {
                  const statusColor = activity.status === 'success' ? 'bg-green-500' : 
                                    activity.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500';
                  const timeAgo = new Date(activity.timestamp).toLocaleString();
                  
                  return (
                    <div key={activity.id || index} className="flex items-center gap-3 text-sm">
                      <div className={`w-2 h-2 rounded-full ${statusColor}`}></div>
                      <span className="text-muted-foreground">{activity.description}</span>
                      <span className="ml-auto text-xs">{timeAgo}</span>
                    </div>
                  );
                })
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">Profitability Calculator</div>
                      <div className="text-xs text-muted-foreground">Used 2 minutes ago</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">Pivot Point Calculator</div>
                      <div className="text-xs text-muted-foreground">Used 5 minutes ago</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">Elliott Wave Calculator</div>
                      <div className="text-xs text-muted-foreground">Used 8 minutes ago</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}