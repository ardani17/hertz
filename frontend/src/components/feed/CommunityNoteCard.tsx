import Link from 'next/link';
import type { CommunityNote } from '@shared/types';
import { UsersIcon } from './SignalIcons';
import styles from './SignalPost.module.css';

export function CommunityNoteCard({ note, postId }: { note: CommunityNote | null; postId: string }) {
  if (!note) return null;

  return (
    <div className={styles.note}>
      <strong><UsersIcon /> Catatan komunitas</strong>
      <p>{note.content}</p>
      <div className={styles.noteFooter}>
        <span>{note.sources.length} source</span>
        <Link href={`/post/${postId}`}>Beri nilai</Link>
      </div>
    </div>
  );
}
