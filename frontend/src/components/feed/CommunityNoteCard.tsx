import Link from 'next/link';
import type { CommunityNote } from '@shared/types';
import { UsersIcon } from './SignalIcons';
import styles from './SignalPost.module.css';

export function CommunityNoteCard({ note, postId }: { note: CommunityNote | null; postId: string }) {
  if (!note) return null;

  return (
    <div className={styles.note}>
      <div className={styles.noteSpineNode} aria-hidden="true">
        <UsersIcon />
      </div>
      <strong><UsersIcon /> Catatan Komunitas</strong>
      <p>{note.content}</p>
      <div className={styles.noteFooter}>
        <span>{note.sources.map((source) => source.url.replace(/^https?:\/\//, '')).join('  ·  ')}</span>
        <Link href={`/hertz/post/${postId}`}>Beri nilai</Link>
      </div>
    </div>
  );
}
