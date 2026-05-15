# Horizon UI/UX Review — Mei 2026

Review lengkap fitur UI/UX yang tersedia di aplikasi Horizon, termasuk status kelengkapan masing-masing.

---

## 1. Halaman & Route yang Tersedia

| Route | Nama | Status |
|-------|------|--------|
| `/` | Landing Page | ✅ Lengkap |
| `/hertz` | HERTZ Social Feed | ✅ Lengkap |
| `/hertz/post/[shortId]` | HERTZ Post Detail | ✅ Lengkap |
| `/hertz/messages` | Direct Message | ✅ Lengkap |
| `/outlook` | Outlook List | ✅ Lengkap |
| `/outlook/[slug]` | Outlook Detail | ✅ Lengkap |
| `/blog` | Blog List | ✅ Lengkap |
| `/blog/[slug]` | Blog Detail | ✅ Lengkap |
| `/artikel/[slug]` | Artikel Detail (generic) | ✅ Lengkap |
| `/gallery` | Gallery Media | ✅ Lengkap |
| `/tools` | Tools Hub | ✅ Lengkap |
| `/tools/cftc` | CFTC COT Viewer | ✅ |
| `/tools/pivot-point` | Pivot Point Calculator | ✅ |
| `/tools/profitability` | Profitability Simulator | ✅ |
| `/tools/elliott-wave` | Elliott Wave Calculator | ✅ |
| `/tools/economic-calendar` | Economic Calendar | ✅ |
| `/tools/order-book` | Order Book (OANDA) | ✅ |
| `/tools/exchange-liquidity` | Exchange Liquidity | ✅ |
| `/tools/horizonfx` | HorizonFX V2 Audit | ✅ |
| `/post/[id]` | Legacy Post | ✅ Redirect ke HERTZ |
| `/admin` | Admin Dashboard | ✅ Lengkap |
| `/admin/hertz` | HERTZ Moderation | ✅ Lengkap |
| `/admin/articles` | Artikel Management | ✅ |
| `/admin/outlook` | Outlook Management | ✅ |
| `/admin/blog` | Blog Management | ✅ |
| `/admin/users` | User Management | ✅ |
| `/admin/credits` | Credit Management | ✅ |
| `/admin/comments` | Comment Moderation | ✅ |
| `/admin/logs` | System Logs | ✅ |
| `/admin/api-keys` | API Keys | ✅ |

---

## 2. Navigasi

### Landing Navbar
- HERTZ | Outlook | Blog | Tools | Masuk HERTZ

### SignalLeftRail (navigasi utama app)
- Home → `/hertz`
- Outlook → `/outlook`
- Blog → `/blog`
- Tools → `/tools`
- Gallery → `/gallery`
- Direct Message → `/hertz/messages`
- Admin (hanya admin) → `/admin/hertz`

### Mobile Bottom Nav
- HERTZ | Tools | DM | Profile/Login

### Admin Sidebar
- **Utama:** Dashboard, HERTZ, Articles, Outlook, Blog
- **Pengguna:** Users, Credits, Comments
- **Sistem:** Logs, API Keys

### Old Sidebar (halaman lama)
- Kategori: Semua, Trading Room, Life & Coffee, Outlook, Blog, Gallery
- Info Komunitas
- Links (Telegram Group, Panduan) — **placeholder, bukan link aktif**

---

## 3. Fitur UI/UX per Modul

### 3.1 HERTZ Social Feed (`/hertz`)
- ✅ Composer (tulis post dari web)
- ✅ Kategori post: Trading Room, Life & Coffee, General
- ✅ Upload gambar (max 4)
- ✅ Input pair & risk untuk Trading Room
- ✅ Filter kategori & sort (latest/trending)
- ✅ Search post
- ✅ Telegram login widget untuk guest
- ✅ Market data rail (kanan) — Forex, Crypto, Stock
- ✅ Market data diambil dari backend summary endpoint
- ⚠️ Data market masih snapshot backend, belum live upstream price feed

### 3.2 HERTZ Post Interactions
- ✅ Pulse (like equivalent)
- ✅ Comment (redirect ke detail page)
- ✅ Repost
- ✅ Quote Repost (dengan textarea)
- ✅ Bookmark/Save
- ✅ Share (Web Share API / clipboard)
- ✅ View tracking
- ✅ Community Notes (admin-created)
- ✅ Report post

### 3.3 HERTZ Post Detail (`/hertz/post/[shortId]`)
- ✅ Full post view
- ✅ Semua interactions di atas
- ✅ Comment section (tulis & baca komentar)
- ✅ Community notes display
- ✅ View counter

