import Link from 'next/link';
import type { SignalPost } from '@shared/types';
import styles from './SignalPost.module.css';

export function QuotePostCard({ post }: { post: SignalPost | null }) {
  if (!post) return null;

  return (
    <Link className={styles.quoteCard} href={`/post/${post.id}`}>
      <div className={styles.quoteAuthor}>
        <span>{post.author.name.slice(0, 1).toUpperCase()}</span>
        <strong>{post.author.name}</strong>
        <em>{post.market?.pair ?? (post.category === 'trading' ? 'Trading Room' : 'Horizon')}</em>
      </div>
      <p>{post.content.text}</p>
    </Link>
  );
}
