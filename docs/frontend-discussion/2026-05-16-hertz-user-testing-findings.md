# HERTZ User Testing Findings

Tanggal: 16 Mei 2026  
Sumber: testing langsung user pada web live `https://horizon.cloudnexify.com`

## Status Legend

- `Open`: belum diperbaiki.
- `Needs reproduction details`: butuh detail tambahan untuk reproduksi stabil.
- `Investigating`: sedang dicari root cause.
- `Fixed`: sudah diperbaiki dan diverifikasi.
- `Deferred`: sengaja ditunda.

## Findings

### UTF-001: Delete HERTZ post menampilkan error server

Status: Needs reproduction details  
Severity: High  
Area: HERTZ feed / post action menu / delete post  
Reported at: 2026-05-16

User report:

- Saat mencoba menghapus postingan HERTZ, UI menampilkan pesan `Terjadi kesalahan pada server`.

Expected:

- Jika user adalah pembuat postingan atau admin, delete berhasil setelah confirm dan feed refresh tanpa post tersebut.
- Jika user tidak punya akses, UI menampilkan pesan permission yang jelas seperti `Akses ditolak`, bukan generic server error.
- Jika session expired, UI menampilkan `Login member diperlukan`.

Actual:

- UI menampilkan `Terjadi kesalahan pada server`.

Initial evidence:

- Endpoint guest `DELETE /api/hertz/posts/hzx_live01` mengembalikan `401` dengan pesan `Login member diperlukan`, jadi path unauthenticated dasar tidak menghasilkan server error.
- Frontend delete memanggil `DELETE /api/hertz/posts/{shortId}` dari `HertzPostMenu`.
- Backend route meneruskan ke `HertzPostService.deletePost`, yang seharusnya mengubah status post menjadi `deleted`.
- Docker frontend log belum menunjukkan stack trace untuk laporan ini; perlu reproduksi dengan session user yang mengalami error.

Likely affected files:

- `frontend/src/components/feed/HertzPostMenu.tsx`
- `frontend/src/app/api/hertz/posts/[shortId]/route.ts`
- `shared/services/hertzPostService.ts`
- `shared/repositories/hertzPostRepository.ts`

Needed reproduction details:

- Akun yang dipakai saat menghapus: admin/member pembuat post/non-author member.
- `shortId` post yang dihapus, misalnya `hzx_live01`.
- Apakah error muncul setelah klik confirm di dialog `Hapus postingan`.
- Apakah post seed atau post baru buatan user.

Next investigation:

- Reproduce with authenticated member/admin session.
- Capture API response status/body for `DELETE /api/hertz/posts/{shortId}`.
- Check whether post is legacy `feed_posts` data, HERTZ `hertz_posts` data, plain repost item, or quoted post.
- Add/adjust automated test once root cause is known.

### UTF-002: Right sidebar market sparkline terlihat seperti garis horizontal

Status: Investigating  
Severity: Medium  
Area: HERTZ right sidebar / MarketSidebarWidget / Sparkline  
Reported at: 2026-05-16

User report:

- Grafik line di sidebar kanan masih terlihat seperti garis horizontal dan belum menyerupai contoh grafik yang diharapkan.
- User meminta audit sumber data GlobalData terlebih dahulu, termasuk testing endpoint yang diperlukan, sebelum implementasi.

Expected:

- Sparkline di card Forex, Crypto, dan Stock menampilkan gerakan harga yang jelas secara visual.
- Grafik memakai data GlobalData live/historical yang valid, bukan fallback statis atau garis datar.
- Implementasi baru hanya dilakukan setelah endpoint yang diperlukan terbukti bisa diambil.

Actual:

- Grafik sidebar kanan terlihat terlalu datar/horizontal.

Endpoint audit:

- `GET http://globaldata-api:3201/api/chart/price?symbol=OANDA:XAUUSD&timeframe=D&range=12`
  - `success: true`, 12 candle, close range `4519.5` sampai `4720.3999`.
- `GET http://globaldata-api:3201/api/chart/price?symbol=OANDA:EURUSD&timeframe=D&range=12`
  - `success: true`, 12 candle, close range `1.163061` sampai `1.177995`.
- `GET http://globaldata-api:3201/api/v1/crypto/klines?symbol=BTCUSDT&interval=1h&limit=12`
  - `success: true`, 12 candle, close range sekitar `77928.39` sampai `79155.54`.
- `GET http://globaldata-api:3201/api/chart/price?symbol=TSLA&timeframe=D&range=12`
  - `success: true`, 12 candle, close range `381.63` sampai `445.27`.
- Intraday endpoint juga valid:
  - `GET /api/v2/timeseries?symbol=XAU/USD&interval=1h&outputsize=24`
  - `GET /api/v2/timeseries?symbol=EUR/USD&interval=1h&outputsize=24`
  - `GET /api/v2/timeseries?symbol=BTC-USD&interval=1h&outputsize=24`
  - `GET /api/v2/timeseries?symbol=TSLA&interval=1h&outputsize=24`
  - `GET /api/v1/crypto/klines?symbol=BTCUSDT&interval=15m&limit=24`

Initial analysis:

- Data GlobalData tersedia dan tidak datar; setiap asset punya lebih dari 2 point dan min/max berbeda.
- Current HERTZ market API `/api/market/rail` juga sudah mengembalikan `sparkline` numeric array per asset.
- Kemungkinan utama masalah visual adalah domain Y chart. `Sparkline.tsx` memakai `AreaChart` tanpa `YAxis domain={['dataMin', 'dataMax']}` atau normalisasi data.
- Jika Recharts memakai implicit domain dari `0` sampai max price, perubahan 1-3% pada BTC/NASDAQ/EURUSD akan terlihat sangat dekat garis horizontal.

