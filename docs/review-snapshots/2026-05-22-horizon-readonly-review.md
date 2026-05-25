# Horizon Read-Only Review — 22 Mei 2026

Lokasi project: `/www/dk_project/horizon`
Domain: `horizon.cloudnexify.com`
Mode: **read-only review** — tidak mengubah kode aplikasi, tidak build/deploy, tidak restart service.

## Ringkasan Status Runtime

- Frontend lokal: `http://127.0.0.1:3888/` → **200 OK**.
- Bot lokal: `http://127.0.0.1:4888/api/bot/status` → **200 OK**.
- Origin lokal dengan Host `horizon.cloudnexify.com` → **200 OK**.
- Public curl ke `https://horizon.cloudnexify.com/` sempat mengembalikan **502/444**, sementara traffic browser/log reguler masih terlihat 200. Indikasi lebih dekat ke Cloudflare/WAF/anti-bot, bukan container app mati.
- Kesimpulan restart: **tidak perlu restart app/container saat review ini dibuat**.

## Temuan Awal

### 1. Public domain curl 502/444

Gejala:
- `curl https://horizon.cloudnexify.com/` sempat mendapat `502 Bad Gateway` dari Cloudflare.
- `HEAD /` tercatat `444` di access log.
- Origin lokal via Nginx + Host header tetap `200`.

Dugaan:
- Cloudflare/WAF/anti-bot/rule handling terhadap curl atau metode tertentu.
- Bukan indikasi langsung bahwa frontend/container mati.

Rekomendasi:
- Cek Cloudflare rules / WAF event untuk domain ini.
- Pastikan health check public memakai GET normal, bukan HEAD jika WAF memblokir HEAD.
ini aman karena saya pasang waf aapanel
DONE 

### 2. aaPanel WAF error berulang

Log error berulang:

```text
/www/server/btwaf/public/database.lua:608: incorrect number of parameters to bind (2 given, 3 to bind)
```

Dampak:
- Spam error log.
- Berpotensi mengganggu observability.
- Sumbernya WAF/aaPanel, bukan kode Horizon.

Rekomendasi:
- Perbaiki/update modul aaPanel WAF atau nonaktifkan fitur statistik IP bermasalah jika aman.
- Pisahkan alert app error dari WAF error agar tidak misleading.
bagian ini dicek saja jangan masukin spec karena bukan dari kode horizon

### 3. Frontend Docker log punya error Next/Node

Temuan:

```text
TypeError: controller[kState].transformAlgorithm is not a function
```

Status:
- Belum terlihat fatal karena frontend lokal tetap `200`.

Rekomendasi:
- Trace request/route yang memicu error ini.
- Cek kompatibilitas Next.js 16.x, Node runtime container, dan Web Streams/polyfill.

### 4. Repo sedang dirty sebelum review

Status git menunjukkan banyak file modified/untracked sebelum review.

Contoh area berubah:
- Admin dashboard layout/sidebar/header.
- Admin articles/outlook/blog/users/credits/logs/api-keys.
- Komponen admin baru: `AdminEmptyState`, `AdminPageHeader`, `AdminRowActions`.
- `docker-compose.yml`, `bot/Dockerfile`, `frontend/next.config.mjs`.

Catatan:
- Review ini tidak mengubah source code.
- Sebelum deploy, diff perlu direview dan disimpan sebagai commit/backup.

### 5. Admin login belum terlihat punya rate-limit khusus

File terkait:
- `frontend/src/app/api/auth/login/route.ts`

Temuan:
- Login memakai bcrypt dan session cookie HttpOnly/Secure/SameSite.
- Belum terlihat throttling/lockout per IP/username di route login.

Risiko:
- Brute-force admin login lebih mudah.

Rekomendasi:
- Tambahkan rate-limit login per IP + username.
- Tambahkan delay/backoff setelah gagal berulang.

### 6. Rate limiter Credit API masih in-memory

File terkait:
- `frontend/src/lib/rateLimiter.ts`

Temuan:
- Rate limit memakai `Map` in-memory.

Risiko:
- Reset saat container restart.
- Tidak shared jika scale lebih dari satu instance.

Rekomendasi:
- Untuk production, pindahkan ke Redis/Postgres.

### 7. Media upload perlu hardening

File terkait:
- `frontend/src/app/api/media/upload/route.ts`
- `shared/utils/mediaValidation.ts`

Temuan:
- Validasi utama berdasarkan MIME dari `file.type`.
- Belum terlihat content sniffing/signature check.
- Perlu pastikan limit ukuran file konsisten di route/server/proxy.

Rekomendasi:
- Tambahkan limit size eksplisit di route.
- Verifikasi file magic bytes untuk image/video penting.
- Rate-limit upload.

### 8. Permission env terlalu longgar

Temuan:
- `.env` dan `frontend/.env` mode `644`.

Rekomendasi:
- Ubah ke `600` atau `640` sesuai user/group service yang butuh akses.

### 9. npm audit advisory

Temuan audit production dependency:
- Total: 6 advisory.
- High: 1.
- Moderate: 5.
- Paket terkait antara lain `fast-xml-builder`, `fast-xml-parser`, `next/postcss`, `ws`.

Rekomendasi:
- Jalankan update terkontrol di branch/staging.
- Build/test setelah update.

### 10. Nginx actual config belum sekuat template

Temuan:
- Actual aaPanel vhost masih mengaktifkan `TLSv1.1`.
- Security headers tidak selengkap template `aapanel-nginx.conf`.

Rekomendasi:
- Harden vhost: minimal TLS 1.2/1.3, security headers, cache static assets.
- Gunakan reload Nginx, bukan restart app, setelah config valid.

## Review Lanjutan yang Diminta Arr

Checklist berikut akan direview berikutnya secara read-only terlebih dahulu:

1. Sistem SPA / navigasi tanpa reload penuh.
2. Optimasi speed/performance.
3. Auto-refresh komentar tanpa refresh halaman.
4. Klik profile orang lain lalu bisa DM.
5. Typing/writing indicator saat user mengetik.
6. DM composer: `Shift+Enter` untuk baris baru, `Enter` untuk kirim.
7. Layout DM: tinggi halaman tetap, area chat saja yang scrolling.
8. Posisi notifikasi dibuat seperti Minbloom.
9. Konsistensi background mengikuti halaman home.

## Catatan Operasional

- Jangan restart/deploy sebelum ada instruksi eksplisit.
- Untuk perubahan code nanti, buat perubahan kecil per area dan verifikasi dengan build/typecheck/smoke test.
- Untuk config Nginx/WAF, minta approval sebelum reload/restart service.

---

# Review Lanjutan — HERTZ UX/SPA/DM/Notification

Scope tambahan sesuai daftar Arr:
- SPA behavior.
- Speed/performance.
- Auto-refresh komentar tanpa refresh halaman.
- Klik profile orang lain dan bisa DM.
- Typing/writing indicator.
- DM composer: `Shift+Enter` turun baris, `Enter` kirim.
- DM layout tetap, area chat saja scrolling.
- Posisi notifikasi seperti Minbloom.
- Background konsisten mengikuti home.

## A. Sistem SPA / Navigasi

### Temuan

1. Sebagian navigasi HERTZ masih memakai anchor HTML biasa (`<a href=...>`), sehingga berpotensi melakukan full page navigation, bukan client-side SPA navigation.

File terkait:
- `frontend/src/components/layout/HertzLayout.tsx`
  - Mobile brand memakai `<a href="/hertz">`.
- `frontend/src/components/feed/HertzLeftRail.tsx`
  - Menu kiri memakai `<a href={href}>`.
  - Link admin dan profile juga memakai `<a>`.
- `frontend/src/components/hertz/MobileBottomNav.tsx`
  - Bottom nav mobile memakai `<a href={href}>`.

2. Sebagian area feed sudah SPA-friendly karena memakai `next/link` dan `router.push`.

File terkait:
- `frontend/src/components/feed/HertzPost.tsx` memakai `Link` untuk hashtag/post detail.
- `frontend/src/components/feed/HertzPostArticle.tsx` memakai `router.push(href)` untuk buka detail post.

### Dampak

- Navigasi antar tab HERTZ bisa terasa reload penuh.
- State UI lokal hilang saat pindah tab.
- UX belum terasa seperti SPA penuh.

### Rekomendasi

- Ganti anchor internal HERTZ menjadi `next/link` untuk route internal.
- Pertahankan `<a>` hanya untuk external URL/download atau link yang memang harus full reload.
- Setelah diganti, smoke test mobile/desktop navigation: home, notifications, messages, profile, tools.

Prioritas: **P1**.

## B. Optimasi Speed / Performance

### Temuan

1. DM polling berjalan periodik per conversation aktif.

File terkait:
- `frontend/src/features/hertz/messages/useMessages.ts`
  - `setInterval(() => loadThread(activeId), HERTZ_DM_POLL_INTERVAL_MS)`.

Catatan:
- Ini sederhana dan bekerja, tetapi masih polling penuh thread.
- Jika user banyak membuka DM, request berkala tetap terjadi selama tab aktif.

2. Beberapa route memakai `cache: 'no-store'`, cocok untuk data realtime tetapi mengurangi cache benefit.

File terkait:
- DM inbox/thread/search.
- Auth/current user.

3. Navigasi `<a>` yang menyebabkan full reload juga berdampak ke speed karena asset/data hydration dimulai ulang.

### Rekomendasi

- Perbaiki SPA navigation dulu karena efek speed terasa langsung.
- Untuk DM/comment realtime, pertimbangkan incremental polling berbasis `since`/`lastMessageId`, bukan fetch seluruh thread terus-menerus.
- Tambahkan pause polling saat tab hidden (`document.visibilityState`) untuk mengurangi beban.
- Audit bundle/build setelah perubahan: `npm run build` atau script project yang sesuai.

Prioritas: **P1-P2**.

## C. Auto-refresh Komentar tanpa Refresh Halaman

### Temuan

File terkait:
- `frontend/src/components/feed/HertzDetailInteractions.tsx`

Saat comment/reply/delete/report, fungsi `afterMutation()` memanggil:

```ts
refreshPreserveScroll(router)
```

Dampak:
- Data komentar diperbarui dengan refresh router, bukan update state lokal.
- Belum ada polling/live refresh komentar otomatis ketika komentar baru masuk dari user lain.
- UX masih terasa seperti refresh data halaman.

### Rekomendasi

- Jadikan comment detail sebagai client state lokal:
  - load komentar dari API ke state,
  - setelah submit sukses append/replace state,
  - polling ringan komentar tiap beberapa detik saat post detail terbuka, atau pakai SSE/WebSocket nanti.
- Endpoint yang sudah ada bisa dipakai: `/api/hertz/posts/[shortId]/comments`.
- Hindari `router.refresh()` untuk operasi komentar biasa kecuali fallback error.

