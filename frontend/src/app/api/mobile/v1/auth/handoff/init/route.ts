import { NextRequest } from 'next/server';
import { MobileAuthService } from '@shared/services/mobileAuthService';
import { apiErrorFromUnknown, apiSuccess } from '@/lib/apiResponse';
import { checkMobileRateLimit } from '@/lib/mobileApi';

export const dynamic = 'force-dynamic';

const auth = new MobileAuthService();

export async function POST(request: NextRequest) {
  const limited = checkMobileRateLimit(request, 'device');
  if (limited) return limited;

  try {
    const handoff = await auth.initHandoff(await request.json());
    return apiSuccess(handoff, 201);
  } catch (error) {
    return apiErrorFromUnknown(error);
  }
}

