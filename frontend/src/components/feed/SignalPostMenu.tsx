'use client';

import { useState, type FormEvent } from 'react';
import type { MarketContext, MemberSessionUser, SignalPost } from '@shared/types';
import { Button } from '@/components/ui/button';
import { MoreIcon } from './SignalIcons';
import styles from './SignalPostMenu.module.css';

export function SignalPostMenu({ post, currentUser }: { post: SignalPost; currentUser: MemberSessionUser | null }) {
  const [open, setOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [marketOpen, setMarketOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState('misleading');
  const [reportDetails, setReportDetails] = useState('');
  const [editContent, setEditContent] = useState(post.content.text);
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

  async function copyLink() {
    await navigator.clipboard?.writeText(`${window.location.origin}/hertz/post/${post.shortId}`);
    setMessage('Link disalin.');
    setOpen(false);
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
    setReportOpen(false);
    setReportDetails('');
    setOpen(false);
    setMessage('Report masuk ke review admin.');
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
    <div className={styles.wrap}>
      <Button type="button" variant="ghost" size="icon-sm" className={styles.trigger} onClick={() => setOpen((value) => !value)} aria-label="Post actions">
        <MoreIcon />
      </Button>
      {open ? (
        <div className={styles.menu}>
          <Button type="button" variant="ghost" size="sm" onClick={copyLink}>Copy link</Button>
          {currentUser ? <Button type="button" variant="ghost" size="sm" onClick={() => { setReportOpen((value) => !value); setMarketOpen(false); setEditOpen(false); }}>Report</Button> : null}
          {post.viewer.canEdit ? <Button type="button" variant="ghost" size="sm" onClick={() => { setEditOpen((value) => !value); setReportOpen(false); setMarketOpen(false); }}>Edit post</Button> : null}
          {currentUser?.role === 'admin' ? <Button type="button" variant="ghost" size="sm" onClick={() => { setMarketOpen((value) => !value); setReportOpen(false); setEditOpen(false); }}>Edit market metadata</Button> : null}
          {post.viewer.canDelete ? <Button type="button" variant="ghost" size="sm" onClick={deleteOwnPost}>Delete post</Button> : null}
          {currentUser?.role === 'admin' ? <Button type="button" variant="ghost" size="sm" onClick={hidePost}>Hide post</Button> : null}
        </div>
      ) : null}
      {reportOpen ? (
        <form className={styles.panel} onSubmit={submitReport}>
          <label htmlFor={`report-reason-${post.id}`}>Alasan report</label>
          <select id={`report-reason-${post.id}`} value={reportReason} onChange={(event) => setReportReason(event.target.value)}>
            <option value="misleading">Misleading</option>
            <option value="spam">Spam</option>
            <option value="abusive">Abusive</option>
            <option value="off_topic">Off topic</option>
            <option value="other">Other</option>
          </select>
          <textarea value={reportDetails} onChange={(event) => setReportDetails(event.target.value)} placeholder="Detail opsional" rows={3} />
          <Button type="submit">Submit report</Button>
        </form>
      ) : null}
      {editOpen ? (
        <form className={styles.panel} onSubmit={submitEdit}>
          <label htmlFor={`edit-post-${post.id}`}>Edit post</label>
          <textarea id={`edit-post-${post.id}`} value={editContent} onChange={(event) => setEditContent(event.target.value)} rows={5} maxLength={12000} />
          <Button type="submit">Save post</Button>
        </form>
      ) : null}
      {marketOpen ? (
        <form className={`${styles.panel} ${styles.marketPanel}`} onSubmit={submitMarket}>
          <label>Pair<input value={market.pair} onChange={(event) => setMarketField('pair', event.target.value)} placeholder="XAUUSD" /></label>
          <label>Timeframe<input value={market.timeframe} onChange={(event) => setMarketField('timeframe', event.target.value)} placeholder="H4" /></label>
          <label>Risk %<input value={market.riskPercent} onChange={(event) => setMarketField('riskPercent', event.target.value)} inputMode="decimal" /></label>
          <label>Direction<input value={market.direction} onChange={(event) => setMarketField('direction', event.target.value)} placeholder="Long / Short" /></label>
          <label>Entry zone<input value={market.entryZone} onChange={(event) => setMarketField('entryZone', event.target.value)} /></label>
          <label>Entry<input value={market.entryPrice} onChange={(event) => setMarketField('entryPrice', event.target.value)} inputMode="decimal" /></label>
          <label>SL<input value={market.stopLoss} onChange={(event) => setMarketField('stopLoss', event.target.value)} inputMode="decimal" /></label>
          <label>TP<input value={market.takeProfit} onChange={(event) => setMarketField('takeProfit', event.target.value)} inputMode="decimal" /></label>
          <label>Confidence %<input value={market.confidencePercent} onChange={(event) => setMarketField('confidencePercent', event.target.value)} inputMode="decimal" /></label>
          <Button type="submit">Save market</Button>
        </form>
      ) : null}
      {message ? <p className={styles.message}>{message}</p> : null}
    </div>
  );
}
