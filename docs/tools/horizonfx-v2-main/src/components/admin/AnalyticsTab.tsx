import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Clock,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Users,
  Calculator,
  FileText,
  TrendingUp,
  Star,
  PieChart,
  Activity,
  RefreshCw
} from 'lucide-react';

interface PerformanceMetrics {
  avgResponseTime: number;
  uptime: number;
  errorRate: number;
  totalRequests: number;
}

interface TrafficData {
  date: string;
  visitors: number;
  pageViews: number;
}

interface ToolUsage {
  name: string;
  visits: number;
}

interface NewsAnalytics {
  dailyNews: Array<{
    _id: string;
    count: number;
  }>;
  newsByMarket: Array<{
    _id: string;
    count: number;
  }>;
}

interface AnalyticsData {
  performanceMetrics: PerformanceMetrics;
  trafficData: TrafficData[];
  toolsUsage: ToolUsage[];
  newsAnalytics: NewsAnalytics;
}

interface ActivityLog {
  id: string;
  description: string;
  status: 'success' | 'warning' | 'error';
  timestamp: string;
}

interface AnalyticsTabProps {
  analytics: AnalyticsData | null;
  recentActivities: ActivityLog[];
  activitiesLoading: boolean;
}

export default function AnalyticsTab({ analytics, recentActivities, activitiesLoading }: AnalyticsTabProps) {
  return (
    <div className="space-y-6">
      {/* Performance Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.performanceMetrics.avgResponseTime || 0}ms</div>
            <p className="text-xs text-muted-foreground">
              API response time
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uptime</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.performanceMetrics.uptime || 0}%</div>
            <p className="text-xs text-muted-foreground">
              System availability
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.performanceMetrics.errorRate || 0}%</div>
            <p className="text-xs text-muted-foreground">
              Request error rate
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.performanceMetrics.totalRequests?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">
              Last 7 days
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Traffic Analytics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Traffic Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics?.trafficData?.slice(-7).map((day) => (
                <div key={day.date} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm font-medium">
                      {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{day.visitors} visitors</div>
                    <div className="text-xs text-muted-foreground">{day.pageViews} views</div>
                  </div>
                </div>
              )) || (
                <p className="text-sm text-muted-foreground">No traffic data available</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tools Usage */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Popular Tools
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics?.toolsUsage?.map((tool, index) => (
                <div key={tool.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      index === 0 ? 'bg-green-500' :
                      index === 1 ? 'bg-blue-500' :
                      index === 2 ? 'bg-yellow-500' :
                      index === 3 ? 'bg-purple-500' :
                      'bg-gray-500'
                    }`}></div>
                    <span className="text-sm font-medium">{tool.name}</span>
                  </div>
                  <div className="text-sm font-medium">{tool.visits.toLocaleString()}</div>
                </div>
              )) || (
                <p className="text-sm text-muted-foreground">No usage data available</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* News Analytics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            News Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Daily News Chart */}
            <div>
              <h3 className="font-medium mb-3">Daily News (Last 7 Days)</h3>
              <div className="space-y-2">
                {analytics?.newsAnalytics?.dailyNews?.slice(-7).map((day) => (
                  <div key={day._id} className="flex items-center justify-between">
                    <span className="text-sm">
                      {new Date(day._id).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 rounded-full"
                          style={{ 
                            width: `${Math.min(100, (day.count / Math.max(...(analytics?.newsAnalytics?.dailyNews?.map(d => d.count) || [1]))) * 100)}%` 
                          }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium w-8 text-right">{day.count}</span>
                    </div>
                  </div>
                )) || (
                  <p className="text-sm text-muted-foreground">No news data available</p>
                )}
              </div>
            </div>

            {/* News by Market Type */}
            <div>
              <h3 className="font-medium mb-3">News by Market Type</h3>
              <div className="space-y-2">
                {analytics?.newsAnalytics?.newsByMarket?.map((market) => (
                  <div key={market._id} className="flex items-center justify-between">
                    <span className="text-sm capitalize">{market._id || 'Unknown'}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-green-500 rounded-full"
                          style={{ 
                            width: `${Math.min(100, (market.count / Math.max(...(analytics?.newsAnalytics?.newsByMarket?.map(m => m.count) || [1]))) * 100)}%` 
                          }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium w-8 text-right">{market.count}</span>
                    </div>
                  </div>
                )) || (
                  <p className="text-sm text-muted-foreground">No market data available</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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
              {analytics?.toolsUsage?.reduce((sum, tool) => sum + tool.visits, 0)?.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Total visits
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
              {analytics?.toolsUsage?.[0]?.visits?.toLocaleString() || 0} visits
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
              {analytics?.toolsUsage?.length ? 
                Math.round(analytics.toolsUsage.reduce((sum, tool) => sum + tool.visits, 0) / analytics.toolsUsage.length).toLocaleString() 
                : 0
              }
            </div>
            <p className="text-xs text-muted-foreground">
              Per tool
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tools Categories and Recent Activity */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Tools by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: 'Calculators', count: analytics?.toolsUsage?.filter(t => t.name.includes('Calculator')).length || 0, color: 'bg-blue-500' },
                { name: 'Market Analysis', count: analytics?.toolsUsage?.filter(t => t.name.includes('Analysis')).length || 0, color: 'bg-green-500' },
                { name: 'Trading Tools', count: analytics?.toolsUsage?.filter(t => t.name.includes('Pivot') || t.name.includes('Elliott')).length || 0, color: 'bg-yellow-500' },
                { name: 'Economic Data', count: analytics?.toolsUsage?.filter(t => t.name.includes('Calendar') || t.name.includes('Economic')).length || 0, color: 'bg-purple-500' }
              ].map((category) => (
                <div key={category.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${category.color}`}></div>
                    <span className="text-sm font-medium">{category.name}</span>
                  </div>
                  <span className="text-sm font-medium">{category.count}</span>
                </div>
              ))}
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
                <div className="text-center text-muted-foreground py-4">
                  {activitiesLoading ? 'Loading activities...' : 'No recent activities'}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}