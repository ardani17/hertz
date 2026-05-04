import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import PageView from '@/models/PageView';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { path, responseTime, statusCode } = body;
    
    // Get client information
    const userAgent = request.headers.get('user-agent');
    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const ip = forwarded ? forwarded.split(',')[0] : realIp || 'unknown';
    const referrer = request.headers.get('referer');
    
    // Create page view record
    const pageView = new PageView({
      path: path || '/',
      userAgent,
      ip,
      referrer,
      responseTime: responseTime || null,
      statusCode: statusCode || 200,
      timestamp: new Date()
    });
    
    await pageView.save();
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error tracking page view:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to track page view' },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve analytics data
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '7');
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Get daily page views
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
          visitors: { $size: '$uniqueIps' }
        }
      },
      { $sort: { date: 1 } }
    ]);
    
    // Get total requests and average response time
    const totalStats = await PageView.aggregate([
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
    
    const stats = totalStats[0] || {
      totalRequests: 0,
      avgResponseTime: 0,
      errorCount: 0
    };
    
    const errorRate = stats.totalRequests > 0 
      ? (stats.errorCount / stats.totalRequests) * 100 
      : 0;
    
    return NextResponse.json({
      success: true,
      data: {
        dailyViews,
        totalRequests: stats.totalRequests,
        avgResponseTime: Math.round(stats.avgResponseTime || 0),
        errorRate: Math.round(errorRate * 100) / 100
      }
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}