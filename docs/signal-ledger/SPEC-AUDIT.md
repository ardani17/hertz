# Signal Ledger Spec Audit

Tanggal: 2026-05-08
Status: Sesuai setelah koreksi audit

## Scope Audit

Sumber kebenaran diskusi:

- `docs/signal-ledger/DISCUSSION.md`
- `docs/signal-ledger/signal-ledger-mock-03.png`

Spec yang diaudit:

- `.kiro/specs/signal-ledger/requirements.md`
- `.kiro/specs/signal-ledger/design.md`
- `.kiro/specs/signal-ledger/tasks.md`
- `docs/signal-ledger/SPEC.md`

## Hasil Ringkas

Spec Kiro sudah disesuaikan dengan keputusan diskusi. Gap kecil yang ditemukan saat audit sudah ditambahkan ke `.kiro/specs/signal-ledger`.

Tidak ada keputusan produk utama dari diskusi yang sengaja diubah di spec.

## Checklist Keputusan Diskusi

| Area | Keputusan Diskusi | Status Spec |
| --- | --- | --- |
| Identitas produk | Signal Ledger bukan clone X/Twitter 100%, tetap Hertz emerald/trading | OK |
| Mock visual | Mock ketiga menjadi acuan implementasi | OK |
| Feature flag | Gunakan `SIGNAL_LEDGER_ENABLED` | OK |
| Route detail | Gunakan `/post/[id]` | OK |
| Artikel lama | Artikel lama belum production/testing, tidak jadi blocker migration | OK, ditambahkan saat audit |
| Blog/Outlook | Tetap sistem terpisah, tidak masuk timeline | OK |
| Guest | Read-only, action button tetap terlihat dan memunculkan login prompt | OK |
| Guest backend | Semua mutasi guest ditolak server-side | OK |
| Login Telegram | Signature Telegram harus valid | OK |
| Membership | Login harus cek endpoint membership grup Hertz | OK |
| Non-member copy | `Akun Telegram Anda belum terdaftar sebagai member grup Hertz.` | OK |
| Badge member | Semua verified member mendapat badge Verified Member | OK, diperjelas saat audit |
| Badge admin | Admin mendapat badge admin | OK, diperjelas saat audit |
| Pro Member | Tidak ada Pro Member phase awal | OK, ditambahkan saat audit |
| Web post | Verified member web post langsung published | OK |
| Telegram member | Post Telegram member tetap pending/admin `/publish` | OK |
| Telegram admin | Post Telegram admin auto publish | OK |
| Credit web post | Web post mendapat credit langsung | OK |
| Credit category | Credit hanya original post kategori trading/life_story/general | OK |
| No credit | Repost/quote/comment/Signal/bookmark/community note tidak auto-credit | OK |
| Composer | Pair/Risk hanya untuk Trading Room | OK |
| Trading text-only | Trading Room boleh text-only | OK |
| Media max | Maksimal 4 media per post | OK |
| Video | Phase awal web fokus image, tidak bangun pipeline video baru | OK, ditambahkan saat audit |
| Chart interpretation | Chart di mock adalah uploaded image/media, bukan chart engine tools | OK, ditambahkan saat audit |
| Signal | Signal toggle, berbasis verified user, bukan fingerprint like lama | OK |
| Bookmark | Bookmark private | OK |
| Views | Guest view dihitung dengan dedupe session/IP-ish, tanpa IP mentah | OK |
| Repost | Repost biasa langsung tampil dan bisa dibatalkan | OK |
| Quote repost | Quote repost langsung tampil | OK |
| Own repost | Repost biasa ke post sendiri ditolak | OK |
| Own quote | Quote repost post sendiri boleh | OK |
| Comments | Member bisa edit/delete comment | OK |
| Community note | Member buat note langsung, tanpa approve admin | OK |
| Community note source | Source URL wajib minimal satu | OK |
| Community notes count | Banyak note tersimpan, feed tampilkan satu note utama | OK |
| Community note edit/delete | Creator delete, edit terbatas; admin hide/delete | OK |
| Long post | Feed truncate, `Baca lanjut` buka `/post/[id]` | OK, diperjelas saat audit |
| Signal spine | Visual/indikator kategori/source phase awal | OK, ditambahkan saat audit |
| Post overflow menu | Role-aware action menu | OK, ditambahkan saat audit |
| Search shortcut | Jangan tampilkan hint jika shortcut belum dibuat | OK, ditambahkan saat audit |
| Market Pulse | Mock/fallback boleh, wajib label `Data sementara` | OK |
| Telegram Sync module | Pending draft count hanya admin | OK |
| Admin moderation | Minimal review queue/moderation phase awal | OK |
| Ban/mute | Schema siap, phase awal cukup hide/delete content | OK, diperjelas saat audit |
| Code structure | API tipis, service/repository/types/components terpisah | OK |
| Source schema | `db/migrations` source of truth, bukan Prisma | OK |
| Deploy | Env baru masuk deploy/docker/env example | OK |
| Audit akhir | Build/test/manual audit masuk tasks | OK |

## Koreksi Yang Dilakukan Saat Audit

