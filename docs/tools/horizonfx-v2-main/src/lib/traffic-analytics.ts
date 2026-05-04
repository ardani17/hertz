import connectDB from './mongodb';
import PageView from '@/models/PageView';

// Interface untuk traffic data
export interface TrafficData {
  date: string;
  visitors: number;
  pageViews: number;
  bounceRate: number;
  avgSessionDuration: number;
}

// Interface untuk visitor analytics
export interface VisitorAnalytics {
  totalVisitors: number;
  uniqueVisitors: number;
  returningVisitors: number;
  newVisitors: number;
  topPages: Array<{
    page: string;
    views: number;
    uniqueViews: number;
  }>;
  topReferrers: Array<{
    referrer: string;
    visits: number;
  }>;
  deviceTypes: Array<{
    device: string;
    count: number;
  }>;
  browsers: Array<{
    browser: string;
    count: number;
  }>;
}

// Interface untuk real-time analytics
export interface RealTimeAnalytics {
  activeUsers: number;
  currentPageViews: number;
  topActivePages: Array<{
    page: string;
    activeUsers: number;
  }>;
}

// Fungsi untuk mendapatkan traffic data berdasarkan periode
export async function getTrafficData(days: number = 7): Promise<TrafficData[]> {
  try {
    await connectDB();
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Aggregate daily traffic data
    const dailyTraffic = await PageView.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$timestamp"
            }
          },
          totalViews: { $sum: 1 },
          uniqueVisitors: { $addToSet: "$sessionId" },
          sessions: { $addToSet: "$sessionId" },
          pages: { $addToSet: "$page" }
        }
      },
      {
        $project: {
          date: "$_id",
          pageViews: "$totalViews",
          visitors: { $size: "$uniqueVisitors" },
          sessions: { $size: "$sessions" },
          uniquePages: { $size: "$pages" }
        }
      },
      {
        $sort: { date: 1 }
      }
    ]);

    // Calculate bounce rate and session duration for each day
    const trafficData: TrafficData[] = [];
    
    for (const day of dailyTraffic) {
      // Get session data for bounce rate calculation
      const dayStart = new Date(day.date);
      const dayEnd = new Date(day.date);
      dayEnd.setDate(dayEnd.getDate() + 1);
      
      const sessionStats = await PageView.aggregate([
        {
          $match: {
            timestamp: { $gte: dayStart, $lt: dayEnd }
          }
        },
        {
          $group: {
            _id: "$sessionId",
            pageCount: { $sum: 1 },
            firstView: { $min: "$timestamp" },
            lastView: { $max: "$timestamp" }
          }
        },
        {
          $project: {
            sessionId: "$_id",
            pageCount: 1,
            duration: {
              $divide: [
                { $subtract: ["$lastView", "$firstView"] },
                1000 // Convert to seconds
              ]
            },
            isBounce: { $eq: ["$pageCount", 1] }
          }
        }
      ]);

      const totalSessions = sessionStats.length;
      const bouncedSessions = sessionStats.filter(s => s.isBounce).length;
      const bounceRate = totalSessions > 0 ? (bouncedSessions / totalSessions) * 100 : 0;
      
      const totalDuration = sessionStats.reduce((sum, s) => sum + s.duration, 0);
      const avgSessionDuration = totalSessions > 0 ? totalDuration / totalSessions : 0;

      trafficData.push({
        date: day.date,
        visitors: day.visitors,
        pageViews: day.pageViews,
        bounceRate: Math.round(bounceRate * 100) / 100,
        avgSessionDuration: Math.round(avgSessionDuration)
      });
    }

    // Fill missing days with zero data
    const completeData: TrafficData[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const existingData = trafficData.find(d => d.date === dateStr);
      if (existingData) {
        completeData.push(existingData);
      } else {
        completeData.push({
          date: dateStr,
          visitors: 0,
          pageViews: 0,
          bounceRate: 0,
          avgSessionDuration: 0
        });
      }
    }

    return completeData;
  } catch (error) {
    console.error('Error getting traffic data:', error);
    return [];
  }
}

