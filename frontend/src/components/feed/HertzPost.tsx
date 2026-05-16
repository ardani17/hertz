'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import type { MemberSessionUser, HertzPost } from '@shared/types';
import { HertzActionBar } from './HertzActionBar';
import { HertzAuthorLine } from './HertzAuthorLine';
import { HertzAvatar } from './HertzAvatar';
import { HertzPostArticle } from './HertzPostArticle';
import { HertzPostDetailModal } from './HertzPostDetailModal';
import { HertzPostMedia } from './HertzPostMedia';
import { HertzMarketMeta } from './HertzMarketMeta';
import { HertzPostMenu } from './HertzPostMenu';
import { QuotePostCard } from './QuotePostCard';
import { CoffeeIcon, ImageIcon, TelegramIcon } from './HertzIcons';
import styles from './HertzPost.module.css';

function SpineIcon({ post }: { post: HertzPost }) {
  if (post.category === 'life_coffee' || post.category === 'life_story') return <CoffeeIcon />;
  if (post.quotedPost) return <ImageIcon />;
  return <TelegramIcon />;
}

function spineNodeClass(post: HertzPost) {
  return [
    styles.spineNode,
    (post.category === 'life_coffee' || post.category === 'life_story') ? styles.coffeeSpineNode : '',
  ].filter(Boolean).join(' ');
}

export function HertzPostCard({
  post,
  currentUser,
  enableDesktopModal = true,
}: {
  post: HertzPost;
  currentUser: MemberSessionUser | null;
  enableDesktopModal?: boolean;
}) {
  const isPlainRepost = post.type === 'repost' && post.quotedPost;
  const [detailOpen, setDetailOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement | null>(null);

  function closeDetail() {
    setDetailOpen(false);
    requestAnimationFrame(() => triggerRef.current?.focus());
  }

  return (
    <div ref={triggerRef} tabIndex={-1}>
      <HertzPostArticle
        className={styles.post}
        href={`/hertz/post/${post.shortId}`}
        onDesktopOpen={enableDesktopModal ? () => setDetailOpen(true) : undefined}
      >
        <div className={spineNodeClass(post)} aria-hidden="true">
          <SpineIcon post={post} />
        </div>
        <HertzAvatar
          className={`${styles.avatar} ${(post.category === 'life_coffee' || post.category === 'life_story') ? styles.coffeeAvatar : ''}`}
          src={post.author.avatarUrl}
          name={post.author.name}
          username={post.author.username}
        />
        <div className={styles.body}>
          <div className={styles.postTop}>
            <HertzAuthorLine post={post} />
            <HertzPostMenu post={post} currentUser={currentUser} />
          </div>
          {isPlainRepost ? <p className={styles.repostLabel}>Merepost</p> : <p className={styles.content}>{post.content.text}</p>}
          {post.content.isTruncated ? (
            <Link className={styles.readMore} href={`/hertz/post/${post.shortId}`}>Baca lanjut</Link>
          ) : null}
          <HertzPostMedia media={post.media} />
          <HertzMarketMeta post={post} />
          <QuotePostCard post={post.quotedPost} />
          <div className={styles.interactiveArea}>
            <HertzActionBar post={post} currentUser={currentUser} />
          </div>
        </div>
      </HertzPostArticle>
      {detailOpen ? <HertzPostDetailModal shortId={post.shortId} currentUser={currentUser} onClose={closeDetail} /> : null}
    </div>
  );
}
