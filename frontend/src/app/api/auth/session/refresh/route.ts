import { NextResponse } from 'next/server';
import { validateSessionAndRefreshCookie } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST() {
  const user = await validateSessionAndRefreshCookie();
  return NextResponse.json({
    success: true,
    data: {
      user: user
        ? {
            id: user.id,
            username: user.username,
            role: user.role,
          }
        : null,
    },
  }, { status: user ? 200 : 401 });
}
