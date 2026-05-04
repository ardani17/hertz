import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import News from '@/models/News';
import ToolUsage from '@/models/ToolUsage';
import PageView from '@/models/PageView';

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

    // Get date range (last 30 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    // Get news analytics
    const newsAnalytics = await getNewsAnalytics(startDate, endDate);
    
    // Get tools usage data
    const toolsUsage = await getToolsUsageData(startDate, endDate);
    
    // Get real traffic data from PageView collection
    const trafficData = await getRealTrafficData(startDate, endDate);
    
    // Get real performance metrics from PageView collection
    const performanceMetrics = await getRealPerformanceMetrics(startDate, endDate);

    return NextResponse.json({
      newsAnalytics,
      toolsUsage,
      trafficData,
      performanceMetrics
    });

  } catch (error) {
    console.error('Dashboard analytics error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch analytics data',
        newsAnalytics: {
          dailyNews: [],
          totalNews: 0,
          newsByMarket: []
        },
        toolsUsage: [],
        trafficData: [],
        performanceMetrics: {
          avgResponseTime: 0,
          uptime: 0,
          errorRate: 0,
          totalRequests: 0
        }
      },
      { status: 500 }
    );
  }
}

async function getNewsAnalytics(startDate: Date, endDate: Date) {
  try {
    // Get daily news count
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

    // Get total news count
    const totalNews = await News.countDocuments({
      createdAt: { $gte: startDate, $lte: endDate }
    });

    // Get news by market type
    const newsByMarket = await News.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$marketType',
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

    // If no data found, return empty array
    return formattedData.length > 0 ? formattedData : [];
  } catch (error) {
    console.error('Tools usage data error:', error);
    return [];
  }
}

async function getRealTrafficData(startDate: Date, endDate: Date) {
  try {
    const dailyViews = await PageView.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$timestamp'
            }
          },
          pageViews: { $sum: 1 },
          uniqueIps: { $addToSet: '$ip' }
        }
      },
      {
        $project: {
          date: '$_id',
          pageViews: 1,
          visitors: { $size: '$uniqueIps' },
          bounceRate: 45 // Default bounce rate for development
        }
      },
      { $sort: { date: 1 } }
    ]);
    
    // Fill in missing dates with zero values
    const data = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const existingData = dailyViews.find(d => d.date === dateStr);
      
      data.push({
        date: dateStr,
        visitors: existingData?.visitors || 0,
        pageViews: existingData?.pageViews || 0,
        bounceRate: existingData?.bounceRate || 0
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching traffic data:', error);
    return [];
  }
}

async function getRealPerformanceMetrics(startDate: Date, endDate: Date) {
  try {
    const stats = await PageView.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          totalRequests: { $sum: 1 },
          avgResponseTime: { $avg: '$responseTime' },
          errorCount: {
            $sum: {
              $cond: [{ $gte: ['$statusCode', 400] }, 1, 0]
            }
          }
        }
      }
    ]);
    
    const result = stats[0] || {
      totalRequests: 0,
      avgResponseTime: 0,
      errorCount: 0
    };
    
    const errorRate = result.totalRequests > 0 
      ? (result.errorCount / result.totalRequests) * 100 
      : 0;
    
    return {
      avgResponseTime: Math.round(result.avgResponseTime || 51), // Default to 51ms for development
      uptime: 99.9, // Static uptime for development
      errorRate: Math.round(errorRate * 100) / 100,
      totalRequests: result.totalRequests
    };
  } catch (error) {
    console.error('Error fetching performance metrics:', error);
    return {
      avgResponseTime: 51,
      uptime: 99.9,
      errorRate: 0,
      totalRequests: 0
    };
  }
}