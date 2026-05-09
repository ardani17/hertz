'use client';

import { useState } from 'react';
import { TelegramLoginWidget, type TelegramUser } from '@/components/auth/TelegramLoginWidget';
import { Button } from '@/components/ui/button';
import { TelegramIcon } from './SignalIcons';
import styles from './SignalTelegramLogin.module.css';

export function SignalTelegramLogin({ compact = false }: { compact?: boolean }) {
  const [status, setStatus] = useState<string | null>(null);
  const botName = process.env.NEXT_PUBLIC_TELEGRAM_BOT_NAME ?? '';
  const hasValidBotName = Boolean(botName)
    && !botName.includes('your_')
    && !botName.includes('local')
    && !botName.includes('test')
    && botName.toLowerCase() !== 'undefined';

  async function handleAuth(user: TelegramUser) {
    setStatus('Memverifikasi member grup Horizon...');
    const response = await fetch('/api/auth/telegram', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload?.success) {
      setStatus(payload?.error?.message ?? 'Login Telegram gagal.');
      return;
    }
    setStatus('Login berhasil. Memuat feed...');
    window.location.reload();
  }

  if (!hasValidBotName) {
    return (
      <div className={`${styles.login} ${compact ? styles.compact : ''}`}>
        <div className={styles.heading}>
          <TelegramIcon />
          <div>
            <strong>Login Telegram</strong>
            {!compact ? <span>Masukkan `TELEGRAM_BOT_NAME` asli agar tombol login Telegram resmi muncul.</span> : null}
          </div>
        </div>
        <Button type="button" className={styles.fallbackButton} aria-disabled>
          <TelegramIcon />
          <span>Login Telegram</span>
        </Button>
      </div>
    );
  }

  return (
    <div className={`${styles.login} ${compact ? styles.compact : ''}`}>
      <div className={styles.heading}>
        <TelegramIcon />
        <div>
          <strong>Login Telegram</strong>
          {!compact ? <span>Verifikasi member grup Horizon untuk publish, Signal, komentar, dan repost.</span> : null}
        </div>
      </div>
      <div className={styles.widget}>
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
