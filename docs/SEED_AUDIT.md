# Panduan Seed Data Horizon (Audit & Testing)

Seed data demo untuk menguji dan mengaudit seluruh permukaan produk Horizon tanpa mengisi data manual.

## Jalankan seed

```bash
cd /www/dk_project/horizon

# Lengkap: migrasi + admin dari .env + semua seed SQL
npm run db:seed:all

# Hanya seed SQL (setelah migrasi)
npm run db:seed

# Satu file saja
node scripts/run-db-seeds.js db/seeds/003_horizon_audit_seed.sql
```

**Prasyarat:** PostgreSQL jalan, file `.env` berisi `DATABASE_URL` atau `POSTGRES_*`, dan `ADMIN_USERNAME` / `ADMIN_PASSWORD` untuk login admin web.

---

## Urutan file seed

| File | Isi |
|------|-----|
| `db/migrations/002_seed_data.sql` | Credit settings + admin default (via migrasi) |
| `db/seeds/001_hertz_review_seed.sql` | Legacy feed seed (opsional, prefix user lama) |
| `db/seeds/002_hertz_full_review_seed.sql` | **Inti:** 10 member demo, HERTZ feed, Outlook, DM, credits |
| `db/seeds/003_horizon_audit_seed.sql` | **Lengkap audit:** blog, notifikasi, challenge, moderation, push, API keys |

Disarankan jalankan **002 + 003** (otomatis lewat `npm run db:seed`).

---

## Akun demo (Telegram ID)

Login member via Telegram dev / whitelist sesuai setup VPS Anda.

| Telegram ID | Username | Role | Kredit | Catatan |
|-------------|----------|------|--------|---------|
| `920000001` | `mira_fx` | member | 245 | **Akun utama audit** — DM, notifikasi unread, bookmarks |
| `920000002` | `langit_trading` | member | 198 | Feed + repost seed |
| `920000003` | `raka_macro` | member | 176 | Outlook macro |
| `920000004` | `sena_scalper` | member | 164 | **Challenge tracker** (FTMO 100K), DM dengan Mira |
| `920000005` | `nara_alpha` | member | 152 | Blog author |
| `920000006` | `deka_notes` | member | 138 | Community notes |
| `920000007` | `viona_research` | member | 128 | Research / liquidity |
| `920000008` | `kai_journal` | member | 116 | Jurnal |
| `920000009` | `bayu_digest` | member | 104 | Digest |
| `920000010` | `admin_hertz` | **admin** | 360 | Admin HERTZ + pending publish queue |
| `920000011` | `pending_member` | member | 0 | **Belum verified** (tanpa `verified_member_at`) |
| `920000012` | `muted_trader` | member | 42 | **Muted** (`muted_until` +2 hari) |
| `920000013` | `banned_spam` | member | 0 | **Banned** |

**Admin web:** dari `.env` (`ADMIN_USERNAME` / `ADMIN_PASSWORD`), bukan Telegram.

---

## Apa yang bisa diaudit per area

### HERTZ Feed (`/hertz`)
- Posting published + pinned (`hzx_live01`)
- Quote post, pulse, views, komentar
- Post **pending_review** (`hzx_audit01`) → admin queue
- Community notes + rating helpful/not helpful
- Counter cache `hertz_post_stats`
- Laporan moderation **open** / **reviewing**

### Outlook (`/outlook`)
- Video, chart, long-read (metadata lengkap dari seed 002)
- Draft + hidden (seed 003)

### Blog (`/blog`)
- 3 artikel published (`category=blog`, `source=wordpress`)
- 1 draft blog
- Komentar member + anonim, likes

### Direct Message (`/hertz/messages`)
- 3 percakapan, 15 pesan, 1 attachment
- Block antar user (Deka ↔ Bayu)
- Notifikasi DM unread untuk Mira

### Notifikasi (`/hertz/notifications`)
- Pulse, comment, repost (read), DM unread
- Badge lonceng di header

### Profil (`/hertz/profile`)
- Credit balance + riwayat transaksi
- Aktivitas tabs (postingan, disimpan, repost, komentar)

### Tools (`/tools`)
- 4 tools published (Pivot, Profitability, Challenge, Elliott)
- Challenge tracker: akun FTMO + personal, 4 trades, persona AI, 1 AI review

### Admin
- `/admin/hertz` — pending Telegram post
- `/admin/logs` — activity logs seed
- `/admin/credits` — credit settings
- API keys: 1 active + 1 revoked (seed)
- WordPress import jobs: completed + failed

### Mobile push (backend)
- `device_tokens` android/ios
- `notification_events`: sent, pending, failed

---

## Postingan HERTZ (shortId)

| shortId | Status | Author |
|---------|--------|--------|
| `hzx_live01` | published | sena_scalper — Gold reject |
| `hzx_live02` | published | viona_research — liquidity |
| `hzx_live03` | published | nara_alpha — life coffee |
| `hzx_live04` | published | langit_trading — EURUSD |
| `hzx_live05` | published | sena_scalper — BTC |
| `hzx_live06` | published | deka_notes — ngopi |
| `hzx_live07` | published | raka_macro — quote DXY |
| `hzx_audit01` | **pending_review** | admin_hertz |

URL contoh: `https://horizon.cloudnexify.com/hertz/post/hzx_live01`

---

## Blog slugs

- `checklist-risk-management-sesi-london`
- `jurnal-trading-proses-review-konsisten`
- `prop-firm-challenge-hindari-overtrading`

---

## Reset / ulang seed

Semua seed **idempotent** — aman dijalankan ulang. Row demo punya UUID prefix tetap dan di-DELETE sebelum INSERT ulang.

```bash
npm run db:seed
```

Tidak menghapus admin dari `.env` atau user produksi di luar prefix seed.

---

## Troubleshooting

| Error | Solusi |
|-------|--------|
| `relation does not exist` | Jalankan migrasi dulu: `bash scripts/run-migrations-local.sh` |
| `connection refused` | Pastikan PostgreSQL/docker `horizon-db` jalan |
| Feed kosong | Pastikan seed 002 sukses sebelum 003 |
| Login Telegram gagal | Pastikan Telegram ID demo terdaftar / dev auth enabled di `.env` |
