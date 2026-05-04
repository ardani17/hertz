import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getSystemInfo, getSecurityStatus } from '@/lib/system-info';
import { getSecurityEvents } from '@/lib/activity-logger';

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
    const type = searchParams.get('type'); // 'info' or 'security' or 'all'

    if (type === 'info') {
      const systemInfo = await getSystemInfo();
      return NextResponse.json({
        success: true,
        systemInfo
      });
    }

    if (type === 'security') {
      const securityEvents = await getSecurityEvents(24);
      const securityStatus = await getSecurityStatus(securityEvents.failedLogins);
      
      return NextResponse.json({
        success: true,
        securityStatus,
        securityEvents: securityEvents.securityEvents.slice(0, 5) // Latest 5 events
      });
    }

    // Default: return both system info and security status
    const [systemInfo, securityEvents] = await Promise.all([
      getSystemInfo(),
      getSecurityEvents(24)
    ]);
    
    const securityStatus = await getSecurityStatus(securityEvents.failedLogins);

    return NextResponse.json({
      success: true,
      systemInfo,
      securityStatus,
      securityEvents: securityEvents.securityEvents.slice(0, 5)
    });
  } catch {
    // Silent operation - logs removed to reduce terminal noise
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}