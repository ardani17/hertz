'use client';

import Link from 'next/link';
import { DmAvatar } from './DmAvatar';
import { getDmProfileHref } from './dm-utils';
import type { Conversation } from './types';
import styles from './messages.module.css';

type ThreadIntroProps = {
  peer: NonNullable<Conversation['peer']>;
};

/** Ringkasan profil di atas thread — tanpa tombol voice/video (fitur tidak ada). */
export function ThreadIntro({ peer }: ThreadIntroProps) {
  const profileHref = getDmProfileHref(peer.username);

  return (
    <div className={styles.threadIntro}>
      <DmAvatar
        src={peer.avatarUrl}
        displayName={peer.displayName}
        username={peer.username}
        className={styles.threadIntroAvatar}
      />
      <strong className={styles.threadIntroName}>{peer.displayName}</strong>
      {peer.username ? <span className={styles.threadIntroHandle}>@{peer.username.replace(/^@/, '')}</span> : null}
      {profileHref ? (
        <Link className={styles.threadIntroProfileBtn} href={profileHref}>
          Lihat profil
        </Link>
      ) : null}
    </div>
  );
}
