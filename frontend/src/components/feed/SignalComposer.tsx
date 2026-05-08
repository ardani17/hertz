'use client';

import { useState } from 'react';
import type { MemberSessionUser } from '@shared/types';
import { ImageIcon, PlusIcon } from './SignalIcons';
import { SignalTelegramLogin } from './SignalTelegramLogin';
import styles from './SignalComposer.module.css';

const categories = [
  { value: 'trading', label: 'Trading Room' },
  { value: 'life_story', label: 'Life & Coffee' },
  { value: 'general', label: 'General' },
] as const;

export function SignalComposer({ currentUser }: { currentUser: MemberSessionUser | null }) {
  const [category, setCategory] = useState<'trading' | 'life_story' | 'general'>('trading');
  const [content, setContent] = useState('');
  const [pair, setPair] = useState('');
  const [risk, setRisk] = useState('');
  const [mediaIds, setMediaIds] = useState<string[]>([]);
  const [mediaNames, setMediaNames] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function uploadImages(files: FileList | null) {
    if (!currentUser || !files?.length) return;
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
    setStatus('Mengirim...');
    const response = await fetch('/api/feed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category,
        content,
        market: category === 'trading' ? {
          pair: pair || null,
          riskPercent: risk ? Number(risk) : null,
        } : null,
        mediaIds,
      }),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => null);
      setStatus(data?.error?.message ?? 'Gagal mengirim post.');
      return;
    }
    setContent('');
    setPair('');
    setRisk('');
    setMediaIds([]);
    setMediaNames([]);
    setStatus('Published.');
    window.location.reload();
  }

  if (!currentUser) {
    return (
      <section id="telegram-login" className={styles.composer} data-auth="guest" aria-label="Login Telegram member">
        <div className={styles.avatar}>G</div>
        <div className={styles.body}>
          <SignalTelegramLogin />
        </div>
      </section>
    );
  }

  return (
    <section className={styles.composer} data-auth="member" aria-label="Signal composer">
      <div className={styles.avatar}>{(currentUser?.displayName ?? 'G').slice(0, 1).toUpperCase()}</div>
      <div className={styles.body}>
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder={currentUser ? 'Kirim jurnal dari Telegram atau tulis setup...' : 'Login Telegram member untuk membuat post'}
          disabled={!currentUser}
          rows={3}
        />
        <div className={styles.controls}>
          <div className={styles.segments} role="tablist" aria-label="Category">
            {categories.map((item) => (
              <button
                key={item.value}
                type="button"
                className={category === item.value ? styles.activeSegment : ''}
                onClick={() => setCategory(item.value)}
                disabled={!currentUser}
              >
                {item.label}
              </button>
            ))}
          </div>
          {category === 'trading' ? (
            <div className={styles.marketInputs}>
              <label>
                <span>Pair</span>
                <input value={pair} onChange={(event) => setPair(event.target.value)} placeholder="XAUUSD" disabled={!currentUser} />
              </label>
              <label>
                <span>Risk</span>
                <input value={risk} onChange={(event) => setRisk(event.target.value)} placeholder="1%" inputMode="decimal" disabled={!currentUser} />
              </label>
            </div>
          ) : null}
          <label className={`${styles.uploadButton} ${(!currentUser || uploading || mediaIds.length >= 4) ? styles.disabledUpload : ''}`}>
            <ImageIcon />
            Chart
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
          <button className={styles.submit} type="button" onClick={submit} disabled={!currentUser || !content.trim()}>
            <PlusIcon />
            Publish
          </button>
        </div>
        {mediaNames.length > 0 ? (
          <div className={styles.mediaQueue} aria-label="Uploaded images">
            {mediaNames.map((name, index) => (
              <span key={`${name}-${index}`}>{name}</span>
            ))}
          </div>
        ) : null}
        {status ? <p className={styles.status}>{status}</p> : null}
      </div>
    </section>
  );
}
