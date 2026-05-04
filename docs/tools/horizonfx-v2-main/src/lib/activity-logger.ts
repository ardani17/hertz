import ActivityLog, { IActivityLog } from '@/models/ActivityLog';
import connectDB from '@/lib/mongodb';
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

interface LogActivityParams {
  action: string;
  description: string;
  category: 'auth' | 'admin' | 'system' | 'security' | 'data';
  status?: 'success' | 'warning' | 'error';
  userId?: string;
  username?: string;
  ip?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

export async function logActivity(params: LogActivityParams): Promise<void> {
  try {
    await connectDB();
    
    const activityLog = new ActivityLog({
      action: params.action,
      description: params.description,
      category: params.category,
      status: params.status || 'success',
      userId: params.userId,
      username: params.username,
      ip: params.ip || 'unknown',
      userAgent: params.userAgent,
      metadata: params.metadata || {},
      timestamp: new Date()
    });
    
    await activityLog.save();
  } catch (error) {
    console.error('Failed to log activity:', error);
    // Don't throw error to avoid disrupting the main flow
  }
}

export async function logActivityFromRequest(
  request: NextRequest,
  params: Omit<LogActivityParams, 'ip' | 'userAgent' | 'userId' | 'username'>
): Promise<void> {
  try {
    const session = await getServerSession(authOptions);
    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const ip = forwarded ? forwarded.split(',')[0] : realIp || 'localhost';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    await logActivity({
      ...params,
      userId: session?.user?.id,
      username: session?.user?.username || session?.user?.email,
      ip,
      userAgent
    });
  } catch (error) {
    console.error('Failed to log activity from request:', error);
  }
}

export async function getRecentActivities(limit: number = 10): Promise<IActivityLog[]> {
  try {
    await connectDB();
    
    const activities = await ActivityLog
      .find({})
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean() as unknown as IActivityLog[];
    
    return activities;
  } catch (error) {
    console.error('Failed to get recent activities:', error);
    return [];
  }
}

export async function getActivitiesByCategory(
  category: string,
  limit: number = 10
): Promise<IActivityLog[]> {
  try {
    await connectDB();
    
    const activities = await ActivityLog
      .find({ category })
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean() as unknown as IActivityLog[];
    
    return activities;
  } catch (error) {
    console.error('Failed to get activities by category:', error);
    return [];
  }
}

export async function getSecurityEvents(hours: number = 24): Promise<{
  failedLogins: number;
  suspiciousActivities: number;
  securityEvents: IActivityLog[];
}> {
  try {
    await connectDB();
    
    // Use aggregation pipeline to avoid casting issues
    const hoursAgo = hours * 60 * 60 * 1000;
    const currentTime = Date.now();
    const sinceTime = currentTime - hoursAgo;
    
    // Execute queries using aggregation to avoid date casting issues
    const failedLoginsResult = await ActivityLog.aggregate([
      {
        $match: {
          category: 'auth',
          status: 'error',
          $expr: {
            $gte: [{ $toLong: '$timestamp' }, sinceTime]
          }
        }
      },
      { $count: 'count' }
    ]);
    const failedLogins = failedLoginsResult[0]?.count || 0;
    
    const suspiciousActivitiesResult = await ActivityLog.aggregate([
      {
        $match: {
          category: 'security',
          status: { $in: ['warning', 'error'] },
          $expr: {
            $gte: [{ $toLong: '$timestamp' }, sinceTime]
          }
        }
      },
      { $count: 'count' }
    ]);
    const suspiciousActivities = suspiciousActivitiesResult[0]?.count || 0;
    
    // Use aggregation for security events query
    const securityEvents = await ActivityLog.aggregate([
      {
        $match: {
          category: { $in: ['auth', 'security'] },
          $expr: {
            $gte: [{ $toLong: '$timestamp' }, sinceTime]
          }
        }
      },
      { $sort: { timestamp: -1 } },
      { $limit: 20 }
    ]) as IActivityLog[];
    
    return {
      failedLogins,
      suspiciousActivities,
      securityEvents
    };
  } catch {
    // Silent operation - logs removed to reduce terminal noise
    return {
      failedLogins: 0,
      suspiciousActivities: 0,
      securityEvents: []
    };
  }
}

export async function getSystemStats(): Promise<{
  totalActivities: number;
  activitiesLast24h: number;
  topActions: Array<{ action: string; count: number }>;
  statusBreakdown: Array<{ status: string; count: number }>;
}> {
  try {
    await connectDB();
    
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const [totalActivities, activitiesLast24h, topActions, statusBreakdown] = await Promise.all([
      ActivityLog.countDocuments({}),
      ActivityLog.countDocuments({ timestamp: { $gte: last24h } }),
      ActivityLog.aggregate([
        { $group: { _id: '$action', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
        { $project: { action: '$_id', count: 1, _id: 0 } }
      ]),
      ActivityLog.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $project: { status: '$_id', count: 1, _id: 0 } }
      ])
    ]);
    
    return {
      totalActivities,
      activitiesLast24h,
      topActions,
      statusBreakdown
    };
  } catch (error) {
    console.error('Failed to get system stats:', error);
    return {
      totalActivities: 0,
      activitiesLast24h: 0,
      topActions: [],
      statusBreakdown: []
    };
  }
}