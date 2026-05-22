'use client';

import { useEffect, useState } from 'react';
import { TelegramLoginWidget, type TelegramUser } from '@/components/auth/TelegramLoginWidget';
import { Button } from '@/components/ui/button';
import { TelegramIcon } from './HertzIcons';
import styles from './HertzTelegramLogin.module.css';

const AUTH_TIMEOUT_MS = 30_000;

const devLoginFromBuild = process.env.NEXT_PUBLIC_ALLOW_DEV_TELEGRAM_LOGIN === 'true';

function HertzTelegramDevLogin({ compact = false }: { compact?: boolean }) {
  const [status, setStatus] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [telegramId, setTelegramId] = useState('');

  async function handleDevLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const id = Number(telegramId.trim());
    if (!Number.isFinite(id) || id <= 0) {
      setStatus('Masukkan Telegram ID numerik yang valid (dari @userinfobot).');
      return;
    }
    if (isVerifying) return;

    setIsVerifying(true);
    setStatus('Memproses login dev...');

    const timeout = window.setTimeout(() => {
      setStatus('Login terlalu lama. Coba lagi.');
      setIsVerifying(false);
    }, AUTH_TIMEOUT_MS);

    try {
      const response = await fetch('/api/auth/telegram/dev', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegramId: id }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success) {
        setStatus(payload?.error?.message ?? 'Login dev gagal.');
        return;
      }
      setStatus('Login berhasil. Memuat feed...');
      window.location.reload();
    } catch {
      setStatus('Tidak dapat menghubungi server. Pastikan frontend dev sedang berjalan.');
    } finally {
      window.clearTimeout(timeout);
      setIsVerifying(false);
    }
  }

  return (
    <div className={`${styles.login} ${compact ? styles.compact : ''}`}>
      <div className={styles.heading}>
        <TelegramIcon />
        <div>
          <strong>Login dev (localhost)</strong>
          {!compact ? (
            <span>Masukkan Telegram ID numerik Anda. Hanya untuk pengembangan lokal.</span>
          ) : null}
        </div>
      </div>
      <form className={styles.devForm} onSubmit={handleDevLogin}>
        <div className={styles.devRow}>
          <input
            className={styles.devInput}
            inputMode="numeric"
            placeholder="Telegram ID"
            value={telegramId}
            onChange={(event) => setTelegramId(event.target.value)}
            disabled={isVerifying}
            aria-label="Telegram ID"
          />
          <Button type="submit" className={styles.devButton} disabled={isVerifying}>
            Masuk dev
          </Button>
        </div>
      </form>
      {status ? <p className={styles.status}>{status}</p> : null}
    </div>
  );
}

/** Login Telegram resmi (produksi). */
function HertzTelegramWidgetLogin({ compact = false }: { compact?: boolean }) {
  const [status, setStatus] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const botName = process.env.NEXT_PUBLIC_TELEGRAM_BOT_NAME ?? '';
  const hasValidBotName = Boolean(botName)
    && !botName.includes('your_')
    && !botName.includes('local')
    && !botName.includes('test')
    && botName.toLowerCase() !== 'undefined';

  async function handleAuth(user: TelegramUser) {
    if (isVerifying) return;
    setIsVerifying(true);
    setStatus('Memverifikasi member grup Horizon...');

    const timeout = window.setTimeout(() => {
      setStatus('Verifikasi terlalu lama. Coba lagi.');
      setIsVerifying(false);
    }, AUTH_TIMEOUT_MS);

    try {
      const response = await fetch('/api/auth/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success) {
        if (response.status === 444 || response.status === 0) {
          setStatus('Permintaan diblokir firewall server (444). Coba lagi beberapa menit atau hubungi admin.');
        } else if (response.status === 503) {
          setStatus('Verifikasi membership sedang tidak tersedia. Coba lagi nanti.');
        } else {
          setStatus(payload?.error?.message ?? 'Login Telegram gagal.');
        }
        return;
      }
      setStatus('Login berhasil. Memuat feed...');
      window.location.reload();
    } catch {
      setStatus('Tidak dapat menghubungi server.');
    } finally {
      window.clearTimeout(timeout);
      setIsVerifying(false);
    }
  }

  if (!hasValidBotName) {
    return (
      <div className={`${styles.login} ${compact ? styles.compact : ''}`}>
        <div className={styles.heading}>
          <TelegramIcon />
          <div>
            <strong>Login Telegram</strong>
            {!compact ? <span>Konfigurasi bot Telegram belum lengkap.</span> : null}
          </div>
        </div>
        <Button type="button" className={styles.fallbackButton} aria-disabled>
          <TelegramIcon />
          <span>Login Telegram</span>
        </Button>
        {status ? <p className={styles.status}>{status}</p> : null}
      </div>
    );
  }

  return (
    <div className={`${styles.login} ${compact ? styles.compact : ''}`}>
      <div className={styles.heading}>
        <TelegramIcon />
        <div>
          <strong>Login Telegram</strong>
          {!compact ? (
            <span>Verifikasi member grup Horizon untuk publish, Pulse, komentar, dan repost.</span>
          ) : null}
        </div>
      </div>
      <div className={styles.widget} aria-busy={isVerifying}>
        <TelegramLoginWidget
          botName={botName}
          onAuth={handleAuth}
          buttonSize={compact ? 'medium' : 'large'}
          cornerRadius={8}
          usePic
        />
      </div>
      {status ? <p className={styles.status}>{status}</p> : null}
    </div>
  );
}

export function HertzTelegramLogin({ compact = false }: { compact?: boolean }) {
  const [useDevLogin, setUseDevLogin] = useState(devLoginFromBuild);
  const [checkingDev, setCheckingDev] = useState(!devLoginFromBuild);

  useEffect(() => {
    if (devLoginFromBuild) return;
    let cancelled = false;
    fetch('/api/auth/telegram/dev')
      .then((response) => response.json())
      .then((payload) => {
        if (!cancelled && payload?.data?.enabled === true) {
          setUseDevLogin(true);
        }
      })
      .catch(() => {
        /* tetap widget resmi */
      })
      .finally(() => {
        if (!cancelled) setCheckingDev(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (checkingDev) {
    return (
      <div className={`${styles.login} ${compact ? styles.compact : ''}`}>
        <p className={styles.status}>Memuat opsi login...</p>
      </div>
    );
  }

  if (useDevLogin) {
    return <HertzTelegramDevLogin compact={compact} />;
  }
  return <HertzTelegramWidgetLogin compact={compact} />;
}
