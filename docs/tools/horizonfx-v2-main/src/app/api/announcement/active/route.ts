import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Announcement from '@/models/Announcement';

export async function GET() {
  try {
    await connectDB();

    // Get only active announcements
    const activeAnnouncement = await Announcement.findOne({ 
      isActive: true 
    })
    .sort({ createdAt: -1 })
    .lean();

    return NextResponse.json({
      success: true,
      data: activeAnnouncement
    });

  } catch (error) {
    console.error('Error fetching active announcement:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil announcement aktif' },
      { status: 500 }
    );
  }
}