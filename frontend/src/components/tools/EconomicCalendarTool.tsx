'use client';

import { useEffect, useMemo, useState } from 'react';
import styles from './ToolShell.module.css';

type EventRow = {
  eventId: string;
  dateUtc: string;
  name: string;
  countryCode: string;
  currencyCode: string;
  volatility: string;
  actual: number | null;
  consensus: number | null;
  previous: number | null;
};

type CalendarResponse = {
  success: boolean;
  message?: string;
  data: EventRow[];
  totalEvents: number;
  dateRange?: { start: string; end: string };
  lastUpdated?: string;
  source?: string;
  timezone?: string;
};

const MAX_VISIBLE_ROWS = 80;

function formatEventTime(dateUtc: string) {
  return new Date(dateUtc).toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta',
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: 'short',
  });
}

function formatValue(value: number | null) {
  return value ?? '-';
}

export function EconomicCalendarTool() {
  const [period, setPeriod] = useState('today');
  const [volatility, setVolatility] = useState('MEDIUM,HIGH');
  const [country, setCountry] = useState('all');
  const [data, setData] = useState<CalendarResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ period, volatility });
    if (country !== 'all') params.set('countryCode', country);

    setLoading(true);
    setError(null);
    fetch(`/api/tools/economic-calendar?${params.toString()}`, { signal: controller.signal })
      .then(async (response) => {
        const json = await response.json();
        if (!response.ok) {
          throw new Error(json.message ?? 'Gagal mengambil economic calendar.');
        }
        return json as CalendarResponse;
      })
      .then((json) => {
        setData(json);
        if (!json.success) {
          setError(json.message ?? 'Upstream economic calendar sedang tidak tersedia.');
        }
      })
      .catch((err) => {
        if (err.name !== 'AbortError') setError(err.message ?? 'Gagal mengambil economic calendar.');
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [country, period, volatility]);

  const rows = useMemo(() => data?.data.slice(0, MAX_VISIBLE_ROWS) ?? [], [data]);
  const hiddenRows = Math.max((data?.totalEvents ?? 0) - rows.length, 0);

  return (
    <section className={styles.panel}>
      <div className={styles.formGridThree}>
        <div className={styles.field}>
          <label htmlFor="period">Periode</label>
          <select id="period" value={period} onChange={(e) => setPeriod(e.target.value)}>
            <option value="today">Hari ini</option>
            <option value="tomorrow">Besok</option>
            <option value="this-week">Minggu ini</option>
            <option value="next-week">Minggu depan</option>
          </select>
        </div>
        <div className={styles.field}>
          <label htmlFor="volatility">Impact</label>
          <select id="volatility" value={volatility} onChange={(e) => setVolatility(e.target.value)}>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="MEDIUM,HIGH">Medium + High</option>
          </select>
        </div>
        <div className={styles.field}>
          <label htmlFor="country">Negara</label>
          <select id="country" value={country} onChange={(e) => setCountry(e.target.value)}>
            <option value="all">All</option>
            <option value="US">US</option>
            <option value="GB">GB</option>
            <option value="EMU">Euro Area</option>
            <option value="JP">JP</option>
            <option value="DE">DE</option>
            <option value="CA">CA</option>
            <option value="AU">AU</option>
          </select>
        </div>
      </div>

      {loading ? <p className={styles.note}>Memuat calendar...</p> : null}
      {error ? <div className={styles.error}>{error}</div> : null}
      {data ? (
        <div className={styles.statusLine}>
          <span className={styles.badge}>{data.totalEvents.toLocaleString('id-ID')} event</span>
          <span className={hiddenRows > 0 ? styles.badgeWarning : styles.badgeMuted}>
            Menampilkan {rows.length.toLocaleString('id-ID')} dari {data.totalEvents.toLocaleString('id-ID')}
          </span>
          <span className={styles.badgeMuted}>
            {data.dateRange?.start ?? '-'} sampai {data.dateRange?.end ?? '-'}
          </span>
          <span className={styles.badgeMuted}>Waktu: Asia/Jakarta</span>
        </div>
      ) : null}

      <div className={styles.tableWrap} data-mobile-cards="true">
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Waktu</th>
              <th>Negara</th>
              <th>Event</th>
              <th>Impact</th>
              <th>Actual</th>
              <th>Perkiraan</th>
              <th>Sebelumnya</th>
            </tr>
          </thead>
          <tbody>
            {rows.length ? rows.map((event) => (
              <tr key={event.eventId}>
                <td>{formatEventTime(event.dateUtc)}</td>
                <td>{event.countryCode} {event.currencyCode ? `(${event.currencyCode})` : ''}</td>
                <td>{event.name}</td>
                <td><span className={event.volatility === 'HIGH' ? styles.badgeWarning : styles.badgeMuted}>{event.volatility}</span></td>
                <td>{formatValue(event.actual)}</td>
                <td>{formatValue(event.consensus)}</td>
                <td>{formatValue(event.previous)}</td>
              </tr>
            )) : (
              <tr>
                <td colSpan={7}>
                  <div className={styles.emptyState}>
                    Tidak ada event untuk filter ini. Coba ubah periode, impact, atau negara.
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className={styles.mobileDataCards} aria-label="Economic calendar events">
        {rows.length ? rows.map((event) => (
          <article className={styles.mobileDataCard} key={event.eventId}>
            <div className={styles.mobileDataCardHeader}>
              <strong>{formatEventTime(event.dateUtc)}</strong>
              <span className={event.volatility === 'HIGH' ? styles.badgeWarning : styles.badgeMuted}>{event.volatility}</span>
            </div>
            <h3>{event.name}</h3>
            <dl>
              <div>
                <dt>Negara</dt>
                <dd>{event.countryCode} {event.currencyCode ? `(${event.currencyCode})` : ''}</dd>
              </div>
              <div>
                <dt>Actual</dt>
                <dd>{formatValue(event.actual)}</dd>
              </div>
              <div>
                <dt>Perkiraan</dt>
                <dd>{formatValue(event.consensus)}</dd>
              </div>
              <div>
                <dt>Sebelumnya</dt>
                <dd>{formatValue(event.previous)}</dd>
              </div>
            </dl>
          </article>
        )) : (
          <div className={styles.emptyState}>Tidak ada event untuk filter ini. Coba ubah periode, impact, atau negara.</div>
        )}
      </div>

      <p className={styles.note}>
        Fungsi: melihat jadwal rilis ekonomi yang berpotensi menggerakkan market.
        Data live ditampilkan dalam waktu Asia/Jakarta.
      </p>
    </section>
  );
}