Prioritas: **P1**.

## D. Klik Profile Orang Lain dan Bisa DM

### Temuan

1. Profile page saat ini terlihat untuk akun sendiri:

File terkait:
- `frontend/src/app/hertz/profile/page.tsx`
  - Route `/hertz/profile` mengambil current member.

2. Author line belum menjadi link ke public profile.

File terkait:
- `frontend/src/components/feed/HertzAuthorLine.tsx`
  - Menampilkan nama dan username saja.

3. Avatar/author di post belum terlihat membuka profile member lain.

File terkait:
- `frontend/src/components/feed/HertzPost.tsx`
- `frontend/src/components/feed/HertzAvatar.tsx`
- `frontend/src/components/feed/HertzAuthorLine.tsx`

4. DM creation API sudah ada.

File terkait:
- `frontend/src/app/api/hertz/messages/conversations/route.ts`
  - `POST` dengan `recipientId` → `service.createDirect(...)`.
- `frontend/src/features/hertz/messages/useMessages.ts`
  - `startConversation(recipientId)` sudah ada untuk hasil search member.

### Gap

- Belum ada public profile route seperti `/hertz/@username` atau `/hertz/member/[id]`.
- Belum ada tombol “Message/DM” di profile publik.
- Belum ada link dari author post/comment ke profile publik.

### Rekomendasi

- Tambahkan route public profile, misalnya `/hertz/u/[username]` atau `/hertz/member/[memberId]`.
- Jadikan author name/avatar clickable ke public profile.
- Di public profile tambahkan tombol “Kirim DM” yang memanggil API conversation lalu redirect/route ke `/hertz/messages?conversation=...` atau set active conversation.
- Pastikan tidak menampilkan data private akun sendiri di profile publik.

Prioritas: **P1**.

## E. Typing / Writing Indicator

### Temuan

- Belum ditemukan implementasi typing/writing indicator pada DM.
- `MessageComposer.tsx` hanya mengirim body via textarea dan `onSend`.
- `useMessages.ts` belum punya state/API untuk typing.
- `MessageThread.tsx` belum render status “sedang mengetik”.

### Rekomendasi

Implementasi minimal:
- Client mengirim heartbeat typing saat textarea berubah, throttle 1-2 detik.
- API menyimpan status typing sementara di Redis/memory dengan TTL pendek 5-8 detik.
- Thread polling mengambil `typingUsers` bersama message payload.
- UI render: `Nama sedang mengetik...` di bawah message list / atas composer.

Catatan:
- Jika production multi-instance, jangan pakai memory local; gunakan Redis/Postgres TTL.

Prioritas: **P2**.

## F. DM Composer: Shift+Enter Turun, Enter Kirim

### Temuan

File terkait:
- `frontend/src/features/hertz/messages/MessageComposer.tsx`

Behavior sudah ada:

```ts
if (event.key === 'Enter' && !event.shiftKey) {
  event.preventDefault();
  if (activeId && !uploading && body.trim()) onSend();
}
```

Kesimpulan:
- `Enter` kirim pesan.
- `Shift+Enter` tidak dicegah, sehingga textarea tetap membuat baris baru.

Catatan kecil:
- Kondisi saat ini hanya kirim jika `body.trim()` ada. Jika pesan hanya attachment tanpa body, tombol kirim mungkin bisa, tapi Enter tidak mengirim attachment-only.

Rekomendasi:
- Sesuaikan kondisi Enter dengan rule `body.trim() || attachments.length > 0` agar attachment-only konsisten.

Prioritas: **P3**.

## G. Layout DM: Tinggi Tetap, Chat Saja yang Scrolling

### Temuan

File terkait:
- `frontend/src/features/hertz/messages/messages.module.css`

Current layout:
- `.dmLayout` memakai `min-height: min(720px, calc(100dvh - 12rem));`
- `.dmLayout` belum memakai fixed `height`.
- Sidebar/thread memakai `overflow: hidden`.
- Message list area memiliki overflow behavior, tetapi karena parent memakai `min-height`, halaman masih berpotensi ikut memanjang tergantung isi/header/composer.

Dampak:
- Requirement “halaman DM besarnya tetap tapi chat yang scrolling” belum sepenuhnya kuat.

Rekomendasi CSS:
- Ubah container DM dari `min-height` menjadi controlled height, contoh:
  - desktop: `height: calc(100dvh - var(--hertz-header-offset, 120px));`
  - mobile: `height: calc(100svh - mobile header - bottom nav);`
- Pastikan struktur thread:
  - header fixed dalam card,
  - `.messages` / `.messageList` = `flex: 1; overflow-y: auto; min-height: 0;`
  - composer fixed di bawah dalam card.
- Tambahkan `min-height: 0` pada semua grid/flex parent yang membungkus scroll area.

Prioritas: **P1**.

## H. Posisi Notifikasi seperti Minbloom

### Temuan

Ada dua jenis “notifikasi” yang terlihat:

1. Page notifications HERTZ
   - `frontend/src/features/hertz/notifications/NotificationsView.tsx`
   - `frontend/src/features/hertz/notifications/notifications.module.css`
   - Saat ini berupa panel/list di area konten.

2. Toast global
   - `frontend/src/components/ui/Toast.tsx`
   - `frontend/src/components/ui/Toast.module.css`
   - Posisi toast berada fixed top-right (`.toastContainer`).

Gap:
- Belum ada acuan Minbloom di repo yang bisa dibandingkan langsung dari review ini.
- Jika yang dimaksud adalah notification dropdown/popover ala Minbloom, implementasi HERTZ sekarang masih page-based/list, bukan floating notification center.

Rekomendasi:
- Minta/cek referensi visual Minbloom atau file project Minbloom jika ada di server.
- Jika pattern-nya seperti notification center, buat komponen bell/dropdown di shell kanan/atas, bukan page list saja.
- Untuk mobile, posisikan notification center dekat header/bottom nav sesuai pattern Minbloom.

Prioritas: **P2**, perlu referensi visual/arah desain.

## I. Background Konsisten Mengikuti Home

### Temuan

File terkait:
- `frontend/src/components/layout/HertzLayout.module.css`
  - `.main { background: #0f0f14; }`
- `frontend/src/features/hertz/messages/messages.module.css`
  - DM panel background sendiri `rgba(2, 12, 7, 0.72)`.
- `frontend/src/features/hertz/notifications/notifications.module.css`
  - Notification panel background sendiri `rgba(2, 12, 7, 0.78)`.
- `frontend/src/app/HorizonLanding.module.css`
  - Landing/home memakai background yang lebih kaya dengan gradient/radial treatment.

Dampak:
- HERTZ page background terasa lebih flat dan tidak sepenuhnya mengikuti visual home.
- Beberapa panel sudah hijau gelap, tapi base background antar halaman belum konsisten.

Rekomendasi:
- Buat shared background token/class untuk Horizon/HERTZ, misalnya `.horizonSurfaceBg`.
- Terapkan di `HertzLayout.module.css` supaya semua subpage otomatis konsisten.
- Panel DM/notification tetap bisa pakai glass/dark overlay, tapi base page mengikuti home.

Prioritas: **P2**.

## Prioritas Eksekusi Jika Nanti Diizinkan Ubah Kode

1. **P1 — SPA nav:** ganti internal `<a>` menjadi `Link`.
2. **P1 — DM fixed layout:** container height tetap, message list saja scroll.
3. **P1 — Comments realtime UX:** hilangkan `router.refresh()` untuk mutation normal, pakai state lokal + polling ringan.
4. **P1 — Public profile + DM CTA:** author/avatar clickable, public profile route, tombol DM.
5. **P2 — Typing indicator:** typing endpoint + TTL + UI indicator.
6. **P2 — Background shared style:** base background ikut home.
7. **P2 — Notification Minbloom style:** perlu referensi pattern Minbloom, lalu implement dropdown/positioning.
8. **P3 — Composer attachment-only Enter:** kecil, tapi bagus untuk konsistensi.

## Status Review

- Review masih **read-only**.
- Tidak ada file source yang diubah.
- File dokumentasi temuan ini diperbarui sesuai instruksi Arr.

---

# Audit Lanjutan — Rekomendasi Speed Client Next.js

Tanggal update: 22 Mei 2026
Mode: **read-only audit** — source code tidak diubah.

Tujuan audit ini: menilai apa yang paling berpengaruh agar Horizon/HERTZ terasa sangat cepat di client tanpa menjadikan seluruh aplikasi full SPA murni.

## Ringkasan Rekomendasi Utama

Pendekatan terbaik untuk Horizon adalah **hybrid Next.js**:

- Server Components untuk initial render dan data awal.
- Client Components hanya untuk interaksi yang memang butuh browser state.
- Client-side navigation untuk route internal.
- Cache client untuk data realtime ringan.
- Lazy-load komponen berat.
- Realtime/polling efisien untuk DM, komentar, notifikasi.

Jangan mengubah seluruh app menjadi SPA murni. Next.js akan lebih cepat jika server/client dipakai sesuai fungsi.

## 1. Client-side Navigation Harus Dirapikan

### Temuan

Masih ada internal route yang memakai anchor biasa:

- `frontend/src/components/layout/HertzLayout.tsx`
  - mobile brand: `<a href="/hertz">`
- `frontend/src/components/feed/HertzLeftRail.tsx`
  - admin/profile/internal nav masih `<a href=...>`
- `frontend/src/components/hertz/MobileBottomNav.tsx`
  - bottom nav mobile masih `<a href=...>`
- `frontend/src/app/hertz/post/[shortId]/page.tsx`
  - back link: `<a href="/hertz">`

### Dampak

- Browser bisa melakukan full reload.
- Navigasi terasa lebih lambat.
- State client hilang lebih mudah.

### Rekomendasi

- Ganti internal route ke `next/link`.
- Gunakan `router.push()` hanya untuk navigasi berbasis action.
- Biarkan `<a>` untuk external link saja.

Prioritas: **P1 — dampak langsung ke rasa cepat aplikasi**.

## 2. Gunakan SWR atau TanStack Query untuk Data Realtime Ringan

### Temuan

Dependency saat ini belum terlihat memakai `swr` atau `@tanstack/react-query`.

Client fetch masih manual di banyak komponen:

- DM: `frontend/src/features/hertz/messages/useMessages.ts`
- Notifications: `frontend/src/features/hertz/notifications/NotificationsView.tsx`
- Notification summary rail/mobile: `HertzLeftRail`, `HertzRightRail`, `MobileBottomNav`
- Comments: `frontend/src/components/feed/HertzDetailInteractions.tsx`
- Market rail/mobile: `HertzRightRail`, `HertzMobileMarket`

### Dampak

