import { BlogArticleService } from '@shared/services/blogArticleService';
import { apiError, apiErrorFromUnknown, apiSuccess } from '@/lib/apiResponse';

interface RouteContext {
  params: Promise<{ slug: string }>;
}

export const revalidate = 300;

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { slug } = await context.params;
    const article = await new BlogArticleService().getPublishedBySlug(slug);
    if (!article) return apiError('RESOURCE_NOT_FOUND', 'Blog tidak ditemukan', 404);
    return apiSuccess({ article });
  } catch (error) {
    return apiErrorFromUnknown(error);
  }
}
