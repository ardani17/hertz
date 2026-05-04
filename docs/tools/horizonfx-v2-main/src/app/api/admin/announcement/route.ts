import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Announcement from '@/models/Announcement';
import { writeFile, mkdir, unlink } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import sharp from 'sharp';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const formData = await request.formData();
    const destinationUrl = formData.get('destinationUrl') as string;
    const imageFile = formData.get('image') as File;

    // Validation
    if (!destinationUrl || !imageFile) {
      return NextResponse.json(
        { success: false, error: 'URL destination dan gambar wajib diisi' },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(destinationUrl);
    } catch {
      return NextResponse.json(
        { success: false, error: 'Format URL tidak valid' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(imageFile.type)) {
      return NextResponse.json(
        { success: false, error: 'Format gambar harus JPEG, PNG, atau WebP' },
        { status: 400 }
      );
    }

    // Validate file size (5MB)
    if (imageFile.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'Ukuran gambar maksimal 5MB' },
        { status: 400 }
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'announcements');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const originalName = imageFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${timestamp}_${originalName}`;
    const filePath = join(uploadsDir, fileName);

    // Process and optimize image
    const buffer = Buffer.from(await imageFile.arrayBuffer());
    
    // Optimize image using Sharp
    const optimizedBuffer = await sharp(buffer)
      .resize(800, 600, { 
        fit: 'inside',
        withoutEnlargement: true 
      })
      .jpeg({ 
        quality: 85,
        progressive: true 
      })
      .toBuffer();

    // Save optimized image
    await writeFile(filePath, optimizedBuffer);

    // Deactivate previous announcements
    await Announcement.updateMany(
      { isActive: true },
      { isActive: false }
    );

    // Create new announcement
    const announcement = new Announcement({
      destinationUrl,
      imageUrl: `/api/uploads/announcements/${fileName}`,
      imageName: originalName,
      createdBy: session.user?.email || 'admin',
      isActive: true
    });

    await announcement.save();

    return NextResponse.json({
      success: true,
      message: 'Announcement berhasil dipublish',
      data: {
        id: announcement._id,
        destinationUrl: announcement.destinationUrl,
        imageUrl: announcement.imageUrl,
        createdAt: announcement.createdAt
      }
    });

  } catch (error) {
    console.error('Error creating announcement:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mempublish announcement' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') === 'true';

    const query = activeOnly ? { isActive: true } : {};
    
    const announcements = await Announcement.find(query)
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: announcements
    });

  } catch (error) {
    console.error('Error fetching announcements:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil data announcement' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID announcement diperlukan' },
        { status: 400 }
      );
    }

    const announcement = await Announcement.findById(id);

    if (!announcement) {
      return NextResponse.json(
        { success: false, error: 'Announcement tidak ditemukan' },
        { status: 404 }
      );
    }

    // Delete the image file from filesystem
    try {
      // Extract filename from imageUrl (remove /api/uploads/announcements/ prefix)
      const filename = announcement.imageUrl.replace('/api/uploads/announcements/', '');
      const imagePath = join(process.cwd(), 'public', 'uploads', 'announcements', filename);
      if (existsSync(imagePath)) {
        await unlink(imagePath);
      }
    } catch (fileError) {
      console.error('Error deleting image file:', fileError);
      // Continue with database deletion even if file deletion fails
    }

    // Delete from database
    await Announcement.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: 'Announcement berhasil dihapus'
    });

  } catch (error) {
    console.error('Error deleting announcement:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal menghapus announcement' },
      { status: 500 }
    );
  }
}