- Fetch/cache/deduping belum terpusat.
- Komponen berbeda bisa memanggil endpoint yang sama sendiri-sendiri.
- Auto-refresh perlu ditulis manual berulang.

### Rekomendasi

Pilih salah satu:

1. **SWR** — lebih ringan dan cocok untuk Next.js + polling sederhana.
2. **TanStack Query** — lebih lengkap untuk mutation, optimistic update, cache invalidation besar.

Untuk Horizon/HERTZ, rekomendasi saya: **SWR dulu** karena kebutuhan awalnya:
- komentar auto-refresh,
- notification summary,
- DM polling ringan,
- market rail cache,
- auth/me cache.

Pattern yang disarankan:
- `useSWR('/api/auth/me', fetcher)` untuk current user.
- `useSWR('/api/hertz/notifications/summary', fetcher, { refreshInterval: 25000 })`.
- `useSWR(['/api/hertz/posts', filter], fetcher)` untuk feed jika nanti client-side.
- `useSWR(['/api/hertz/posts/[id]/comments'], fetcher, { refreshInterval: 5000 })` untuk comments.
- Mutasi comment/like/DM pakai optimistic update + revalidate.

Prioritas: **P1** untuk comments/notifications, **P2** untuk area lain.

## 3. DM Polling Perlu Dibuat Lebih Efisien

### Temuan

File:
- `frontend/src/features/hertz/messages/useMessages.ts`

Saat conversation aktif:

```ts
const timer = window.setInterval(() => void loadThread(activeId), HERTZ_DM_POLL_INTERVAL_MS);
```

### Dampak

- Fetch thread penuh berkala.
- Tidak pause saat tab hidden.
- Belum incremental berdasarkan `lastMessageId`/`since`.

### Rekomendasi

Tahap cepat:
- Pause polling saat `document.visibilityState === 'hidden'`.
- Gunakan SWR `refreshInterval` yang otomatis bisa dikontrol.
- Jangan fetch jika tidak ada `activeId`.

Tahap bagus:
- Endpoint thread menerima `?after=<lastMessageId>` atau `?since=<timestamp>`.
- Client append message baru, bukan replace semua thread.

Tahap terbaik:
- SSE/WebSocket untuk DM + typing indicator.

Prioritas: **P1-P2**.

## 4. Comments Jangan Pakai Router Refresh untuk UX Realtime

### Temuan

File:
- `frontend/src/components/feed/HertzDetailInteractions.tsx`

Mutation komentar masih memanggil refresh route melalui helper `refreshPreserveScroll(router)`.

### Dampak

- Terasa seperti refresh data halaman.
- Tidak realtime untuk komentar user lain.
- Lebih berat dibanding update state lokal.

### Rekomendasi

- Jadikan comments client cache via SWR.
- Setelah submit, optimistic append komentar baru.
- Poll 5-10 detik saat post detail terbuka.
- Jika nanti sudah ada WebSocket/SSE, ganti polling dengan push event.

Prioritas: **P1**.

## 5. Terlalu Banyak Client Component Perlu Diaudit

### Temuan

Jumlah file dengan `'use client'`: **110 file**.

Client component besar antara lain:
- `frontend/src/components/tools/ProfitabilityTool.tsx` — 620 baris.
- `frontend/src/components/admin/OutlookEditor.tsx` — 562 baris.
- `frontend/src/components/admin/CreditSettings.tsx` — 482 baris.
- `frontend/src/components/tools/ChallengeTrackerTool.tsx` — 449 baris.
- `frontend/src/components/feed/HertzComposer.tsx` — 434 baris.
- `frontend/src/components/admin/ArticleEditor.tsx` — 415 baris.
- `frontend/src/components/admin/LogViewer.tsx` — 394 baris.
- `frontend/src/components/admin/Charts.tsx` — 349 baris.

### Dampak

- JS bundle client lebih besar.
- Hydration lebih berat.
- Interaksi awal bisa terasa lambat di mobile.

### Rekomendasi

- Pecah client component besar menjadi:
  - server wrapper untuk data awal/layout statis,
  - client island kecil untuk interaksi.
- Jangan taruh `'use client'` di page besar jika hanya sebagian kecil interaktif.
- Admin/tool berat boleh tetap client, tapi lazy-load saat route/tool dibuka.

Prioritas: **P2**.

## 6. Lazy Load Komponen Berat

### Temuan

Dynamic import/lazy loading sudah ada, tapi masih terbatas:
- Gallery lightbox.
- Admin editor/chart tertentu.

Belum terlihat untuk sebagian komponen berat tools/feed/admin.

Komponen kandidat lazy-load:
- Tools berat: Profitability, Challenge Tracker, Elliott Wave, Order Book.
- Chart/Recharts: `Sparkline`, admin `Charts`.
- Composer/modal besar: `HertzComposer`, post detail modal, share sheet, report dialog.

### Rekomendasi

- Gunakan `next/dynamic` untuk komponen yang tidak langsung terlihat above-the-fold.
- Untuk modal/dialog, load ketika dibuka.
- Untuk chart, tampilkan skeleton ringan dulu.

Prioritas: **P2**.

## 7. Image Optimization Belum Konsisten

### Temuan

`next/image` sudah dipakai di beberapa tempat, tetapi masih ada raw `<img>` di banyak komponen:

- `frontend/src/components/feed/HertzPostMedia.tsx`
- `frontend/src/components/feed/HertzAvatar.tsx`
- `frontend/src/features/hertz/messages/DmAvatar.tsx`
- `frontend/src/features/hertz/messages/MessageThread.tsx`
- `frontend/src/features/hertz/messages/MessageComposer.tsx`
- `frontend/src/components/blog/BlogCard.tsx`
- `frontend/src/components/outlook/OutlookCard.tsx`
- beberapa page detail artikel/blog/outlook.

Next config sudah mendukung image formats:
- AVIF
- WebP

### Dampak

- Gambar bisa lebih berat dari perlu.
- Layout shift lebih mungkin jika width/height tidak jelas.
- Lazy loading native tidak selalu konsisten.

### Rekomendasi

- Pakai `next/image` untuk media yang aman/domain jelas.
- Untuk dynamic user-upload image, pastikan remotePatterns mencakup domain storage.
- Jika tetap raw `<img>`, minimal tambahkan `loading="lazy"`, `decoding="async"`, width/height/aspect-ratio.

Prioritas: **P2**.

## 8. Banyak Page Dipaksa Dynamic

### Temuan

Banyak page memakai:

```ts
export const dynamic = 'force-dynamic';
```

Contoh:
- `frontend/src/app/page.tsx`
- `frontend/src/app/hertz/page.tsx`
- `frontend/src/app/hertz/post/[shortId]/page.tsx`
- `frontend/src/app/blog/page.tsx`
- `frontend/src/app/blog/[slug]/page.tsx`
- `frontend/src/app/outlook/page.tsx`
- `frontend/src/app/outlook/[slug]/page.tsx`
- `frontend/src/app/gallery/page.tsx`

### Dampak

- Next.js tidak bisa memanfaatkan static/ISR secara maksimal.
- TTFB bisa lebih lambat untuk halaman publik yang sebenarnya bisa cache.

### Rekomendasi

Pisahkan kategori:

1. **Harus dynamic/private**
   - profile, messages, notifications, admin, halaman yang tergantung session.

2. **Bisa ISR/cache pendek**
   - landing home,
   - blog list/detail,
   - outlook list/detail,
   - gallery,
   - public HERTZ post detail untuk guest.

3. **Hybrid**
   - HERTZ feed: public feed bisa cache pendek, viewer-specific actions di client.

Rekomendasi awal:
- Hapus `force-dynamic` dari page publik yang tidak perlu session.
- Gunakan `revalidate = 60` / `300` sesuai jenis konten.
- Untuk data personal, ambil di client setelah initial render.

Prioritas: **P2**, perlu test hati-hati agar session/admin tidak bocor.

## 9. Notification Summary Dipanggil dari Beberapa Tempat

### Temuan

Endpoint `/api/hertz/notifications/summary` dipanggil berkala dari beberapa komponen:
- `HertzLeftRail`
- `HertzRightRail`
- `MobileBottomNav`

Interval sekitar 25 detik.

### Dampak

- Bisa terjadi duplikasi request untuk data sama.
- Semakin terasa di mobile/desktop jika beberapa rail mounted bersamaan.

### Rekomendasi

- Pusatkan summary notification ke SWR key yang sama agar request dedupe.
- Atau buat provider kecil `HertzNotificationProvider` di layout.
- Polling satu sumber, komponen lain membaca cache/context.

Prioritas: **P1-P2**.

## 10. CSS Besar dan Duplikasi Perlu Dirapikan

### Temuan

CSS besar:
- `frontend/src/app/HorizonLanding.module.css` — 1436 baris.
- `frontend/src/features/marketing/HorizonLanding.module.css` — 1436 baris.
- `frontend/src/components/tools/ToolShell.module.css` — 985 baris.
- `frontend/src/features/hertz/messages/messages.module.css` — 778 baris.
- `frontend/src/components/feed/HertzRails.module.css` — 606 baris.

Dua file landing CSS berukuran sama tetapi tidak identik sepenuhnya.

### Dampak

- Maintenance berat.
- Potensi style drift.
- CSS yang tidak terpakai bisa ikut membesar tergantung import path.

### Rekomendasi

- Pastikan hanya satu source landing CSS yang dipakai.
- Pecah CSS besar berdasarkan komponen/section.
- Buat shared token untuk background, card, border, text muted, accent.
- Hindari copy-paste style antar HERTZ/messages/notifications.

Prioritas: **P3**, setelah UX utama.

## 11. Bundle Analyzer Belum Tersedia di Script

### Temuan

Belum terlihat dependency/script khusus bundle analyzer.

### Rekomendasi

Tambahkan saat mulai optimasi performa:
- `@next/bundle-analyzer`, atau
- gunakan analyzer bawaan build jika tersedia.

Script contoh nanti:

```json
"analyze": "ANALYZE=true npm run build:frontend"
```

Tujuan:
- lihat chunk terbesar,
- cek apakah Recharts/lucide/tools ikut masuk route yang tidak perlu,
- ukur dampak lazy-load.

Prioritas: **P2** sebelum refactor besar.

## Rencana Eksekusi yang Saya Rekomendasikan

Jika nanti Arr mengizinkan perubahan kode, urutan paling aman:

1. **Navigasi SPA internal**
   - `<a href>` internal → `next/link`.
   - Smoke test semua menu HERTZ.

2. **SWR untuk notification summary + comments**
   - Dedup request notifikasi.
   - Comments auto-refresh tanpa `router.refresh()`.

3. **DM layout + polling efisien**
   - Fixed-height layout.
   - Polling pause saat tab hidden.
   - Siapkan typing indicator.

