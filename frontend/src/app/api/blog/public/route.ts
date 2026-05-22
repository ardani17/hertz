import { NextRequest } from 'next/server';
import { BlogArticleService } from '@shared/services/blogArticleService';
import { apiErrorFromUnknown, apiSuccess } from '@/lib/apiResponse';

export const dynamic = 'force-dynamic';
export const revalidate = 120;

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const rawPage = parseInt(params.get('page') ?? '1', 10);
    const page = Number.isFinite(rawPage) && rawPage >= 1 ? rawPage : 1;
    const search = (params.get('search') ?? '').trim();
    const result = await new BlogArticleService().listPublished(page, search);
    return apiSuccess(result);
  } catch (error) {
    return apiErrorFromUnknown(error);
  }
}
