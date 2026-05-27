import { NextRequest } from 'next/server';
import { HertzSearchService } from '@shared/services/hertzSearchService';
import { apiErrorFromUnknown, apiSuccess } from '@/lib/apiResponse';
import { checkMobileRateLimit } from '@/lib/mobileApi';

export const dynamic = 'force-dynamic';

const service = new HertzSearchService();

export async function GET(request: NextRequest) {
  const limited = await checkMobileRateLimit(request, 'read');
  if (limited) return limited;

  try {
    return apiSuccess(await service.search(request.nextUrl.searchParams.get('q')));
  } catch (error) {
    return apiErrorFromUnknown(error);
  }
}

