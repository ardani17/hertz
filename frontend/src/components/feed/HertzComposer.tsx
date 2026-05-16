'use client';

import { useEffect, useState } from 'react';
import type { MarketContext, MemberSessionUser, HertzPostCategory } from '@shared/types';
import { Button } from '@/components/ui/button';
import { HertzAvatar } from './HertzAvatar';
import { HertzTelegramLogin } from './HertzTelegramLogin';
import styles from './HertzComposer.module.css';

type ComposerCategory = 'trading_room' | 'life_coffee' | 'general';
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
interface QueuedMedia {
  id: string;
  name: string;
  url: string;
}

function resolveComposerCategory(activeCategory?: HertzPostCategory | string | null): ComposerCategory {
  if (activeCategory === 'trading_room' || activeCategory === 'trading') return 'trading_room';
  if (activeCategory === 'life_coffee' || activeCategory === 'life_story') return 'life_coffee';
  return 'general';
}

export function HertzComposer({
  currentUser,
  activeCategory,
}: {
  currentUser: MemberSessionUser | null;
  activeCategory?: HertzPostCategory | string | null;
}) {
  const category = resolveComposerCategory(activeCategory);
  const isTradingPost = category === 'trading_room';
  const [content, setContent] = useState('');
  const [market, setMarket] = useState({
    pair: '',
    timeframe: '',
    direction: '',
    riskPercent: '',
    entryPrice: '',
    stopLoss: '',
    takeProfit: '',
    confidencePercent: '',
  });
  const [mediaItems, setMediaItems] = useState<QueuedMedia[]>([]);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (isTradingPost) return;
    setMarket({
      pair: '',
      timeframe: '',
      direction: '',
      riskPercent: '',
      entryPrice: '',
      stopLoss: '',
      takeProfit: '',
      confidencePercent: '',
    });
  }, [isTradingPost]);

  function setMarketField(field: keyof typeof market, value: string) {
    setMarket((current) => ({ ...current, [field]: value }));
  }

  function numberOrNull(value: string) {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function marketPayload(): MarketContext {
    return {
      pair: market.pair.trim() || null,
      timeframe: market.timeframe.trim() || null,
      direction: market.direction.trim() || null,
      riskPercent: numberOrNull(market.riskPercent),
      entryPrice: numberOrNull(market.entryPrice),
      stopLoss: numberOrNull(market.stopLoss),
      takeProfit: numberOrNull(market.takeProfit),
      confidencePercent: numberOrNull(market.confidencePercent),
    };
  }

  async function uploadImages(files: FileList | null) {
    if (!currentUser || !files?.length) return;
    const nextFiles = Array.from(files).slice(0, Math.max(0, 4 - mediaItems.length));
    if (nextFiles.length === 0) {
      setStatus('Maksimal 4 gambar per post.');
      return;
    }

    setUploading(true);
    setStatus('Mengunggah gambar...');
    try {
      const uploadedIds: string[] = [];
      for (const file of nextFiles) {
        if (!ALLOWED_IMAGE_TYPES.has(file.type.toLowerCase())) {
          setStatus('HERTZ hanya mendukung gambar JPG, PNG, atau WEBP.');
          continue;
        }
        const formData = new FormData();
        formData.append('file', file);
        const response = await fetch('/api/media/upload', { method: 'POST', body: formData });
        const payload = await response.json().catch(() => null);
        if (!response.ok || !payload?.success) {
          throw new Error(payload?.error?.message ?? 'Gagal mengunggah gambar.');
        }
        uploadedIds.push(payload.data.media.id);
        const url = typeof payload.data.media.file_url === 'string' ? payload.data.media.file_url : '';
        setMediaItems((items) => [...items, { id: payload.data.media.id, name: file.name, url }].slice(0, 4));
      }
      setStatus(uploadedIds.length > 0 ? 'Gambar siap dipublish.' : null);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Gagal mengunggah gambar.');
    } finally {
      setUploading(false);
    }
  }

  function removeMedia(id: string) {
    setMediaItems((items) => items.filter((item) => item.id !== id));
  }

  async function submit() {
    if (!currentUser) {
      setStatus('Login Telegram member diperlukan.');
      return;
    }
    if (isTradingPost && (!market.pair.trim() || !market.riskPercent.trim())) {
      setStatus('Pair dan risk wajib untuk Trading Room.');
      return;
    }
    setStatus('Mengirim...');
    const response = await fetch('/api/hertz/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category,
        content,
        market: isTradingPost ? marketPayload() : null,
        mediaIds: mediaItems.map((item) => item.id),
      }),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => null);
      setStatus(data?.error?.message ?? 'Gagal mengirim post.');
      return;
    }
    setContent('');
    setMarket({
      pair: '',
      timeframe: '',
      direction: '',
      riskPercent: '',
      entryPrice: '',
      stopLoss: '',
      takeProfit: '',
      confidencePercent: '',
    });
    setMediaItems([]);
    setStatus('Postingan terkirim.');
    window.location.reload();
  }

  if (!currentUser) {
    return (
      <section id="telegram-login" className={styles.composer} data-auth="guest" aria-label="Login Telegram member">
        <HertzAvatar className={styles.avatar} name="Guest" />
        <div className={styles.body}>
          <HertzTelegramLogin />
        </div>
      </section>
    );
  }

  return (
    <section className={styles.composer} data-auth="member" aria-label="HERTZ composer">
      <HertzAvatar
        className={styles.avatar}
        src={currentUser.avatarUrl}
        name={currentUser.displayName}
        username={currentUser.username}
      />
      <div className={styles.body}>
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder={currentUser ? 'Kirim jurnal dari Telegram atau tulis setup...' : 'Login Telegram member untuk membuat post'}
          disabled={!currentUser}
          rows={1}
        />
        <div className={styles.controls}>
          <label className={`${styles.uploadButton} ${(!currentUser || uploading || mediaItems.length >= 4) ? styles.disabledUpload : ''}`}>
            <span>+</span>
            <span>Gambar</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              disabled={!currentUser || uploading || mediaItems.length >= 4}
              onChange={(event) => {
                void uploadImages(event.target.files);
                event.currentTarget.value = '';
              }}
            />
          </label>
          {isTradingPost ? (
            <>
              <label className={styles.inlineField}>
                <span>Pair</span>
                <input value={market.pair} onChange={(event) => setMarketField('pair', event.target.value)} placeholder="XAUUSD" disabled={!currentUser} />
              </label>
              <label className={styles.inlineField}>
                <span>TF</span>
                <input value={market.timeframe} onChange={(event) => setMarketField('timeframe', event.target.value)} placeholder="H4" disabled={!currentUser} />
              </label>
              <label className={styles.inlineField}>
                <span>Arah</span>
                <input value={market.direction} onChange={(event) => setMarketField('direction', event.target.value)} placeholder="Buy" disabled={!currentUser} />
              </label>
              <label className={styles.inlineField}>
                <span>Risk</span>
                <input value={market.riskPercent} onChange={(event) => setMarketField('riskPercent', event.target.value)} placeholder="2" inputMode="decimal" disabled={!currentUser} />
              </label>
              <label className={styles.inlineField}>
                <span>Entry</span>
                <input value={market.entryPrice} onChange={(event) => setMarketField('entryPrice', event.target.value)} placeholder="0.00" inputMode="decimal" disabled={!currentUser} />
              </label>
              <label className={styles.inlineField}>
                <span>SL</span>
                <input value={market.stopLoss} onChange={(event) => setMarketField('stopLoss', event.target.value)} placeholder="0.00" inputMode="decimal" disabled={!currentUser} />
              </label>
              <label className={styles.inlineField}>
                <span>TP</span>
                <input value={market.takeProfit} onChange={(event) => setMarketField('takeProfit', event.target.value)} placeholder="0.00" inputMode="decimal" disabled={!currentUser} />
              </label>
              <label className={styles.inlineField}>
                <span>Conf</span>
                <input value={market.confidencePercent} onChange={(event) => setMarketField('confidencePercent', event.target.value)} placeholder="70" inputMode="decimal" disabled={!currentUser} />
              </label>
            </>
          ) : null}
          <Button className={styles.submit} type="button" onClick={submit} disabled={!currentUser || !content.trim()}>
            Posting
          </Button>
        </div>
        {mediaItems.length > 0 ? (
          <div className={styles.mediaQueue} aria-label="Gambar siap diposting">
            {mediaItems.map((item) => (
              <figure key={item.id}>
                {item.url ? <img src={item.url} alt="" /> : null}
                <figcaption>{item.name}</figcaption>
                <button type="button" onClick={() => removeMedia(item.id)} aria-label={`Hapus ${item.name}`}>×</button>
              </figure>
            ))}
          </div>
        ) : null}
        <p className={styles.mediaPolicy}>Posting HERTZ mendukung gambar JPG, PNG, atau WEBP, maksimal 4 file per postingan.</p>
        {status ? <p className={styles.status}>{status}</p> : null}
      </div>
    </section>
  );
}
