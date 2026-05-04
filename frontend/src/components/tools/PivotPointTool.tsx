'use client';

import { useMemo, useState } from 'react';
import styles from './ToolShell.module.css';

type FormState = {
  open: string;
  high: string;
  low: string;
  close: string;
};

function parsePrice(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function round(value: number) {
  return Math.round(value * 100000) / 100000;
}

export function PivotPointTool() {
  const sample = {
    open: '1.0800',
    high: '1.0920',
    low: '1.0750',
    close: '1.0860',
  };
  const [form, setForm] = useState<FormState>({
    ...sample,
  });
  const [submitted, setSubmitted] = useState(form);

  const result = useMemo(() => {
    const open = parsePrice(submitted.open);
    const high = parsePrice(submitted.high);
    const low = parsePrice(submitted.low);
    const close = parsePrice(submitted.close);

    if (!open || !high || !low || !close) {
      return { error: 'Semua harga harus angka positif.', levels: null };
    }

    if (high < Math.max(open, low, close) || low > Math.min(open, high, close)) {
      return { error: 'OHLC tidak valid: High harus tertinggi dan Low harus terendah.', levels: null };
    }

    const pivot = (high + low + close) / 3;
    const range = high - low;

    return {
      error: null,
      levels: {
        r3: round(high + 2 * (pivot - low)),
        r2: round(pivot + range),
        r1: round(2 * pivot - low),
        pivot: round(pivot),
        s1: round(2 * pivot - high),
        s2: round(pivot - range),
        s3: round(low - 2 * (high - pivot)),
      },
    };
  }, [submitted]);

  return (
    <section className={styles.panel}>
      <div className={styles.formGrid}>
        {(['open', 'high', 'low', 'close'] as const).map((field) => (
          <div className={styles.field} key={field}>
            <label htmlFor={field}>{field}</label>
            <input
              id={field}
              inputMode="decimal"
              value={form[field]}
              onChange={(event) => setForm((prev) => ({ ...prev, [field]: event.target.value }))}
            />
          </div>
        ))}
      </div>

      <div className={styles.actions}>
        <button className="btn btn-primary" onClick={() => setSubmitted(form)} type="button">
          Hitung pivot
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => {
            const reset = { open: '', high: '', low: '', close: '' };
            setForm(reset);
            setSubmitted(reset);
          }}
          type="button"
        >
          Reset
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => {
            setForm(sample);
            setSubmitted(sample);
          }}
          type="button"
        >
          Pakai contoh
        </button>
      </div>

      {result.error ? <div className={styles.error}>{result.error}</div> : null}

      {result.levels ? (
        <div className={styles.resultGrid}>
          {Object.entries(result.levels).map(([key, value]) => (
            <div
              className={`${styles.metric} ${['pivot', 'r1', 's1'].includes(key) ? styles.metricPrimary : ''}`}
              key={key}
            >
              <span>{key.toUpperCase()}</span>
              <strong>{value.toLocaleString('id-ID')}</strong>
            </div>
          ))}
        </div>
      ) : null}

      <p className={styles.note}>
        Fungsi: menghitung level support dan resistance dari data OHLC periode sebelumnya.
        Pivot, R1, dan S1 ditandai sebagai level utama untuk dibaca lebih dulu.
      </p>
    </section>
  );
}
