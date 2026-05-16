import { NextRequest } from 'next/server';
import { HertzSearchService } from '@shared/services/hertzSearchService';
import { apiErrorFromUnknown, apiSuccess } from '@/lib/apiResponse';

export const dynamic = 'force-dynamic';

const service = new HertzSearchService();

export async function GET(request: NextRequest) {
  try {
    return apiSuccess(await service.search(request.nextUrl.searchParams.get('q')));
  } catch (error) {
    return apiErrorFromUnknown(error);
  }
}