Evidence from current `/api/market/rail`:

- `BTC/USDT`: 12 point, range `77928.39` sampai `79155.54`, zero-domain amplitude sekitar `1.55%`.
- `EURUSD`: 12 point, range `1.163061` sampai `1.177995`, zero-domain amplitude sekitar `1.27%`.
- `DOW`: 12 point, range `48941.8984` sampai `50063.4609`, zero-domain amplitude sekitar `2.24%`.
- `TSLA`: 12 point, range `381.63` sampai `445.27`, zero-domain amplitude sekitar `14.29%`.

Likely affected files:

- `frontend/src/components/feed/Sparkline.tsx`
- `frontend/src/components/feed/MarketCard.tsx`
- `frontend/src/lib/globalDataMarket.ts`

Next investigation:

- Confirm rendered SVG path/domain from Recharts in browser.
- Decide whether to use `YAxis hide domain={['dataMin', 'dataMax']}` with padding, or normalize sparkline values to percent/indexed movement before rendering.
- Prefer 24-point intraday data for main chart if the visual target needs more visible movement than daily 12-point series.
- Add a unit test around sparkline data normalization/domain behavior before implementation.

### UTF-003: Mobile HERTZ tidak menampilkan logo atom Horizon di kiri atas

Status: Open  
Severity: Medium  
Area: HERTZ mobile shell / top header  
Reported at: 2026-05-16

User report:

- Pada menu mobile saat membuka HERTZ, kiri atas seharusnya menampilkan logo atom Horizon.

Expected:

- Di viewport mobile/tablet, bagian atas HERTZ memiliki brand signal yang jelas di kiri atas: logo atom Horizon.
- Logo tidak mengganggu tab `For You` / `Trending`, kategori, search chip, atau bottom nav.
- Logo tetap accessible dengan `alt="Horizon"` atau label setara.

Actual:

- Mobile header HERTZ hanya menampilkan area title/tabs/feed navigation; logo atom kiri atas tidak terlihat.

Initial evidence:

- `HertzLeftRail` desktop memiliki logo atom Horizon, tetapi rail desktop disembunyikan pada breakpoint mobile.
- `HertzAppShell` mobile hanya merender header title/description di content, tanpa brand logo mobile.
- `HertzHeader` feed merender `For You` / `Trending` dan tabs kategori, tetapi tidak punya brand slot di kiri atas.
- HTML live tetap memuat asset logo untuk desktop rail/favicon, jadi asset tersedia; masalahnya adalah placement/responsive rendering.

Likely affected files:

- `frontend/src/components/hertz/HertzAppShell.tsx`
- `frontend/src/components/hertz/HertzAppShell.module.css`
- `frontend/src/components/feed/HertzHeader.tsx`
- `frontend/src/components/feed/HertzHeader.module.css`

Next investigation:

- Tentukan apakah logo masuk sebagai mobile app bar global di `HertzAppShell` atau sebagai bagian feed header `HertzHeader`.
- Cek semua route HERTZ mobile: `/hertz`, `/hertz/messages`, `/hertz/profile`, dan `/hertz/post/{shortId}` agar brand tidak muncul ganda.
- Tambahkan test/render assertion atau DOM review marker untuk memastikan logo mobile hadir.

### UTF-004: Ikon kiri pada postingan HERTZ harus mengikuti kategori post

Status: Open  
Severity: Medium  
Area: HERTZ feed / post card left spine icon  
Reported at: 2026-05-16

User report:

- Ikon di sebelah kiri postingan HERTZ menandakan postingan tersebut diposting di kategori mana.
- Jika kategori `life`, ikon harus berbentuk coffee.
- Jika kategori `trading`, ikon harus berbentuk grafik/chart.
- Jika kategori `general`, ikon harus berbentuk pesan seperti kondisi sekarang.

Expected:

- Post `life_coffee` dan `life_story` memakai ikon coffee.
- Post `trading_signal` dan `trading_analysis` memakai ikon grafik/chart.
- Post `general` memakai ikon pesan/default seperti sekarang.
- Ikon kategori tetap konsisten meskipun post memiliki quote/repost, kecuali ada indikator quote terpisah yang sengaja dipakai.

Actual:

- Post kategori life sudah memakai `CoffeeIcon`.
- Post kategori trading saat ini jatuh ke ikon default `TelegramIcon`, sehingga terlihat sama seperti general.
- Post dengan `quotedPost` memakai `ImageIcon`, sehingga state quote dapat menimpa makna kategori pada ikon kiri.

Initial evidence:

- `frontend/src/components/feed/HertzPost.tsx` saat ini memetakan:
  - `life_coffee` / `life_story` ke `CoffeeIcon`.
  - `post.quotedPost` ke `ImageIcon`.
  - kategori lain ke `TelegramIcon`.
- `frontend/src/components/feed/HertzIcons.tsx` sudah memiliki `InsightIcon` yang secara visual bisa dipakai sebagai ikon chart/trading.
- `frontend/src/components/feed/HertzPost.module.css` baru memiliki variasi `.coffeeSpineNode`; belum ada styling khusus untuk trading.

Likely affected files:

- `frontend/src/components/feed/HertzPost.tsx`
- `frontend/src/components/feed/HertzPost.module.css`
- `frontend/src/components/feed/HertzIcons.tsx`

Next implementation:

- Ubah `SpineIcon` agar kategori trading memakai `InsightIcon` atau ikon chart setara.
- Tambahkan class visual untuk node trading jika perlu, misalnya warna aksen chart/trading.
- Pastikan quote/repost tidak menghilangkan makna kategori utama pada ikon kiri, atau pindahkan indikator quote ke elemen lain.
- Tambahkan assertion test/render untuk mapping life, trading, dan general.
