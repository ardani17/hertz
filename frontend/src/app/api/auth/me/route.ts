import { apiSuccess } from '@/lib/apiResponse';
import { getCurrentMember } from '@/lib/memberAuth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getCurrentMember();
  return apiSuccess({ user });
}
