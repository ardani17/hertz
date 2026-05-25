'use client';

import { useEffect, useState } from 'react';
import { Plus, X } from 'lucide-react';
import type { MarketContext, MemberSessionUser, HertzPost, HertzPostCategory } from '@shared/types';
import { ComposerMarketFields } from '@/features/hertz/composer/ComposerMarketFields';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/Toast';
import type { HertzFeedFilterPatch, HertzFeedFilters } from '@/lib/hertzFeedFilters';
import { hertzCategoryTabs } from '@/lib/hertzFeedNav';
import { HertzAvatar } from './HertzAvatar';
import { HertzTelegramLogin } from './HertzTelegramLogin';
import styles from './HertzComposer.module.css';

type ComposerCategory = 'trading_room' | 'life_coffee' | 'general';
const ALLOWED_MEDIA_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime']);
interface QueuedMedia {
  id: string;
  name: string;
  type: 'image' | 'video';
  url: string;
}

type CreatePostResponse =
  | { success: true; data: { post: HertzPost } }
  | { success: false; error?: { message?: string } };

function resolveComposerCategory(activeCategory?: HertzPostCategory | string | null): ComposerCategory {
  if (activeCategory === 'trading_room' || activeCategory === 'trading') return 'trading_room';
  if (activeCategory === 'life_coffee' || activeCategory === 'life_story') return 'life_coffee';
  return 'general';
}

