import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getRecentActivities, getActivitiesByCategory } from '@/lib/activity-logger';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '10');

    let activities;
    
    if (category) {
      activities = await getActivitiesByCategory(category, limit);
    } else {
      activities = await getRecentActivities(limit);
    }

    // Format activities for frontend
    const formattedActivities = activities.map(activity => ({
      id: activity._id,
      action: activity.action,
      description: activity.description,
      username: activity.username || 'System',
      status: activity.status,
      category: activity.category,
      timestamp: activity.timestamp,
      ip: activity.ip,
      metadata: activity.metadata
    }));

    return NextResponse.json({
      success: true,
      activities: formattedActivities
    });
  } catch (error) {
    console.error('Error fetching activities:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}