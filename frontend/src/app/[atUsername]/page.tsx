import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { PublicProfileView } from '@/components/profile/PublicProfileView';
import { parsePublicProfileSegment } from '@/lib/public-profile/public-profile';
import { getCurrentMember } from '@/lib/memberAuth';
import { HertzPublicProfileService } from '@shared/services/hertzPublicProfileService';

export const dynamic = 'force-dynamic';

type PageProps = { params: Promise<{ atUsername: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { atUsername } = await params;
  const username = parsePublicProfileSegment(atUsername);
  if (!username) return { title: 'Profil tidak ditemukan' };
  return {
    title: `@${username} | Horizon`,
    alternates: { canonical: `/@${username}` },
  };
}

export default async function PublicProfilePage({ params }: PageProps) {
  const { atUsername } = await params;
  const username = parsePublicProfileSegment(atUsername);
  if (!username) notFound();

  const viewer = await getCurrentMember();
  const dto = await new HertzPublicProfileService().getPublicProfileByUsername(username, viewer);
  if (!dto) notFound();

  if (dto.username.toLowerCase() !== username) {
    redirect(`/@${dto.username}`);
  }

  return <PublicProfileView dto={dto} viewerId={viewer?.id ?? null} currentUser={viewer} />;
}
