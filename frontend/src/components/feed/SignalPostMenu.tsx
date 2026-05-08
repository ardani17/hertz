'use client';

import { useState, type FormEvent } from 'react';
import type { MarketContext, MemberSessionUser, SignalPost } from '@shared/types';
import { MoreIcon } from './SignalIcons';
import styles from './SignalPostMenu.module.css';

export function SignalPostMenu({ post, currentUser }: { post: SignalPost; currentUser: MemberSessionUser | null }) {
  const [open, setOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [marketOpen, setMarketOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState('misleading');
  const [reportDetails, setReportDetails] = useState('');
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
    await navigator.clipboard?.writeText(`${window.location.origin}/post/${post.id}`);
    setMessage('Link disalin.');
    setOpen(false);
  }

  async function deleteOwnPost() {
    const response = await fetch(`/api/feed/${post.id}`, { method: 'DELETE' });
    if (!response.ok) {
      const data = await response.json().catch(() => null);
      setMessage(data?.error?.message ?? 'Gagal menghapus post.');
      return;
    }
    window.location.reload();
  }

  async function hidePost() {
    const response = await fetch(`/api/admin/signal-ledger/posts/${post.id}/hide`, { method: 'POST' });
    if (!response.ok) {
      const data = await response.json().catch(() => null);
      setMessage(data?.error?.message ?? 'Gagal menyembunyikan post.');
      return;
    }
    window.location.reload();
  }

  async function submitReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch(`/api/feed/${post.id}/report`, {
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
    const response = await fetch(`/api/feed/${post.id}`, {
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
      <button type="button" className={styles.trigger} onClick={() => setOpen((value) => !value)} aria-label="Post actions">
        <MoreIcon />
      </button>
      {open ? (
        <div className={styles.menu}>
          <button type="button" onClick={copyLink}>Copy link</button>
          {currentUser ? <button type="button" onClick={() => { setReportOpen((value) => !value); setMarketOpen(false); }}>Report</button> : null}
          {currentUser?.role === 'admin' ? <button type="button" onClick={() => { setMarketOpen((value) => !value); setReportOpen(false); }}>Edit market metadata</button> : null}
          {post.viewer.canDelete ? <button type="button" onClick={deleteOwnPost}>Delete post</button> : null}
          {currentUser?.role === 'admin' ? <button type="button" onClick={hidePost}>Hide post</button> : null}
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
          <button type="submit">Submit report</button>
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
          <button type="submit">Save market</button>
        </form>
      ) : null}
      {message ? <p className={styles.message}>{message}</p> : null}
    </div>
  );
}
