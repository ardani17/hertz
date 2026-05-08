import type { SignalPost } from '@shared/types';
import styles from './SignalPost.module.css';

export function SignalAuthorLine({ post }: { post: SignalPost }) {
  const badge = post.author.badge === 'admin' ? 'Admin' : 'Verified Member';
  const categoryLabel = post.category === 'trading'
    ? 'Trading Room'
    : post.category === 'life_story'
      ? 'Life & Coffee'
      : 'General';

  return (
    <div>
      <div className={styles.authorLine}>
        <strong>{post.author.name}</strong>
        <span className={post.author.badge === 'admin' ? styles.adminBadge : styles.badge}>{badge}</span>
        <span>@{post.author.username ?? 'horizon'}</span>
        <span>{new Date(post.createdAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</span>
        {post.editedAt ? <span>Edited</span> : null}
      </div>
      <div className={styles.metaLine}>
        <span>{post.source === 'telegram' || post.source === 'admin' ? 'via Telegram' : 'via Web'}</span>
        <span>{categoryLabel}</span>
        {post.market?.pair ? <span>{post.market.pair}</span> : null}
        {post.market?.riskPercent ? <span>Risk {post.market.riskPercent}%</span> : null}
      </div>
    </div>
  );
}