function ComposerCategoryChips({
  filters,
  onFilterChange,
}: {
  filters: HertzFeedFilters;
  onFilterChange: (patch: HertzFeedFilterPatch) => void;
}) {
  const activeValue = filters.category ?? null;

  return (
    <nav className={styles.categoryRow} aria-label="Kategori postingan">
      {hertzCategoryTabs.map((tab) => {
        const isActive = (tab.value ?? null) === activeValue;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onFilterChange({ category: tab.value ?? null })}
            className={isActive ? `${styles.categoryChip} ${styles.categoryChipActive}` : styles.categoryChip}
            aria-current={isActive ? 'page' : undefined}
          >
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}

function ComposerForm({
  category,
  filters,
  onFilterChange,
  onPosted,
}: {
  category: ComposerCategory;
  filters: HertzFeedFilters;
  onFilterChange: (patch: HertzFeedFilterPatch) => void;
  onPosted?: (post: HertzPost) => void;
}) {
  const { showToast } = useToast();
  const isTradingPost = category === 'trading_room';
  const [content, setContent] = useState('');
  const [market, setMarket] = useState({
    pair: '',
  });
  const [mediaItems, setMediaItems] = useState<QueuedMedia[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isTradingPost) return;
    setMarket({
      pair: '',
    });
  }, [isTradingPost]);

  function setMarketField(field: keyof typeof market, value: string) {
    setMarket((current) => ({ ...current, [field]: value }));
  }

  function marketPayload(): MarketContext {
    return {
      pair: market.pair.trim() || null,
    };
  }

  async function uploadMedia(files: FileList | null) {
    if (!files?.length) return;
    const nextFiles = Array.from(files).slice(0, Math.max(0, 4 - mediaItems.length));
    if (nextFiles.length === 0) {
      showToast('Maksimal 4 file per post.', 'warning');
      return;
    }

    setUploading(true);
    try {
      for (const file of nextFiles) {
        if (!ALLOWED_MEDIA_TYPES.has(file.type.toLowerCase())) {
          showToast('HERTZ hanya mendukung JPG, PNG, WEBP, MP4, WEBM, atau MOV.', 'warning');
          continue;
        }
        const formData = new FormData();
        formData.append('file', file);
        const response = await fetch('/api/media/upload', { method: 'POST', body: formData });
        const payload = await response.json().catch(() => null);
        if (!response.ok || !payload?.success) {
          throw new Error(payload?.error?.message ?? 'Gagal mengunggah file.');
        }
        const url = typeof payload.data.media.file_url === 'string' ? payload.data.media.file_url : '';
        const type: QueuedMedia['type'] = payload.data.media.media_type === 'video' ? 'video' : 'image';
        setMediaItems((items) => [...items, { id: payload.data.media.id, name: file.name, type, url }].slice(0, 4));
      }
      showToast('File siap dipublish.', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Gagal mengunggah file.', 'error');
    } finally {
      setUploading(false);
    }
  }

  function removeMedia(id: string) {
    setMediaItems((items) => items.filter((item) => item.id !== id));
  }

  async function submit() {
    if (isTradingPost && (!market.pair.trim() || mediaItems.length === 0)) {
      showToast('Pair dan lampiran wajib untuk Trading Room.', 'warning');
      return;
    }
    setSubmitting(true);
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
    setSubmitting(false);
    const payload = (await response.json().catch(() => null)) as CreatePostResponse | null;
    if (!response.ok || !payload?.success) {
      showToast(payload && !payload.success ? payload.error?.message ?? 'Gagal mengirim post.' : 'Gagal mengirim post.', 'error');
      return;
    }
    setContent('');
    setMarket({
      pair: '',
    });
    setMediaItems([]);
    showToast('Postingan terkirim.', 'success');
    onPosted?.(payload.data.post);
  }

  return (
    <>
      <ComposerCategoryChips filters={filters} onFilterChange={onFilterChange} />
      <textarea
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder="Kirim jurnal dari Telegram atau tulis setup..."
        rows={1}
      />
      {isTradingPost ? (
        <div className={styles.marketFields}>
          <ComposerMarketFields market={market} disabled={false} onChange={setMarketField} />
        </div>
      ) : null}
      <div className={styles.controls}>
        <label className={`${styles.uploadButton} ${uploading || mediaItems.length >= 4 ? styles.disabledUpload : ''}`}>
          <span>+</span>
          <span>Lampirkan file</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime"
            multiple
            disabled={uploading || mediaItems.length >= 4}
            onChange={(event) => {
              void uploadMedia(event.target.files);
              event.currentTarget.value = '';
            }}
          />
        </label>
        <Button
          className={styles.submit}
          type="button"
          onClick={submit}
          disabled={(isTradingPost ? (!market.pair.trim() || mediaItems.length === 0) : !content.trim()) || submitting}
        >
          {submitting ? 'Mengirim...' : 'Posting'}
        </Button>
      </div>
      {mediaItems.length > 0 ? (
        <div className={styles.mediaQueue} aria-label="File siap diposting">
          {mediaItems.map((item) => (
            <figure key={item.id}>
              {item.url && item.type === 'image' ? <img src={item.url} alt="" loading="lazy" decoding="async" width={96} height={96} /> : null}
              {item.url && item.type === 'video' ? <video src={item.url} controls preload="metadata" /> : null}
              <figcaption>{item.name}</figcaption>
              <button type="button" onClick={() => removeMedia(item.id)} aria-label={`Hapus ${item.name}`}>
                ×
              </button>
            </figure>
          ))}
        </div>
      ) : null}
      <p className={styles.mediaPolicy}>JPG, PNG, WEBP, MP4, WEBM, MOV — maks. 4 file.</p>
    </>
  );
}

export function HertzComposer({
  currentUser,
  filters,
  onFilterChange,
  onPosted,
}: {
  currentUser: MemberSessionUser | null;
  filters: HertzFeedFilters;
  onFilterChange: (patch: HertzFeedFilterPatch) => void;
  onPosted?: (post: HertzPost) => void;
}) {
  const category = resolveComposerCategory(filters.category);
  const [composeOpen, setComposeOpen] = useState(false);

  useEffect(() => {
    if (!composeOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [composeOpen]);

  useEffect(() => {
    if (!composeOpen) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setComposeOpen(false);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [composeOpen]);

  if (!currentUser) {
    return (
      <>
        <section
          id="telegram-login"
          className={`${styles.composer} ${styles.desktopComposer}`}
          data-auth="guest"
          aria-label="Login Telegram member"
        >
          <HertzAvatar className={styles.avatar} name="Guest" />
          <div className={styles.body}>
            <HertzTelegramLogin />
          </div>
        </section>
        <button
          type="button"
          className={styles.composeFab}
          aria-label="Login untuk membuat postingan"
          onClick={() => setComposeOpen(true)}
        >
          <Plus aria-hidden="true" strokeWidth={2.75} />
        </button>
        {composeOpen ? (
          <div
            className={styles.sheetBackdrop}
            role="presentation"
            onClick={() => setComposeOpen(false)}
          >
            <section
              className={styles.composeSheet}
              role="dialog"
              aria-modal="true"
              aria-label="Login HERTZ"
              onClick={(event) => event.stopPropagation()}
            >
              <header className={styles.sheetHeader}>
                <h2>Postingan baru</h2>
                <button
                  type="button"
                  className={styles.sheetClose}
                  aria-label="Tutup"
                  onClick={() => setComposeOpen(false)}
                >
                  <X aria-hidden="true" />
                </button>
              </header>
              <div className={styles.sheetGuestBody}>
                <HertzTelegramLogin />
              </div>
            </section>
          </div>
        ) : null}
      </>
    );
  }

  const composerPanel = (
    <section className={styles.composer} data-auth="member" aria-label="Composer HERTZ">
      <HertzAvatar
        className={styles.avatar}
        src={currentUser.avatarUrl}
        name={currentUser.displayName}
        username={currentUser.username}
      />
      <div className={styles.body}>
        <ComposerForm category={category} filters={filters} onFilterChange={onFilterChange} onPosted={onPosted} />
      </div>
    </section>
  );

  return (
    <>
      <div className={styles.desktopComposer}>{composerPanel}</div>

      <button
        type="button"
        className={styles.composeFab}
        aria-label="Buat postingan baru"
        onClick={() => setComposeOpen(true)}
      >
        <Plus aria-hidden="true" strokeWidth={2.75} />
      </button>

      {composeOpen ? (
        <div
          className={styles.sheetBackdrop}
          role="presentation"
          onClick={() => setComposeOpen(false)}
        >
          <section
            className={styles.composeSheet}
            role="dialog"
            aria-modal="true"
            aria-label="Buat postingan HERTZ"
            onClick={(event) => event.stopPropagation()}
          >
            <header className={styles.sheetHeader}>
              <h2>Postingan baru</h2>
              <button
                type="button"
                className={styles.sheetClose}
                aria-label="Tutup"
                onClick={() => setComposeOpen(false)}
              >
                <X aria-hidden="true" />
              </button>
            </header>
            <div className={styles.sheetBody}>
              <HertzAvatar
                className={styles.sheetAvatar}
                src={currentUser.avatarUrl}
                name={currentUser.displayName}
                username={currentUser.username}
              />
              <div className={styles.sheetForm}>
                <ComposerForm
                  category={category}
                  filters={filters}
                  onFilterChange={onFilterChange}
                  onPosted={(post) => {
                    onPosted?.(post);
                    setComposeOpen(false);
                  }}
                />
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
