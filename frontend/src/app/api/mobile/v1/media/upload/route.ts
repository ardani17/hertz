import { NextRequest } from 'next/server';
import { MobileMediaService } from '@/server/services/media/MobileMediaService';
import { apiSuccess } from '@/lib/apiResponse';
import { withMobileRoute } from '@/lib/mobileApi';

export const dynamic = 'force-dynamic';

const media = new MobileMediaService();

export async function POST(request: NextRequest) {
  return withMobileRoute(request, { policy: 'upload' }, async ({ auth }) => {
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
  });
}