4. **Public profile + DM CTA**
   - Link author/avatar.
   - Route profile publik.
   - Tombol DM.

5. **Lazy-load heavy components**
   - Tools/chart/modal berat.

6. **Image optimization**
   - Ganti raw image penting ke `next/image` atau minimal lazy/async.

7. **Review dynamic/cache strategy**
   - Jangan semua page `force-dynamic`.
   - Terapkan ISR untuk publik.

8. **Bundle analyzer + build gate**
   - Jalankan build/typecheck/lint setelah perubahan.

## Status

- Audit tambahan selesai dan dicatat di file ini.
- Source code tetap tidak diubah.
- Belum build/deploy/restart.

---

# Alasan di Balik Rekomendasi Speed Client

Bagian ini menjelaskan **kenapa** rekomendasi audit speed client diberikan, agar nanti saat implementasi tidak hanya mengikuti daftar teknis, tetapi jelas dampaknya ke user experience, performa, dan risiko produksi.

## 1. Kenapa internal `<a href>` perlu diganti `next/link`

Alasan:
- `<a href>` untuk route internal berpotensi membuat browser melakukan full document navigation.
- Full navigation memuat ulang layout, state client, dan sebagian resource.
- `next/link` memakai client-side routing Next.js dan bisa prefetch route.

Dampak yang diharapkan:
- Perpindahan Home → Messages → Notifications → Profile terasa lebih instan.
- Tidak ada efek reload/flash yang mengganggu.
- State lokal seperti scroll, menu, atau draft lebih mudah dipertahankan.

Risiko jika tidak dilakukan:
- HERTZ terasa seperti website tradisional, bukan app modern.
- Optimasi lain seperti cache client tetap terasa kurang maksimal karena navigasi masih reload.

## 2. Kenapa saya rekomendasikan SWR lebih dulu

Alasan:
- Kebutuhan Horizon saat ini banyak berupa data yang perlu refresh ringan: comments, notifications, DM summary, market rail, auth/me.
- Fetch manual tersebar di banyak komponen, sehingga deduping/cache tidak terpusat.
- SWR ringan, sederhana, cocok untuk Next.js, dan cukup untuk polling/revalidate/optimistic update awal.

Dampak yang diharapkan:
- Request endpoint yang sama bisa didedup.
- Komentar/notifikasi bisa auto-refresh tanpa reload halaman.
- Mutation seperti komentar/like bisa update UI dulu, lalu sync ke server.

Kenapa bukan langsung WebSocket semua:
- WebSocket/SSE lebih bagus untuk realtime penuh, tetapi butuh desain server, lifecycle connection, auth, reconnect, dan scaling.
- SWR lebih cepat diterapkan dan risikonya lebih rendah untuk tahap awal.

## 3. Kenapa comments sebaiknya tidak memakai `router.refresh()`

Alasan:
- `router.refresh()` memicu refresh data server component/route, bukan update granular komentar saja.
- Untuk aksi kecil seperti tambah/hapus komentar, refresh route terasa berat.
- UX komentar idealnya langsung muncul tanpa halaman terasa reload.

Dampak yang diharapkan:
- Komentar baru langsung muncul.
- Scroll lebih stabil.
- User lain yang komentar bisa muncul melalui polling ringan.

Risiko jika tetap `router.refresh()`:
- Interaksi komentar terasa lambat.
- State UI bisa reset.
- Beban server lebih besar dibanding update cache komentar saja.

## 4. Kenapa DM polling perlu dibuat efisien

Alasan:
- Saat ini thread aktif dipoll berkala.
- Jika fetch mengambil seluruh thread setiap interval, semakin panjang chat semakin berat.
- Polling tetap berjalan saat tab tidak aktif akan membuang request.

Dampak yang diharapkan:
- DM tetap realtime ringan tanpa membebani server.
- Mobile lebih hemat baterai/data.
- UI tetap cepat meski thread panjang.

Tahapan logis:
1. Pause polling saat tab hidden.
2. Fetch incremental dengan `after/since`.
3. Baru naik ke SSE/WebSocket untuk realtime penuh dan typing indicator.

## 5. Kenapa banyak `'use client'` perlu diaudit

Alasan:
- Setiap client component menambah JavaScript yang harus dikirim, diparse, dan dihydrate di browser.
- File besar yang diberi `'use client'` sering membawa child/dependency ikut masuk bundle client.
- Mobile device paling terasa dampaknya.

Dampak yang diharapkan:
- Initial load lebih ringan.
- Hydration lebih cepat.
- Interaksi awal lebih responsif.

Catatan:
- Bukan berarti semua `'use client'` salah.
- Yang perlu diaudit adalah page/component besar yang sebenarnya sebagian besar hanya layout/data statis.

## 6. Kenapa heavy components perlu lazy-load

Alasan:
- Tools, chart, editor, modal, dan composer berat tidak selalu dibutuhkan saat first paint.
- Jika dimuat semua dari awal, route menjadi berat meskipun user belum membuka fitur tersebut.

Dampak yang diharapkan:
- First load lebih cepat.
- Route utama HERTZ tidak ikut menanggung beban tools/chart/admin.
- Modal/dialog baru memuat JS ketika benar-benar dibuka.

Risiko jika tidak dilakukan:
- Bundle membesar diam-diam.
- User mobile merasa aplikasi lambat walaupun server cepat.

## 7. Kenapa image optimization penting

Alasan:
- Feed, DM, avatar, blog, outlook banyak menampilkan media.
- Raw `<img>` tanpa lazy/size/aspect ratio bisa menyebabkan layout shift dan download terlalu besar.
- Next config sudah mendukung AVIF/WebP, jadi sebaiknya dimanfaatkan.

Dampak yang diharapkan:
- Gambar lebih ringan.
- Layout lebih stabil.
- LCP/CLS lebih baik.

Catatan:
- Untuk user-upload image yang domainnya dinamis, perlu pastikan `remotePatterns` aman dan lengkap.
- Jika belum bisa pakai `next/image`, minimal pakai `loading="lazy"` dan `decoding="async"`.

## 8. Kenapa `force-dynamic` perlu dikurangi di page publik

Alasan:
- `force-dynamic` memaksa render dinamis dan membatasi cache/static optimization.
- Banyak halaman publik seperti landing/blog/outlook/gallery biasanya tidak perlu selalu render fresh per request.

Dampak yang diharapkan:
- TTFB lebih cepat untuk halaman publik.
- Beban server turun.
- CDN/cache bisa bekerja lebih efektif.

Risiko yang harus dijaga:
- Jangan cache halaman yang berisi data private/session.
- Halaman profile, messages, notifications, admin tetap dynamic/private.

## 9. Kenapa notification summary perlu dipusatkan

Alasan:
- Summary notification dipanggil dari beberapa komponen dengan interval mirip.
- Tanpa shared cache/context, endpoint yang sama bisa ditembak beberapa kali.

Dampak yang diharapkan:
- Request lebih sedikit.
- Badge notification tetap konsisten di left rail, right rail, dan mobile nav.
- Logic polling lebih mudah dirawat.

## 10. Kenapa perlu bundle analyzer sebelum refactor besar

Alasan:
- Optimasi tanpa ukuran bundle bisa menjadi tebak-tebakan.
- Bundle analyzer menunjukkan chunk terbesar dan dependency yang ikut masuk route.

Dampak yang diharapkan:
- Refactor lebih tepat sasaran.
- Bisa mengukur sebelum/sesudah lazy-load.
- Mencegah library berat masuk ke route yang tidak membutuhkan.

## Kesimpulan Alasan Teknis

Rekomendasi saya diarahkan untuk tiga tujuan utama:

1. **Mengurangi full reload**
   - lewat `next/link`, client routing, dan cache client.

2. **Mengurangi JavaScript dan kerja browser**
   - lewat audit `'use client'`, lazy-load, image optimization, dan bundle analyzer.

3. **Mengurangi request yang tidak perlu**
   - lewat SWR/cache dedupe, polling efisien, pause saat tab hidden, dan cache page publik.

Dengan urutan ini, Horizon bisa terasa lebih cepat di client tanpa mengorbankan kelebihan Next.js di server rendering dan SEO.

---

# Audit Lanjutan — Konsistensi Background & Warna Antar Page

Tanggal update: 22 Mei 2026
Mode: **read-only audit** — source code tidak diubah.

## Jawaban Singkat

Warna/background Horizon **belum sepenuhnya konsisten** antar page.

Secara rasa visual masih satu keluarga: dark green/black dengan aksen hijau. Tetapi secara implementasi CSS, warna dasar, panel, border, accent, dan muted text masih banyak hardcoded dan berbeda-beda antar halaman.

Kesimpulan: **brand direction konsisten, token/style system belum konsisten**.

## Evidence dari File

### 1. Global theme punya token dasar, tapi belum dipakai merata

File:
- `frontend/src/app/globals.css`

Token dark utama:

```css
--color-bg: #0a0a0a;
--color-surface: #141414;
--hertz-shell-bg: #0f0f14;
--hertz-accent-bright: #13d27b;
--hertz-muted-text: #8fa899;
--hertz-surface: rgba(2, 12, 7, 0.82);
--hertz-border: rgba(19, 210, 123, 0.26);
--color-accent: #10b981;
```

Catatan:
- Token sudah ada.
- Namun banyak module CSS masih pakai nilai langsung seperti `#0f0f14`, `#020906`, `#13d27b`, `rgba(...)`, bukan selalu memakai token.

### 2. Home / Landing punya background sendiri yang lebih kaya

File:
- `frontend/src/app/HorizonLanding.module.css`
- `frontend/src/features/marketing/HorizonLanding.module.css`

Landing memakai token lokal:

```css
--lp-bg: #050a07;
--lp-bg-deep: #020503;
--lp-surface: rgba(10, 22, 14, 0.82);
```

Dan background `main` memakai campuran gradient/radial treatment.

Dampak:
- Home terasa lebih premium/depth.
- HERTZ/app pages terasa lebih flat karena base-nya hanya `#0f0f14`.

### 3. HERTZ layout memakai base flat `#0f0f14`

File:
- `frontend/src/components/layout/HertzLayout.module.css`
- `frontend/src/components/hertz/HertzAppShell.module.css`

Keduanya punya pola:

```css
.main {
  background: #0f0f14;
  color: #e7f4ec;
}
```

Catatan penting:
- Dua file ini sangat mirip fungsinya dan sama-sama mendefinisikan shell background.
- Ini rawan drift: kalau satu diperbaiki, yang lain bisa tertinggal.

### 4. HERTZ post detail memakai token, tapi fallback tetap `#0f0f14`

File:
- `frontend/src/app/hertz/post/[shortId]/post-detail.module.css`

```css
background: var(--hertz-shell-bg, #0f0f14);
```

