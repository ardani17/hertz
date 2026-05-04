import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  RefreshCw,
  Activity,
  Shield,
  Monitor,
  Server,
  AlertTriangle,
  Database,
  CheckCircle,
  XCircle,
  LogOut
} from 'lucide-react';

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
  category: string;
  status: 'success' | 'warning' | 'error';
  timestamp: string;
  ip: string;
  username: string;
}

interface SystemInfo {
  serverTime: string;
  uptime: string;
  version: string;
  environment: string;
  platform: string;
  memoryUsage: number;
  cpuUsage: number;
}

interface SecurityStatus {
  sslCertificate: {
    status: string;
    message: string;
  };
  rateLimiting: {
    status: string;
    message: string;
  };
  csrfProtection: {
    status: string;
    message: string;
  };
  failedLogins24h: number;
  securityScore: number;
}

interface AdminManagementTabProps {
  adminUsers: AdminUser[];
  adminLoading: boolean;
  recentActivities: ActivityLog[];
  activitiesLoading: boolean;
  systemInfo: SystemInfo | null;
  securityStatus: SecurityStatus | null;
  systemLoading: boolean;
  currentUser: { username: string; email: string } | null;
  onAddAdmin: () => void;
  onEditAdmin: (admin: AdminUser) => void;
  onDeleteAdmin: (adminId: string) => void;
  onAdminSubmit: (e: React.FormEvent) => void;
  onLogout: () => void;
  showAdminModal: boolean;
  setShowAdminModal: (show: boolean) => void;
  editingAdmin: AdminUser | null;
  setEditingAdmin: React.Dispatch<React.SetStateAction<AdminUser | null>>;
  adminFormData: { username: string; email: string; password: string };
  setAdminFormData: (data: { username: string; email: string; password: string }) => void;
  showPassword: boolean;
  setShowPassword: (show: boolean) => void;
}

