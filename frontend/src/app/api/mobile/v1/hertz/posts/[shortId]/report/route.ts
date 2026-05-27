import { NextRequest } from 'next/server';
import { HertzReportService } from '@shared/services/hertzReportService';
import { apiErrorFromUnknown, apiSuccess } from '@/lib/apiResponse';
import { checkMobileRateLimit, isMobileAuthContext, requireMobileMember } from '@/lib/mobileApi';

interface RouteContext {
  params: Promise<{ shortId: string }>;
}

const reports = new HertzReportService();

export async function POST(request: NextRequest, context: RouteContext) {
  const auth = await requireMobileMember(request);
  if (!isMobileAuthContext(auth)) return auth;

  const limited = await checkMobileRateLimit(request, 'mutation', auth.user.id);
  if (limited) return limited;

  try {
    const { shortId } = await context.params;
    const report = await reports.createPostReport(shortId, auth.user, await request.json().catch(() => ({})));
    return apiSuccess({ report }, 201);
  } catch (error) {
    return apiErrorFromUnknown(error);
  }
}

