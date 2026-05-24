'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import styles from './page.module.css';

export function ProfileSessionActions() {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function logout() {
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/hertz');
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <div className={styles.sessionActions}>
      <Link href="/hertz">HERTZ</Link>
      <Link href="#profile-edit">Edit profil</Link>
      <button type="button" onClick={logout} disabled={loggingOut}>
        {loggingOut ? 'Keluar...' : 'Keluar'}
      </button>
    </div>
  );
}
