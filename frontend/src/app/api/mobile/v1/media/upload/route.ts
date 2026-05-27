import { NextRequest } from 'next/server';
import { MobileMediaService } from '@/server/services/media/MobileMediaService';
import { apiErrorFromUnknown, apiSuccess } from '@/lib/apiResponse';
import { checkMobileRateLimit, isMobileAuthContext, requireMobileMember } from '@/lib/mobileApi';

export const dynamic = 'force-dynamic';

const media = new MobileMediaService();

export async function POST(request: NextRequest) {
  const auth = await requireMobileMember(request);
  if (!isMobileAuthContext(auth)) return auth;

  const limited = await checkMobileRateLimit(request, 'mutation', auth.user.id);
  if (limited) return limited;

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const purpose = formData.get('purpose');
    return apiSuccess({
      media: await media.upload({
        file,
        purpose: typeof purpose === 'string' ? purpose : null,
        actorId: auth.user.id,
      }),
    }, 201);
  } catch (error) {
    return apiErrorFromUnknown(error);
  }
}

