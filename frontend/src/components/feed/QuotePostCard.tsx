'use client';

import Link from 'next/link';
import type { HertzPost } from '@shared/types';
import { buildHertzPostPath } from '@/lib/hertzPostSpa';
import { useHertzPostNavigation } from './HertzPostContext';
import styles from './HertzPost.module.css';

export function QuotePostCard({ post }: { post: HertzPost | null }) {
  const { openPost } = useHertzPostNavigation();
  if (!post) return null;

  const href = buildHertzPostPath(post.shortId);

  return (
    <Link
      className={styles.quoteCard}
      href={href}
      onClick={(event) => {
        event.preventDefault();
        openPost(post.shortId);
      }}
    >
      {post.media[0] ? (
        <img
          src={post.media[0].url}
          alt={post.media[0].alt ?? 'Quoted chart'}
          loading="lazy"
          decoding="async"
          width={480}
          height={270}
        />
      ) : null}
      <div>
        <div className={styles.quoteAuthor}>
          <strong>{post.author.name}</strong>
          <em>
            {post.market?.pair ?? (post.category === 'trading_room' || post.category === 'trading' ? 'Trading Room' : 'Horizon')}
          </em>
        </div>
        <p>{post.content.text}</p>
        {post.market ? (
          <small>
            Entry: {post.market.entryZone ?? post.market.entryPrice ?? '-'} · TP:{' '}
            {post.market.takeProfit1 ?? post.market.takeProfit ?? '-'} · SL: {post.market.stopLoss ?? '-'}
          </small>
        ) : null}
      </div>
    </Link>
  );
}