Ini lebih baik dibanding hardcoded penuh, tapi token `--hertz-shell-bg` saat ini masih flat `#0f0f14`, belum mengikuti background home.

### 5. Blog / Outlook / Tools memakai panel hijau gelap, tapi base ikut HERTZ layout

File:
- `frontend/src/app/blog/layout.tsx`
- `frontend/src/app/outlook/layout.tsx`
- `frontend/src/app/tools/layout.tsx`

Semua dibungkus `HertzLayout`, jadi base page ikut HERTZ flat `#0f0f14`.

Panel CSS:
- `frontend/src/app/blog/page.module.css`
- `frontend/src/app/outlook/page.module.css`
- `frontend/src/app/tools/tools.module.css`

Banyak panel memakai:

```css
background: rgba(2, 12, 7, 0.82);
border: 1px solid rgba(19, 210, 123, 0.32);
```

Ini konsisten secara arah, tapi belum sepenuhnya tokenized.

### 6. Gallery inactive panel lebih gelap sendiri

File:
- `frontend/src/app/gallery/page.module.css`

```css
background: #020906;
```

Dampak:
- Gallery panel lebih dekat ke deep green/black.
- Masih cocok, tapi berbeda dari HERTZ shell dan landing token.

### 7. Admin punya warna dasar mirip HERTZ tapi tetap hardcoded

File:
- `frontend/src/app/admin/(dashboard)/layout.module.css`
- `frontend/src/app/admin/login/page.module.css`

Contoh:

```css
background: #0f0f14;
background: #0a0a0f;
```

Admin terlihat satu keluarga dengan HERTZ, tetapi bukan mengikuti shared background token home.

## Warna yang Tidak Konsisten

### Base background

Nilai yang muncul:
- `#0a0a0a` — global body token.
- `#050a07` — landing background.
- `#020503` — landing deep background.
- `#0f0f14` — HERTZ/admin shell.
- `#020906` — gallery panel.
- `#0a0a0f` — admin sidebar.

Masalah:
- Semua dark, tapi hue/temperature berbeda.
- Home lebih green-black, HERTZ/admin lebih neutral bluish-black.

### Accent green

Nilai yang muncul:
- `#10b981` — global accent.
- `#13d27b` — HERTZ bright accent.
- `#00e38a` — outlook detail accent.
- `#34d399` — lighter green.
- `#059669` — admin/chart green.
- `#084729` — dark green block/avatar/accent.

Masalah:
- Secara visual masih hijau, tapi tidak ada single scale yang jelas.
- Bisa membuat page terasa sedikit beda produk.

### Muted text

Nilai yang muncul:
- `#8fa899`
- `#8ea897`
- `#9eb8a9`
- `#9ca3af`
- `#769383`
- `#a1a1a1`

Masalah:
- Perbedaan kecil ini membuat hierarchy text antar page tidak seragam.

### Border

Nilai yang muncul:
- `rgba(19, 210, 123, 0.26)`
- `rgba(19, 210, 123, 0.32)`
- `rgba(75, 118, 92, 0.28)`
- `rgba(76, 118, 94, 0.32)`
- `rgba(255, 255, 255, 0.05)`

Masalah:
- Border hijau dan border putih transparan bercampur tanpa aturan jelas.
- Beberapa page terasa lebih “HERTZ”, beberapa lebih “generic dark UI”.

## Penilaian Per Area

| Area | Konsistensi Visual | Catatan |
|---|---:|---|
| Home/Landing | Baik sendiri | Paling premium, gradient/depth kuat |
| HERTZ Feed/Layout | Sedang | Flat `#0f0f14`, belum mengikuti home |
| HERTZ Profile | Sedang-baik | Banyak green panels, tapi hardcoded |
| DM/Messages | Sedang | Panel gelap hijau, base tetap flat |
| Notifications | Sedang | Sejalan dengan HERTZ, belum tokenized penuh |
| Blog/Outlook/Tools | Sedang | Dibungkus HERTZ layout, panel cukup searah |
| Gallery | Sedang | Lebih deep green sendiri |
| Admin | Sedang | Mirip HERTZ, tapi lebih neutral/dark admin |

## Rekomendasi Konsistensi Background

### P1 — Buat shared Horizon background token

Tambahkan token global, misalnya di `globals.css`:

```css
--horizon-bg-base: #050a07;
--horizon-bg-deep: #020503;
--horizon-bg-shell: #07100b;
--horizon-surface: rgba(10, 22, 14, 0.82);
--horizon-surface-strong: rgba(2, 12, 7, 0.88);
--horizon-border: rgba(19, 210, 123, 0.28);
--horizon-accent: #13d27b;
--horizon-accent-soft: #10b981;
--horizon-text: #f3fff8;
--horizon-text-muted: #8fa899;
```

Alasan:
- Semua page bisa memakai sumber warna yang sama.
- Kalau brand color berubah, cukup edit token.
- Mengurangi hardcoded drift antar module CSS.

### P1 — Buat shared background class/mixin pattern

Untuk base app page, gunakan background yang mengikuti home tetapi lebih subtle:

```css
background:
  radial-gradient(circle at top left, rgba(19, 210, 123, 0.08), transparent 34rem),
  radial-gradient(circle at top right, rgba(34, 199, 138, 0.05), transparent 28rem),
  linear-gradient(180deg, var(--horizon-bg-base), var(--horizon-bg-deep));
```

Terapkan ke:
- `HertzLayout.module.css`
- `HertzAppShell.module.css`
- admin layout jika ingin admin tetap satu brand.

Alasan:
- HERTZ, Blog, Outlook, Tools, Gallery otomatis ikut karena dibungkus shell.
- Home tetap lebih kaya, app pages tetap konsisten tapi tidak terlalu ramai.

### P1 — Satukan `HertzLayout` dan `HertzAppShell` style

Masalah:
- `frontend/src/components/layout/HertzLayout.module.css`
- `frontend/src/components/hertz/HertzAppShell.module.css`

Keduanya punya banyak style shell yang mirip.

Rekomendasi:
- Pilih satu shell utama.
- Atau minimal samakan token dan background di keduanya.

Alasan:
- Mengurangi risiko satu page sudah konsisten, page lain tertinggal.

### P2 — Ganti hardcoded warna utama ke token

Target awal:
- `#0f0f14` → `var(--horizon-bg-shell)` atau shared background.
- `#13d27b` → `var(--horizon-accent)`.
- `rgba(2, 12, 7, 0.82)` → `var(--horizon-surface)`.
- `rgba(19, 210, 123, 0.26/0.32)` → `var(--horizon-border)`.
- `#8ea897/#8fa899/#9eb8a9` → `var(--horizon-text-muted)`.

Alasan:
- Konsistensi visual meningkat tanpa redesign besar.
- Patch bisa kecil dan aman.

### P2 — Tetapkan 3 level surface

Rekomendasi level:

1. **Page background**
   - gradient dark green-black.
2. **Panel/card surface**
   - `rgba(2, 12, 7, 0.82)` atau token baru.
3. **Elevated/modal surface**
   - sedikit lebih terang/solid, misalnya `rgba(10, 22, 14, 0.94)`.

Alasan:
- DM, notifications, profile, blog card, tools card akan punya hierarchy yang sama.

### P3 — Admin boleh sedikit berbeda, tapi tetap pakai token brand

Admin bisa tetap lebih utilitarian/neutral, tetapi sebaiknya tetap memakai token:
- base sama,
- sidebar sedikit lebih deep,
- accent sama.

Alasan:
- Admin tetap terasa bagian dari Horizon, bukan template terpisah.

## Prioritas Fix Jika Nanti Diizinkan Ubah Kode

1. Update global tokens di `globals.css`.
2. Terapkan shared background ke `HertzLayout.module.css` dan `HertzAppShell.module.css`.
3. Ganti hardcoded base/accent/surface/border di HERTZ pages utama.
4. Rapikan Blog/Outlook/Tools/Gallery agar memakai token surface yang sama.
5. Rapikan Admin belakangan supaya tidak mengganggu area user-facing.

## Kesimpulan

Jawaban akhir: **belum konsisten penuh**.

- Secara identitas warna: sudah satu arah, dark green Horizon.
- Secara implementasi: belum konsisten karena banyak hardcoded colors dan shell background berbeda.
- Perbaikan terbaik bukan redesign, tapi membuat shared token/background lalu mengganti hardcoded warna secara bertahap.

---

# Keputusan Arr — Target Warna Background Horizon

Tanggal update: 22 Mei 2026
Status: **design direction dari Arr**.

Arr menunjuk area hitam di left sidebar HERTZ dan menetapkan warna tersebut sebagai warna yang ingin diterapkan ke seluruh background Horizon.

## Warna Target

```css
#0a0a0f
```

Sumber warna saat ini:

```css
/* frontend/src/components/feed/HertzRails.module.css */
.left {
  background: #0a0a0f;
}
```

## Makna Keputusan

Warna `#0a0a0f` menjadi kandidat **global base background** untuk Horizon, menggantikan variasi background yang sekarang tersebar seperti:

- `#0f0f14` — HERTZ/app shell saat ini.
- `#050a07` — landing/home background.
- `#020503` — landing/home deep background.
- `#020906` — gallery panel.
- `#0a0a0a` — global dark body token.

## Rekomendasi Implementasi Nanti

Jika Arr mengizinkan perubahan kode, jadikan warna ini token global, misalnya:

```css
:root,
[data-theme="dark"] {
  --horizon-bg-base: #0a0a0f;
  --horizon-bg-shell: #0a0a0f;
}
```

Lalu terapkan bertahap ke background utama:

- `body` / global dark theme bila aman.
- `HertzLayout.module.css`.
- `HertzAppShell.module.css`.
- HERTZ feed/detail/messages/notifications/profile.
- Blog/Outlook/Tools/Gallery yang dibungkus Horizon/HERTZ layout.
- Admin belakangan jika ingin seluruh produk benar-benar seragam.

## Catatan Visual

- `#0a0a0f` adalah dark neutral-black dengan sedikit blue/purple tone.
- Cocok untuk base background karena lebih gelap dan stabil dibanding `#0f0f14`.
- Untuk menjaga depth, panel/card tetap sebaiknya memakai surface berbeda, contoh `rgba(2, 12, 7, 0.82)` atau token surface baru.
- Jangan semua elemen dibuat `#0a0a0f`; yang diseragamkan adalah **page/shell background**, sedangkan card, border, hover, active nav tetap perlu hierarchy.

---

# Jawaban Arr — Product Direction untuk Penyempurnaan Review

Tanggal update: 22 Mei 2026
Status: **keputusan produk dari Arr**.
Mode kerja: **review-only**, tidak mengubah source code.

## A. Identitas Visual

### 1. Base background final

