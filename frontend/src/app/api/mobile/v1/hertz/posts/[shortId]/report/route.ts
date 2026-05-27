import { NextRequest } from 'next/server';
import { HertzReportService } from '@shared/services/hertzReportService';
import { apiSuccess } from '@/lib/apiResponse';
import { withMobileRoute } from '@/lib/mobileApi';

interface RouteContext {
  params: Promise<{ shortId: string }>;
}

const reports = new HertzReportService();

export async function POST(request: NextRequest, context: RouteContext) {
  return withMobileRoute(request, { policy: 'mutation' }, async ({ auth }) => {
    const { shortId } = await context.params;
    const report = await reports.createPostReport(shortId, auth.user, await request.json().catch(() => ({})));
    return apiSuccess({ report }, 201);
  });
}

