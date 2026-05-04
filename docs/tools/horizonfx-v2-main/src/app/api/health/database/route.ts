import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { getDatabaseStats } from '@/lib/database-stats';

export async function GET() {
  try {
    const startTime = Date.now();
    
    // Test database connection
    await connectDB();
    
    // Test database operations
    const stats = await getDatabaseStats();
    
    const responseTime = Date.now() - startTime;
    
    return NextResponse.json({
      success: true,
      status: 'healthy',
      responseTime,
      data: {
        connected: true,
        collections: stats.collections,
        totalDocuments: stats.totalDocuments,
        databaseSize: stats.databaseSize,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error: unknown) {
    const responseTime = Date.now() - Date.now();
    
    return NextResponse.json(
      {
        success: false,
        status: 'unhealthy',
        responseTime,
        error: error instanceof Error ? error.message : 'Database connection failed',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}