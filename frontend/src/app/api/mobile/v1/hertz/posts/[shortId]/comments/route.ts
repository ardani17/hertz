import { NextRequest } from 'next/server';
import { HertzCommentService } from '@shared/services/hertzCommentService';
import { HertzPostService } from '@shared/services/hertzPostService';
import { apiSuccess } from '@/lib/apiResponse';
import { withMobileRoute } from '@/lib/mobileApi';

interface RouteContext {
  params: Promise<{ shortId: string }>;
}

const comments = new HertzCommentService();
const posts = new HertzPostService();

export async function GET(request: NextRequest, context: RouteContext) {
  return withMobileRoute(request, { policy: 'read', requireAuth: false }, async ({ viewer }) => {
    const { shortId } = await context.params;
    const post = await posts.getPostDetail(shortId, viewer);
    return apiSuccess({ comments: post.comments });
  });
}

export async function POST(request: NextRequest, context: RouteContext) {
  return withMobileRoute(request, { policy: 'mutation' }, async ({ auth }) => {
    const { shortId } = await context.params;
    const body = await request.json();
    const comment = await comments.create(shortId, auth.user, body.content, body.parentCommentId);
    return apiSuccess({ comment }, 201);
  });
}