export default function AdminManagementTab({
  adminUsers,
  adminLoading,
  recentActivities,
  activitiesLoading,
  systemInfo,
  securityStatus,
  systemLoading,
  currentUser,
  onAddAdmin,
  onEditAdmin,
  onDeleteAdmin,
  onAdminSubmit,
  onLogout,
  showAdminModal,
  setShowAdminModal,
  editingAdmin,
  setEditingAdmin,
  adminFormData,
  setAdminFormData,
  showPassword,
  setShowPassword
}: AdminManagementTabProps) {
  const getIcon = (category: string) => {
    switch (category) {
      case 'auth': return <Shield className="w-4 h-4" />;
      case 'admin': return <Monitor className="w-4 h-4" />;
      case 'system': return <Server className="w-4 h-4" />;
      case 'security': return <AlertTriangle className="w-4 h-4" />;
      case 'data': return <Database className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Current Admin Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Admin Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium">{currentUser?.username || 'Admin'}</h3>
                <p className="text-sm text-muted-foreground">{currentUser?.email || 'admin@example.com'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">Super Admin</Badge>
              <Button variant="outline" size="sm" onClick={onLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Admin Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Admin Management
            </CardTitle>
            <Dialog open={showAdminModal} onOpenChange={setShowAdminModal}>
              <DialogTrigger asChild>
                <Button onClick={onAddAdmin}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Admin
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {editingAdmin ? 'Edit Admin' : 'Add New Admin'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={onAdminSubmit} className="space-y-4">
                  {!editingAdmin && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        <Input
                          id="username"
                          value={adminFormData.username}
                          onChange={(e) => setAdminFormData({ ...adminFormData, username: e.target.value })}
                          placeholder="Enter username"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={adminFormData.email}
                          onChange={(e) => setAdminFormData({ ...adminFormData, email: e.target.value })}
                          placeholder="Enter email"
                          required
                        />
                      </div>
                    </>
                  )}
                  {editingAdmin && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                      <p className="text-sm text-blue-800">
                        <strong>Editing:</strong> {editingAdmin.username} ({editingAdmin.email})
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        Only password can be changed for existing admins.
                      </p>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="password">
                      {editingAdmin ? 'New Password' : 'Password'}
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={adminFormData.password}
                        onChange={(e) => setAdminFormData({ ...adminFormData, password: e.target.value })}
                        placeholder={editingAdmin ? 'Enter new password' : 'Enter password'}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowAdminModal(false);
                        setEditingAdmin(null);
                        setAdminFormData({ username: '', email: '', password: '' });
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingAdmin ? 'Update Password' : 'Create Admin'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {adminLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading admin users...</span>
            </div>
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Username</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adminUsers.length > 0 ? (
                    adminUsers.map((admin) => (
                      <TableRow key={admin._id}>
                        <TableCell className="font-medium">{admin.username}</TableCell>
                        <TableCell>{admin.email}</TableCell>
                        <TableCell>
                          {new Date(admin.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onEditAdmin(admin)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onDeleteAdmin(admin._id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        No admin users found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activity Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
            {activitiesLoading && <RefreshCw className="h-4 w-4 animate-spin" />}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivities.length > 0 ? (
              recentActivities.map((activity, index) => {
                const timeAgo = new Date(activity.timestamp).toLocaleString();
                
                return (
                  <div key={activity.id || index} className="flex items-center gap-4 p-3 rounded-lg border">
                    <div className={`p-2 rounded-full ${
                      activity.status === 'success' ? 'bg-green-100 text-green-600' :
                      activity.status === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                      'bg-red-100 text-red-600'
                    }`}>
                      {getIcon(activity.category)}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{activity.action}</p>
                      <p className="text-sm text-muted-foreground">
                        {timeAgo} • IP: {activity.ip} • User: {activity.username}
                      </p>
                    </div>
                    <Badge variant={activity.status === 'success' ? 'default' : activity.status === 'warning' ? 'secondary' : 'destructive'}>
                      {activity.status}
                    </Badge>
                  </div>
                );
              })
            ) : (
              <div className="text-center text-muted-foreground py-8">
                {activitiesLoading ? 'Loading activities...' : 'No recent activities found'}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* System Information */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              System Information
              {systemLoading && <RefreshCw className="h-4 w-4 animate-spin" />}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {systemInfo ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Server Time</span>
                  <span className="text-sm text-muted-foreground">
                    {new Date(systemInfo.serverTime).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Uptime</span>
                  <span className="text-sm text-muted-foreground">{systemInfo.uptime}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Version</span>
                  <span className="text-sm text-muted-foreground">{systemInfo.version}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Environment</span>
                  <Badge variant="outline">{systemInfo.environment}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Platform</span>
                  <span className="text-sm text-muted-foreground">{systemInfo.platform}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Memory Usage</span>
                  <span className="text-sm text-muted-foreground">{systemInfo.memoryUsage.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">CPU Usage</span>
                  <span className="text-sm text-muted-foreground">{systemInfo.cpuUsage.toFixed(1)}%</span>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-4">
                {systemLoading ? 'Loading system info...' : 'System information unavailable'}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security Status
              {systemLoading && <RefreshCw className="h-4 w-4 animate-spin" />}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {securityStatus ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">SSL Certificate</span>
                  <Badge variant="outline" className={
                    securityStatus.sslCertificate.status === 'valid' ? 'text-green-600 border-green-600' :
                    securityStatus.sslCertificate.status === 'warning' ? 'text-yellow-600 border-yellow-600' :
                    'text-red-600 border-red-600'
                  }>
                    {securityStatus.sslCertificate.status === 'valid' ? <CheckCircle className="w-3 h-3 mr-1" /> :
                     securityStatus.sslCertificate.status === 'warning' ? <AlertTriangle className="w-3 h-3 mr-1" /> :
                     <XCircle className="w-3 h-3 mr-1" />}
                    {securityStatus.sslCertificate.status}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Rate Limiting</span>
                  <Badge variant="outline" className={
                    securityStatus.rateLimiting.status === 'active' ? 'text-green-600 border-green-600' :
                    'text-red-600 border-red-600'
                  }>
                    {securityStatus.rateLimiting.status === 'active' ? <CheckCircle className="w-3 h-3 mr-1" /> :
                     <XCircle className="w-3 h-3 mr-1" />}
                    {securityStatus.rateLimiting.status}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">CSRF Protection</span>
                  <Badge variant="outline" className={
                    securityStatus.csrfProtection.status === 'enabled' ? 'text-green-600 border-green-600' :
                    'text-red-600 border-red-600'
                  }>
                    {securityStatus.csrfProtection.status === 'enabled' ? <CheckCircle className="w-3 h-3 mr-1" /> :
                     <XCircle className="w-3 h-3 mr-1" />}
                    {securityStatus.csrfProtection.status}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Failed Logins (24h)</span>
                  <span className={`text-sm ${
                    securityStatus.failedLogins24h > 10 ? 'text-red-600' :
                    securityStatus.failedLogins24h > 5 ? 'text-yellow-600' :
                    'text-muted-foreground'
                  }`}>
                    {securityStatus.failedLogins24h}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Security Score</span>
                  <span className={`text-sm font-medium ${
                    securityStatus.securityScore >= 80 ? 'text-green-600' :
                    securityStatus.securityScore >= 60 ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {securityStatus.securityScore}/100
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-4">
                {systemLoading ? 'Loading security status...' : 'Security status unavailable'}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}