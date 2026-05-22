'use client';

import Link from 'next/link';
import type { MemberSessionUser } from '@shared/types';
import type { PublicProfileDto } from '@shared/services/hertzPublicProfileService';
import { HertzLayout } from '@/components/layout/HertzLayout';
import { HertzAvatar } from '@/components/feed/HertzAvatar';
import { PublicProfileDmButton } from './PublicProfileDmButton';
import styles from './PublicProfileView.module.css';

export function PublicProfileView({
  dto,
  viewerId,
  currentUser,
}: {
  dto: PublicProfileDto;
  viewerId: string | null;
  currentUser: MemberSessionUser | null;
}) {
  return (
    <HertzLayout variant="page" active="profile" title={`@${dto.username}`} description="Profil publik Horizon" currentUser={currentUser}>
      <section className={styles.profile}>
        <div className={styles.header}>
          <HertzAvatar className={styles.avatar} src={dto.avatarUrl} name={dto.displayName} username={dto.username} />
          <div>
            <h2>{dto.displayName}</h2>
            <p>@{dto.username}</p>
            {dto.bio ? <p className={styles.bio}>{dto.bio}</p> : null}
          </div>
        </div>
        <div className={styles.counters}>
          <div><strong>{dto.publicCounters.posts}</strong><span>Posts</span></div>
          <div><strong>{dto.publicCounters.pulses}</strong><span>Pulses</span></div>
          <div><strong>{dto.publicCounters.repostsReceived}</strong><span>Reposts</span></div>
        </div>
        {dto.isSelf ? (
          <Link href="/hertz/profile" className={styles.cta}>
            Edit profile
          </Link>
        ) : (
          <PublicProfileDmButton dto={dto} viewerId={viewerId} />
        )}
        <section className={styles.postsSection}>
          <h3>Postingan</h3>
          {dto.recentPosts.length === 0 ? (
            <p className={styles.emptyPosts}>Belum ada postingan publik.</p>
          ) : (
            <ul className={styles.postList}>
              {dto.recentPosts.map((post) => (
                <li key={post.shortId}>
                  <Link href={`/hertz/post/${post.shortId}`} className={styles.postLink}>
                    <span className={styles.postExcerpt}>{post.excerpt}</span>
                    <time dateTime={post.createdAt}>
                      {new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(new Date(post.createdAt))}
                    </time>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </section>
    </HertzLayout>
  );
}
