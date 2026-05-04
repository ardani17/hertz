'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Download, Search, Edit, Trash2, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

interface User {
  _id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  credits: number;
  isActive: boolean;
  createdAt: string;
}

interface UserTabProps {
  className?: string;
}

export default function UserTab({ className }: UserTabProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newCredits, setNewCredits] = useState<number>(0);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });

  // Fetch users
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(searchTerm && { search: searchTerm })
      });
      
      const response = await fetch(`/api/admin/user-management?${queryParams}`);
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      
      const data = await response.json();
      setUsers(data.users);
      setPagination(prev => ({
        ...prev,
        total: data.total,
        totalPages: data.totalPages
      }));
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, searchTerm]);



  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Handle edit credits
  const handleEditCredits = (user: User) => {
    setEditingUser(user);
    setNewCredits(user.credits);
    setIsEditDialogOpen(true);
  };

  // Save credits
  const saveCredits = async () => {
    if (!editingUser) return;
    
    try {
      const response = await fetch(`/api/admin/user-management/${editingUser._id}/credits`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ credits: newCredits })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Credits updated successfully');
        setIsEditDialogOpen(false);
        fetchUsers();
      } else {
        toast.error(data.error || 'Failed to update credits');
      }
    } catch (error) {
      console.error('Error updating credits:', error);
      toast.error('Error updating credits');
    }
  };

  // Delete user
  const deleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }
    
    const loadingToast = toast.loading('Deleting user...');
    
    try {
      const response = await fetch(`/api/admin/user-management/${userId}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast.success(data.message || 'User deleted successfully', { id: loadingToast });
        fetchUsers();
      } else {
        toast.error(data.error || 'Failed to delete user', { id: loadingToast });
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Network error occurred', { id: loadingToast });
    }
  };

  // Export CSV
  const exportCSV = async () => {
    try {
      setIsExporting(true);
      const response = await fetch('/api/admin/user-management/export');
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Users exported successfully');
      } else {
        toast.error('Failed to export users');
      }
    } catch (error) {
      console.error('Error exporting users:', error);
      toast.error('Error exporting users');
    } finally {
      setIsExporting(false);
    }
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
  };

  // Load users on component mount
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Search and Export Controls */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1 flex gap-2">
              <Input
                placeholder="Search users by username, email, or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1"
              />
              <Button onClick={handleSearch} variant="outline">
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <Button onClick={exportCSV} disabled={isExporting} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              {isExporting ? 'Exporting...' : 'Export CSV'}
            </Button>
            <Button onClick={() => fetchUsers()} variant="outline">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          {/* Users Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Credits</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      Loading users...
                    </TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user._id}>
                      <TableCell className="font-medium">{user.username}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.credits}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditCredits(user)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteUser(user._id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex justify-between items-center mt-4">
              <div className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.pages} ({pagination.total} total users)
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() => handlePageChange(pagination.page - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.pages}
                  onClick={() => handlePageChange(pagination.page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Credits Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User Credits</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Username</Label>
              <Input value={editingUser?.username || ''} disabled />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={editingUser?.email || ''} disabled />
            </div>
            <div>
              <Label>Credits</Label>
              <Input
                type="number"
                min="0"
                value={newCredits}
                onChange={(e) => setNewCredits(parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={saveCredits}>
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}