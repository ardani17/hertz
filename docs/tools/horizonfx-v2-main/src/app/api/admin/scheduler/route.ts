import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { startNewsScheduler, stopNewsScheduler, getSchedulerStatus } from '@/lib/scheduler';

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

    const status = getSchedulerStatus();

    return NextResponse.json({
      success: true,
      data: status
    });

  } catch (error) {
    console.error('Scheduler status error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get scheduler status' },
      { status: 500 }
    );
  }
}

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

    const body = await request.json();
    const { action } = body;

    if (!action) {
      return NextResponse.json(
        { success: false, error: 'Action is required' },
        { status: 400 }
      );
    }

    let message;

    switch (action) {
      case 'start':
        startNewsScheduler();
        message = 'Scheduler started successfully';
        break;

      case 'stop':
        stopNewsScheduler();
        message = 'Scheduler stopped successfully';
        break;

      case 'restart':
        stopNewsScheduler();
        // Wait a moment before restarting
        await new Promise(resolve => setTimeout(resolve, 1000));
        startNewsScheduler();
        message = 'Scheduler restarted successfully';
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action. Use: start, stop, or restart' },
          { status: 400 }
        );
    }

    const status = getSchedulerStatus();

    return NextResponse.json({
      success: true,
      message,
      data: status
    });

  } catch (error) {
    console.error('Scheduler control error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to control scheduler' },
      { status: 500 }
    );
  }
}