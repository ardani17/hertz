import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import News from '@/models/News';
import ToolUsage from '@/models/ToolUsage';
import { getPerformanceMetrics } from '@/lib/performance-metrics';
import { getTrafficData, getVisitorAnalytics } from '@/lib/traffic-analytics';

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
    const period = searchParams.get('period') || '7'; // days
    const days = parseInt(period);

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get news analytics
    const newsAnalytics = await getNewsAnalytics(startDate, endDate);

    // Get real traffic data from database
    const trafficData = await getTrafficData(days);

    // Get real performance metrics
    const performanceMetrics = await getPerformanceMetrics();

    // Get visitor analytics
    const visitorAnalytics = await getVisitorAnalytics(days);

    // Get real tools usage data
    const toolsUsage = await getToolsUsageData(startDate, endDate);

    return NextResponse.json({
      success: true,
      data: {
        newsAnalytics,
        trafficData,
        performanceMetrics,
        visitorAnalytics,
        toolsUsage,
        period: days
      }
    });

  } catch (error) {
    console.error('Analytics fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}

async function getNewsAnalytics(startDate: Date, endDate: Date) {
  try {
    // Daily news count
    const dailyNews = await News.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt"
            }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Total news in period
    const totalNews = await News.countDocuments({
      createdAt: { $gte: startDate, $lte: endDate }
    });

    // News by market type
    const newsByMarket = await News.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: "$marketType",
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    return {
      dailyNews,
      totalNews,
      newsByMarket
    };
  } catch (error) {
    console.error('News analytics error:', error);
    return {
      dailyNews: [],
      totalNews: 0,
      newsByMarket: []
    };
  }
}

async function getToolsUsageData(startDate: Date, endDate: Date) {
  try {
    // Get tools usage statistics from database
    const toolsStats = await ToolUsage.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$toolName',
          visits: { $sum: 1 },
          lastUsed: { $max: '$createdAt' }
        }
      },
      {
        $sort: { visits: -1 }
      },
      {
        $limit: 10
      }
    ]);

    // Format the data
    const formattedData = toolsStats.map(tool => ({
      name: tool._id,
      visits: tool.visits
    }));

    // If no data found, return empty array instead of mock data
    return formattedData.length > 0 ? formattedData : [];
  } catch (error) {
    console.error('Tools usage data error:', error);
    return [];
  }
}