Arr mengunci warna base background Horizon:

```css
#0a0a0f
```

Keputusan:
- Warna ini fix sebagai background utama Horizon.
- Warna ini diambil dari area left sidebar HERTZ yang saat ini berada di `HertzRails.module.css`.

### 2. Home/Landing juga ikut warna yang sama

Keputusan Arr:
- Home/landing juga harus ikut `#0a0a0f` agar konsisten.
- Tidak dibuat berbeda sendiri dengan background yang terlalu lain.

Catatan review:
- Home tetap boleh punya visual depth/gradient, tetapi base color harus tetap `#0a0a0f`.
- Jika memakai gradient, gradient harus subtle dan tetap berangkat dari `#0a0a0f`.

### 3. Accent green global

Arr mengunci accent global:

```css
#13d27b
```

Keputusan:
- `#13d27b` yang sekarang kuat di HERTZ dijadikan global token.
- Warna hijau lain seperti `#10b981`, `#00e38a`, `#34d399`, `#059669` sebaiknya dipakai hanya sebagai turunan/secondary state jika memang perlu, bukan primary brand accent.

## B. Scope Konsistensi Page

### 4. Semua page ikut konsisten

Arr mengunci bahwa background seragam berlaku untuk semua area:

- HERTZ feed.
- Profile.
- DM.
- Notifications.
- Blog.
- Outlook.
- Tools.
- Gallery.
- Admin.

### 5. Admin juga seragam

Keputusan:
- Admin dashboard juga ikut seragam agar seluruh produk Horizon konsisten.
- Admin boleh punya layout utilitarian, tapi token warna tetap mengikuti Horizon.

## C. Prioritas UX dan Implementasi Bertahap

### 6. Semua item prioritas, tetapi harus dibahas tuntas dan dibuat bertahap

Arr menyatakan semua item prioritas:

- SPA navigation.
- Speed client.
- Auto-refresh komentar.
- Public profile + DM.
- Typing/writing message indicator.
- DM layout fixed-height.
- Notification position seperti Minbloom.
- Background consistency.

Keputusan dokumentasi:
- Semua item harus tetap dibahas tuntas di `.md`.
- Pengerjaan nanti dibuat bertahap, bukan sekaligus tanpa urutan.
- Setiap item perlu alasan, scope, rekomendasi, risiko, dan prioritas.

### Rekomendasi batch pengerjaan nanti

Jika suatu saat Arr mengizinkan edit kode, urutan bertahap yang disarankan:

#### Batch 1 — Design foundation

- Global token warna:
  - `--horizon-bg-base: #0a0a0f`
  - `--horizon-accent: #13d27b`
- Apply background ke shell utama.
- Samakan surface/border/text-muted token.

Alasan:
- Ini menjadi fondasi semua page.
- Jika dilakukan belakangan, perbaikan page lain rawan ulang.

#### Batch 2 — SPA navigation

- Internal `<a href>` diganti `next/link`.
- Fokus HERTZ nav, mobile nav, back link, profile/admin route.

Alasan:
- Dampak langsung ke rasa cepat.
- Patch relatif kecil dan mudah diverifikasi.

#### Batch 3 — DM layout dan composer behavior

- Fixed page height.
- Chat list/thread saja yang scroll.
- `Enter` kirim dan `Shift+Enter` newline tetap dipertahankan.
- Perbaiki edge case attachment-only jika perlu.

Alasan:
- DM adalah area interaksi intensif.
- Layout stabil membuat app terasa matang.

#### Batch 4 — Comments auto-refresh

- Hilangkan ketergantungan `router.refresh()` untuk aksi komentar normal.
- Gunakan client cache/polling ringan.
- Optimistic update setelah submit/delete.

Alasan:
- Komentar adalah interaksi publik utama.
- User tidak perlu merasa halaman refresh.

#### Batch 5 — Public profile + DM

- URL public profile:

```txt
/@username
```

- Klik avatar/nama user membuka public profile.
- Tombol DM langsung membuka chat.

Alasan:
- Membuat HERTZ terasa sosial, bukan hanya feed statis.
- DM discovery menjadi natural.

#### Batch 6 — Typing/writing indicator

- Cukup polling ringan dulu, sesuai keputusan Arr.
- Tambahkan fitur writing message dengan TTL pendek.

Alasan:
- Arr ingin fitur writing message.
- Bisa dibuat tanpa WebSocket awal, sehingga risiko lebih kecil.

#### Batch 7 — Notification positioning ala Minbloom

- Menunggu screenshot/contoh dari Arr.
- Setelah contoh diberikan, audit posisi, behavior, desktop/mobile pattern.

Alasan:
- Tanpa referensi visual, risiko salah arah desain tinggi.

#### Batch 8 — Speed deeper

- SWR/deduping.
- Lazy-load heavy components.
- Bundle analyzer.
- Review `force-dynamic` page publik.

Alasan:
- Dilakukan setelah foundation dan UX utama jelas.
- Membutuhkan pengukuran agar tidak spekulatif.

## D. DM Realtime dan Writing Message

### 7. Keputusan Arr: polling ringan dulu

Arr memilih:

```txt
A) cukup polling ringan dulu
```

Tetapi Arr tetap ingin fitur:

```txt
writing message / typing indicator
```

### Apakah writing message bisa dengan polling ringan?

Jawaban: **bisa**.

Tidak wajib WebSocket untuk tahap awal. Implementasi awal bisa memakai endpoint typing status + polling ringan.

### Rekomendasi konsep typing indicator tanpa WebSocket

#### Client behavior

- Saat user mengetik di DM composer, client mengirim event typing ke server.
- Event dikirim dengan throttle/debounce, misalnya setiap 1.5–2 detik saat input berubah.
- Jangan kirim request setiap keypress.

#### Server behavior

- Server menyimpan status typing sementara dengan TTL pendek, misalnya 5–8 detik.
- Status berisi:
  - `conversationId`
  - `userId`
  - `displayName`
  - `lastTypingAt`

#### Thread polling

- Client DM thread tetap polling ringan.
- Response thread atau endpoint typing mengembalikan user yang sedang mengetik.
- UI menampilkan:

```txt
Nama sedang mengetik...
```

#### Saat user berhenti mengetik

- Karena TTL pendek, status otomatis hilang.
- Saat user mengirim pesan, typing status juga bisa di-clear.

### Catatan teknis

- Jika app hanya satu instance, memory Map bisa cukup untuk proof-of-concept.
- Untuk production/multi-instance, lebih aman pakai Redis/Postgres TTL agar status konsisten antar server.
- Karena Horizon sudah punya kebutuhan rate-limit/cache, Redis akan berguna juga untuk fitur lain.

### Risiko polling typing

- Tidak se-real-time WebSocket, ada delay sesuai interval.
- Jika polling terlalu cepat, request bertambah.
- Jika polling terlalu lambat, typing indicator terasa telat.

### Rekomendasi interval awal

- Typing event throttle: 1.5–2 detik.
- Typing TTL: 6–8 detik.
- Thread/typing polling: 3–5 detik saat conversation aktif.
- Pause polling saat tab hidden.

## E. Notification Minbloom

### 8–9. Menunggu screenshot dari Arr

Arr akan mengirim screenshot contoh Minbloom untuk:

- Posisi notifikasi.
- Pattern behavior.
- Desktop/mobile placement.

Status:
- Belum diputuskan final.
- Jangan implementasi atau finalisasi desain sebelum screenshot diterima.

Catatan review:
- Setelah screenshot diterima, tambahkan section baru berisi perbandingan HERTZ vs Minbloom.
- Tentukan apakah pattern berupa dropdown, popover, toast, page list, atau notification center.

## F. Public Profile dan DM

### 10. URL public profile

Arr memilih URL:

```txt
/@username
```

Keputusan:
- Public profile user lain memakai route ` /@username `.
- Nama/avatar user di feed/comment mengarah ke route tersebut.

Catatan teknis:
- Route Next.js yang mungkin dipakai: `frontend/src/app/@[username]/page.tsx` tidak valid langsung dalam App Router karena `@` punya arti parallel route.
- Opsi teknis yang perlu dicek saat implementasi:
  - route catch-all yang membaca path `@username`, atau
  - rewrite middleware dari `/@username` ke route internal seperti `/hertz/u/[username]`.
- Untuk UX, URL publik tetap `/@username` sesuai keputusan Arr.

### 11. Tombol DM langsung buka chat

Keputusan:
- Tombol DM di public profile langsung membuka chat.
- Tidak perlu konfirmasi tambahan.

Flow yang direkomendasikan:

1. User buka `/@username`.
2. Klik tombol DM.
3. Client/server membuat atau mengambil direct conversation existing.
4. Redirect/buka `/hertz/messages?conversation=<id>` atau route equivalent.
5. Conversation langsung aktif.

Catatan:
- Jika belum login, tampilkan login/member required.
- Jika user klik DM dirinya sendiri, tombol disembunyikan atau diganti “Ini profil Anda”.

## G. Batas Kerja Saat Ini

### 12. Review-only

Arr menegaskan:

```txt
Tidak, tugasmu hanya review dan membuat .md tanpa mengedit apapun.
```

Keputusan:
- Tidak mengedit source code.
- Tidak build.
- Tidak deploy.
- Tidak restart.
- Hanya audit, tanya-jawab, dan memperbarui markdown review.

## Ringkasan Keputusan Terkunci

| Topik | Keputusan Arr |
|---|---|
| Base background | `#0a0a0f` |
| Landing/home | Ikut `#0a0a0f` agar konsisten |
| Global accent | `#13d27b` |
| Scope page | Semua page termasuk Admin |
| Prioritas | Semua item prioritas, dibahas tuntas dan bertahap |
| DM realtime awal | Polling ringan dulu |
| Typing indicator | Tetap ingin ada, bisa via polling + TTL |
| Notification Minbloom | Tunggu screenshot Arr |
| Public profile URL | `/@username` |
| Tombol DM | Langsung buka chat |
| Mode kerja sekarang | Review-only, hanya `.md` |

---

# Keputusan Arr — Pattern Notifikasi Sosial Media

Tanggal update: 22 Mei 2026
Status: **referensi visual dari Arr sudah diterima**.
Mode kerja: **review-only**, source code tidak diubah.

Arr mengirim screenshot contoh notifikasi yang dimaksud: notifikasi seperti sosial media pada umumnya, berupa **bell icon di top bar** yang ketika diklik membuka **dropdown/popover notification panel**.

## Pattern yang Diinginkan

Dari screenshot referensi:

- Ada **icon bell** di area kanan atas/top bar.
- Bell memiliki area klik kecil seperti tombol square/rounded.
- Ketika bell diklik, muncul dropdown panel tepat di bawah/sekitar bell.
- Panel berisi judul `Notifications`.
- Ada aksi `Mark all as read` di kanan header panel.
- Isi berupa list notifikasi ringkas.
- Setiap item punya:
  - label/type, contoh `ENTRY HIT`,
  - teks utama notifikasi,
  - waktu di kanan,
  - separator antar item.
