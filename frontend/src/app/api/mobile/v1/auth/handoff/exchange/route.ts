import { NextRequest } from 'next/server';
import { MobileAuthService } from '@shared/services/mobileAuthService';
import { apiErrorFromUnknown, apiSuccess } from '@/lib/apiResponse';
import { checkMobileRateLimit } from '@/lib/mobileApi';

export const dynamic = 'force-dynamic';

const auth = new MobileAuthService();

export async function POST(request: NextRequest) {
  const limited = checkMobileRateLimit(request, 'auth');
  if (limited) return limited;

  try {
    const session = await auth.exchangeHandoff(await request.json());
    return apiSuccess(session);
  } catch (error) {
    return apiErrorFromUnknown(error);
  }
}