// Fungsi untuk mendapatkan visitor analytics
export async function getVisitorAnalytics(days: number = 30): Promise<VisitorAnalytics> {
  try {
    await connectDB();
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Total dan unique visitors
    const visitorStats = await PageView.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          totalViews: { $sum: 1 },
          uniqueVisitors: { $addToSet: "$sessionId" },
          uniqueIPs: { $addToSet: "$ip" }
        }
      }
    ]);

    const stats = visitorStats[0] || { totalViews: 0, uniqueVisitors: [], uniqueIPs: [] };

    // Top pages
    const topPages = await PageView.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: "$page",
          views: { $sum: 1 },
          uniqueViews: { $addToSet: "$sessionId" }
        }
      },
      {
        $project: {
          page: "$_id",
          views: 1,
          uniqueViews: { $size: "$uniqueViews" }
        }
      },
      {
        $sort: { views: -1 }
      },
      {
        $limit: 10
      }
    ]);

    // Top referrers
    const topReferrers = await PageView.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate, $lte: endDate },
          referrer: { $exists: true, $nin: [null, ""] }
        }
      },
      {
        $group: {
          _id: "$referrer",
          visits: { $sum: 1 }
        }
      },
      {
        $project: {
          referrer: "$_id",
          visits: "$visits"
        }
      },
      {
        $sort: { visits: -1 }
      },
      {
        $limit: 10
      }
    ]);

    // Device types (simplified)
    const deviceTypes = await PageView.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            $cond: {
              if: { $regexMatch: { input: "$userAgent", regex: /Mobile|Android|iPhone/i } },
              then: "Mobile",
              else: {
                $cond: {
                  if: { $regexMatch: { input: "$userAgent", regex: /Tablet|iPad/i } },
                  then: "Tablet",
                  else: "Desktop"
                }
              }
            }
          },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          device: "$_id",
          count: 1
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Browser analysis (simplified)
    const browsers = await PageView.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            $cond: {
              if: { $regexMatch: { input: "$userAgent", regex: /Chrome/i } },
              then: "Chrome",
              else: {
                $cond: {
                  if: { $regexMatch: { input: "$userAgent", regex: /Firefox/i } },
                  then: "Firefox",
                  else: {
                    $cond: {
                      if: { $regexMatch: { input: "$userAgent", regex: /Safari/i } },
                      then: "Safari",
                      else: "Other"
                    }
                  }
                }
              }
            }
          },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          browser: "$_id",
          count: 1
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    return {
      totalVisitors: stats.totalViews,
      uniqueVisitors: stats.uniqueVisitors.length,
      returningVisitors: Math.max(0, stats.uniqueVisitors.length - stats.uniqueIPs.length),
      newVisitors: stats.uniqueIPs.length,
      topPages: topPages.map(p => ({
        page: p.page,
        views: p.views,
        uniqueViews: p.uniqueViews
      })),
      topReferrers: topReferrers.map(r => ({
        referrer: r.referrer,
        visits: r.visits
      })),
      deviceTypes: deviceTypes.map(d => ({
        device: d.device,
        count: d.count
      })),
      browsers: browsers.map(b => ({
        browser: b.browser,
        count: b.count
      }))
    };
  } catch (error) {
    console.error('Error getting visitor analytics:', error);
    return {
      totalVisitors: 0,
      uniqueVisitors: 0,
      returningVisitors: 0,
      newVisitors: 0,
      topPages: [],
      topReferrers: [],
      deviceTypes: [],
      browsers: []
    };
  }
}

// Fungsi untuk mendapatkan real-time analytics
export async function getRealTimeAnalytics(): Promise<RealTimeAnalytics> {
  try {
    await connectDB();
    
    // Get data from last 5 minutes for "real-time" feel
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    const realtimeData = await PageView.aggregate([
      {
        $match: {
          timestamp: { $gte: fiveMinutesAgo }
        }
      },
      {
        $group: {
          _id: null,
          activeUsers: { $addToSet: "$sessionId" },
          currentPageViews: { $sum: 1 },
          pages: {
            $push: {
              page: "$page",
              sessionId: "$sessionId"
            }
          }
        }
      }
    ]);

    const data = realtimeData[0] || { activeUsers: [], currentPageViews: 0, pages: [] };
    
    // Calculate top active pages
    const pageStats: { [key: string]: Set<string> } = {};
    data.pages.forEach((p: { page: string; sessionId: string }) => {
      if (!pageStats[p.page]) {
        pageStats[p.page] = new Set();
      }
      pageStats[p.page].add(p.sessionId);
    });

    const topActivePages = Object.entries(pageStats)
      .map(([page, sessions]) => ({
        page,
        activeUsers: sessions.size
      }))
      .sort((a, b) => b.activeUsers - a.activeUsers)
      .slice(0, 5);

    return {
      activeUsers: data.activeUsers.length,
      currentPageViews: data.currentPageViews,
      topActivePages
    };
  } catch (error) {
    console.error('Error getting real-time analytics:', error);
    return {
      activeUsers: 0,
      currentPageViews: 0,
      topActivePages: []
    };
  }
}