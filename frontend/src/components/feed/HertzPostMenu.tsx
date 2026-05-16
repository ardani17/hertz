'use client';

import { useState, type FormEvent } from 'react';
import type { MarketContext, MemberSessionUser, HertzPost } from '@shared/types';
import { Button } from '@/components/ui/button';
import { HertzDeletePostDialog } from './HertzDeletePostDialog';
import { MoreIcon } from './HertzIcons';
import { buildCanonicalPostUrl } from './HertzShareSheet';
import styles from './HertzPostMenu.module.css';

export function HertzPostMenu({ post, currentUser }: { post: HertzPost; currentUser: MemberSessionUser | null }) {
  const [open, setOpen] = useState(false);
  const [menuUser, setMenuUser] = useState<MemberSessionUser | null>(currentUser);
  const [authChecked, setAuthChecked] = useState(Boolean(currentUser));
  const [checkingAuth, setCheckingAuth] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [marketOpen, setMarketOpen] = useState(false);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState('misleading');
  const [reportDetails, setReportDetails] = useState('');
  const [editContent, setEditContent] = useState(post.content.text);
  const [quoteContent, setQuoteContent] = useState('');
  const [market, setMarket] = useState({
    pair: post.market?.pair ?? '',
    timeframe: post.market?.timeframe ?? '',
    riskPercent: post.market?.riskPercent?.toString() ?? '',
    direction: post.market?.direction ?? '',
    entryZone: post.market?.entryZone ?? '',
    entryPrice: post.market?.entryPrice?.toString() ?? '',
    stopLoss: post.market?.stopLoss?.toString() ?? '',
    takeProfit: post.market?.takeProfit?.toString() ?? '',
    confidencePercent: post.market?.confidencePercent?.toString() ?? '',
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

  function toggleMenu() {
    setOpen((value) => {
      const next = !value;
      if (next) void refreshMenuUser();
      return next;
    });
  }

  async function copyLink() {
    await navigator.clipboard?.writeText(buildCanonicalPostUrl(post.shortId, window.location.origin));
    setMessage('Link disalin.');
    setOpen(false);
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
      setMessage(data?.error?.message ?? 'Gagal menghapus post.');
      return;
    }
    window.location.reload();
  }

  async function hidePost() {
    const response = await fetch(`/api/admin/hertz/posts/${post.id}/hide`, { method: 'POST' });
    if (!response.ok) {
      const data = await response.json().catch(() => null);
      setMessage(data?.error?.message ?? 'Gagal menyembunyikan post.');
      return;
    }
    window.location.reload();
  }

  async function submitEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = editContent.trim();
    if (!content) {
      setMessage('Konten tidak boleh kosong.');
      return;
    }
    const response = await fetch(`/api/hertz/posts/${post.shortId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => null);
      setMessage(data?.error?.message ?? 'Post gagal diedit.');
      return;
    }
    window.location.reload();
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
      setMessage(data?.error?.message ?? 'Report gagal dikirim.');
      return;
    }
    closePanels();
    setReportDetails('');
    setOpen(false);
    setMessage('Report masuk ke review admin.');
  }

  async function submitQuote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = quoteContent.trim();
    if (!content) {
      setMessage('Konten quote tidak boleh kosong.');
      return;
    }
    const response = await fetch(`/api/hertz/posts/${post.shortId}/repost`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'quote', content }),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => null);
      setMessage(data?.error?.message ?? 'Quote gagal dibuat.');
      return;
    }
    setQuoteContent('');
    window.location.reload();
  }

  async function submitMarket(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const numberOrNull = (value: string) => {
      const trimmed = value.trim();
      if (!trimmed) return null;
      const parsed = Number(trimmed);
      return Number.isFinite(parsed) ? parsed : null;
    };
    const payload: MarketContext = {
      pair: market.pair.trim() || null,
      timeframe: market.timeframe.trim() || null,
      riskPercent: numberOrNull(market.riskPercent),
      direction: market.direction.trim() || null,
      entryZone: market.entryZone.trim() || null,
      entryPrice: numberOrNull(market.entryPrice),
      stopLoss: numberOrNull(market.stopLoss),
      takeProfit: numberOrNull(market.takeProfit),
      confidencePercent: numberOrNull(market.confidencePercent),
    };
    const response = await fetch(`/api/hertz/posts/${post.shortId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ market: payload }),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => null);
      setMessage(data?.error?.message ?? 'Metadata market gagal disimpan.');
      return;
    }
    window.location.reload();
  }

  function setMarketField(field: keyof typeof market, value: string) {
    setMarket((current) => ({ ...current, [field]: value }));
  }

  return (
    <div className={styles.wrap} data-menu-open={open ? "true" : undefined}>
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
        <div className={styles.menu}>
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
      {reportOpen ? (
        <div className={styles.modalBackdrop} role="presentation" onClick={(event) => { event.stopPropagation(); closePanels(); }}>
          <form className={styles.panel} role="dialog" aria-modal="true" aria-labelledby={`report-title-${post.id}`} onSubmit={submitReport} onClick={(event) => event.stopPropagation()}>
            <div className={styles.panelHeader}>
              <h2 id={`report-title-${post.id}`}>Laporkan postingan</h2>
              <Button type="button" variant="ghost" size="icon-sm" className={styles.closeButton} onClick={closePanels} aria-label="Tutup laporan">×</Button>
            </div>
            <label htmlFor={`report-reason-${post.id}`}>Alasan report</label>
            <select id={`report-reason-${post.id}`} value={reportReason} onChange={(event) => setReportReason(event.target.value)}>
              <option value="misleading">Misleading</option>
              <option value="spam">Spam</option>
              <option value="abusive">Abusive</option>
              <option value="off_topic">Off topic</option>
              <option value="other">Other</option>
            </select>
            <textarea value={reportDetails} onChange={(event) => setReportDetails(event.target.value)} placeholder="Detail opsional" rows={3} />
            <div className={styles.panelActions}>
              <Button type="button" variant="ghost" onClick={closePanels}>Batal</Button>
              <Button type="submit">Kirim laporan</Button>
            </div>
          </form>
        </div>
      ) : null}
      {quoteOpen ? (
        <div className={styles.modalBackdrop} role="presentation" onClick={(event) => { event.stopPropagation(); closePanels(); }}>
          <form className={styles.panel} role="dialog" aria-modal="true" aria-labelledby={`quote-title-${post.id}`} onSubmit={submitQuote} onClick={(event) => event.stopPropagation()}>
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
          <form className={styles.panel} role="dialog" aria-modal="true" aria-labelledby={`edit-title-${post.id}`} onSubmit={submitEdit} onClick={(event) => event.stopPropagation()}>
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
          <form className={`${styles.panel} ${styles.marketPanel}`} role="dialog" aria-modal="true" aria-labelledby={`market-title-${post.id}`} onSubmit={submitMarket} onClick={(event) => event.stopPropagation()}>
            <div className={styles.panelHeader}>
              <h2 id={`market-title-${post.id}`}>Edit metadata market</h2>
              <Button type="button" variant="ghost" size="icon-sm" className={styles.closeButton} onClick={closePanels} aria-label="Tutup metadata market">×</Button>
            </div>
            <label>Pair<input value={market.pair} onChange={(event) => setMarketField('pair', event.target.value)} placeholder="XAUUSD" /></label>
            <label>Timeframe<input value={market.timeframe} onChange={(event) => setMarketField('timeframe', event.target.value)} placeholder="H4" /></label>
            <label>Risk %<input value={market.riskPercent} onChange={(event) => setMarketField('riskPercent', event.target.value)} inputMode="decimal" /></label>
            <label>Direction<input value={market.direction} onChange={(event) => setMarketField('direction', event.target.value)} placeholder="Long / Short" /></label>
            <label>Entry zone<input value={market.entryZone} onChange={(event) => setMarketField('entryZone', event.target.value)} /></label>
            <label>Entry<input value={market.entryPrice} onChange={(event) => setMarketField('entryPrice', event.target.value)} inputMode="decimal" /></label>
            <label>SL<input value={market.stopLoss} onChange={(event) => setMarketField('stopLoss', event.target.value)} inputMode="decimal" /></label>
            <label>TP<input value={market.takeProfit} onChange={(event) => setMarketField('takeProfit', event.target.value)} inputMode="decimal" /></label>
            <label>Confidence %<input value={market.confidencePercent} onChange={(event) => setMarketField('confidencePercent', event.target.value)} inputMode="decimal" /></label>
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
      {message ? <p className={styles.message}>{message}</p> : null}
    </div>
  );
}
