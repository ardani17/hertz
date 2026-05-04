"use client";

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Upload, Image as ImageIcon, ExternalLink, CheckCircle, AlertCircle, Trash2, Eye, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

interface AnnouncementData {
  destinationUrl: string;
  imageFile: File | null;
  imagePreview: string | null;
}

interface SavedAnnouncement {
  _id: string;
  destinationUrl: string;
  imageUrl: string;
  imageName: string;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface AnnouncementTabProps {
  // Props bisa ditambahkan sesuai kebutuhan
}

export default function AnnouncementTab({}: AnnouncementTabProps) {
  const [formData, setFormData] = useState<AnnouncementData>({
    destinationUrl: '',
    imageFile: null,
    imagePreview: null
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [announcements, setAnnouncements] = useState<SavedAnnouncement[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [announcementToDelete, setAnnouncementToDelete] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      setIsLoadingList(true);
      const response = await fetch('/api/admin/announcement');
      const result = await response.json();
      
      if (result.success) {
        setAnnouncements(result.data || []);
      } else {
        toast.error('Gagal mengambil data announcement');
      }
    } catch (error) {
      console.error('Error fetching announcements:', error);
      toast.error('Gagal mengambil data announcement');
    } finally {
      setIsLoadingList(false);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    setAnnouncementToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!announcementToDelete) return;

    try {
      const response = await fetch(`/api/admin/announcement?id=${announcementToDelete}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success('Announcement berhasil dihapus');
        fetchAnnouncements(); // Refresh list
      } else {
        toast.error(result.error || 'Gagal menghapus announcement');
      }
    } catch (error) {
      console.error('Error deleting announcement:', error);
      toast.error('Gagal menghapus announcement');
    } finally {
      setDeleteDialogOpen(false);
      setAnnouncementToDelete(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};

    // Validasi URL destination
    if (!formData.destinationUrl.trim()) {
      newErrors.destinationUrl = 'URL destination wajib diisi';
    } else {
      try {
        new URL(formData.destinationUrl);
      } catch {
        newErrors.destinationUrl = 'Format URL tidak valid';
      }
    }

    // Validasi gambar
    if (!formData.imageFile) {
      newErrors.imageFile = 'Gambar wajib diupload';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      destinationUrl: e.target.value
    }));
    if (errors.destinationUrl) {
      setErrors(prev => ({ ...prev, destinationUrl: '' }));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validasi tipe file
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Format gambar harus JPEG, PNG, atau WebP');
      return;
    }

    // Validasi ukuran file (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran gambar maksimal 5MB');
      return;
    }

    // Buat preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setFormData(prev => ({
        ...prev,
        imageFile: file,
        imagePreview: e.target?.result as string
      }));
    };
    reader.readAsDataURL(file);

    if (errors.imageFile) {
      setErrors(prev => ({ ...prev, imageFile: '' }));
    }
  };

  const handleRemoveImage = () => {
    setFormData(prev => ({
      ...prev,
      imageFile: null,
      imagePreview: null
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handlePublish = async () => {
    if (!validateForm()) {
      toast.error('Mohon lengkapi semua field yang wajib diisi');
      return;
    }

    setIsLoading(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('destinationUrl', formData.destinationUrl);
      if (formData.imageFile) {
        formDataToSend.append('image', formData.imageFile);
      }

      const response = await fetch('/api/admin/announcement', {
        method: 'POST',
        body: formDataToSend,
      });

      if (!response.ok) {
        throw new Error('Gagal mempublish announcement');
      }

      await response.json();
      toast.success('Announcement berhasil dipublish!');
      
      // Reset form
      setFormData({
        destinationUrl: '',
        imageFile: null,
        imagePreview: null
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Refresh announcements list
      fetchAnnouncements();
    } catch (error) {
      console.error('Error publishing announcement:', error);
      toast.error('Gagal mempublish announcement');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Announcement Management</h2>
          <p className="text-muted-foreground">
            Kelola announcement yang akan muncul sebagai popup di homepage
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Buat Announcement Baru
          </CardTitle>
          <CardDescription>
            Upload gambar dan tentukan URL tujuan untuk announcement popup
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* URL Destination Field */}
          <div className="space-y-2">
            <Label htmlFor="destinationUrl" className="text-sm font-medium">
              URL Destination <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <ExternalLink className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="destinationUrl"
                type="url"
                placeholder="https://example.com"
                value={formData.destinationUrl}
                onChange={handleUrlChange}
                className={`pl-10 ${errors.destinationUrl ? 'border-red-500' : ''}`}
              />
            </div>
            {errors.destinationUrl && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.destinationUrl}
              </p>
            )}
          </div>

          {/* Image Upload Field */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Upload Gambar <span className="text-red-500">*</span>
            </Label>
            
            {!formData.imagePreview ? (
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors hover:border-primary/50 ${
                  errors.imageFile ? 'border-red-500' : 'border-muted-foreground/25'
                }`}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground mb-2">
                  Klik untuk upload gambar atau drag & drop
                </p>
                <p className="text-xs text-muted-foreground">
                  Format: JPEG, PNG, WebP (Max: 5MB)
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative inline-block">
                  <Image
                    src={formData.imagePreview}
                    alt="Preview"
                    width={400}
                    height={300}
                    className="max-w-full max-h-64 rounded-lg border object-contain"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={handleRemoveImage}
                  >
                    Hapus
                  </Button>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Ganti Gambar
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
            )}
            
            {errors.imageFile && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.imageFile}
              </p>
            )}
          </div>

          {/* Info Alert */}
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Setelah dipublish, gambar akan muncul sebagai popup di homepage. 
              Pengunjung dapat mengklik gambar untuk diarahkan ke URL destination.
            </AlertDescription>
          </Alert>

          {/* Publish Button */}
          <div className="flex justify-end">
            <Button
              onClick={handlePublish}
              disabled={isLoading}
              className="min-w-32"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Publishing...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Publish
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Announcements List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Daftar Announcement
          </CardTitle>
          <CardDescription>
            Kelola announcement yang telah dibuat
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingList ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              <span className="ml-2">Memuat data...</span>
            </div>
          ) : announcements.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ImageIcon className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>Belum ada announcement yang dibuat</p>
            </div>
          ) : (
            <div className="space-y-4">
              {announcements.map((announcement) => (
                <div
                  key={announcement._id}
                  className="border rounded-lg p-4 flex items-start gap-4 hover:bg-muted/50 transition-colors"
                >
                  {/* Image Preview */}
                  <div className="flex-shrink-0">
                    <Image
                      src={announcement.imageUrl}
                      alt={announcement.imageName}
                      width={120}
                      height={80}
                      className="rounded-md object-cover border"
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            announcement.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {announcement.isActive ? 'Aktif' : 'Tidak Aktif'}
                          </span>
                        </div>
                        
                        <div className="space-y-1">
                          <p className="text-sm font-medium">URL Destination:</p>
                          <a
                            href={announcement.destinationUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:text-blue-800 break-all flex items-center gap-1"
                          >
                            {announcement.destinationUrl}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(announcement.createdAt)}
                          </div>
                          <div>
                            Dibuat oleh: {announcement.createdBy}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(announcement.destinationUrl, '_blank')}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteAnnouncement(announcement._id)}
                          className="text-red-600 hover:text-red-800 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Konfirmasi Hapus Announcement
            </AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus announcement ini? Tindakan ini tidak dapat dibatalkan dan akan menghapus gambar serta data announcement secara permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Hapus Announcement
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}