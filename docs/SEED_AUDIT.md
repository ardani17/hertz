# Panduan Seed Data Horizon (Audit & Testing)

Seed data demo untuk menguji dan mengaudit seluruh permukaan produk Horizon tanpa mengisi data manual.

## Jalankan seed

```bash
cd /www/dk_project/horizon

# Lengkap: migrasi + admin dari .env + seed SQL
npm run db:seed:all

# Hanya seed SQL (setelah migrasi)
npm run db:seed

# Satu file via docker
docker exec -i horizon-db psql -U horizon_admin -d horizon -v ON_ERROR_STOP=1 -f - < db/seeds/001_horizon_demo_seed.sql

# Satu file via node
node scripts/run-db-seeds.js db/seeds/001_horizon_demo_seed.sql
```

**Prasyarat:** PostgreSQL jalan (`horizon-db` docker atau `POSTGRES_*` di `.env`), migrasi termasuk `016_member_public_profile.sql`, dan `ADMIN_USERNAME` / `ADMIN_PASSWORD` untuk login admin web.

---

## File seed

| File | Isi |
|------|-----|
| `db/migrations/002_seed_data.sql` | Credit settings + admin default (via migrasi) |
| `db/seeds/001_horizon_demo_seed.sql` | **Unified demo seed** — users, profil publik, HERTZ feed, Outlook, blog, DM, notifikasi, challenge, moderation, push, API keys |

Cukup jalankan **satu file** `001_horizon_demo_seed.sql` (otomatis lewat `npm run db:seed`).

Seed **idempotent**: cleanup prefix tetap di awal transaksi, lalu `INSERT ... ON CONFLICT DO UPDATE` untuk users dan upsert di tempat yang relevan.

---

## Akun demo (Telegram ID)

Login member via Telegram dev / whitelist sesuai setup VPS Anda.

### Member verified (18)

| Telegram ID | Username | UUID suffix | Kredit | Catatan profil |
|-------------|----------|-------------|--------|----------------|
| `920000001` | `mira_fx` | `...001` | 312 | **Akun utama audit** — DM unread, notifikasi, bookmarks |
| `920000002` | `langit_trading` | `...002` | 278 | Swing forex, social links lengkap |
| `920000003` | `raka_macro` | `...003` | 256 | Macro + outlook author |
| `920000004` | `sena_scalper` | `...004` | 241 | **Challenge tracker** FTMO 100K |
| `920000005` | `nara_alpha` | `...005` | 198 | Blog author risk management |
| `920000006` | `deka_notes` | `...006` | 186 | Community notes |
| `920000007` | `viona_research` | `...007` | 172 | Liquidity research |
| `920000008` | `kai_journal` | `...008` | 154 | Jurnal psikologi |
| `920000009` | `bayu_digest` | `...009` | 128 | Market digest |
| `920000014` | `arjun_swing` | `...014` | 305 | Swing indeks |
| `920000015` | `citra_futures` | `...015` | 292 | Futures energi |
| `920000016` | `dimas_crypto` | `...016` | 224 | Crypto intraday |
| `920000017` | `elisa_macro` | `...017` | 201 | Event-driven macro |
| `920000018` | `fajar_indices` | `...018` | 176 | NAS100 / SPX |
| `920000019` | `gita_options` | `...019` | 142 | Options hedging |
| `920000020` | `hendra_commod` | `...020` | 118 | Komoditas |
| `920000021` | `indah_scalp` | `...021` | 95 | Scalping rules |
| `920000022` | `joko_review` | `...022` | 82 | Community review |

### Admin & edge cases

| Telegram ID | Username | UUID suffix | Role | Catatan |
|-------------|----------|-------------|------|---------|
| `920000010` | `admin_hertz` | `...010` | **admin** | Publish queue, API keys, import jobs |
| `920000011` | `pending_member` | `...011` | member | **Belum verified** (`verified_member_at` NULL) |
| `920000012` | `muted_trader` | `...012` | member | **Muted** (`muted_until` +2 hari) |
| `920000013` | `banned_spam` | `...013` | member | **Banned** |

**Admin web:** dari `.env` (`ADMIN_USERNAME` / `ADMIN_PASSWORD`), bukan Telegram.

---

## Profil publik (migration 016)

Setiap member verified (001–009, 014–022) dan admin memiliki:

