import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import News from '@/models/News';
import { getSchedulerStatus } from '@/lib/scheduler';
import { getDatabaseStats } from '@/lib/database-stats';
import { getSimplifiedApiHealth } from '@/lib/api-health';
import { getSystemInfo } from '@/lib/system-info';

export async function GET() {
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

    // Get current date for today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get database stats
    const databaseStats = await getDatabaseStats();

    // Get total news count
    const totalNews = await News.countDocuments();

    // Get today's news count
    const todayNews = await News.countDocuments({
      createdAt: {
        $gte: today,
        $lt: tomorrow
      }
    });

    // Get scheduler status
    const schedulerStatus = getSchedulerStatus();

    // Get last news fetch time
    const lastNews = await News.findOne({}, { createdAt: 1 }).sort({ createdAt: -1 });
    const lastFetch = lastNews ? lastNews.createdAt.toISOString() : null;

    // Get real API health status
    const apiHealth = await getSimplifiedApiHealth();

    // Get real system information
    const systemInfo = await getSystemInfo();
    
    // System health with real data
    const systemHealth = {
      database: true, // If we got here, database is connected
      scheduler: schedulerStatus.isRunning,
      memory: systemInfo.memoryUsage // Use real memory usage
    };

    const stats = {
      totalNews,
      todayNews,
      schedulerStatus: schedulerStatus.isRunning ? 'running' : 'stopped',
      lastFetch,
      apiHealth,
      systemHealth,
      databaseStats
    };

    return NextResponse.json({
      success: true,
      data: stats
    });

  } catch {
    // Silent operation - logs removed to reduce terminal noise
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch dashboard stats',
        data: {
          totalNews: 0,
          todayNews: 0,
          schedulerStatus: 'stopped',
          lastFetch: null,
          apiHealth: {
            news: false,
            stocks: false,
            calendar: false,
            database_connection: false
          },
          systemHealth: {
            database: false,
            scheduler: false,
            memory: 0
          }
        }
      },
      { status: 500 }
    );
  }
}