- Panel tampil overlay di atas konten, bukan pindah halaman penuh.
- Behavior menyerupai notification center sosial media.

## Kondisi HERTZ Saat Ini

### 1. Notifikasi masih berupa halaman khusus

File:
- `frontend/src/features/hertz/notifications/NotificationsView.tsx`
- `frontend/src/features/hertz/notifications/notifications.module.css`
- `frontend/src/app/hertz/notifications/page.tsx`

Saat ini notifikasi dibuka lewat route:

```txt
/hertz/notifications
```

UI yang ada:
- Page khusus `Notifikasi`.
- Filter `Semua` dan `Belum dibaca`.
- Tombol `Tandai dibaca`.
- List notifikasi dengan avatar, icon type, copy, preview, waktu, unread dot.

Kesimpulan:
- Data dan UI list notifikasi sudah ada.
- Yang belum ada adalah **dropdown/popover dari bell icon** seperti screenshot.

### 2. Bell sekarang ada di sidebar/mobile nav, bukan top-right dropdown

File:
- `frontend/src/components/feed/HertzLeftRail.tsx`
- `frontend/src/components/hertz/MobileBottomNav.tsx`

Saat ini notification entry adalah link navigasi:

```txt
Notifikasi -> /hertz/notifications
```

Di mobile bottom nav juga ada badge notifikasi.

Kesimpulan:
- Existing bell/link bisa tetap ada sebagai fallback atau full notification page.
- Tetapi untuk UX sosial media, perlu tambahan **top-right notification bell + dropdown**.

### 3. Summary count sudah ada

File:
- `frontend/src/components/feed/HertzLeftRail.tsx`
- `frontend/src/components/feed/HertzRightRail.tsx`
- `frontend/src/components/hertz/MobileBottomNav.tsx`

Endpoint yang dipakai:

```txt
/api/hertz/notifications/summary
```

Kesimpulan:
- Badge unread count sudah memungkinkan.
- Perlu dedupe/cache agar tidak dipanggil berulang dari banyak komponen.

## Rekomendasi Desain untuk Horizon/HERTZ

### Desktop

Tambahkan notification bell di top-right area shell, misalnya di header kanan atau mobile/desktop top bar HERTZ.

Behavior:

1. User klik bell.
2. Dropdown muncul align ke kanan bell.
3. Dropdown width sekitar 360–420px.
4. Max-height sekitar 70vh.
5. List scroll di dalam dropdown jika item banyak.
6. Klik luar panel menutup dropdown.
7. Tekan `Esc` menutup dropdown.
8. Klik item:
   - mark item read,
   - navigasi ke `item.href`,
   - tutup dropdown.

### Mobile

Rekomendasi mobile:

- Bell tetap bisa ada di header/top mobile.
- Saat klik, buka bottom sheet atau full-height drawer ringan.
- Jangan pakai dropdown kecil jika layar sempit.
- Mobile bottom nav `Notif` tetap boleh membuka halaman `/hertz/notifications` sebagai fallback.

### Full notification page tetap dipertahankan

Walau ada dropdown, halaman ini tetap berguna:

```txt
/hertz/notifications
```

Fungsinya:
- riwayat lebih lengkap,
- filter semua/belum dibaca,
- pagination nanti,
- akses dari mobile nav/sidebar.

Dropdown hanya untuk quick access, bukan pengganti penuh.

## Rekomendasi Komponen

Buat komponen baru nanti, misalnya:

```txt
frontend/src/features/hertz/notifications/NotificationBell.tsx
frontend/src/features/hertz/notifications/NotificationDropdown.tsx
```

Atau satu komponen:

```txt
HertzNotificationCenter.tsx
```

Tanggung jawab:

- Fetch summary unread count.
- Fetch recent notification list saat dropdown dibuka.
- Poll ringan saat user aktif.
- Mark all as read.
- Mark item as read.
- Close on outside click/Esc.
- Render badge di bell.

## Data Fetching yang Direkomendasikan

### Untuk badge

Gunakan endpoint summary:

```txt
GET /api/hertz/notifications/summary
```

Polling ringan:
- 20–30 detik saat tab aktif.
- Pause saat tab hidden.
- Dedupe dengan SWR/shared cache.

### Untuk dropdown list

Gunakan endpoint existing:

```txt
GET /api/hertz/notifications
```

Tetapi untuk dropdown sebaiknya batasi data:

```txt
GET /api/hertz/notifications?limit=8
```

Jika endpoint belum support limit, rekomendasikan ditambah.

Alasan:
- Dropdown hanya butuh recent notifications.
- Halaman penuh bisa mengambil list lebih panjang.

## UI Detail yang Disarankan

### Bell button

- Background: sedikit lebih terang dari `#0a0a0f`, misalnya panel surface.
- Border: `rgba(19, 210, 123, 0.22)` atau token border.
- Icon: muted saat normal, `#13d27b` saat ada unread/active.
- Badge: kecil di pojok kanan atas.

### Dropdown panel

- Background mengikuti keputusan Arr:
  - base: `#0a0a0f`,
  - panel: sedikit elevated, misalnya `rgba(10, 10, 15, 0.98)` atau token surface.
- Border: green transparent.
- Radius: 10–12px.
- Shadow: lembut agar panel jelas berada di atas konten.
- Header sticky jika list panjang.

### Notification item

- Unread item diberi subtle green background.
- Type label kecil uppercase.
- Teks utama ringkas max 1–2 baris.
- Time di kanan.
- Separator tipis.

## Integrasi dengan Layout

Lokasi integrasi yang perlu dicek saat implementasi:

- `frontend/src/components/layout/HertzLayout.tsx`
- `frontend/src/components/hertz/HertzAppShell.tsx`
- `frontend/src/components/feed/HertzLeftRail.tsx`
- `frontend/src/components/hertz/MobileBottomNav.tsx`

Rekomendasi:
- Jangan hanya taruh di page notification.
- Taruh di shell/top area agar muncul lintas page HERTZ/Blog/Outlook/Tools jika user login.
- Pastikan tidak bentrok dengan left sidebar navigation.

## Status Keputusan

Keputusan Arr:
- Pattern notifikasi yang diinginkan adalah **dropdown/popover dari bell icon**, seperti sosial media.
- Bukan hanya halaman `/hertz/notifications`.
- Full page tetap boleh ada sebagai archive/detail.

## Prioritas

Priority: **P2** setelah foundation background, SPA navigation, DM layout, dan comments auto-refresh.

Alasan:
- Notifikasi sosial media meningkatkan rasa app modern.
- Data notifikasi sudah ada, sehingga fokus implementasi terutama di UX shell/dropdown.
- Namun perlu dirapikan setelah shell/background agar posisi dan warna konsisten.

---

# Diskusi Lanjutan — Agar Horizon Terasa Cepat seperti SaaS Sosial Media

Tanggal update: 22 Mei 2026
Status: **review-only discussion notes**.
Mode kerja: source code tidak diubah.

Target Arr: Horizon/HERTZ terasa cepat seperti SaaS sosial media modern, misalnya Facebook/Twitter/X.

## Prinsip Utama

Aplikasi sosial media terasa cepat bukan hanya karena server cepat, tetapi karena kombinasi:

1. Navigasi client-side tanpa full reload.
2. Data cache di client.
3. Optimistic UI.
4. Infinite feed yang ringan.
5. Polling/realtime yang efisien.
6. Query database yang tidak berat.
7. Asset/image yang teroptimasi.
8. Layout stabil, tidak lompat-lompat.
9. Skeleton/loading state yang halus.
10. Background job/cache untuk data yang sering dihitung.

Untuk Horizon, rekomendasi saya: **hybrid Next.js social app**, bukan full SPA murni.

Artinya:
- Public/SEO pages tetap memanfaatkan server rendering/cache Next.js.
- Area app interaktif seperti HERTZ feed, DM, notifications, comments dibuat terasa SPA dengan `next/link`, SWR/cache, optimistic update, dan polling ringan.

## Temuan dari Kode Saat Ini

### 1. Paket SWR/TanStack Query belum terlihat terpasang

`frontend/package.json` menunjukkan dependencies utama:

- Next `^16.2.4`
- React `^19.2.0`
- lucide-react
- radix-ui
- pg

Belum terlihat:

- `swr`
- `@tanstack/react-query`

Rekomendasi:
- Untuk tahap awal pilih **SWR**.
- Alasannya sederhana, ringan, cocok untuk feed/comments/notifications/DM polling ringan.
- TanStack Query lebih powerful, tapi lebih banyak setup. Bisa dipertimbangkan nanti jika state data makin kompleks.

### 2. Beberapa route API HERTZ `force-dynamic`

Contoh:

- `frontend/src/app/api/hertz/posts/route.ts`
- `frontend/src/app/api/hertz/notifications/route.ts`

Keduanya memakai:

```ts
export const dynamic = 'force-dynamic';
```

Catatan:
- Untuk API private/member-specific seperti notifications, DM, viewer state, dynamic memang masuk akal.
- Tetapi untuk page publik/landing/blog/outlook yang tidak selalu user-specific, terlalu banyak dynamic dapat mengurangi cache benefit.

Rekomendasi:
- Bedakan data publik vs data personalized.
- Public content bisa cache/ISR.
- Personalized state seperti liked/bookmarked/unread tetap dynamic/client fetch.

### 3. Feed query masih menghitung counts lewat LATERAL subquery per post

File:
- `shared/repositories/hertzPostRepository.ts`

Feed query memakai LATERAL count untuk:

- comments,
- pulse/reactions,
- repost,
- views.

Contoh pola:

```sql
LEFT JOIN LATERAL (
  SELECT COUNT(*) AS comment_count FROM hertz_comments c
  WHERE c.post_id = hp.id AND c.status = 'visible' AND c.deleted_at IS NULL
) cc ON true
```

Ini masih oke untuk data kecil-menengah. Tetapi untuk rasa sosial media skala besar, ini bisa menjadi bottleneck karena setiap page feed menghitung banyak agregat.

Rekomendasi bertahap:

- Tahap awal: pastikan index semua table count sudah tepat.
- Tahap berikut: buat counter cache/denormalized columns untuk `comment_count`, `pulse_count`, `repost_count`, `view_count` di post stats table.
- Update counter saat aksi terjadi.

Alasan:
- Twitter/Facebook tidak menghitung semua count dari nol setiap buka feed.
- Mereka menyimpan aggregate/counter agar feed cepat.

### 4. DM polling saat ini reload full thread

File:
- `frontend/src/features/hertz/messages/useMessages.ts`

