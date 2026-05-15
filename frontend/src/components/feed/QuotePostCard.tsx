import Link from 'next/link';
import type { HertzPost } from '@shared/types';
import styles from './HertzPost.module.css';

export function QuotePostCard({ post }: { post: HertzPost | null }) {
  if (!post) return null;

  return (
    <Link className={styles.quoteCard} href={`/hertz/post/${post.shortId}`}>
      {post.media[0] ? <img src={post.media[0].url} alt={post.media[0].alt ?? 'Quoted chart'} /> : null}
      <div>
        <div className={styles.quoteAuthor}>
          <strong>{post.author.name}</strong>
          <em>{post.market?.pair ?? (post.category === 'trading_room' || post.category === 'trading' ? 'Trading Room' : 'Horizon')}</em>
        </div>
        <p>{post.content.text}</p>
        {post.market ? (
          <small>
            Entry: {post.market.entryZone ?? post.market.entryPrice ?? '-'} · TP: {post.market.takeProfit1 ?? post.market.takeProfit ?? '-'} · SL: {post.market.stopLoss ?? '-'}
          </small>
        ) : null}
      </div>
    </Link>
  );
}
