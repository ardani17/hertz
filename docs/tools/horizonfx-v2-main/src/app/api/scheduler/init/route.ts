import { NextResponse } from 'next/server';
import { startNewsScheduler, getSchedulerStatus } from '@/lib/scheduler';

// POST /api/scheduler/init - Initialize the news scheduler
export async function POST() {
  try {
    // Start the scheduler
    startNewsScheduler();
    
    // Get status to confirm
    const status = getSchedulerStatus();
    
    return NextResponse.json({
      success: true,
      message: 'News scheduler initialized successfully',
      status
    });
  } catch (error) {
    // Silent operation - logs removed to reduce terminal noise
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to initialize scheduler',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET /api/scheduler/init - Get scheduler status
export async function GET() {
  try {
    const status = getSchedulerStatus();
    
    return NextResponse.json({
      success: true,
      status
    });
  } catch {
    // Silent operation - logs removed to reduce terminal noise
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get scheduler status'
      },
      { status: 500 }
    );
  }
}