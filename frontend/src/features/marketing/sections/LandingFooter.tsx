import Image from 'next/image';
import Link from 'next/link';
import styles from '../HorizonLanding.module.css';

export function LandingFooter() {
  return (
    <>
      <nav className={styles.mobileDock} aria-label="Navigasi mobile Horizon">
        <Link href="/hertz">HERTZ</Link>
        <Link href="/outlook">Outlook</Link>
        <Link href="/blog">Blog</Link>
        <Link href="/tools">Tools</Link>
        <Link className={styles.mobileDockLogin} href="/hertz">
          Masuk
        </Link>
      </nav>

      <footer className={styles.footer}>
        <div className={styles.footerTop}>
          <div className={styles.footerBrand}>
            <Image src="/images/logo/Logo-Horizon-Atom-Online-White_8.png" alt="" width={22} height={22} />
            <strong>HORIZON</strong>
            <span>Intelijen Market Forex</span>
          </div>
          <div className={styles.footerLinks}>
            <Link href="/hertz">HERTZ</Link>
            <Link href="/outlook">Outlook</Link>
            <Link href="/blog">Blog</Link>
            <Link href="/tools">Tools</Link>
          </div>
        </div>
        <div className={styles.footerMid}>
          <p className={styles.footerAbout}>
            Horizon adalah platform intelijen market forex gratis untuk trader yang ingin tools lebih baik dan
            komunitas yang lebih kuat.
          </p>
          <a
            className={styles.footerTelegram}
            href="https://t.me/horizon_forex"
            target="_blank"
            rel="noopener noreferrer"
          >
            Gabung Komunitas Telegram →
          </a>
        </div>
        <div className={styles.footerBottom}>
          <div className={styles.footerBottomLeft}>
            <span className={styles.footerCopy}>© {new Date().getFullYear()} Horizon. Hak cipta dilindungi.</span>
            <span className={styles.footerBuilt}>Dibuat untuk komunitas trader forex</span>
          </div>
          <div className={styles.footerLegal}>
            <Link href="/privacy">Privasi</Link>
            <Link href="/terms">Ketentuan</Link>
          </div>
        </div>
      </footer>
    </>
  );
}
