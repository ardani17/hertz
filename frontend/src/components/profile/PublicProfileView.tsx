'use client';

import Link from 'next/link';
import type { HertzPost, MemberSessionUser } from '@shared/types';
import type { PublicProfileDto } from '@shared/services/hertzPublicProfileService';
import { HertzLayout } from '@/components/layout/HertzLayout';
import { HertzAvatar } from '@/components/feed/HertzAvatar';
import { PublicProfileDmButton } from './PublicProfileDmButton';
import { PublicProfilePostShell } from './PublicProfilePostShell';
import { PublicProfilePosts } from './PublicProfilePosts';
import { ProfileSocialLinks } from './ProfileSocialLinks';
import { ProfileTradingCard } from './ProfileTradingCard';
import styles from './PublicProfileView.module.css';

export function PublicProfileView({
  dto,
  viewerId,
  currentUser,
  initialPosts,
  initialNextCursor,
}: {
  dto: PublicProfileDto;
  viewerId: string | null;
  currentUser: MemberSessionUser | null;
  initialPosts: HertzPost[];
  initialNextCursor: string | null;
}) {
  return (
    <PublicProfilePostShell username={dto.username} currentUser={currentUser}>
      <HertzLayout variant="page" active="profile" title={`@${dto.username}`} description="Profil publik Hertz" currentUser={currentUser}>
        <section className={styles.profile}>
          <div className={styles.header}>
            <HertzAvatar className={styles.avatar} src={dto.avatarUrl} name={dto.displayName} username={dto.username} />
            <div>
              <h2>{dto.displayName}</h2>
              <p>@{dto.username}</p>
              {dto.location ? <p className={styles.location}>{dto.location}</p> : null}
              {dto.bio ? <p className={styles.bio}>{dto.bio}</p> : null}
            </div>
          </div>
          <div className={styles.counters}>
            <div><strong>{dto.publicCounters.posts}</strong><span>Posts</span></div>
            <div><strong>{dto.publicCounters.pulses}</strong><span>Pulses</span></div>
            <div><strong>{dto.publicCounters.repostsReceived}</strong><span>Reposts</span></div>
          </div>
          {dto.isSelf ? (
            <Link href="/hertz/profile#profile-edit" className={styles.cta}>
              Edit profile
            </Link>
          ) : (
            <PublicProfileDmButton dto={dto} viewerId={viewerId} />
          )}
          {dto.hobbies.length > 0 ? (
            <section className={styles.hobbiesSection}>
              <h3>Hobi</h3>
              <ul className={styles.hobbyList}>
                {dto.hobbies.map((hobby) => (
                  <li key={hobby}>{hobby}</li>
                ))}
              </ul>
            </section>
          ) : null}
          <ProfileSocialLinks links={dto.socialLinks} />
          <ProfileTradingCard trading={dto.trading} />
          <PublicProfilePosts
            username={dto.username}
            currentUser={currentUser}
            initialPosts={initialPosts}
            initialNextCursor={initialNextCursor}
          />
        </section>
      </HertzLayout>
    </PublicProfilePostShell>
  );
}
