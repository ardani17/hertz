'use client';

import { useState } from 'react';
import type { MemberSessionUser } from '@shared/types';
import { Button } from '@/components/ui/button';
import { SignalTelegramLogin } from './SignalTelegramLogin';
import styles from './SignalComposer.module.css';

function initials(name: string) {
  if (name === 'Ardani Trader') return 'AR';
  return name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}

export function SignalComposer({ currentUser }: { currentUser: MemberSessionUser | null }) {
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
    if (!pair.trim() || !risk.trim()) {
      setStatus('Pair dan risk wajib untuk Trading Room.');
      return;
    }
    setStatus('Mengirim...');
    const response = await fetch('/api/hertz/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category: 'trading_room',
        content,
        market: {
          pair: pair || null,
          riskPercent: risk ? Number(risk) : null,
        },
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
    <section className={styles.composer} data-auth="member" aria-label="HERTZ composer">
      <div className={styles.avatar}>{initials(currentUser.displayName)}</div>
      <div className={styles.body}>
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder={currentUser ? 'Kirim jurnal dari Telegram atau tulis setup...' : 'Login Telegram member untuk membuat post'}
          disabled={!currentUser}
          rows={1}
        />
        <div className={styles.controls}>
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
            <span>+</span>
            <input value={pair} onChange={(event) => setPair(event.target.value)} placeholder="Pair" disabled={!currentUser} />
          </label>
          <label className={styles.inlineField}>
            <span>+</span>
            <input value={risk} onChange={(event) => setRisk(event.target.value)} placeholder="Risk" inputMode="decimal" disabled={!currentUser} />
          </label>
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
        {status ? <p className={styles.status}>{status}</p> : null}
      </div>
    </section>
  );
}
