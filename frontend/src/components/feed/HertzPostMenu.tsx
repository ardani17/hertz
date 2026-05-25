'use client';

import { useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import type { MarketContext, MemberSessionUser, HertzPost } from '@shared/types';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/Toast';
import { trapFocusWithin } from '@/lib/focusTrap';
import { refreshPreserveScroll } from '@/lib/hertzRefresh';
import { useDismissMenu } from '@/lib/useDismissMenu';
import { ReportDialog } from '@/features/hertz/post-menu/ReportDialog';
import { HertzDeletePostDialog } from './HertzDeletePostDialog';
import { MoreIcon } from './HertzIcons';
import { buildCanonicalPostUrl, copyShareLinkWithFeedback } from '@/lib/shareLink';
import styles from './HertzPostMenu.module.css';

export function HertzPostMenu({ post, currentUser }: { post: HertzPost; currentUser: MemberSessionUser | null }) {
  const router = useRouter();
  const { showToast } = useToast();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [menuUser, setMenuUser] = useState<MemberSessionUser | null>(currentUser);
  const [authChecked, setAuthChecked] = useState(Boolean(currentUser));
  const [checkingAuth, setCheckingAuth] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [marketOpen, setMarketOpen] = useState(false);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [reportReason, setReportReason] = useState('misleading');
  const [reportDetails, setReportDetails] = useState('');
  const [editContent, setEditContent] = useState(post.content.text);
  const [quoteContent, setQuoteContent] = useState('');
  const [market, setMarket] = useState({
    pair: post.market?.pair ?? '',
  });
  const effectiveUser = currentUser ?? menuUser;
  const sameAuthorIdentity = Boolean(effectiveUser && (
    effectiveUser.id === post.author.id
    || (effectiveUser.username && post.author.username && effectiveUser.username === post.author.username)
    || effectiveUser.displayName === post.author.name
  ));
  const isOwnerOrAdmin = Boolean(effectiveUser && (sameAuthorIdentity || effectiveUser.role === 'admin'));
  const canReport = Boolean(effectiveUser);
  const canQuote = Boolean(effectiveUser);
  const canEdit = Boolean(post.viewer.canEdit || isOwnerOrAdmin);
  const canDelete = Boolean(post.viewer.canDelete || isOwnerOrAdmin);
  const isAdmin = effectiveUser?.role === 'admin';
  const canEditMarket = Boolean(isAdmin || (canEdit && (post.category === 'trading_room' || post.category === 'trading')));

  async function refreshMenuUser() {
    if (currentUser || authChecked || checkingAuth) return;
    setCheckingAuth(true);
    try {
      const response = await fetch('/api/auth/me', { credentials: 'same-origin' });
      const payload = await response.json().catch(() => null);
      const user = payload?.success ? payload.data?.user ?? null : null;
      setMenuUser(user);
    } finally {
      setAuthChecked(true);
      setCheckingAuth(false);
    }
  }

  function closeMenu() {
    setOpen(false);
  }

  useDismissMenu(open, closeMenu, wrapRef);

  function toggleMenu() {
    setOpen((value) => {
      const next = !value;
      if (next) void refreshMenuUser();
      return next;
    });
  }

  async function copyLink() {
    await copyShareLinkWithFeedback(buildCanonicalPostUrl(post.shortId, window.location.origin), showToast);
    closeMenu();
  }

  function closePanels() {
    setReportOpen(false);
    setEditOpen(false);
    setMarketOpen(false);
    setQuoteOpen(false);
    setDeleteOpen(false);
  }

  async function deleteOwnPost() {
    const response = await fetch(`/api/hertz/posts/${post.shortId}`, { method: 'DELETE' });
    if (!response.ok) {
      const data = await response.json().catch(() => null);
      showToast(data?.error?.message ?? 'Gagal menghapus post.', 'error');
      return;
    }
    showToast('Postingan dihapus.', 'success');
    closePanels();
    refreshPreserveScroll(router);
  }

  async function hidePost() {
    const response = await fetch(`/api/admin/hertz/posts/${post.id}/hide`, { method: 'POST' });
    if (!response.ok) {
      const data = await response.json().catch(() => null);
      showToast(data?.error?.message ?? 'Gagal menyembunyikan post.', 'error');
      return;
    }
    showToast('Postingan disembunyikan.', 'success');
    closePanels();
    refreshPreserveScroll(router);
  }

  async function submitEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = editContent.trim();
    if (!content) {
      showToast('Konten tidak boleh kosong.', 'warning');
      return;
    }
    const response = await fetch(`/api/hertz/posts/${post.shortId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => null);
      showToast(data?.error?.message ?? 'Post gagal diedit.', 'error');
      return;
    }
    showToast('Postingan diperbarui.', 'success');
    closePanels();
    refreshPreserveScroll(router);
  }

  async function submitReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch(`/api/hertz/posts/${post.shortId}/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: reportReason, details: reportDetails }),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => null);
      showToast(data?.error?.message ?? 'Laporan gagal dikirim.', 'error');
      return;
    }
    closePanels();
    setReportDetails('');
    closeMenu();
    showToast('Laporan masuk ke review admin.', 'success');
  }

  async function submitQuote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = quoteContent.trim();
    if (!content) {
      showToast('Konten quote tidak boleh kosong.', 'warning');
      return;
    }
    const response = await fetch(`/api/hertz/posts/${post.shortId}/repost`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'quote', content }),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => null);
      showToast(data?.error?.message ?? 'Quote gagal dibuat.', 'error');
      return;
    }
    setQuoteContent('');
    showToast('Quote diposting.', 'success');
    closePanels();
    refreshPreserveScroll(router);
  }

  async function submitMarket(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const pair = market.pair.trim();
    if (!pair) {
      showToast('Pair wajib diisi untuk Trading Room.', 'warning');
      return;
    }
    const payload: MarketContext = {
      pair,
    };
    const response = await fetch(`/api/hertz/posts/${post.shortId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ market: payload }),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => null);
      showToast(data?.error?.message ?? 'Metadata market gagal disimpan.', 'error');
      return;
    }
    showToast('Metadata market disimpan.', 'success');
    closePanels();
    refreshPreserveScroll(router);
  }

  function setMarketField(field: keyof typeof market, value: string) {
    setMarket((current) => ({ ...current, [field]: value }));
  }

  return (
    <div ref={wrapRef} className={styles.wrap} data-menu-open={open ? 'true' : undefined}>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className={styles.trigger}
        onClick={toggleMenu}
        aria-label="Aksi postingan"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <MoreIcon />
      </Button>
      {open ? (
        <div className={styles.menu} role="menu" onKeyDown={(event) => trapFocusWithin(event.currentTarget, event)}>
          <Button type="button" variant="ghost" size="sm" onClick={copyLink}>Salin link</Button>
          {checkingAuth ? <Button type="button" variant="ghost" size="sm" disabled>Cek login...</Button> : null}
          {canQuote ? <Button type="button" variant="ghost" size="sm" onClick={() => { closePanels(); setQuoteOpen(true); setOpen(false); }}>Quote postingan</Button> : null}
          {canReport ? <Button type="button" variant="ghost" size="sm" onClick={() => { closePanels(); setReportOpen(true); setOpen(false); }}>Laporkan</Button> : null}
          {canEdit ? <Button type="button" variant="ghost" size="sm" onClick={() => { closePanels(); setEditOpen(true); setOpen(false); }}>Edit postingan</Button> : null}
          {canEditMarket ? <Button type="button" variant="ghost" size="sm" onClick={() => { closePanels(); setMarketOpen(true); setOpen(false); }}>Edit metadata market</Button> : null}
          {canDelete ? <Button type="button" variant="ghost" size="sm" onClick={() => { closePanels(); setDeleteOpen(true); setOpen(false); }}>Hapus postingan</Button> : null}
          {isAdmin ? <Button type="button" variant="ghost" size="sm" onClick={hidePost}>Sembunyikan postingan</Button> : null}
        </div>
      ) : null}
      <ReportDialog
        postId={post.id}
        open={reportOpen}
        reason={reportReason}
        details={reportDetails}
        onReasonChange={setReportReason}
        onDetailsChange={setReportDetails}
        onClose={closePanels}
        onSubmit={submitReport}
      />
      {quoteOpen ? (
        <div className={styles.modalBackdrop} role="presentation" onClick={(event) => { event.stopPropagation(); closePanels(); }}>
          <form className={styles.panel} role="dialog" aria-modal="true" aria-labelledby={`quote-title-${post.id}`} onSubmit={submitQuote} onKeyDown={(event) => trapFocusWithin(event.currentTarget, event)} onClick={(event) => event.stopPropagation()}>
            <div className={styles.panelHeader}>
              <h2 id={`quote-title-${post.id}`}>Quote postingan</h2>
              <Button type="button" variant="ghost" size="icon-sm" className={styles.closeButton} onClick={closePanels} aria-label="Tutup quote">×</Button>
            </div>
            <label htmlFor={`quote-post-${post.id}`}>Komentar quote</label>
            <textarea id={`quote-post-${post.id}`} value={quoteContent} onChange={(event) => setQuoteContent(event.target.value)} rows={5} maxLength={4000} />
            <div className={styles.panelActions}>
              <Button type="button" variant="ghost" onClick={closePanels}>Batal</Button>
              <Button type="submit">Posting quote</Button>
            </div>
          </form>
        </div>
      ) : null}
      {editOpen ? (
        <div className={styles.modalBackdrop} role="presentation" onClick={(event) => { event.stopPropagation(); closePanels(); }}>
          <form className={styles.panel} role="dialog" aria-modal="true" aria-labelledby={`edit-title-${post.id}`} onSubmit={submitEdit} onKeyDown={(event) => trapFocusWithin(event.currentTarget, event)} onClick={(event) => event.stopPropagation()}>
            <div className={styles.panelHeader}>
              <h2 id={`edit-title-${post.id}`}>Edit postingan</h2>
              <Button type="button" variant="ghost" size="icon-sm" className={styles.closeButton} onClick={closePanels} aria-label="Tutup edit">×</Button>
            </div>
            <label htmlFor={`edit-post-${post.id}`}>Konten</label>
            <textarea id={`edit-post-${post.id}`} value={editContent} onChange={(event) => setEditContent(event.target.value)} rows={7} maxLength={12000} />
            <div className={styles.panelActions}>
              <Button type="button" variant="ghost" onClick={closePanels}>Batal</Button>
              <Button type="submit">Simpan</Button>
            </div>
          </form>
        </div>
      ) : null}
      {marketOpen ? (
        <div className={styles.modalBackdrop} role="presentation" onClick={(event) => { event.stopPropagation(); closePanels(); }}>
          <form className={`${styles.panel} ${styles.marketPanel}`} role="dialog" aria-modal="true" aria-labelledby={`market-title-${post.id}`} onSubmit={submitMarket} onKeyDown={(event) => trapFocusWithin(event.currentTarget, event)} onClick={(event) => event.stopPropagation()}>
            <div className={styles.panelHeader}>
              <h2 id={`market-title-${post.id}`}>Edit metadata market</h2>
              <Button type="button" variant="ghost" size="icon-sm" className={styles.closeButton} onClick={closePanels} aria-label="Tutup metadata market">×</Button>
            </div>
            <label>Pair<input value={market.pair} onChange={(event) => setMarketField('pair', event.target.value)} placeholder="XAUUSD" /></label>
            <div className={styles.panelActions}>
              <Button type="button" variant="ghost" onClick={closePanels}>Batal</Button>
              <Button type="submit">Simpan market</Button>
            </div>
          </form>
        </div>
      ) : null}
      {deleteOpen ? (
        <HertzDeletePostDialog
          postText={post.content.text}
          onCancel={closePanels}
          onConfirm={deleteOwnPost}
        />
      ) : null}
    </div>
  );
}
