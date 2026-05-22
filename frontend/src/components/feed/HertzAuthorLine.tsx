import Link from 'next/link';
import type { HertzPost } from '@shared/types';
import { formatHertzAuthorHandle } from '@/lib/hertzAuthorDisplay';
import styles from './HertzPost.module.css';

function relativeTime(date: string) {
  const minutes = Math.max(1, Math.round((Date.now() - new Date(date).getTime()) / 60000));
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.round(hours / 24)}d`;
}

export function HertzAuthorLine({ post }: { post: HertzPost }) {
  return (
    <div>
      <div className={styles.authorLine}>
        {post.author.username ? (
          <Link href={`/@${post.author.username}`} className={styles.authorLink} prefetch>
            <strong>{post.author.name}</strong>
            <span className={styles.authorHandle}>{formatHertzAuthorHandle(post.author.username)}</span>
          </Link>
        ) : (
          <>
            <strong>{post.author.name}</strong>
            <span className={styles.authorHandle}>{formatHertzAuthorHandle(post.author.username)}</span>
          </>
        )}
      </div>
      <div className={styles.metaLine}>
        <span>{post.source === 'telegram' || post.source === 'admin' ? 'via Telegram' : 'via Web'}</span>
        {post.market?.pair ? <span>{post.market.pair}</span> : null}
        {post.market?.riskPercent ? <span>Risk {post.market.riskPercent}%</span> : null}
        <span>{relativeTime(post.createdAt)}</span>
        {post.editedAt ? <span>Edited</span> : null}
      </div>
    </div>
  );
}
