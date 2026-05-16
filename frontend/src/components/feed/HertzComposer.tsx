'use client';

import { useEffect, useState } from 'react';
import type { MarketContext, MemberSessionUser, HertzPostCategory } from '@shared/types';
import { Button } from '@/components/ui/button';
import { HertzAvatar } from './HertzAvatar';
import { HertzTelegramLogin } from './HertzTelegramLogin';
import styles from './HertzComposer.module.css';

type ComposerCategory = 'trading_room' | 'life_coffee' | 'general';

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
  const [mediaIds, setMediaIds] = useState<string[]>([]);
  const [mediaNames, setMediaNames] = useState<string[]>([]);
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
    setMediaIds([]);
    setMediaNames([]);
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
    if (!currentUser || !isTradingPost || !files?.length) return;
    const nextFiles = Array.from(files).slice(0, Math.max(0, 4 - mediaIds.length));
    if (nextFiles.length === 0) {
      setStatus('Maksimal 4 gambar per post.');
      return;
    }

    setUploading(true);
    setStatus('Mengunggah gambar...');
    try {
      const uploadedIds: string[] = [];
      const uploadedNames: string[] = [];
      for (const file of nextFiles) {
        if (!file.type.startsWith('image/')) {
          setStatus('Upload web phase awal hanya mendukung gambar.');
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
        uploadedNames.push(file.name);
      }
      setMediaIds((items) => [...items, ...uploadedIds].slice(0, 4));
      setMediaNames((items) => [...items, ...uploadedNames].slice(0, 4));
      setStatus(uploadedIds.length > 0 ? 'Gambar siap dipublish.' : null);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Gagal mengunggah gambar.');
    } finally {
      setUploading(false);
    }
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
        mediaIds: isTradingPost ? mediaIds : [],
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
    setMediaIds([]);
    setMediaNames([]);
    setStatus('Published.');
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
          {isTradingPost ? (
            <>
              <label className={`${styles.uploadButton} ${(!currentUser || uploading || mediaIds.length >= 4) ? styles.disabledUpload : ''}`}>
                <span>+</span>
                <span>Chart</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  disabled={!currentUser || uploading || mediaIds.length >= 4}
                  onChange={(event) => {
                    void uploadImages(event.target.files);
                    event.currentTarget.value = '';
                  }}
                />
              </label>
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
            Publish
          </Button>
        </div>
        {mediaNames.length > 0 ? (
          <div className={styles.mediaQueue} aria-label="Uploaded images">
            {mediaNames.map((name, index) => (
              <span key={`${name}-${index}`}>{name}</span>
            ))}
          </div>
        ) : null}
        {isTradingPost ? <p className={styles.mediaPolicy}>Chart trading mendukung gambar saja, maksimal 4 file per postingan.</p> : null}
        {status ? <p className={styles.status}>{status}</p> : null}
      </div>
    </section>
  );
}
