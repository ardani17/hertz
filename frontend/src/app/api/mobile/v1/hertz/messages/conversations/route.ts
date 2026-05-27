import { NextRequest } from 'next/server';
import { HertzDmService } from '@shared/services/hertzDmService';
import { apiErrorFromUnknown, apiSuccess } from '@/lib/apiResponse';
import { checkMobileRateLimit, isMobileAuthContext, requireMobileMember } from '@/lib/mobileApi';

export const dynamic = 'force-dynamic';

const service = new HertzDmService();

export async function GET(request: NextRequest) {
  const auth = await requireMobileMember(request);
  if (!isMobileAuthContext(auth)) return auth;

  const limited = checkMobileRateLimit(request, 'read', auth.user.id);
  if (limited) return limited;

  try {
    const members = await service.searchMembers(request.nextUrl.searchParams.get('q') ?? '', auth.user.id);
    return apiSuccess({ members });
  } catch (error) {
    return apiErrorFromUnknown(error);
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireMobileMember(request);
  if (!isMobileAuthContext(auth)) return auth;

  const limited = checkMobileRateLimit(request, 'mutation', auth.user.id);
  if (limited) return limited;

  try {
    const body = await request.json();
    const result = await service.createDirectResolved(auth.user, {
      recipientId: body.recipientId ? String(body.recipientId) : undefined,
      recipientUsername: body.recipientUsername ? String(body.recipientUsername) : undefined,
    });
    return apiSuccess({ conversation: result.conversation, existing: result.existing }, result.existing ? 200 : 201);
  } catch (error) {
    return apiErrorFromUnknown(error);
  }
}

