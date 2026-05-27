import { NextRequest } from 'next/server';
import { HertzDmService } from '@shared/services/hertzDmService';
import { apiSuccess } from '@/lib/apiResponse';
import { withMobileRoute } from '@/lib/mobileApi';

export const dynamic = 'force-dynamic';

const service = new HertzDmService();

export async function GET(request: NextRequest) {
  return withMobileRoute(request, { policy: 'read' }, async ({ auth }) => {
    const members = await service.searchMembers(request.nextUrl.searchParams.get('q') ?? '', auth.user.id);
    return apiSuccess({ members });
  });
}

export async function POST(request: NextRequest) {
  return withMobileRoute(request, { policy: 'mutation' }, async ({ auth }) => {
    const body = await request.json();
    const result = await service.createDirectResolved(auth.user, {
      recipientId: body.recipientId ? String(body.recipientId) : undefined,
      recipientUsername: body.recipientUsername ? String(body.recipientUsername) : undefined,
    });
    return apiSuccess({ conversation: result.conversation, existing: result.existing }, result.existing ? 200 : 201);
  });
}

