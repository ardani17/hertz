import Link from 'next/link';
import { productModules } from '../data';
import styles from '../HorizonLanding.module.css';

function ProductVisual({ index }: { index: number }) {
  const patterns = [
    <svg key="hertz" width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <circle cx="32" cy="20" r="6" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="16" cy="44" r="5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="48" cy="44" r="5" stroke="currentColor" strokeWidth="1.5" />
      <line x1="32" y1="26" x2="16" y2="39" stroke="currentColor" strokeWidth="1.2" />
      <line x1="32" y1="26" x2="48" y2="39" stroke="currentColor" strokeWidth="1.2" />
      <line x1="16" y1="44" x2="48" y2="44" stroke="currentColor" strokeWidth="1.2" strokeDasharray="3 3" />
    </svg>,
    <svg key="outlook" width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <circle cx="32" cy="32" r="22" stroke="currentColor" strokeWidth="1.5" />
      <polygon points="32,14 36,30 32,28 28,30" fill="currentColor" opacity="0.6" />
      <polygon points="32,50 28,34 32,36 36,34" fill="currentColor" opacity="0.3" />
      <circle cx="32" cy="32" r="3" fill="currentColor" />
    </svg>,
    <svg key="blog" width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <rect x="14" y="10" width="36" height="44" rx="3" stroke="currentColor" strokeWidth="1.5" />
      <line x1="22" y1="22" x2="42" y2="22" stroke="currentColor" strokeWidth="1.2" />
      <line x1="22" y1="30" x2="42" y2="30" stroke="currentColor" strokeWidth="1.2" />
      <line x1="22" y1="38" x2="36" y2="38" stroke="currentColor" strokeWidth="1.2" />
      <rect x="22" y="14" width="12" height="3" rx="1" fill="currentColor" opacity="0.5" />
    </svg>,
    <svg key="tools" width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <line x1="16" y1="20" x2="48" y2="20" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="28" cy="20" r="4" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <line x1="16" y1="32" x2="48" y2="32" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="40" cy="32" r="4" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <line x1="16" y1="44" x2="48" y2="44" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="22" cy="44" r="4" stroke="currentColor" strokeWidth="1.5" fill="none" />
    </svg>,
  ];
  return (
    <div className={styles.productVisual} style={{ color: 'var(--lp-accent)' }}>
      {patterns[index] ?? patterns[0]}
    </div>
  );
}

export function LandingProducts({ previewLine }: { previewLine: string }) {
  return (
    <section className={styles.products} aria-label="Ekosistem Horizon">
      <div className={styles.socialProof}>
        <span className={styles.socialProofLabel}>Suara trader di HERTZ</span>
        <p>{previewLine}</p>
      </div>

      {productModules.map((item, index) => (
        <div className={styles.productRow} key={item.href}>
          <div className={styles.productText}>
            <span className={styles.productLabel}>{item.metric}</span>
            <strong className={styles.productTitle}>{item.title}</strong>
            <p className={styles.productDescription}>{item.text}</p>
            <Link className={styles.ctaLink} href={item.href}>
              {item.cta}
            </Link>
          </div>
          <ProductVisual index={index} />
        </div>
      ))}
    </section>
  );
}
