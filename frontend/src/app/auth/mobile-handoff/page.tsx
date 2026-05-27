import Script from 'next/script';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

export default async function MobileHandoffPage({
  searchParams,
}: {
  searchParams: Promise<{ nonce?: string }>;
}) {
  const { nonce = '' } = await searchParams;
  const botName = process.env.NEXT_PUBLIC_TELEGRAM_BOT_NAME || process.env.TELEGRAM_BOT_NAME || '';

  return (
    <main className={styles.handoff}>
      <h1 className={styles.title}>Masuk ke Hertz</h1>
      <p className={styles.copy}>Verifikasi membership lewat Telegram untuk melanjutkan ke aplikasi mobile.</p>
      <div id="telegram-login" className={styles.telegramLogin} />
      {!botName ? <p className={styles.copy}>Telegram bot belum dikonfigurasi.</p> : null}
      <Script
        id="hertz-mobile-handoff"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.onTelegramAuth = async function(user) {
              try {
                const response = await fetch('/api/mobile/v1/auth/handoff/exchange', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ nonce: ${JSON.stringify(nonce)}, telegramAuth: user })
                });
                const payload = await response.json();
                if (!response.ok || !payload.success) {
                  throw new Error(payload.error?.message || 'Login gagal');
                }
                const data = payload.data;
                const target = new URL('hertz://auth/callback');
                target.searchParams.set('token', data.token);
                target.searchParams.set('expiresAt', data.expiresAt);
                window.location.href = target.toString();
              } catch (error) {
                const message = error && error.message ? error.message : 'Login gagal';
                document.getElementById('telegram-login').innerText = message;
              }
            };
          `,
        }}
      />
      {botName ? (
        <Script
          async
          src="https://telegram.org/js/telegram-widget.js?22"
          data-telegram-login={botName}
          data-size="large"
          data-radius="12"
          data-auth-url=""
          data-request-access="write"
          data-onauth="onTelegramAuth(user)"
        />
      ) : null}
    </main>
  );
}

