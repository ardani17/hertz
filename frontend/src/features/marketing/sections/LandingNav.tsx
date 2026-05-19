import Image from 'next/image';
import Link from 'next/link';
import styles from '../HorizonLanding.module.css';

export function LandingNav() {
  return (
    <header className={styles.navbar}>
      <Link className={styles.navBrand} href="/">
        <Image src="/images/logo/Logo-Horizon-Atom-Online-White_8.png" alt="" width={36} height={36} priority />
        <strong>HORIZON</strong>
      </Link>
      <nav aria-label="Horizon navigation">
        <Link href="/hertz">HERTZ</Link>
        <Link href="/outlook">Outlook</Link>
        <Link href="/blog">Blog</Link>
        <Link href="/tools">Tools</Link>
      </nav>
      <Link className={styles.login} href="/hertz">
        Sign In
      </Link>
    </header>
  );
}
