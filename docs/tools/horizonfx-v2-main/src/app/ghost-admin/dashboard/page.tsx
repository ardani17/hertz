"use client";

import { useState, useEffect, useCallback } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { RefreshCw } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AdminHeader from '@/components/admin/AdminHeader';
import OverviewTab from '@/components/admin/OverviewTab';
import AnnouncementTab from '@/components/admin/AnnouncementTab';
import NewsTab from '@/components/admin/NewsTab';
import SystemTab from '@/components/admin/SystemTab';
import AnalyticsTab from '@/components/admin/AnalyticsTab';
import AdminManagementTab from '@/components/admin/AdminManagementTab';
import ToolsTab from '@/components/admin/ToolsTab';
import UserTab from '@/components/admin/UserTab';

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

interface AdminUser {
  _id: string;
  username: string;
  email: string;
  createdAt: string;
  updatedAt: string;
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

interface SystemInfo {
  serverTime: string;
  uptime: string;
  version: string;
  environment: string;
  nodeVersion: string;
  platform: string;
  architecture: string;
  totalMemory: string;
  freeMemory: string;
  memoryUsage: number;
  cpuUsage: number;
  loadAverage: number[];
}

interface SecurityStatus {
  sslCertificate: { status: string; message: string };
  rateLimiting: { status: string; message: string };
  csrfProtection: { status: string; message: string };
  failedLogins24h: number;
  securityScore: number;
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshing, setRefreshing] = useState(false);
  const [newsLoading, setNewsLoading] = useState(false);
  const [selectedNews, setSelectedNews] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Admin management states
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null);
  const [adminFormData, setAdminFormData] = useState({
    username: '',
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  
  // Real-time data states
  const [recentActivities, setRecentActivities] = useState<ActivityLog[]>([]);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [securityStatus, setSecurityStatus] = useState<SecurityStatus | null>(null);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [systemLoading, setSystemLoading] = useState(false);


  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/ghost-admin/login');
      return;
    }
  }, [session, status, router]);

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      setRefreshing(true);
      const [statsRes, newsRes, analyticsRes] = await Promise.all([
        fetch('/api/admin/dashboard/stats'),
        fetch('/api/admin/dashboard/news?limit=10'),
        fetch('/api/admin/dashboard/analytics')
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.data);
      }

      if (newsRes.ok) {
        const newsData = await newsRes.json();
        setNews(newsData.news || []);
      }

      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json();
        setAnalytics(analyticsData);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, []);

  // Fetch real-time data
  const fetchRealtimeData = useCallback(async () => {
    try {
      setActivitiesLoading(true);
      setSystemLoading(true);
      
      const [activitiesRes, systemRes] = await Promise.all([
        fetch('/api/admin/activities?limit=10'),
        fetch('/api/admin/system')
      ]);

      if (activitiesRes.ok) {
        const activitiesData = await activitiesRes.json();
        setRecentActivities(activitiesData.activities || []);
      }

      if (systemRes.ok) {
        const systemData = await systemRes.json();
        setSystemInfo(systemData.systemInfo);
        setSecurityStatus(systemData.securityStatus);
      }
    } catch (error) {
      console.error('Error fetching realtime data:', error);
    } finally {
      setActivitiesLoading(false);
      setSystemLoading(false);
    }
  }, []);

  // Fetch admin users
  const fetchAdminUsers = useCallback(async () => {
    try {
      setAdminLoading(true);
      const response = await fetch('/api/admin/users');
      if (response.ok) {
        const data = await response.json();
        setAdminUsers(data.data || []);
      } else {
        toast.error('Failed to fetch admin users');
      }
    } catch (error) {
      console.error('Error fetching admin users:', error);
      toast.error('Error fetching admin users');
    } finally {
      setAdminLoading(false);
    }
  }, []);

  // Handle admin form submission
  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingAdmin) {
      // For editing, only password is required
      if (!adminFormData.password) {
        toast.error('Password is required');
        return;
      }
    } else {
      // For creating new admin, all fields are required
      if (!adminFormData.username || !adminFormData.email || !adminFormData.password) {
        toast.error('Username, email, and password are required');
        return;
      }
    }

    const loadingToast = toast.loading(editingAdmin ? 'Updating password...' : 'Creating admin...');

    try {
      const url = '/api/admin/users';
      const method = editingAdmin ? 'PUT' : 'POST';
      const body = editingAdmin 
        ? { id: editingAdmin._id, password: adminFormData.password }
        : adminFormData;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || (editingAdmin ? 'Password updated successfully' : 'Admin created successfully'), {
          id: loadingToast
        });
        setShowAdminModal(false);
        setEditingAdmin(null);
        setAdminFormData({ username: '', email: '', password: '' });
        fetchAdminUsers();
      } else {
        toast.error(data.error || 'Operation failed', { id: loadingToast });
      }
    } catch (error) {
      console.error('Error submitting admin form:', error);
      toast.error('Network error occurred', { id: loadingToast });
    }
  };

  // Handle admin deletion
  const handleDeleteAdmin = async (adminId: string) => {
    if (!confirm('Are you sure you want to delete this admin?')) {
      return;
    }

    const loadingToast = toast.loading('Deleting admin...');

    try {
      const response = await fetch(`/api/admin/users?id=${adminId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || 'Admin deleted successfully', { id: loadingToast });
        fetchAdminUsers();
      } else {
        toast.error(data.error || 'Failed to delete admin', { id: loadingToast });
      }
    } catch (error) {
      console.error('Error deleting admin:', error);
      toast.error('Network error occurred', { id: loadingToast });
    }
  };

  // Handle edit admin
  const handleEditAdmin = (admin: AdminUser) => {
    setEditingAdmin(admin);
    setAdminFormData({
      username: admin.username,
      email: admin.email,
      password: ''
    });
    setShowAdminModal(true);
  };

  // Handle add new admin
  const handleAddAdmin = () => {
    setEditingAdmin(null);
    setAdminFormData({ username: '', email: '', password: '' });
    setShowAdminModal(true);
  };

  const fetchNews = useCallback(async (page = 1) => {
    try {
      setNewsLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        search: searchTerm,
        sortBy,
        sortOrder
      });
      
      const response = await fetch(`/api/admin/news?${params}`);
      if (response.ok) {
        const data = await response.json();
        setNews(data.data.news || []);
        setTotalPages(data.data.pagination.pages);
        setCurrentPage(page);
      }
    } catch (error) {
      console.error('Failed to fetch news:', error);
    } finally {
      setNewsLoading(false);
    }
  }, [searchTerm, sortBy, sortOrder]);

  useEffect(() => {
    if (session) {
      fetchDashboardData();
      fetchAdminUsers();
      fetchRealtimeData();
      const interval = setInterval(() => {
        fetchDashboardData();
        fetchRealtimeData();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [session, fetchDashboardData, fetchRealtimeData, fetchAdminUsers]);

  // Fetch admin users when admin tab is active
  useEffect(() => {
    if (session && activeTab === 'admin') {
      fetchAdminUsers();
    }
  }, [session, activeTab, fetchAdminUsers]);

  // Fetch system data when system tab is active
  useEffect(() => {
    if (session && activeTab === 'system') {
      fetchRealtimeData();
    }
  }, [session, activeTab, fetchRealtimeData]);

  // Handle scheduler control
  const handleSchedulerControl = async (action: 'start' | 'stop' | 'restart') => {
    const actionText = action === 'start' ? 'Starting' : action === 'stop' ? 'Stopping' : 'Restarting';
    const toastId = toast.loading(`${actionText} scheduler...`);
    
    try {
      const response = await fetch('/api/admin/scheduler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || `Scheduler ${action}ed successfully`, {
          id: toastId
        });
        fetchDashboardData(); // Refresh data
      } else {
        toast.error(data.error || `Failed to ${action} scheduler`, {
          id: toastId
        });
      }
    } catch (error) {
      console.error('Error controlling scheduler:', error);
      toast.error(`Network error occurred while ${action}ing scheduler`, {
        id: toastId
      });
    }
  };

  // Handle delete logs
  const handleDeleteLogs = async () => {
    const toastId = toast.loading('Deleting old log files...');
    
    try {
      const response = await fetch('/api/admin/delete-logs', {
        method: 'DELETE'
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(
          `Successfully deleted ${data.deletedCount} log files (${data.totalSize})`, 
          { id: toastId }
        );
      } else {
        toast.error(data.error || 'Failed to delete log files', {
          id: toastId
        });
      }
    } catch (error) {
      console.error('Error deleting logs:', error);
      toast.error('Network error occurred while deleting logs', {
        id: toastId
      });
    }
  };

  const handleDeleteNews = async (id: string) => {
    const toastId = toast.loading('Deleting news item...');
    
    try {
      const response = await fetch(`/api/admin/news?id=${id}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast.success(data.message || 'News item deleted successfully', {
          id: toastId
        });
        await fetchNews(currentPage);
        await fetchDashboardData();
      } else {
        toast.error(data.error || 'Failed to delete news item', {
          id: toastId
        });
      }
    } catch (error) {
      console.error('Failed to delete news:', error);
      toast.error('Network error occurred while deleting news item', {
        id: toastId
      });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedNews.length === 0) return;
    
    const toastId = toast.loading(`Deleting ${selectedNews.length} news items...`);
    
    try {
      const response = await fetch('/api/admin/news/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'delete',
          ids: selectedNews
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast.success(data.message || `Successfully deleted ${selectedNews.length} news items`, {
          id: toastId
        });
        setSelectedNews([]);
        await fetchNews(currentPage);
        await fetchDashboardData();
      } else {
        toast.error(data.error || 'Failed to delete news items', {
          id: toastId
        });
      }
    } catch (error) {
      console.error('Failed to bulk delete news:', error);
      toast.error('Network error occurred while deleting news items', {
        id: toastId
      });
    }
  };

  const handleDeleteOldNews = async (days: number) => {
    const toastId = toast.loading(`Deleting news older than ${days} days...`);
    
    try {
      const response = await fetch('/api/admin/news/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'deleteOld',
          days
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast.success(data.message || `Successfully deleted old news items`, {
          id: toastId
        });
        await fetchNews(currentPage);
        await fetchDashboardData();
      } else {
        toast.error(data.error || 'Failed to delete old news items', {
          id: toastId
        });
      }
    } catch (error) {
      console.error('Failed to delete old news:', error);
      toast.error('Network error occurred while deleting old news items', {
        id: toastId
      });
    }
  };

  const toggleNewsSelection = (id: string) => {
    setSelectedNews(prev => 
      prev.includes(id) 
        ? prev.filter(newsId => newsId !== id)
        : [...prev, id]
    );
  };

  const toggleAllNews = () => {
    setSelectedNews(prev => 
      prev.length === news.length 
        ? []
        : news.map(newsItem => newsItem._id)
    );
  };

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (searchTerm !== undefined) {
        fetchNews(1);
      }
    }, 500);
    
    return () => clearTimeout(delayedSearch);
  }, [searchTerm, sortBy, sortOrder, fetchNews]);

  // Handle manual news fetch
  const handleManualFetch = async () => {
    const toastId = toast.loading('Fetching latest news...');
    
    try {
      const response = await fetch('/api/news/fetch', {
        method: 'POST'
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || 'News fetched successfully', {
          id: toastId
        });
        fetchDashboardData(); // Refresh data
      } else {
        toast.error(data.error || 'Failed to fetch news', {
          id: toastId
        });
      }
    } catch (error) {
      console.error('Error fetching news manually:', error);
      toast.error('Network error occurred while fetching news', {
        id: toastId
      });
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader 
        currentUser={session.user}
        onRefresh={fetchDashboardData}
        refreshing={refreshing}
        onLogout={() => signOut()}
      />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-8">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="announcement">Announcement</TabsTrigger>
            <TabsTrigger value="news">News</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="tools">Tools</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="admin">Admin</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <OverviewTab 
              stats={stats}
              news={news}
              onManualFetch={handleManualFetch}
              onSchedulerControl={handleSchedulerControl}
              onDeleteLogs={handleDeleteLogs}
            />
          </TabsContent>

          {/* Announcement Tab */}
          <TabsContent value="announcement" className="space-y-6">
            <AnnouncementTab />
          </TabsContent>

          {/* News Management Tab */}
          <TabsContent value="news" className="space-y-6">
            <NewsTab 
              stats={stats}
              news={news}
              loading={loading}
              newsLoading={newsLoading}
              refreshing={refreshing}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              sortBy={sortBy}
              setSortBy={setSortBy}
              sortOrder={sortOrder}
              setSortOrder={setSortOrder}
              selectedNews={selectedNews}
              onToggleAllNews={toggleAllNews}
              onToggleNewsSelection={toggleNewsSelection}
              onSchedulerControl={handleSchedulerControl}
              onBulkDelete={handleBulkDelete}
              onDeleteOldNews={handleDeleteOldNews}
              onManualFetch={handleManualFetch}
              onDeleteNews={handleDeleteNews}
              onFetchNews={fetchNews}
              currentPage={currentPage}
              totalPages={totalPages}
            />
          </TabsContent>

          <TabsContent value="system" className="space-y-6">
            <SystemTab 
              systemInfo={systemInfo}
              securityStatus={securityStatus}
              stats={stats}
            />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <AnalyticsTab 
              analytics={analytics}
              recentActivities={recentActivities}
              activitiesLoading={activitiesLoading}
            />
          </TabsContent>

          <TabsContent value="tools" className="space-y-6">
            <ToolsTab 
              analytics={analytics}
              recentActivities={recentActivities}
              activitiesLoading={activitiesLoading}
            />
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <UserTab />
          </TabsContent>

          <TabsContent value="admin" className="space-y-6">
            <AdminManagementTab 
              currentUser={session?.user ? { username: session.user.email?.split('@')[0] || '', email: session.user.email || '' } : null}
              adminUsers={adminUsers}
              adminLoading={adminLoading}
              recentActivities={recentActivities}
              activitiesLoading={activitiesLoading}
              systemInfo={systemInfo}
              systemLoading={systemLoading}
              securityStatus={securityStatus}
              showAdminModal={showAdminModal}
              setShowAdminModal={setShowAdminModal}
              editingAdmin={editingAdmin}
              setEditingAdmin={setEditingAdmin}
              adminFormData={adminFormData}
              setAdminFormData={setAdminFormData}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              onAddAdmin={handleAddAdmin}
              onEditAdmin={handleEditAdmin}
              onDeleteAdmin={handleDeleteAdmin}
              onAdminSubmit={handleAdminSubmit}
              onLogout={() => signOut()}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}