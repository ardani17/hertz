import { NextRequest } from 'next/server';
import { HertzBlogService } from '@shared/services/hertzBlogService';
import { apiError, apiErrorFromUnknown, apiSuccess } from '@/lib/apiResponse';
import { getCurrentMember } from '@/lib/memberAuth';
import { checkRateLimit } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

const service = new HertzBlogService();

export async function POST(request: NextRequest) {
  const limited = checkRateLimit(request, { max: 8, windowMs: 60 * 60 * 1000, prefix: 'blog-post' });
  if (limited) return limited;
  try {
    const user = await getCurrentMember();
    if (!user) return apiError('AUTH_REQUIRED', 'Login member diperlukan', 401);
    const article = await service.create(user, await request.json());
    return apiSuccess({ article }, 201);
  } catch (error) {
    return apiErrorFromUnknown(error);
  }
}
