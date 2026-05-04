import { Button } from '@/components/ui/button';
import { RefreshCw, LogOut, Shield } from 'lucide-react';
import Link from 'next/link';

interface AdminHeaderProps {
  currentUser: {
    id: string;
    username: string;
    email: string;
  };
  refreshing: boolean;
  onRefresh: () => void;
  onLogout: () => void;
}

export default function AdminHeader({ currentUser, refreshing, onRefresh, onLogout }: AdminHeaderProps) {
  return (
    <div className="border-b border-border bg-card">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2">
              <Shield className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">HorizonFX Admin</span>
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">Welcome,</span>
              <span className="text-sm font-medium">{currentUser.email}</span>
            </div>
            <Button variant="outline" size="sm" onClick={onLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}