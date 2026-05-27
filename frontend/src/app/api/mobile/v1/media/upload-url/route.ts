import { NextRequest } from 'next/server';
import { MobileMediaService } from '@/server/services/media/MobileMediaService';
import { apiError, apiSuccess } from '@/lib/apiResponse';
import { withMobileRoute } from '@/lib/mobileApi';

export const dynamic = 'force-dynamic';

const media = new MobileMediaService();

export async function POST(request: NextRequest) {
  return withMobileRoute(request, { policy: 'upload' }, async ({ auth: _auth }) => {
    const body = await request.json().catch(() => ({}));
    const purpose = typeof body.purpose === 'string' ? body.purpose : '';
    const contentType = typeof body.contentType === 'string' ? body.contentType : '';
    const sizeBytes = Number(body.sizeBytes);
    if (!purpose || !contentType || !Number.isFinite(sizeBytes) || sizeBytes <= 0) {
      return apiError('VALIDATION_ERROR', 'purpose, contentType, dan sizeBytes wajib diisi', 400);
    }
    return apiSuccess({ upload: await media.createPresignedUpload({ purpose, contentType, sizeBytes }) }, 201);
  });
}
