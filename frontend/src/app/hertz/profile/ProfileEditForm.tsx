'use client';

import { useEffect, useState, type FormEvent } from 'react';
import {
  SOCIAL_PLATFORMS,
  TRADING_LEVELS,
  TRADING_MARKETS,
  TRADING_LEVEL_LABELS,
  TRADING_MARKET_LABELS,
  type MemberPublicProfileDto,
  type MemberSocialLinks,
  type TradingExperienceLevel,
  type TradingMarket,
} from '@shared/types/memberProfile';
import { SOCIAL_PLATFORM_LABELS } from '@shared/lib/socialLinks';
import { useToast } from '@/components/ui/Toast';
import styles from './ProfileEditForm.module.css';

type ApiProfileResponse = { success: true; data: { profile: MemberPublicProfileDto } };
type ApiErrorResponse = { success: false; error: { message: string } };

const EMPTY_TRADING = {
  experienceLevel: null as TradingExperienceLevel | null,
  markets: [] as TradingMarket[],
  sinceYear: '' as string,
  style: '',
};

const BIO_MAX = 280;

export function ProfileEditForm({ username }: { username?: string | null }) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [hobbies, setHobbies] = useState<string[]>([]);
  const [hobbyDraft, setHobbyDraft] = useState('');
  const [socialLinks, setSocialLinks] = useState<MemberSocialLinks>({});
  const [trading, setTrading] = useState(EMPTY_TRADING);

  useEffect(() => {
    let cancelled = false;
    async function loadProfile() {
      try {
        const response = await fetch('/api/hertz/profile/me', { cache: 'no-store' });
        const payload = (await response.json()) as ApiProfileResponse | ApiErrorResponse;
        if (!response.ok || !payload.success) {
          throw new Error(!payload.success ? payload.error.message : 'Gagal memuat profil');
        }
        if (cancelled) return;
        const profile = payload.data.profile;
        setBio(profile.bio ?? '');
        setLocation(profile.location ?? '');
        setHobbies(profile.hobbies);
        setSocialLinks(profile.socialLinks);
        setTrading({
          experienceLevel: profile.trading.experienceLevel,
          markets: profile.trading.markets,
          sinceYear: profile.trading.sinceYear ? String(profile.trading.sinceYear) : '',
          style: profile.trading.style ?? '',
        });
      } catch (error) {
        if (!cancelled) {
          showToast(error instanceof Error ? error.message : 'Gagal memuat profil', 'error');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void loadProfile();
    return () => {
      cancelled = true;
    };
  }, [showToast]);

  function addHobby() {
    const trimmed = hobbyDraft.trim();
    if (!trimmed) return;
    if (hobbies.length >= 8) {
      showToast('Maksimal 8 hobi', 'warning');
      return;
    }
    if (hobbies.some((item) => item.toLowerCase() === trimmed.toLowerCase())) {
      setHobbyDraft('');
      return;
    }
    setHobbies((current) => [...current, trimmed]);
    setHobbyDraft('');
  }

  function removeHobby(index: number) {
    setHobbies((current) => current.filter((_, i) => i !== index));
  }

  function toggleMarket(market: TradingMarket) {
    setTrading((current) => {
      const exists = current.markets.includes(market);
      if (exists) {
        return { ...current, markets: current.markets.filter((item) => item !== market) };
      }
      if (current.markets.length >= 5) {
        showToast('Maksimal 5 pasar trading', 'warning');
        return current;
      }
      return { ...current, markets: [...current.markets, market] };
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await fetch('/api/hertz/profile/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bio: bio.trim() || null,
          location: location.trim() || null,
          hobbies,
          socialLinks: Object.fromEntries(
            SOCIAL_PLATFORMS.map((platform) => [
              platform,
              (socialLinks[platform] ?? '').trim().replace(/^@+/, ''),
            ]),
          ),
          tradingExperienceLevel: trading.experienceLevel,
          tradingMarkets: trading.markets,
          tradingSinceYear: trading.sinceYear ? Number(trading.sinceYear) : null,
          tradingStyle: trading.style.trim() || null,
        }),
      });
      const payload = (await response.json()) as ApiProfileResponse | ApiErrorResponse;
      if (!response.ok || !payload.success) {
        throw new Error(!payload.success ? payload.error.message : 'Gagal menyimpan profil');
      }
      showToast('Profil publik berhasil disimpan', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Gagal menyimpan profil', 'error');
    } finally {
      setSaving(false);
    }
  }

  const handleLabel = username ? `@${username.replace(/^@/, '')}` : 'profil publik';

  if (loading) {
    return (
      <section id="profile-edit" className={styles.panel}>
        <div className={styles.panelHeader}>
          <p className={styles.panelLabel}>Edit profil publik</p>
          <p className={styles.hint}>Memuat data profil...</p>
        </div>
      </section>
    );
  }

  return (
    <section id="profile-edit" className={styles.panel}>
      <div className={styles.panelHeader}>
        <div>
          <p className={styles.panelLabel}>Edit profil publik</p>
          <p className={styles.hint}>
            Tampil di halaman {handleLabel}. Nama dan avatar tetap dari Telegram.
          </p>
        </div>
      </div>

      <form className={styles.form} onSubmit={handleSubmit}>
        <details className={styles.section} open>
          <summary className={styles.sectionSummary}>
            <span>Profil dasar</span>
            <em>Bio & lokasi</em>
          </summary>
          <div className={styles.sectionBody}>
            <label className={styles.field}>
              <span>Bio</span>
              <textarea
                value={bio}
                onChange={(event) => setBio(event.target.value)}
                maxLength={BIO_MAX}
                rows={4}
                placeholder="Ceritakan sedikit tentang dirimu, fokus trading, atau minat di komunitas..."
              />
              <small className={styles.charCount}>
                {bio.length}/{BIO_MAX}
              </small>
            </label>
            <label className={styles.field}>
              <span>Lokasi</span>
              <input
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                maxLength={80}
                placeholder="Jakarta, Surabaya, Singapore..."
              />
            </label>
          </div>
        </details>

        <details className={styles.section}>
          <summary className={styles.sectionSummary}>
            <span>Hobi</span>
            <em>{hobbies.length > 0 ? `${hobbies.length} ditambahkan` : 'Opsional'}</em>
          </summary>
          <div className={styles.sectionBody}>
            <div className={styles.hobbyInputRow}>
              <input
                value={hobbyDraft}
                onChange={(event) => setHobbyDraft(event.target.value)}
                maxLength={40}
                placeholder="Contoh: hiking, fotografi"
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    addHobby();
                  }
                }}
              />
              <button type="button" className={styles.secondaryButton} onClick={addHobby}>
                Tambah
              </button>
            </div>
            {hobbies.length > 0 ? (
              <ul className={styles.chipList}>
                {hobbies.map((hobby, index) => (
                  <li key={`${hobby}-${index}`}>
                    <span>{hobby}</span>
                    <button type="button" aria-label={`Hapus ${hobby}`} onClick={() => removeHobby(index)}>
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.inlineHint}>Belum ada hobi. Tambahkan maksimal 8.</p>
            )}
          </div>
        </details>

        <details className={styles.section}>
          <summary className={styles.sectionSummary}>
            <span>Sosial media</span>
            <em>Username saja</em>
          </summary>
          <div className={styles.sectionBody}>
            <div className={styles.socialGrid}>
              {SOCIAL_PLATFORMS.map((platform) => (
                <label key={platform} className={styles.field}>
                  <span>{SOCIAL_PLATFORM_LABELS[platform]}</span>
                  <div className={styles.inputPrefix}>
                    <span aria-hidden="true">@</span>
                    <input
                      value={socialLinks[platform] ?? ''}
                      onChange={(event) =>
                        setSocialLinks((current) => ({
                          ...current,
                          [platform]: event.target.value.replace(/^@+/, ''),
                        }))
                      }
                      maxLength={50}
                      placeholder={platform}
                    />
                  </div>
                </label>
              ))}
            </div>
          </div>
        </details>

        <details className={styles.section}>
          <summary className={styles.sectionSummary}>
            <span>Pengalaman trading</span>
            <em>
              {trading.experienceLevel
                ? TRADING_LEVEL_LABELS[trading.experienceLevel]
                : 'Level & pasar'}
            </em>
          </summary>
          <div className={styles.sectionBody}>
            <label className={styles.field}>
              <span>Level</span>
              <select
                value={trading.experienceLevel ?? ''}
                onChange={(event) =>
                  setTrading((current) => ({
                    ...current,
                    experienceLevel: (event.target.value || null) as TradingExperienceLevel | null,
                  }))
                }
              >
                <option value="">Pilih level</option>
                {TRADING_LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {TRADING_LEVEL_LABELS[level]}
                  </option>
                ))}
              </select>
            </label>

            <div className={styles.field}>
              <span>Pasar yang difokuskan</span>
              <div className={styles.marketGrid}>
                {TRADING_MARKETS.map((market) => {
                  const active = trading.markets.includes(market);
                  return (
                    <button
                      key={market}
                      type="button"
                      className={active ? `${styles.marketChip} ${styles.marketChipActive}` : styles.marketChip}
                      aria-pressed={active}
                      onClick={() => toggleMarket(market)}
                    >
                      {TRADING_MARKET_LABELS[market]}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className={styles.inlineFields}>
              <label className={styles.field}>
                <span>Mulai sejak</span>
                <input
                  type="number"
                  min={1990}
                  max={new Date().getFullYear()}
                  value={trading.sinceYear}
                  onChange={(event) => setTrading((current) => ({ ...current, sinceYear: event.target.value }))}
                  placeholder="2020"
                />
              </label>
              <label className={styles.field}>
                <span>Gaya trading</span>
                <input
                  value={trading.style}
                  onChange={(event) => setTrading((current) => ({ ...current, style: event.target.value }))}
                  maxLength={120}
                  placeholder="Scalping, swing, long-term..."
                />
              </label>
            </div>
          </div>
        </details>

        <div className={styles.formFooter}>
          <button type="submit" className={styles.primaryButton} disabled={saving}>
            {saving ? 'Menyimpan...' : 'Simpan profil publik'}
          </button>
        </div>
      </form>
    </section>
  );
}