### 3.4 Direct Message (`/hertz/messages`)
- ✅ Conversation list
- ✅ Filter: inbox, unread, admin, archived
- ✅ Search member untuk mulai conversation baru
- ✅ Kirim pesan teks
- ✅ Upload gambar (max 4, JPG/PNG/WEBP, max 5MB)
- ✅ Archive/Unarchive conversation
- ✅ Block member
- ✅ Delete pesan sendiri
- ✅ Report pesan
- ✅ Auto-refresh thread (polling 7 detik)
- ✅ Memakai HertzAppShell tanpa right rail

### 3.5 Blog (`/blog`)
- ✅ List artikel dengan pagination
- ✅ Search artikel
- ✅ BlogComposer (tulis blog dari web)
- ✅ BlogComposer memakai CSS module
- ✅ BlogComposer punya toolbar format dasar (bold, italic, link)

### 3.6 Blog Detail (`/blog/[slug]`)
- ✅ Artikel content (HTML rendered)
- ✅ Cover image
- ✅ Author & meta info
- ✅ Like button
- ✅ Comment section (anonim + Telegram auth)
- ✅ Share buttons
- ✅ JSON-LD structured data

### 3.7 Outlook (`/outlook`)
- ✅ List artikel outlook
- ✅ Card layout dengan cover image

### 3.8 Outlook Detail (`/outlook/[slug]`)
- ✅ Artikel content
- ✅ Cover image + media gallery
- ✅ Author & meta info
- ✅ Comment Section
- ✅ Like Button
- ✅ Share Buttons
- ✅ Tetap menampilkan count komentar & like

### 3.9 Gallery (`/gallery`)
- ✅ Grid layout media
- ✅ Lightbox view
- ✅ Pakai HertzAppShell
- ✅ Ada di navigasi utama SignalLeftRail

### 3.10 Comment System
- ✅ Tampil di Blog detail & Artikel detail
- ✅ Mode anonim (nama opsional)
- ✅ Mode Telegram login (verified member badge)
- ✅ Validasi max 2000 karakter
- ✅ Admin moderation (hide/show/delete)
- ✅ Tampil di Outlook detail

### 3.11 Tools
- ✅ Hub page dengan 8 tool cards
- ✅ Bilingual (Indonesia/English)
- ✅ Masing-masing tool punya halaman sendiri

### 3.12 Admin Panel
- ✅ Dashboard (stats: members, articles, media, credits)
- ✅ HERTZ moderation (publish/reject/hide Telegram drafts)
- ✅ Report review (post, komentar, note, blog, DM)
- ✅ Article CRUD
- ✅ Outlook CRUD
- ✅ Blog management
- ✅ User management
- ✅ Credit system (balance, history, adjust, settings)
- ✅ Comment moderation
- ✅ System logs
- ✅ API key management

---

## 4. Masalah & Rekomendasi

### 🔴 Prioritas Tinggi

| # | Masalah | Lokasi | Rekomendasi |
|---|---------|--------|-------------|
| 1 | Market data masih snapshot backend, belum live upstream | `SignalRightRail.tsx`, `/api/market/summary` | Integrasikan API live price saat provider/data feed sudah ditentukan |
| 2 | Community Notes hanya bisa dibuat admin | Feed | Pertimbangkan member-created notes (dengan moderasi) |
| 3 | Tidak ada notification system | Global | Tambahkan notifikasi untuk reply, pulse, DM baru |

### 🟡 Prioritas Sedang

| # | Masalah | Lokasi | Rekomendasi |
|---|---------|--------|-------------|
| 4 | Tidak ada user profile page | Global | Buat halaman profil member (`/hertz/user/[id]`) |
| 5 | Credit spending tidak ada UI button | Frontend | Tambahkan UI untuk spend credits (jika fitur ini user-facing) |

### 🟢 Prioritas Rendah

| # | Masalah | Lokasi | Rekomendasi |
|---|---------|--------|-------------|
| 6 | Market summary belum punya provider live final | Backend | Sambungkan `/api/market/summary` ke provider live saat tersedia |

---

## 5. Ringkasan Status

| Modul | Kelengkapan |
|-------|-------------|
| Landing Page | 100% |
| HERTZ Feed | 97% (market backend snapshot, belum live upstream) |
| HERTZ Post Detail | 100% |
| HERTZ DM | 100% |
| Blog | 95% (composer basic dengan toolbar format) |
| Outlook List | 100% |
| Outlook Detail | 100% |
| Gallery | 100% |
| Tools | 100% |
| Admin Panel | 100% |
| Comment System | 100% |

---

*Dokumen ini diperbarui pada 15 Mei 2026 setelah implementasi gap UI/UX yang terkonfirmasi.*
