import Link from 'next/link';
import type { MemberSessionUser, SignalPost } from '@shared/types';
import { SignalActionBar } from './SignalActionBar';
import { SignalAuthorLine } from './SignalAuthorLine';
import { SignalPostMedia } from './SignalPostMedia';
import { SignalMarketMeta } from './SignalMarketMeta';
import { SignalPostMenu } from './SignalPostMenu';
import { CommunityNoteCard } from './CommunityNoteCard';
import { QuotePostCard } from './QuotePostCard';
import { CoffeeIcon, ImageIcon, TelegramIcon } from './SignalIcons';
import styles from './SignalPost.module.css';

function initials(name: string, username?: string | null) {
  if (username?.startsWith('trader')) return 'TR';
  if (username?.startsWith('langit')) return 'LG';
  if (username?.startsWith('life')) return 'LC';
  return name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}

function SpineIcon({ post }: { post: SignalPost }) {
  if (post.category === 'life_coffee' || post.category === 'life_story') return <CoffeeIcon />;
  if (post.quotedPost) return <ImageIcon />;
  return <TelegramIcon />;
}

function spineNodeClass(post: SignalPost) {
  return [
    styles.spineNode,
    (post.category === 'life_coffee' || post.category === 'life_story') ? styles.coffeeSpineNode : '',
  ].filter(Boolean).join(' ');
}

export function SignalPostCard({ post, currentUser }: { post: SignalPost; currentUser: MemberSessionUser | null }) {
  return (
    <>
      <article className={styles.post}>
        <div className={spineNodeClass(post)} aria-hidden="true">
          <SpineIcon post={post} />
        </div>
        <div className={styles.avatar}>{initials(post.author.name, post.author.username)}</div>
        <div className={styles.body}>
          <div className={styles.postTop}>
            <SignalAuthorLine post={post} />
            <SignalPostMenu post={post} currentUser={currentUser} />
          </div>
          <p className={styles.content}>{post.content.text}</p>
          {post.content.isTruncated ? (
            <Link className={styles.readMore} href={`/hertz/post/${post.shortId}`}>Baca lanjut</Link>
          ) : null}
          <SignalPostMedia media={post.media} />
          <SignalMarketMeta post={post} />
          <QuotePostCard post={post.quotedPost} />
          <SignalActionBar post={post} currentUser={currentUser} />
        </div>
      </article>
      <CommunityNoteCard note={post.primaryCommunityNote} postId={post.shortId} />
    </>
  );
}
