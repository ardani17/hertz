import Link from 'next/link';
import type { MemberSessionUser, HertzPost } from '@shared/types';
import { HertzActionBar } from './HertzActionBar';
import { HertzAuthorLine } from './HertzAuthorLine';
import { HertzAvatar } from './HertzAvatar';
import { HertzPostArticle } from './HertzPostArticle';
import { HertzPostMedia } from './HertzPostMedia';
import { HertzMarketMeta } from './HertzMarketMeta';
import { HertzPostMenu } from './HertzPostMenu';
import { CommunityNoteCard } from './CommunityNoteCard';
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

export function HertzPostCard({ post, currentUser }: { post: HertzPost; currentUser: MemberSessionUser | null }) {
  return (
    <>
      <HertzPostArticle className={styles.post} href={`/hertz/post/${post.shortId}`}>
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
          <p className={styles.content}>{post.content.text}</p>
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
      <CommunityNoteCard note={post.primaryCommunityNote} postId={post.shortId} />
    </>
  );
}