- `profile_bio` — bio Bahasa Indonesia (≤280 karakter)
- `profile_location` — kota, ID
- `profile_hobbies` — JSONB array (max 8)
- `profile_social_links` — JSONB handles: `x`, `instagram`, `youtube`, `telegram`, `tradingview`, `linkedin`
- `profile_trading` — JSONB `{ experienceLevel, markets, sinceYear, style }`
- `profile_updated_at` — timestamp terakhir edit profil

Edge cases (`011` pending, `013` banned) sengaja tanpa bio lengkap untuk audit empty state.

**Review profil:** login sebagai `mira_fx` (`920000001`) → `/hertz/profile` → tab profil publik; bandingkan dengan `pending_member` dan `muted_trader`.

---

## Apa yang bisa diaudit per area

### HERTZ Feed (`/hertz`)
- 16 post `hzx_demo01`–`hzx_demo16` (trading_room / life_coffee / general)
- Post **pinned** `hzx_demo01` (Gold reject)
- Post **pending_review** `hzx_demo08` (GBPUSD admin queue)
- Pulse, views, 8 komentar, 6 bookmarks, 4 reposts
- Community notes (2) + rating helpful/not helpful
- Counter cache `hertz_post_stats`
- Laporan moderation **open** / **reviewing** (3)

### Outlook (`/outlook`)
- 9 artikel outlook (video / chart / long-read + metadata)
- 1 hidden outlook (`hidden-outlook-audit`)

### Blog (`/blog`)
- 6 artikel published (`category=blog`, `source=wordpress`)
- 1 draft blog
- Komentar member + anonim, likes

### Direct Message (`/hertz/messages`)
- 5 percakapan, 22 pesan, 1 attachment
- Block antar user (Deka ↔ Bayu)
- Notifikasi DM unread untuk Mira

### Notifikasi (`/hertz/notifications`)
- 8 notifikasi (pulse, comment, repost, DM) — unread untuk `mira_fx`
- Badge lonceng di header

### Profil (`/hertz/profile`)
- Credit balance 80–420 + 12 riwayat transaksi
- Profil publik dengan bio, hobi, social links, trading experience
- Aktivitas tabs (postingan, disimpan, repost, komentar)

### Tools (`/tools`)
- Challenge tracker: akun FTMO + personal, 6 trades, persona AI, 1 AI review

### Admin
- `/admin/hertz` — pending Telegram post (`hzx_demo08`)
- `/admin/logs` — 6 activity logs seed
- API keys: 1 active + 1 revoked
- WordPress import jobs: completed + failed

### Mobile push (backend)
- `device_tokens` android/ios
- `notification_events`: sent, pending, failed

---

## Postingan HERTZ (shortId)

| shortId | Status | Author | Catatan |
|---------|--------|--------|---------|
| `hzx_demo01` | published, **pinned** | sena_scalper | Gold reject XAUUSD |
| `hzx_demo02` | published | viona_research | Liquidity snapshot |
| `hzx_demo03` | published | nara_alpha | Life coffee |
| `hzx_demo04` | published | langit_trading | EURUSD compression |
| `hzx_demo05` | published | sena_scalper | BTC retest |
| `hzx_demo06` | published | deka_notes | Ngopi NY |
| `hzx_demo07` | published | raka_macro | Quote DXY |
| `hzx_demo08` | **pending_review** | admin_hertz | Admin queue |
| `hzx_demo09`–`16` | published | various | NAS100, WTI, macro, tools |

URL contoh: `https://horizon.cloudnexify.com/hertz/post/hzx_demo01`

---

## Blog slugs

- `checklist-risk-management-sesi-london`
- `jurnal-trading-proses-review-konsisten`
- `prop-firm-challenge-hindari-overtrading`
- `swing-indeks-disiplin-h4-close`
- `crypto-playbook-btc-range`
- `options-defined-risk-hedging`

---

## Reset / ulang seed

```bash
docker exec -i horizon-db psql -U horizon_admin -d horizon -v ON_ERROR_STOP=1 -f - < db/seeds/001_horizon_demo_seed.sql
# atau
npm run db:seed
```

Tidak menghapus admin dari `.env` atau user produksi di luar prefix seed / rentang Telegram demo.

---

## Troubleshooting

| Error | Solusi |
|-------|--------|
| `relation does not exist` | Jalankan migrasi dulu: `bash scripts/run-migrations-local.sh` |
| `connection refused` | Pastikan docker `horizon-db` jalan |
| `column profile_bio does not exist` | Jalankan migrasi `016_member_public_profile.sql` |
| Feed kosong | Cek output seed — harus `COMMIT` tanpa error |
| Login Telegram gagal | Pastikan Telegram ID demo terdaftar / dev auth enabled di `.env` |
