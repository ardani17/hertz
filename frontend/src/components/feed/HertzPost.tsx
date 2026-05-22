'use client';

import Link from 'next/link';
import { useRef } from 'react';
import type { MemberSessionUser, HertzPost } from '@shared/types';
import { buildHertzPostPath } from '@/lib/hertzPostSpa';
import { getHertzHashtagHref, splitHertzHashtagText } from '@/lib/hertzSearchUi';
import { getHertzPostSpineKind } from '@/lib/hertzPostDisplay';
import { getPlainRepostLabel, isPlainRepostTimelineItem } from '@/lib/hertzRepostUi';
import { HertzActionBar } from './HertzActionBar';
import { HertzAuthorLine } from './HertzAuthorLine';
import { HertzAvatar } from './HertzAvatar';
import { HertzPostArticle } from './HertzPostArticle';
import { useHertzPost } from './HertzPostContext';
import { HertzPostMedia } from './HertzPostMedia';
import { HertzMarketMeta } from './HertzMarketMeta';
import { HertzPostMenu } from './HertzPostMenu';
import { QuotePostCard } from './QuotePostCard';
import { CoffeeIcon, InsightIcon, TelegramIcon } from './HertzIcons';
import styles from './HertzPost.module.css';

function SpineIcon({ post }: { post: HertzPost }) {
  const kind = getHertzPostSpineKind(post.category);
  if (kind === 'life') return <CoffeeIcon />;
  if (kind === 'trading') return <InsightIcon />;
  return <TelegramIcon />;
}

function spineNodeClass(post: HertzPost) {
  const kind = getHertzPostSpineKind(post.category);
  return [
    styles.spineNode,
    kind === 'life' ? styles.coffeeSpineNode : '',
    kind === 'trading' ? styles.tradingSpineNode : '',
  ].filter(Boolean).join(' ');
}

function HertzPostText({ text }: { text: string }) {
  return (
    <>
      {splitHertzHashtagText(text).map((part, index) => (
        part.type === 'hashtag'
          ? <Link key={`${part.value}-${index}`} href={getHertzHashtagHref(part.value)}>{part.value}</Link>
          : <span key={`${part.value}-${index}`}>{part.value}</span>
      ))}
    </>
  );
}

export function HertzPostCard({
  post,
  currentUser,
}: {
  post: HertzPost;
  currentUser: MemberSessionUser | null;
}) {
  const isPlainRepost = isPlainRepostTimelineItem(post);
  const { openPost } = useHertzPost();
  const triggerRef = useRef<HTMLDivElement | null>(null);
  const postHref = buildHertzPostPath(post.shortId);

  return (
    <div ref={triggerRef} tabIndex={-1}>
      <HertzPostArticle
        className={styles.post}
        href={postHref}
        onOpenPost={() => openPost(post.shortId)}
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
          {isPlainRepost ? <p className={styles.repostLabel}>{getPlainRepostLabel(post)}</p> : <p className={styles.content}><HertzPostText text={post.content.text} /></p>}
          {post.content.isTruncated ? (
            <Link
              className={styles.readMore}
              href={postHref}
              onClick={(event) => {
                event.preventDefault();
                openPost(post.shortId);
              }}
            >
              Baca lanjut
            </Link>
          ) : null}
          <HertzPostMedia media={post.media} />
          <HertzMarketMeta post={post} />
          <QuotePostCard post={post.quotedPost} />
          <div className={styles.interactiveArea}>
            <HertzActionBar post={post} currentUser={currentUser} onOpenDetail={() => openPost(post.shortId)} />
          </div>
        </div>
      </HertzPostArticle>
    </div>
  );
}
