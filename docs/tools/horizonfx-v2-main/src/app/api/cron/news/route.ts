import { NextRequest, NextResponse } from 'next/server';

// Security: Simple authentication for cron endpoint
function validateCronAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET || 'default-secret-change-in-production';
  
  return authHeader === `Bearer ${cronSecret}`;
}

// This endpoint will be called by external cron service (like Vercel Cron or external cron job)
export async function GET(request: NextRequest) {
  // Security: Validate authentication
  if (!validateCronAuth(request)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }
  try {
    // Call our internal fetch API
    const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/news/fetch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();

    return NextResponse.json({
      success: true,
      message: 'Cron job executed successfully',
      result
    });

  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

// For manual trigger via POST
export async function POST(request: NextRequest) {
  return GET(request);
}