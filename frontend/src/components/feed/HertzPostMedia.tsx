import type { HertzMedia } from '@shared/types';
import styles from './HertzPost.module.css';

export function HertzPostMedia({ media }: { media: HertzMedia[] }) {
  if (media.length === 0) return null;

  return (
    <div className={styles.mediaGrid} data-count={Math.min(media.length, 4)}>
      {media.slice(0, 4).map((item) => (
        item.type === 'image'
          ? <img key={item.id} src={item.url} alt={item.alt ?? 'Hertz media'} loading="lazy" decoding="async" width={640} height={360} />
          : <video key={item.id} src={item.url} controls preload="metadata" />
      ))}
    </div>
  );
}
