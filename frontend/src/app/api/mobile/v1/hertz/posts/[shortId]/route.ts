import { NextRequest } from 'next/server';
import { HertzPostService } from '@shared/services/hertzPostService';
import { apiErrorFromUnknown, apiSuccess } from '@/lib/apiResponse';
import {
  checkMobileRateLimit,
  isMobileAuthContext,
  optionalMobileMember,
  requireMobileMember,
  withCache,
} from '@/lib/mobileApi';

interface RouteContext {
  params: Promise<{ shortId: string }>;
}

export const dynamic = 'force-dynamic';

const feed = new HertzPostService();

export async function GET(request: NextRequest, context: RouteContext) {
  const limited = await checkMobileRateLimit(request, 'read');
  if (limited) return limited;

  try {
    const { shortId } = await context.params;
    const viewer = await optionalMobileMember(request);
    const post = await feed.getPostDetail(shortId, viewer);
    return withCache(apiSuccess({ post }), viewer ? 'private, no-store' : 'public, max-age=30, stale-while-revalidate=60');
  } catch (error) {
    return apiErrorFromUnknown(error);
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const auth = await requireMobileMember(request);
  if (!isMobileAuthContext(auth)) return auth;

  const limited = await checkMobileRateLimit(request, 'mutation', auth.user.id);
  if (limited) return limited;

  try {
    const { shortId } = await context.params;
    const body = await request.json();
    if (typeof body.content === 'string') {
      await feed.editPost(shortId, auth.user, body.content);
    }
    if ('market' in body) {
      await feed.updateMarketContext(shortId, auth.user, body.market ?? null);
    }
    return apiSuccess({ updated: true });
  } catch (error) {
    return apiErrorFromUnknown(error);
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const auth = await requireMobileMember(request);
  if (!isMobileAuthContext(auth)) return auth;

  const limited = await checkMobileRateLimit(request, 'mutation', auth.user.id);
  if (limited) return limited;

  try {
    const { shortId } = await context.params;
    await feed.deletePost(shortId, auth.user);
    return apiSuccess({ deleted: true });
  } catch (error) {
    return apiErrorFromUnknown(error);
  }
}
