import { NextRequest } from 'next/server';
import { HertzReportService } from '@shared/services/hertzReportService';
import { checkRateLimit } from '@/lib/rateLimit';
import { apiError, apiErrorFromUnknown, apiSuccess } from '@/lib/apiResponse';
import { getCurrentMember } from '@/lib/memberAuth';

interface RouteContext {
  params: Promise<{ shortId: string }>;
}

const reports = new HertzReportService();

export async function POST(request: NextRequest, context: RouteContext) {
  const rateLimited = checkRateLimit(request, { max: 8, windowMs: 60 * 60 * 1000, prefix: 'post-report' });
  if (rateLimited) return rateLimited;
  try {
    const { shortId } = await context.params;
    const user = await getCurrentMember();
    if (!user) return apiError('AUTH_REQUIRED', 'Login member diperlukan', 401);
    const body = await request.json().catch(() => ({}));
    const report = await reports.createPostReport(shortId, user, body);
    return apiSuccess({ report }, 201);
  } catch (error) {
    return apiErrorFromUnknown(error);
  }
}