Saat conversation aktif:

```ts
const timer = window.setInterval(() => void loadThread(activeId), HERTZ_DM_POLL_INTERVAL_MS);
```

`loadThread` mengambil ulang seluruh message thread:

```txt
GET /api/hertz/messages/conversations/{id}
```

Dan repository mengambil semua message conversation:

```sql
ORDER BY m.created_at ASC
```

Masalah:
- Untuk conversation panjang, polling mengambil semua pesan berulang.
- Ini akan terasa berat seperti chat lama dibuka terus.

Rekomendasi:
- Tambah incremental polling:

```txt
GET /api/hertz/messages/conversations/{id}?after=<lastMessageId/lastCreatedAt>
```

- Client append pesan baru saja.
- Full thread hanya saat pertama buka conversation.
- Pause polling saat tab hidden.
- Poll hanya conversation aktif.

### 5. Notification summary dipanggil dari beberapa komponen

Endpoint:

```txt
/api/hertz/notifications/summary
```

Dipakai oleh beberapa area:

- left rail,
- right rail,
- mobile bottom nav,
- auth/me juga membawa notifications.

Masalah:
- Bisa terjadi duplicate request.
- Count notifikasi/DM sebaiknya satu sumber cache client.

Rekomendasi:
- Gunakan SWR shared key:

```ts
useSWR('/api/hertz/notifications/summary', fetcher, {
  refreshInterval: 25000,
  dedupingInterval: 10000,
  refreshWhenHidden: false,
});
```

- Semua badge mengambil dari hook yang sama.

## Apa yang Harus Dibenahi agar Terasa Cepat

## 1. Client-side navigation wajib rapi

Prioritas: **P1**

Masalah yang ditemukan sebelumnya:
- Banyak internal navigation masih memakai `<a href>`.
- Ini membuat Next melakukan document navigation/full reload pada beberapa area.

Benahi:
- Ganti internal link ke `next/link`.
- Fokus:
  - `HertzLeftRail.tsx`
  - `MobileBottomNav.tsx`
  - author/profile links,
  - notification item links,
  - post detail/back links,
  - admin/internal dashboard links.

Alasan:
- Ini efek paling terasa untuk user.
- Navigasi antar Home/Outlook/Blog/Tools/Notif/DM harus terasa instan.

## 2. Data fetching pakai SWR untuk area sosial

Prioritas: **P1**

Area target:
- Feed `/api/hertz/posts`
- Comments `/api/hertz/posts/[shortId]/comments`
- Notification summary `/api/hertz/notifications/summary`
- Notification dropdown `/api/hertz/notifications?limit=8`
- DM inbox `/api/hertz/messages/inbox`
- DM thread aktif
- Search member ringan

Manfaat:
- Cache antar komponen.
- Dedupe request.
- Revalidate otomatis.
- Bisa polling ringan.
- Bisa optimistic update.

Rekomendasi:
- Pakai SWR dulu, bukan TanStack Query.
- Jika nanti data makin kompleks, baru migrasi sebagian ke TanStack Query.

## 3. Optimistic UI untuk aksi sosial

Prioritas: **P1**

Target aksi:
- Like/pulse.
- Bookmark.
- Repost.
- Comment submit/delete.
- Mark notification read.
- Send DM.

Behavior yang diinginkan:
- User klik, UI langsung berubah.
- Request jalan di belakang.
- Jika gagal, rollback + toast error.

Alasan:
- Sosial media terasa cepat karena tidak menunggu server untuk setiap aksi kecil.
- Ini memberi rasa “instant”.

## 4. Feed harus infinite dan ringan

Prioritas: **P1/P2**

Yang sudah baik:
- Feed API sudah punya cursor dan limit.

Yang perlu diperkuat:
- Infinite scroll atau load-more yang smooth.
- Skeleton card saat load.
- Prefetch post detail saat item mendekati viewport/hover.
- Jangan reload feed penuh setelah aksi kecil.
- Pertahankan scroll position saat balik dari detail.

Alasan:
- Facebook/Twitter cepat karena feed tidak render semua data sekaligus.
- Feed harus incremental dan state-nya tidak hilang.

## 5. Backend feed perlu counter/cache strategy

Prioritas: **P2**

Masalah:
- Query feed menghitung counts dengan LATERAL query.

Rekomendasi:
- Buat `hertz_post_stats` atau kolom denormalized:
  - `comment_count`
  - `pulse_count`
  - `repost_count`
  - `view_count`
- Update saat insert/delete reaction/comment/repost/view.

Alasan:
- Mengurangi beban database untuk feed.
- Feed akan lebih stabil saat data membesar.

## 6. DM dibuat seperti chat app modern

Prioritas: **P1/P2**

Benahi:
- Fixed-height layout: hanya list pesan yang scroll.
- Incremental polling, bukan ambil full thread terus.
- Pause polling saat tab hidden.
- Typing/writing indicator pakai polling + TTL.
- Optimistic send message.
- Append message baru, jangan replace full list jika tidak perlu.

Alasan:
- DM adalah area yang paling terasa “real-time”.
- Tanpa WebSocket pun bisa cukup cepat jika polling efisien.

## 7. Notification center seperti sosial media

Prioritas: **P2**

Sesuai screenshot Arr:
- Top-right bell.
- Dropdown/popover notification list.
- Mark all as read.
- Recent notifications limit 8–10.
- Full notification page tetap ada.

Optimasi:
- Summary cache via SWR.
- Fetch list saat dropdown dibuka.
- Mark read optimistic.

Alasan:
- Membuat Horizon terasa seperti SaaS sosial media matang.

## 8. Public profile `/@username` harus cepat

Prioritas: **P2**

Benahi:
- Route publik `/@username`.
- Avatar/nama user clickable.
- Tombol DM langsung buka chat.
- Profile activity pakai pagination/cache.
- Prefetch profile ketika hover/click avatar.

Alasan:
- Social graph terasa hidup jika user bisa cepat berpindah ke profile dan DM.

## 9. Image/media optimization

Prioritas: **P2**

Benahi:
- Raw `<img>` diganti `next/image` jika memungkinkan.
- Jika tidak bisa, minimal:

```html
loading="lazy"
decoding="async"
```

- Thumbnail untuk feed/DM, jangan selalu full image.
- Set width/height agar layout tidak lompat.

Alasan:
- Feed sosial media biasanya berat di gambar.
- Image optimization berdampak besar ke speed dan Core Web Vitals.

## 10. Bundle size dan client component audit

Prioritas: **P2/P3**

Temuan sebelumnya:
- Banyak file `'use client'`.

Rekomendasi:
- Jalankan bundle analyzer sebelum refactor besar.
- Kurangi client component di page yang tidak perlu interaktif.
- Lazy-load komponen berat:
  - chart,
  - modal,
  - admin tools,
  - editor,
  - media viewer.

Alasan:
- Terlalu banyak JS membuat initial load lambat.
- Sosial media modern cepat karena bundle dibagi per fitur.

## 11. API response shape dibuat efisien

Prioritas: **P2**

Benahi:
- Feed list tidak perlu membawa data detail yang hanya dipakai di detail page.
- Notification dropdown cukup recent item kecil.
- DM inbox tidak perlu full message body panjang.
- Search member batasi limit dan debounce.

Alasan:
- Response kecil = cepat diparse, cepat dirender, hemat bandwidth.

## 12. Database indexes dan query plan audit

Prioritas: **P2**

Yang perlu dicek saat implementasi:
- `EXPLAIN ANALYZE` feed latest/trending.
- `EXPLAIN ANALYZE` notification list/summary.
- `EXPLAIN ANALYZE` DM inbox/thread.
- Index untuk cursor pagination dan unread counts.

Catatan dari migrasi:
- Beberapa index sudah ada, misalnya posts status/created, comments post/created, notifications user/created, notifications unread.
- Tetap perlu query plan aktual karena data dan join bisa membuat query tetap berat.

## 13. Loading UX: skeleton, not spinner kosong

Prioritas: **P2**

Benahi:
- Feed skeleton card.
- DM skeleton thread/list.
- Notification dropdown skeleton 3–5 item.
- Profile skeleton.

Alasan:
- Aplikasi terasa lebih cepat jika layout langsung muncul walau data sedang load.
- Ini teknik umum SaaS sosial media.

## 14. Cache static/public page

Prioritas: **P2/P3**

Benahi:
- Landing/home jika tidak user-specific bisa static/ISR.
- Blog/outlook public content bisa cache/ISR.
- User-specific badge/notification fetch client-side.

Alasan:
- Jangan buat semua page dynamic jika tidak perlu.
- Next.js kuat di hybrid rendering; manfaatkan itu.

## 15. Observability ringan

Prioritas: **P3**

Tambahkan nanti:
- Request timing log untuk API HERTZ.
- Slow query log threshold.
- Web vitals capture sederhana.
- Error boundary per area app.

Alasan:
- Untuk jadi cepat seperti SaaS besar, perlu pengukuran.
- Tanpa metrik, optimasi jadi spekulasi.

## Roadmap Bertahap Rekomendasi

### Phase 1 — Perceived speed langsung terasa

1. `next/link` untuk internal navigation.
2. SWR untuk notification summary dan comments.
3. Optimistic update untuk comment/pulse/bookmark.
4. Background token global `#0a0a0f` dan accent `#13d27b`.
5. DM fixed-height layout.

### Phase 2 — Social interaction maturity

1. Public profile `/@username`.
2. DM direct dari profile.
3. Typing indicator via polling + TTL.
4. Notification bell dropdown seperti screenshot Arr.
5. Comments auto-refresh tanpa page refresh.

### Phase 3 — Backend/data performance

1. Incremental DM polling.
2. Notification dropdown `limit=8`.
3. Feed counter cache/stats table.
4. Query plan audit + index adjustment.
5. Response payload slimming.

### Phase 4 — Deep frontend optimization

1. Bundle analyzer.
2. Lazy-load heavy components.
3. Image optimization.
4. Reduce unnecessary `'use client'`.
5. ISR/cache for public pages.

## Kesimpulan Diskusi

Agar Horizon terasa cepat seperti SaaS sosial media, fokusnya bukan satu teknologi saja.

Yang paling penting untuk Horizon:

1. Navigasi harus client-side dan terasa instant.
2. Data sosial harus cached + optimistic.
3. DM dan comments jangan refresh halaman/ambil data penuh terus.
4. Feed harus ringan, incremental, dan tidak menghitung agregat berat terus-menerus.
5. Notifikasi harus berupa bell dropdown seperti sosial media.
6. Visual foundation harus konsisten: `#0a0a0f` + `#13d27b`.

Mode saat ini tetap review-only: semua poin ini adalah catatan rekomendasi untuk `.md`, belum implementasi source code.
