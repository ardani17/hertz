import Link from 'next/link';
import type { MemberSessionUser, SignalPost } from '@shared/types';
import { SignalActionBar } from './SignalActionBar';
import { SignalAuthorLine } from './SignalAuthorLine';
import { SignalPostMedia } from './SignalPostMedia';
import { SignalMarketMeta } from './SignalMarketMeta';
import { SignalPostMenu } from './SignalPostMenu';
import { CommunityNoteCard } from './CommunityNoteCard';
import { QuotePostCard } from './QuotePostCard';
import { SignalIcon } from './SignalIcons';
import styles from './SignalPost.module.css';

export function SignalPostCard({ post, currentUser }: { post: SignalPost; currentUser: MemberSessionUser | null }) {
  return (
    <article className={styles.post}>
      <div className={styles.spineNode} aria-hidden="true">
        <SignalIcon />
      </div>
      <div className={styles.avatar}>{post.author.name.slice(0, 1).toUpperCase()}</div>
      <div className={styles.body}>
        <div className={styles.postTop}>
          <SignalAuthorLine post={post} />
          <SignalPostMenu post={post} currentUser={currentUser} />
        </div>
        <p className={styles.content}>{post.content.text}</p>
        {post.content.isTruncated ? (
          <Link className={styles.readMore} href={`/post/${post.id}`}>Baca lanjut</Link>
        ) : null}
        <SignalPostMedia media={post.media} />
        <SignalMarketMeta post={post} />
        <QuotePostCard post={post.quotedPost} />
        <CommunityNoteCard note={post.primaryCommunityNote} postId={post.id} />
        <SignalActionBar post={post} currentUser={currentUser} />
      </div>
    </article>
  );
}