1. Menambahkan keputusan `Signal_Spine` ke glossary, requirements, design, dan task visual audit.
2. Menegaskan `Verified Member`, admin badge, dan larangan `Pro Member` phase awal.
3. Menambahkan long post truncation dan `Baca lanjut` ke `/post/[id]`.
4. Menegaskan artikel lama masih testing dan tidak menjadi blocker migration.
5. Menegaskan web phase awal mendukung image, bukan pipeline video baru.
6. Menegaskan chart pada feed adalah uploaded media, bukan tools chart engine.
7. Menambahkan role-aware post overflow menu.
8. Menambahkan aturan shortcut/search hint tidak ditampilkan jika belum implemented.
9. Menambahkan requirement safety/rate limit/content validation.
10. Menyesuaikan task references agar mengarah ke requirement terbaru.

## Catatan Audit

Spec Kiro sekarang menjadi sumber utama implementasi:

- `.kiro/specs/signal-ledger/requirements.md`
- `.kiro/specs/signal-ledger/design.md`
- `.kiro/specs/signal-ledger/tasks.md`

Dokumen `docs/signal-ledger/SPEC.md` tetap berguna sebagai spec naratif lengkap, tetapi implementasi dan checklist kerja sebaiknya mengikuti format Kiro.

## Audit Implementasi 2026-05-08

Status: implementasi Signal Ledger selesai untuk scope spec phase awal.

Bukti verifikasi:

- `npm.cmd run build:frontend` berhasil.
- `npm.cmd run build:bot` berhasil.
- `npm.cmd run test` berhasil: 32 test files, 638 tests passed.
- Smoke lokal `http://127.0.0.1:3000/` berhasil HTTP 200 dengan `SIGNAL_LEDGER_ENABLED=true`.
- Smoke lokal mengonfirmasi teks `Signal Ledger` dan label `Data sementara` tampil di HTML.
- Screenshot audit live dibuat di `docs/signal-ledger/audit-desktop-current.png` dan `docs/signal-ledger/audit-mobile-current.png`.
- UI post refactor dipecah per fungsi: author line, media, market meta, quote card, community note card, action bar, overflow menu, dan detail interactions.
- Quote repost, report post, community note rating, comment create/delete, note create/delete, dan admin market metadata edit sudah memiliki UI/API path.

Catatan operasional:

- Dev server frontend aktif di `http://127.0.0.1:3000/` dengan `SIGNAL_LEDGER_ENABLED=true`.
- Warning build tersisa berasal dari route CFTC viewer/Next NFT tracing yang sudah ada di modul tools, bukan dari Signal Ledger.
- Test live Telegram Login Widget tetap membutuhkan payload Telegram asli dan secret produksi di `.env`; kontrak signature, fail-closed membership, dan route wiring sudah ditutup oleh unit/integration test.
- Data feed lokal saat audit kosong, sehingga screenshot live memvalidasi shell/tabs/rails/composer/empty state; post-card behavior divalidasi melalui build, component structure, dan route wiring.

## Audit Ulang Implementasi 2026-05-09

Status: sesuai spec phase awal setelah koreksi audit kedua.

Temuan audit yang sudah ditutup:

1. UI edit comment dan community note belum tersedia walau API sudah ada. Sekarang owner dapat edit comment, owner dapat edit community note, dan admin/owner tetap dapat delete/hide sesuai role.
2. Response error auth masih memakai kode legacy internal sebagai kode utama. Sekarang response publik memakai `error.code` sesuai spec (`UNAUTHENTICATED`, `FORBIDDEN`, `POST_NOT_FOUND`) sambil mempertahankan `error.error_code` lama untuk kompatibilitas.
3. Admin moderation page membaca properti `ok`, sedangkan helper API mengembalikan `success`. Sekarang queue dan action publish/reject/hide membaca `success`.
4. Homepage masih memiliki tag semantik `header/footer` dari komponen feed walau global Navbar/Footer sudah dilepas. Sekarang halaman utama tidak merender tag `<header>` atau `<footer>`, tidak memuat class legacy Navbar/Footer, dan file legacy `Navbar`/`MobileMenu`/`Footer` sudah dihapus dari layout shared.

Bukti verifikasi audit ulang:

- `npm.cmd run build:frontend` berhasil.
- `npm.cmd run build:bot` berhasil.
- `npm.cmd run test` berhasil: 32 test files, 638 tests passed.
- Smoke lokal `GET http://127.0.0.1:3000/` berhasil HTTP 200, memuat `Signal Ledger`, tidak memuat tag `<header>`/`<footer>`, dan tidak memuat class legacy Navbar/Footer.
- Smoke lokal guest `POST /api/feed` berhasil ditolak dengan HTTP 401 dan `error.code=UNAUTHENTICATED`.
- Smoke lokal guest `GET /api/admin/signal-ledger/pending` berhasil ditolak dengan HTTP 403 dan `error.code=FORBIDDEN`.

Catatan residual:

- Smoke live database penuh belum bisa dibuktikan di environment lokal karena `DATABASE_URL` lokal masih placeholder. Code path, repository, service, API route, dan test sudah tersedia, tetapi verifikasi produksi tetap membutuhkan database dan env asli.
- Warning build Turbopack masih berasal dari route tools CFTC viewer, bukan dari Signal Ledger.
