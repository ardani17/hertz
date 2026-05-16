# Diskusi Review Frontend Horizon / HERTZ

Tanggal: 16 Mei 2026  
Status: Draft diskusi sebelum spec  
Tujuan: review frontend satu per satu, mencatat keputusan, lalu menurunkannya menjadi spec/todo implementasi yang jelas.

## Target Experience

Keputusan produk utama: saat user memakai HERTZ, pengalaman harus terasa seperti memakai **Twitter/X untuk komunitas trading**.

Artinya:

- HERTZ harus terasa sebagai social timeline yang hidup, bukan forum statis.
- Post harus cepat dibaca, cepat dibalas, cepat direpost, cepat disimpan, dan cepat dibagikan.
- Desktop harus mendukung browsing feed tanpa kehilangan posisi scroll.
- Mobile harus terasa seperti aplikasi sosial: navigasi ringkas, action cepat, detail post nyaman, dan composer mudah dijangkau.
- Repost, quote, reply/comment, like/suka, bookmark/simpan, share, profile activity, dan DM harus terasa sebagai bagian dari satu pengalaman sosial.
- Trading context seperti market rail dan metadata setup tetap penting, tetapi tidak boleh mengalahkan alur sosial utama.
- Bahasa dan microcopy harus konsisten agar produk terasa matang.

## Cara Pakai Dokumen Ini

Dokumen ini bukan spec final. Ini tempat diskusi agar scope tidak melebar saat masuk implementasi.

Alur yang disepakati:

1. Review satu area UI.
2. Catat masalah aktual, bukti, dan dampaknya.
3. Catat keputusan produk/desain.
4. Baru turunkan ke spec dan todo implementasi.

Setiap area memakai status:

- `Belum direview`: belum dibahas.
- `Perlu keputusan`: butuh arahan produk/desain.
- `Siap spec`: arah perbaikan sudah jelas.
- `Selesai`: sudah diimplementasikan dan diverifikasi.

## Acuan Audit yang Sudah Ada

- `docs/frontend-audit/2026-05-16-frontend-audit.md`
- `docs/frontend-audit/2026-05-16-frontend-audit-rerun.md`
- `docs/superpowers/specs/2026-05-16-hertz-theme-gallery-scope.md`
- `docs/superpowers/specs/2026-05-16-hertz-social-experience-spec.md`
- `docs/review-tooling/README.md`
- Screenshot masalah DM: `docs/teswebimg/pasted file.png`

## Prinsip Review

- Jangan langsung edit kode saat fase diskusi.
- Setiap keputusan harus punya alasan dan dampak user.
- UI desktop dan mobile harus dibahas bersamaan.
- Public frontend harus tetap mengikuti tema HERTZ.
- Build di VPS hanya production build, tidak menjalankan dev server.
- Setelah implementasi nanti, perubahan harus diverifikasi dan dicommit per scope kecil.
- Karena tooling review sudah bertambah, spec dan plan harus mengikat penggunaan Playwright, MCP/browser agent, visual regression, accessibility audit, DOM diff, dan session replay sebelum coding dimulai.

## Keputusan Eksekusi

Keputusan user: semua improvement HERTZ dikerjakan dalam **satu fase besar**, meskipun scope cukup banyak.

Cara eksekusinya bukan dengan mengurangi scope, tetapi dengan mengubah urutan kerja:

- Satu fase HERTZ berisi semua todo yang sudah disepakati dalam diskusi ini.
- Todo harus dipecah kecil dan jelas.
- Setiap todo wajib punya acceptance criteria.
- Setiap todo wajib diverifikasi sebelum lanjut ke todo berikutnya.
- Verifikasi minimal mencakup build/check yang relevan dan responsive check jika menyentuh UI.
- Jika todo menyentuh fitur login, harus diverifikasi sebagai guest, member, dan/atau admin sesuai kebutuhan.
- Commit dilakukan setelah todo atau batch kecil selesai diverifikasi, agar histori tetap mudah ditelusuri.
- Karena berada di VPS, tidak menjalankan dev server; gunakan build produksi/check dan verifikasi live sesuai instruksi user.
- Untuk todo UI, baseline review harus dibuat atau diperbarui sebelum perubahan besar agar hasil visual/DOM sesudah implementasi bisa dibandingkan.
- Untuk todo layout/responsive, wajib memakai Playwright visual regression pada route dan viewport terdampak.
- Untuk todo overlay/action keyboard, wajib memakai accessibility audit dan minimal keyboard/manual browser-agent check.
- Untuk todo flow interaktif yang rawan regress seperti detail modal, share sheet, DM, composer, dan delete confirm, gunakan MCP/browser agent atau session replay sebagai bukti audit jika visual/static check belum cukup.

## Keputusan Review Tooling

Status: Siap spec

Tooling review yang sudah tersedia:

- Playwright untuk browser automation, visual regression, screenshot, trace, dan video.
- Playwright MCP untuk browser agent/computer-use saat perlu investigasi interaktif.
- Axe + Playwright untuk accessibility audit.
- DOM snapshot/diff untuk menangkap perubahan struktur halaman.
- rrweb session replay audit-only untuk merekam flow review tanpa memasang recorder permanen di UI produksi.

Keputusan pemakaian:

1. Tidak menjalankan dev server di VPS. Semua review memakai `REVIEW_BASE_URL` ke web live setelah build/deploy.
2. `npm run review:visual:update` hanya dipakai saat baseline memang ingin diterima sebagai kondisi baru.
3. `npm run review:visual` dipakai setelah perubahan layout/responsive pada route terdampak.
4. `npm run review:a11y` dipakai setelah perubahan overlay, form, icon-only control, nav, atau action keyboard.
5. `npm run review:dom:update` dipakai untuk membuat baseline DOM sebelum batch UI besar.
6. `npm run review:dom` dipakai setelah perubahan untuk melihat diff struktur yang tidak selalu terlihat dari screenshot.
7. `npm run review:mcp` dipakai untuk browser-agent review saat perlu klik, navigasi, keyboard, network, atau snapshot aksesibilitas secara interaktif.
8. `npm run review:replay` dipakai untuk flow yang perlu bukti run, misalnya post detail modal desktop, share sheet, DM mobile, composer upload, dan delete confirm.
9. Artifact review tidak masuk commit kecuali sengaja dijadikan baseline atau bukti diskusi.
10. Plan implementasi berikutnya wajib menulis command review yang relevan per todo, bukan hanya `build`.

## Keputusan Right Sidebar Market Widget

Status: Siap spec

Tambahan dari review screenshot user: right sidebar market perlu dipoles menjadi widget market premium compact, bukan chart dashboard besar.

Target rasa visual:

- ultra modern fintech UI;
- dark mode;
- glassmorphism halus;
- subtle neon glow;
- clean spacing;
- premium crypto exchange aesthetic;
- terinspirasi Binance, Bybit, TradingView, dan Stripe Dashboard;
- tetap selaras dengan tema HERTZ.

Scope desain:

- Widget hanya hidup di right sidebar sempit, bukan full dashboard.
- Tidak membuat chart besar.
- Buat 3 compact stacked cards:
  - Forex Market;
  - Crypto Market;
  - Stock Market.
- Setiap card punya header dengan icon market, badge/pill label, live indicator dot, rounded container, dan border glow sesuai warna market.
- Main asset section menampilkan symbol dominan, subtitle, current price besar tetapi tidak oversized, dan percentage badge hijau/merah.
- Chart memakai compact Recharts `AreaChart`, tinggi sekitar 56-80px, tanpa axes, tanpa label berat, gradient halus, smooth curve, dan responsive width.
- Secondary assets berisi 3 row compact: symbol, tiny sparkline, current price, percentage change.
- Row harus rapi, tidak overflow sidebar, dan memakai separator halus.
- Footer card memuat source label dan update time dengan muted typography.

Warna:

- Forex: emerald/green neon.
- Crypto: purple neon.
- Stock: blue neon.

Requirement teknis:

- Reusable `MarketCard` component.
- Reusable `Sparkline` component.
- TypeScript types bersih.
- Production-ready.
- Responsive dan tidak overflow.
- Mobile friendly, tetapi tidak boleh mengalahkan konten utama mobile HERTZ.
- Accessible.
- Gunakan realistic dummy market data jika data live belum tersedia.
- Gunakan Recharts untuk chart.
- Jika dependency `recharts` belum ada, tambahkan pada task implementasi terkait.

Acceptance:

- Right sidebar desktop terlihat premium tetapi tetap compact.
- Tidak ada chart lebih tinggi dari 80px di card market.
- Tidak ada horizontal overflow pada sidebar.
- Tiga card market terbaca di width sidebar terbatas.
- Hover memberi transition/glow halus tanpa mengganggu readability.
- Widget tidak berubah menjadi full dashboard.

## Urutan Review yang Disarankan

| Urutan | Area | Status | Alasan |
| --- | --- | --- | --- |
| 1 | Direct Message | Siap spec | Keputusan UX utama sudah dicatat: label mobile, guest CTA, menu tiga titik, polling, dan batas upload gambar. |
| 2 | HERTZ Feed dan Post Detail | Perlu keputusan | Layout live sudah tidak overflow, tetapi masih perlu keputusan untuk media post, author action, hapus, detail post, dan mobile action labels. |
| 3 | Profile / Member Center | Belum direview | Sudah ada route, perlu pastikan isi dan navigasi sesuai kebutuhan user Telegram. |
| 4 | Navigation Shell Desktop/Mobile | Belum direview | Menentukan rail kiri, rail kanan, bottom nav, menu yang disembunyikan, dan sticky behavior. |
| 5 | Landing Horizon | Belum direview | Perlu pastikan mobile kecil, brand signal, dan gateway ke HERTZ. |
| 6 | Blog | Belum direview | Perlu sinkron tema HERTZ, ownership, dan flow member/admin. |
| 7 | Outlook | Belum direview | Perlu sinkron tema HERTZ tanpa merusak sumber WordPress. |
| 8 | Tools Hub dan Tool Detail | Belum direview | Perlu konsistensi tema HERTZ dan responsive table/card mode. |
| 9 | Gallery Dormant | Belum direview | Fitur harus hidden/inactive sampai dibuka lagi. |
| 10 | Admin Frontend | Belum direview | Perlu pastikan tema cukup konsisten tanpa mengganggu operasional admin. |

## Review 1: Direct Message

Status: Siap spec

### Kondisi Saat Ini

Screenshot `docs/teswebimg/pasted file.png` menunjukkan halaman publik `/hertz/messages` sempat menampilkan UI lama:

- rail kiri tampil sebagai teks/menu mentah, bukan shell HERTZ fixed rail;
- label user masih `GuestRead-only`, bukan copywriting terbaru;
- composer masih menampilkan input file browser default seperti `Browse... No files selected`;
- layout DM tidak memakai frame/grid HERTZ yang benar;
- konten terasa bertabrakan dan tidak nyaman di mobile.

Audit teknis setelah rebuild menemukan penyebab utamanya:

- path publik normal masih memakai prerender/cache lama;
- origin lokal sudah memakai UI baru;
- route `/hertz/messages` sudah dibuat dynamic agar tidak terjebak static prerender;
- Nginx diberi bypass untuk path exact `/hertz/messages` agar cache lama tidak dipakai.

Commit terkait:

- `9d91880 Make HERTZ messages route dynamic`

### Istilah Role dan Status Login

Keputusan bahasa:

- `member` adalah user Telegram/member aplikasi yang sudah login.
- `admin` adalah admin aplikasi.
- Istilah `owner` tidak dipakai sebagai role agar tidak membingungkan. Untuk postingan, sebut sebagai `pembuat postingan` atau `member pembuat post`.
- Role database tetap hanya dua: `member` dan `admin`.
- Untuk frontend/access-control, aplikasi memakai tiga access role: `guest`, `member`, dan `admin`.
- `guest` berarti user belum login atau tidak punya session member aktif.
- `guest` dibuat sebagai role/state akses turunan, bukan row user di database.
- UI menampilkan guest sebagai `Guest` dengan status `Mode baca`.
- Access role `guest` dipakai agar menu/fitur bisa diatur mudah, misalnya menyembunyikan menu Tools atau action tertentu untuk user belum login.

### Masalah Produk/UX yang Masih Perlu Dibahas

1. **Guest state DM**
   Guest saat belum login sebaiknya tidak melihat action operasional seperti arsip, blokir, upload gambar, dan kirim pesan sebagai kontrol utama.

2. **Mobile flow**
   Mobile sebaiknya memakai alur dua layar:
   - layar 1: daftar percakapan dan search member;
   - layar 2: thread aktif dengan tombol kembali ke inbox.

3. **Composer**
   Composer perlu terasa seperti HERTZ, bukan browser default file upload. Tombol gambar harus berbentuk kontrol UI, input file disembunyikan.

4. **Empty state**
   Saat belum ada percakapan, user perlu melihat state yang jelas:
   - guest: ajakan login Telegram;
   - member: ajakan cari member atau mulai percakapan.

5. **Copywriting**
   UI perlu konsisten bahasa Indonesia:
   - `Direct Message` boleh tetap sebagai nama fitur atau dipendekkan `DM`;
   - `Inbox`, `Archive`, `Block`, `Send`, `Image` perlu diputuskan apakah diterjemahkan.

### Opsi Arah Desain DM

#### Opsi A: Minimal Fix

Fokus hanya memastikan layout tidak patah dan cache tidak memunculkan UI lama.

Kelebihan:

- paling cepat;
- risiko rendah;
- cukup untuk menghilangkan masalah screenshot.

Kekurangan:

- guest/member UX masih biasa saja;
- mobile belum terasa seperti aplikasi chat yang matang;
- spec DM masih akan perlu dibuka lagi nanti.

#### Opsi B: Polish DM Terarah

Tetap memakai struktur DM yang ada, tetapi memperbaiki state dan behavior utama:

- guest state khusus;
- mobile dua layar;
- composer HERTZ-style;
- empty state;
- copywriting konsisten;
- archive/block/report diposisikan sebagai secondary actions.

Kelebihan:

- scope masih masuk akal;
- langsung menyelesaikan keluhan utama desktop/mobile;
- cocok menjadi spec implementasi berikutnya.

Kekurangan:

- butuh testing responsive dan login/member;
- masih memakai polling, belum realtime websocket.

#### Opsi C: Redesign DM Lebih Besar

DM dibuat lebih mirip chat product lengkap:

- conversation grouping;
- unread badges yang lebih kuat;
- search global;
- media preview;
- skeleton/loading;
- realtime/websocket;
- moderation/report flow lengkap.

Kelebihan:

- hasil paling matang.

Kekurangan:

- scope terlalu besar untuk batch frontend saat ini;
- berisiko menunda perbaikan UI utama;
- perlu desain backend/realtime tambahan.

### Rekomendasi Awal

Pilih **Opsi B: Polish DM Terarah**.

Alasannya: masalah screenshot sudah terbukti bukan hanya visual kecil, tetapi gabungan cache, shell, guest state, composer, dan mobile flow. Opsi B cukup menyelesaikan UX yang terasa rusak tanpa membuka redesign realtime besar.

### Keputusan yang Perlu Dikonfirmasi

1. Nama fitur di UI mobile memakai `DM`, sementara desktop tetap boleh memakai `Direct Message`. Untuk aksesibilitas, kontrol mobile tetap memakai label lengkap `Direct Message`.
2. Guest yang belum login langsung melihat CTA login Telegram. Layout inbox kosong/read-only tidak ditampilkan untuk guest.
3. Action sekunder `Arsipkan` dan `Blokir` dipindah ke menu tiga titik di header thread. Header utama hanya memuat identitas conversation dan navigasi/back.
4. DM fase ini tetap memakai polling 5-10 detik tanpa websocket. Websocket/realtime ditunda ke fase terpisah setelah kebutuhan realtime dan kapasitas server jelas.
5. Upload gambar DM tetap maksimal 4 gambar per pesan dan hanya mendukung JPG, PNG, atau WEBP.

### Ringkasan Keputusan Final DM

- Desktop boleh tetap memakai nama `Direct Message`.
- Mobile memakai label pendek `DM`.
- Guest langsung melihat CTA login Telegram.
- Member melihat inbox/search dan thread dalam alur dua layar di mobile.
- Header thread dibuat bersih; action sekunder masuk menu tiga titik.
- DM tetap polling 5-10 detik.
- Upload gambar tetap tersedia dengan batas 4 gambar per pesan.

## Review Berikutnya

Setelah DM disepakati, area berikutnya yang disarankan adalah **HERTZ Feed dan Post Detail**, karena terkait langsung dengan:

- edit/delete postingan oleh member pembuat post;
- action bar selain komentar/suka;
- copy link;
- composer kategori Trading/Life/General;
- detail post;
- responsive card post.

## Review 2: HERTZ Feed dan Post Detail

Status: Perlu keputusan

### Kondisi Saat Ini

Area yang dicek:

- `/hertz`
- `/hertz/post/hzx_live01`
- `frontend/src/components/feed/HertzComposer.tsx`
- `frontend/src/components/feed/HertzPost.tsx`
- `frontend/src/components/feed/HertzActionBar.tsx`
- `frontend/src/components/feed/HertzPostMenu.tsx`
- `frontend/src/components/feed/HertzDetailInteractions.tsx`

Hasil cek live:

- Desktop 1365px, mobile 390px, dan mobile kecil 320px tidak menunjukkan horizontal overflow global.
- Feed sudah menampilkan composer guest CTA login Telegram.
- Action bar di desktop sudah punya `Komentar`, `Suka`, `Repost`, `Simpan`, dan `Bagikan`.
- Mobile menyembunyikan teks action dan menyisakan ikon/count agar tidak penuh.
- Menu tiga titik sudah punya `Salin link`, `Quote postingan`, `Laporkan`, `Edit postingan`, `Hapus postingan`, dan action admin jika user berhak.
- Deteksi edit/delete untuk member pembuat post memakai kombinasi `post.viewer.canEdit/canDelete` dan fallback user dari `/api/auth/me`.
- Composer Trading sudah punya field Pair, TF, Arah, Risk, Entry, SL, TP, dan Confidence.
- Detail post sudah memakai HERTZ shell dan menampilkan comment form serta list komentar.

### Masalah Produk/UX yang Masih Perlu Dibahas

1. **Media untuk Life dan General**
   Saat ini upload gambar hanya aktif untuk kategori Trading. Life dan General tidak bisa upload media. Ini bisa benar jika aturan produk memang hanya chart trading, tetapi terasa membatasi untuk social feed.

2. **Delete post belum punya confirm**
   `Hapus postingan` langsung memanggil DELETE dan reload. Untuk aksi destruktif, perlu confirm dialog agar member pembuat post tidak salah hapus.

3. **Edit post hanya edit konten**
   Member pembuat post bisa edit teks post, tetapi metadata market saat ini hanya admin yang bisa edit. Keputusan diskusi: member pembuat Trading post juga boleh memperbaiki Pair/Risk/Entry dan metadata trading lain miliknya sendiri.

4. **Member author regression harus diuji sebagai user login**
   Kode sudah mendukung edit/delete milik pembuat postingan, tetapi acceptance criteria harus mencakup test login Telegram sebagai `ARDANI | vastara.id`: post milik sendiri menampilkan edit/delete, post orang lain tidak.

5. **Mobile action labels**
   Mobile menyembunyikan teks `Komentar`, `Suka`, `Repost`, `Simpan`, `Bagikan`. Ini hemat ruang, tetapi discoverability bisa lebih rendah. Minimal `aria-label` harus lengkap dan visual icon/count harus konsisten.

6. **Copy link muncul di dua tempat**
   `Bagikan` di action bar saat ini hanya copy link, sedangkan `Salin link` di menu tiga titik juga copy link. Keputusan baru: tombol `Bagikan` di action bar membuka popup/share sheet berisi pilihan kanal berbagi seperti sosial media umum. `Salin link` tetap tersedia sebagai action langsung di menu tiga titik.

7. **Plain repost belum muncul di timeline**
   Temuan live: saat member menekan `Repost`, tombol menjadi aktif dan count naik, tetapi postingan tidak muncul ulang di feed sebagai repost. Root cause: plain repost hanya membuat record di `hertz_reposts`; query feed saat ini hanya membaca `hertz_posts`, sehingga repost tanpa quote hanya dihitung sebagai interaction. Data live membuktikan repost `ARDANI | vastara.id` tersimpan untuk `hzx_live01` dan `hzx_live04`, tetapi `repost_post_id` kosong.

8. **Postingan tersimpan belum punya histori di profile**
   Tombol `Simpan` sudah menyimpan bookmark ke `hertz_bookmarks`, tetapi user belum punya tempat untuk melihat daftar postingan yang pernah disimpan. Profile/member center perlu punya section atau tab `Disimpan` yang menampilkan histori bookmark milik member.

9. **Detail post perlu identitas halaman yang lebih kuat**
   Keputusan baru: desktop tidak pindah halaman saat membuka detail post dari feed. Desktop memakai popup/modal elegan agar user tetap berada di feed dan tidak perlu kembali manual. Mobile tetap pindah ke halaman detail karena modal detail post kurang nyaman di layar kecil.

10. **Komentar guest masih menampilkan form**
   Guest melihat textarea komentar dan baru diberi pesan login saat fokus/submit. Bisa dipertahankan, tetapi CTA login Telegram mungkin lebih jelas jika belum login.

### Opsi Arah Desain Feed/Post

#### Opsi A: Stabilkan yang Sudah Ada

Scope:

- Tambah confirm untuk delete.
- Pastikan edit/delete regression untuk member pembuat post.
- Rapikan copywriting action.
- Pertahankan media hanya untuk Trading.
- Pertahankan mobile icon-only action bar.

Kelebihan:

- cepat dan risiko rendah;
- cocok jika feed saat ini dianggap sudah cukup.

Kekurangan:

- Life/General tetap tidak punya media;
- detail post masih minimal;
- member pembuat Trading post tidak bisa edit metadata sendiri.

#### Opsi B: Polish Feed Terarah

Scope:

- Semua scope Opsi A.
- Putuskan media untuk kategori non-Trading.
- Owner Trading boleh edit metadata market miliknya sendiri.
- Detail post diberi header/identity lebih jelas.
- Guest comment form diganti atau didampingi CTA login Telegram.
- Plain repost muncul sebagai item timeline dengan label member yang melakukan repost.
- Profile/member center menampilkan tab atau section `Disimpan` untuk histori postingan yang dibookmark dari tombol `Simpan`.
- `Bagikan` membuka share popup/sheet; `Salin link` tetap tersedia sebagai aksi cepat di menu tiga titik.

Kelebihan:

- menyelesaikan gap produk yang paling terasa tanpa redesign besar;
- cocok untuk spec implementasi berikutnya;
- memperjelas workflow member pembuat post yang sempat jadi concern utama.

Kekurangan:

- butuh test authenticated;
- menyentuh composer, post menu, detail, dan interaction components.

#### Opsi C: Redesign Feed Lebih Besar

Scope:

- Membuat composer multi-mode penuh.
- Media preview, drag/drop, dan attachment manager.
- Detail post dengan related posts/threading.
- Desktop detail popup/modal dengan route fallback tetap tersedia.
- Feed filters dan saved/bookmarked views.
- Draft post dan optimistic update tanpa full reload.

Kelebihan:

- pengalaman feed jauh lebih matang.

Kekurangan:

- terlalu besar untuk batch setelah DM;
- perlu spec terpisah dan kemungkinan perubahan data/API tambahan.

### Rekomendasi Awal

Pilih **Opsi B: Polish Feed Terarah**.

Alasannya: layout dasar sudah cukup stabil, action bar sudah lebih lengkap, dan composer Trading sudah berkembang. Sisa masalah paling penting adalah keputusan produk yang langsung memengaruhi member pembuat post: upload media non-Trading, edit metadata, confirm delete, dan detail/guest state.

### Keputusan Feed/Post yang Sudah Disepakati

1. Life dan General boleh upload gambar juga. Upload media tidak lagi khusus Trading, tetapi tetap dibatasi sebagai gambar pada fase ini.
2. Member pembuat Trading post boleh edit metadata market miliknya sendiri. Admin juga boleh edit metadata market semua postingan.
3. Plain repost harus muncul di feed/timeline sebagai item repost, bukan hanya menaikkan count. Tampilan yang disarankan: card original tetap dipakai, dengan label/header kecil seperti `ARDANI | vastara.id merepost`.
4. Profile/member center harus punya section/tab `Disimpan` untuk melihat histori postingan yang disimpan/bookmarked.
5. Delete post wajib memakai confirm dialog sebelum benar-benar hapus.
6. Tombol `Bagikan` di action bar membuka popup/share sheet. Isi minimal: Salin link, Telegram, WhatsApp, X/Twitter, Facebook, dan native share jika browser mendukung.
7. Untuk guest di detail post, form komentar diganti atau didampingi CTA login Telegram sesuai rekomendasi UX. Guest tidak melihat pengalaman seolah form aktif penuh.
8. Guest menu/access dikontrol lewat access role `guest/member/admin`.
9. Notifikasi minimal masuk scope: minimal unread indicator untuk DM dan activity indicator ringan untuk aktivitas sosial.
10. Follow/following tidak masuk fase ini.
11. Profile bio masuk scope sesuai rekomendasi: bio singkat, statistik dasar, joined date, dan aktivitas utama.
12. Search sosial di kanan atas harus difungsikan sebagai search sosial untuk post/member/topik, bukan sekadar dekorasi.
13. Hashtag/topik masuk scope.
14. Block/mute/report lanjutan tidak masuk fase ini. Report yang sudah ada cukup memakai feedback sukses dasar.
15. Notification settings tidak masuk fase ini; mengikuti rekomendasi untuk ditunda.

### Keputusan Share Popup

- Klik `Bagikan` tidak langsung copy link.
- Desktop: tampil sebagai popover/modal kecil yang elegan dekat action bar atau centered jika ruang sempit.
- Mobile: tampil sebagai bottom sheet.
- Opsi minimal:
  - Salin link
  - Telegram
  - WhatsApp
  - X/Twitter
  - Facebook
  - Native share, jika `navigator.share` tersedia
- Semua opsi memakai URL canonical `/hertz/post/[shortId]`.
- Setelah aksi berhasil, user melihat feedback singkat seperti `Link disalin` atau `Membuka Telegram`.
- `Salin link` di menu tiga titik tetap ada sebagai shortcut langsung.

### Keputusan Detail Post Desktop/Mobile

- Desktop: klik post dari feed membuka detail dalam popup/modal elegan.
- Desktop modal tetap menampilkan post, action bar, komentar, dan form/CTA komentar.
- Desktop modal harus punya close button, backdrop click close, dan keyboard escape close.
- Desktop modal tidak boleh membuat feed kehilangan posisi scroll.
- Mobile: klik post tetap pindah ke `/hertz/post/[shortId]`.
- Route detail tetap dipertahankan untuk mobile, direct link, SEO/canonical, copy link, dan fallback jika modal gagal.

### Acceptance Criteria untuk Spec Nanti

- Feed dan detail tidak horizontal overflow di 320px, 390px, tablet, dan desktop.
- Login member `ARDANI | vastara.id` melihat `Edit postingan` dan `Hapus postingan` pada post miliknya sendiri.
- Non-author member tidak melihat edit/delete postingan orang lain.
- Member pembuat Trading post bisa edit Pair, TF, Arah, Risk, Entry, SL, TP, dan Confidence miliknya sendiri.
- Admin bisa edit/delete semua postingan dan edit metadata market semua postingan.
- Plain repost muncul sebagai item timeline dengan identitas member yang melakukan repost.
- Repost toggle/count tetap sinkron dengan item timeline.
- Tombol `Simpan` punya histori yang bisa dilihat di profile sebagai `Disimpan`.
- Section `Disimpan` hanya muncul untuk `member` dan `admin`; `guest` melihat CTA login.
- Tombol `Bagikan` membuka share popup/sheet dengan opsi sosial dan copy link.
- Guest detail comment menampilkan CTA login, bukan form aktif yang membingungkan.
- Search kanan atas mengembalikan hasil sosial: post, member, dan hashtag/topik.
- Hashtag/topik dapat muncul sebagai link/filter sosial.
- Profile member punya bio, statistik dasar, joined date, dan tab aktivitas utama.
- Notifikasi minimal tampil untuk DM unread dan activity indicator ringan.
- Delete tidak terjadi tanpa confirm.
- Action bar tetap usable di mobile icon-only.
- Desktop detail post bisa dibuka sebagai modal tanpa meninggalkan feed.
- Mobile detail post tetap memakai halaman penuh dengan back affordance dan state komentar yang jelas.

### 9 Temuan Tambahan dari Codex

Selain poin yang sudah dibahas, berikut 9 temuan HERTZ yang menurut saya perlu masuk bahan diskusi sebelum spec:

1. **Access role belum menjadi helper terpusat**
   Kita sudah sepakat memakai access role `guest`, `member`, dan `admin` di frontend. Saat ini pengecekan masih tersebar lewat `currentUser` atau `currentUser.role`. Spec perlu membuat helper kecil agar menu/fitur bisa dikontrol konsisten, misalnya menyembunyikan Tools untuk guest jika itu keputusan produk. Aturan ini juga harus menjaga mobile navigation tetap rapi ketika menu berbeda untuk guest/member/admin.

2. **Profile belum menjadi pusat aktivitas**
   Profile saat ini baru menampilkan status akun dan credit. Seharusnya member center berkembang menjadi tempat:
   - Bio singkat
   - Statistik dasar
   - Joined date
   - Post saya
   - Disimpan
   - Repost saya
   - Komentar saya
   - Credit/history
   - Setting Telegram/session

3. **Belum ada notifikasi HERTZ**
   HERTZ belum punya notification center untuk komentar baru, repost, like/suka, DM unread, atau status report/moderation. Keputusan fase ini: buat notifikasi minimal berupa badge unread DM dan activity indicator ringan. Notification settings ditunda.

4. **Feed belum punya state yang matang**
   Empty state, loading state, error state, dan skeleton belum konsisten. Contoh: ketika filter kosong, search kosong, guest belum login, atau API gagal, UI perlu pesan yang jelas dan actionable. Ini juga termasuk menentukan action mana yang cukup update lokal dan mana yang boleh reload halaman, supaya pengalaman tidak terasa patah.

5. **Composer belum punya preview media dan remove per file**
   Setelah Life/General boleh upload gambar, composer perlu preview thumbnail, tombol hapus per file, validasi ukuran/format yang terlihat, dan progress upload yang tidak membuat user bingung.

6. **Repost dan quote perlu pemisahan UX**
   Sekarang `Repost` ada di action bar dan `Quote postingan` ada di menu. Setelah plain repost muncul di timeline, UX perlu jelas:
   - Repost cepat dari action bar.
   - Quote dari menu/share composer.
   - Repost sendiri tidak boleh, dan errornya harus terlihat jelas.

7. **Report/moderation feedback belum lengkap untuk member**
   Member bisa melaporkan postingan, tetapi belum ada status apakah report diterima, sedang ditinjau, atau selesai. Keputusan fase ini: cukup feedback sukses dasar. Block/mute/report lanjutan dan histori report ditunda.

8. **SEO dan social preview detail post masih tipis**
   Detail post metadata saat ini masih memakai title berbasis shortId. Untuk share popup, post detail sebaiknya punya title, description, dan Open Graph/Twitter metadata dari konten post agar link terlihat bagus saat dibagikan ke Telegram, WhatsApp, atau X.

9. **Accessibility modal harus dirancang dari awal**
   Desktop post detail modal, share popup, delete confirm, edit dialog, dan DM menu perlu focus trap, Escape close, aria label, dan restore focus. Ini penting karena HERTZ akan punya banyak overlay.

Catatan verifikasi untuk semua temuan ini:

- Banyak fitur HERTZ hanya bisa valid jika login member/admin.
- Spec implementasi harus punya checklist login sebagai member `ARDANI | vastara.id`, non-author member, guest, dan admin.

Prioritas dari 9 temuan tambahan:

1. Access role helper untuk `guest/member/admin`.
2. Profile tabs: Post saya, Disimpan, Repost saya.
3. Repost timeline muncul benar.
4. Share popup dan post detail modal dengan accessibility benar.
5. SEO/social preview untuk detail post karena berkaitan langsung dengan share.

### Review Perspektif Pengguna Sosial Media

Review ini melihat HERTZ sebagai produk sosial media, bukan hanya sebagai halaman yang tidak overflow.

Target rasa produk: **seperti Twitter/X untuk komunitas trading**.

Perangkat yang dicek live:

- Desktop 1440x950
- Tablet 768x1024
- Mobile 390x844
- Mobile kecil 320x740

Hasil umum:

- Tidak ada horizontal overflow pada route utama yang dicek.
- `/hertz`, `/hertz/post/hzx_live01`, `/hertz/profile`, dan `/hertz/messages` bisa dibuka.
- Masalah terbesar bukan crash layout, tetapi rasa produk sosial media yang belum lengkap dan beberapa breakpoint yang kurang nyaman.

#### Temuan Kenyamanan Desktop

1. **Feed terasa terlalu utilitarian, belum cukup sosial**
   Layout sudah rapi, tetapi belum ada elemen yang membuat user merasa ada aktivitas komunitas yang hidup: notifikasi, siapa baru repost, siapa baru komentar, trending people/topic, atau activity hint.

2. **Detail post desktop masih terasa seperti halaman, bukan percakapan**
   Keputusan modal desktop sudah benar. Sebagai user desktop, pindah halaman untuk membaca komentar terasa memperlambat flow feed.

3. **Share belum mendukung kebiasaan sosial media**
   Tombol `Bagikan` harus menjadi share sheet. Kalau hanya copy link, user merasa fitur belum selesai.

4. **Right rail market kuat, tetapi konteks sosial kurang**
   Right rail memberi data market, tetapi belum ada panel sosial seperti `Trending di HERTZ`, `Aktif hari ini`, `Post tersimpan`, atau `DM unread`. Untuk sosial media trading, kombinasi market + komunitas akan terasa lebih lengkap.

#### Temuan Kenyamanan Tablet

1. **Tablet 768px adalah breakpoint paling bermasalah**
   Cek live menunjukkan post pertama di `/hertz` pada tablet hanya sekitar 156px lebar, dan detail post sekitar 106px lebar. Ini bukan overflow, tetapi konten jadi terlalu sempit karena layout masih memperlakukan tablet seperti desktop dengan rail kiri.

2. **Tablet sebaiknya memakai layout mobile/tablet, bukan desktop rail penuh**
   Pada lebar 768px, left rail desktop dan content feed tidak punya ruang cukup. Perlu breakpoint khusus tablet: rail kiri disembunyikan/compact, content full-width, bottom nav tetap aktif.

3. **Tablet detail post perlu prioritas konten**
   Jika rail kanan/market atau header terlalu dominan, user tablet harus scroll sebelum membaca post. Detail post tablet sebaiknya lebih dekat ke mobile behavior.

#### Temuan Kenyamanan Mobile

1. **Mobile action bar terlalu tersandi**
   Icon-only action bar hemat ruang, tetapi user baru mungkin tidak langsung tahu angka `1 7 1` itu komentar/suka/repost. Minimal perlu tooltip/aria sudah ada, tetapi visual mobile bisa memakai label pendek atau mode reveal saat ruang cukup.

2. **Mobile detail post kebanyakan market sebelum konten**
   Pada `/hertz/post/hzx_live01`, mobile menampilkan `Market Live` panjang sebelum post. Sebagai user yang membuka detail post, prioritas utama seharusnya post dan komentar. Market mobile sebaiknya collapsible atau lebih rendah di halaman detail.

3. **Bottom nav 6 item padat**
   `Home Outlook Blog Tools DM Akun` masih muat, tetapi semakin padat. Jika access role guest/member/admin nanti mengubah menu, perlu aturan prioritas agar bottom nav tidak terasa penuh.

4. **Guest feed terlalu dekat ke mode read-only umum**
   Guest melihat feed dan banyak action, lalu baru diberi pesan login saat mencoba. Untuk user baru, CTA login perlu lebih jelas tetapi tidak menghalangi eksplorasi.

5. **Create post di mobile belum terasa cepat**
   Composer ada di atas feed. Setelah user scroll jauh, tidak ada tombol cepat untuk kembali membuat post. Sosial media biasanya punya floating compose button atau shortcut yang jelas untuk member.

#### Temuan Direct Message

1. **Guest DM masih menampilkan kontrol operasional**
   Live `/hertz/messages` masih menampilkan filter `Inbox/Unread/Admin/Archived` dan action seperti `Arsipkan`, `Blokir`, `Gambar`, `Kirim` walaupun guest belum login. Ini bertentangan dengan keputusan diskusi bahwa guest langsung melihat CTA login Telegram.

2. **DM mobile belum terasa seperti inbox**
   Pada mobile guest, halaman hanya menunjukkan pesan login + filter. Untuk member nanti perlu benar-benar dua layar: inbox dan thread. Untuk guest, cukup CTA login.

#### Temuan Profile

1. **Profile guest terlalu kosong**
   Profile guest hanya CTA login. Itu benar secara fungsi, tetapi sebagai calon member belum menjelaskan manfaat konkret: bisa posting, simpan post, DM, komentar, dan melihat histori aktivitas.

2. **Profile member perlu menjadi dashboard sosial**
   Profile harus menjadi pusat aktivitas, bukan hanya status Telegram dan credit. Tab `Post saya`, `Disimpan`, `Repost saya`, `Komentar saya`, dan `Credit` menjadi kebutuhan utama.

#### Temuan Konten dan Bahasa

1. **Istilah masih campur**
   Ada `Direct Message`, `Inbox`, `Unread`, `Archived`, `Quote postingan`, `Verified Member`, `Mode baca`. Perlu keputusan bahasa: UI utama Indonesia, istilah produk boleh English hanya jika konsisten.

2. **Label kategori perlu lebih jelas**
   `Life` dan `General` cukup umum. Sebagai user baru, perlu hint pendek di composer atau empty state agar tahu konten apa yang cocok untuk tiap kategori.

3. **Search sosial dan hashtag perlu terasa seperti X**
   Search di kanan atas harus difungsikan untuk pencarian sosial: post, member, dan hashtag/topik. Hashtag pada post sebaiknya bisa diklik untuk filter/topik, agar HERTZ terasa seperti timeline sosial, bukan daftar artikel.

#### Prioritas UX dari Perspektif User

1. Fix breakpoint tablet 768px agar feed/detail tidak menjadi kolom sempit.
2. Terapkan guest access role pada DM dan menu/action.
3. Buat desktop detail post modal dan mobile detail tetap halaman penuh.
4. Buat Profile menjadi pusat aktivitas: Post saya, Disimpan, Repost saya.
5. Tampilkan plain repost di timeline.
6. Buat share sheet.
7. Tambahkan media preview/remove di composer.
8. Kurangi dominasi Market Live pada mobile detail post.
9. Tambahkan notification/unread indicator minimal untuk DM dan activity.
10. Fungsikan search sosial dan hashtag/topik.

### Review Lintas Persona Pengguna

Bagian ini melihat HERTZ dari beberapa tipe user yang kemungkinan memakai produk dengan ekspektasi berbeda.

#### 1. Guest / Calon Member

Ekspektasi:

- Bisa memahami HERTZ dalam 10-20 detik.
- Bisa membaca feed tanpa dipaksa login.
- Tahu manfaat login Telegram dengan jelas.

Yang kurang nyaman:

- Guest masih melihat beberapa action yang terlihat aktif, lalu baru ditolak saat dipakai.
- DM guest masih menampilkan kontrol operasional.
- Profile guest belum menjelaskan manfaat konkret login.
- Tools/fitur yang tidak boleh dipakai guest belum punya aturan menu yang jelas.

Implikasi spec:

- Access role `guest` harus mengontrol menu dan action.
- Guest CTA harus jelas, tetapi tidak menghalangi user membaca feed.
- DM guest harus langsung CTA login Telegram.

#### 2. Member Pembaca / Lurker

Ekspektasi:

- Feed cepat dibaca.
- Bisa simpan post penting.
- Bisa menemukan ulang post yang disimpan.
- Bisa cari topik, member, atau hashtag.

Yang kurang nyaman:

- `Simpan` belum punya histori di profile.
- Search sosial belum jelas hasilnya.
- Hashtag/topik belum menjadi affordance navigasi.
- Mobile action bar icon-only membuat fungsi kurang eksplisit untuk user baru.

Implikasi spec:

- Profile wajib punya `Disimpan`.
- Search kanan atas menjadi search sosial.
- Hashtag/topik dibuat clickable.
- Mobile action perlu tetap hemat ruang tetapi lebih mudah dipahami.

#### 3. Member Pembuat Post

Ekspektasi:

- Cepat membuat post seperti di X.
- Bisa upload gambar untuk Trading, Life, dan General.
- Bisa edit/delete post sendiri tanpa bingung.
- Bisa memperbaiki metadata trading yang salah.

Yang kurang nyaman:

- Composer mobile hanya di atas feed; setelah scroll jauh tidak ada shortcut cepat.
- Media belum punya preview/remove.
- Delete belum punya confirm.
- Edit metadata market untuk member pembuat post belum sesuai keputusan.

Implikasi spec:

- Composer perlu preview media dan remove per file.
- Member pembuat post bisa edit teks dan metadata trading miliknya.
- Delete wajib confirm.
- Mobile member perlu shortcut compose atau affordance kembali ke composer.

#### 4. Trader Aktif

Ekspektasi:

- Bisa membaca setup cepat: pair, arah, risk, entry, SL, TP, confidence.
- Bisa membandingkan post dengan market context.
- Bisa melihat diskusi komunitas tanpa kehilangan market context.

Yang kurang nyaman:

- Market context penting, tetapi pada mobile detail post terlalu mendominasi sebelum konten.
- Right rail market desktop kuat, tetapi belum ada konteks komunitas seperti trending/topik aktif.
- Search belum bisa mencari pair/topik secara sosial.

Implikasi spec:

- Mobile detail post harus memprioritaskan post dan komentar; market mobile bisa collapsible.
- Search sosial harus mengenali post/topik/pair.
- Right rail bisa berkembang menjadi kombinasi market + community signals.

#### 5. Mobile-First User

Ekspektasi:

- Navigasi terasa seperti app sosial.
- Membuka detail post nyaman.
- Action cepat tanpa teks bertabrakan.
- Tidak perlu scroll terlalu banyak untuk aksi utama.

Yang kurang nyaman:

- Bottom nav 6 item sudah padat.
- Icon-only action bar hemat ruang tetapi kurang jelas.
- Create post tidak punya shortcut setelah user scroll.
- Detail post mobile didahului market ticker panjang.

Implikasi spec:

- Bottom nav perlu aturan prioritas berdasarkan access role.
- Action icon mobile butuh label pendek, tooltip, atau layout yang lebih jelas.
- Pertimbangkan floating compose untuk member.
- Market mobile detail dibuat collapsible atau dipindah setelah konten utama.

#### 6. Desktop Power User

Ekspektasi:

- Bisa scroll feed lama tanpa kehilangan posisi.
- Detail post terbuka cepat seperti modal.
- Share, repost, quote, dan simpan terasa instan.
- Right rail membantu keputusan, bukan mengganggu.

Yang kurang nyaman:

- Detail post masih route penuh jika dibuka langsung dari feed.
- Share belum berupa sheet.
- Right rail belum punya sinyal sosial.
- Beberapa action masih reload penuh.

Implikasi spec:

- Desktop post detail memakai modal.
- Share sheet desktop dibuat popover/modal kecil.
- Action tertentu sebaiknya local update agar feed tidak kehilangan posisi.
- Right rail bisa menampilkan DM unread, trending topik, atau aktivitas komunitas ringan.

#### 7. Tablet User

Ekspektasi:

- Layout tidak terasa seperti desktop dipaksa sempit.
- Feed tetap terbaca nyaman.
- Navigasi tetap mudah dengan sentuhan.

Yang kurang nyaman:

- Tablet 768px membuat card post sangat sempit karena rail desktop masih mengambil ruang.
- Detail post tablet juga sempit.

Implikasi spec:

- Breakpoint tablet harus memakai layout compact/mobile-like.
- Rail desktop disembunyikan atau dibuat compact pada tablet.
- Content feed/detail mengambil full-width yang layak.

#### 8. Admin Aplikasi

Ekspektasi:

- Bisa melihat dan memoderasi aktivitas.
- Bisa edit/delete semua postingan.
- Bisa melihat laporan/report dengan status jelas.
- Tidak tercampur antara action member dan action admin.

Yang kurang nyaman:

- Report feedback untuk member masih dasar; admin flow perlu tetap jelas nanti.
- Action admin di menu post perlu tetap terlihat hanya untuk admin.
- Access role harus memastikan admin punya akses penuh tanpa UI terlalu ramai untuk member.

Implikasi spec:

- Admin tetap bisa edit/delete semua post dan metadata.
- Report lanjutan tidak masuk fase ini, tetapi feedback sukses dasar tetap ada.
- Menu admin harus gated oleh access role `admin`.

#### 9. Returning User

Ekspektasi:

- Bisa melihat apa yang baru sejak terakhir buka.
- Bisa lanjut dari notifikasi/DM.
- Bisa kembali ke post tersimpan atau repost sendiri.

Yang kurang nyaman:

- Belum ada notification indicator.
- Belum ada profile activity tabs.
- Tidak ada saved/repost history.

Implikasi spec:

- Notifikasi minimal: DM unread + activity indicator ringan.
- Profile tabs: Post saya, Disimpan, Repost saya, Komentar saya.
- Activity ring bisa menjadi fase pertama yang sederhana.

#### 10. User Aksesibilitas / Keyboard

Ekspektasi:

- Modal bisa dipakai dengan keyboard.
- Tombol icon punya nama jelas.
- Focus tidak hilang setelah menutup modal.
- Tidak ada action destruktif tanpa konfirmasi.

Yang kurang nyaman:

- Banyak overlay direncanakan: detail modal, share sheet, edit modal, delete confirm, DM menu.
- Jika tidak dirancang dari awal, keyboard/focus bisa rusak.

Implikasi spec:

- Semua overlay wajib punya `aria-label`, focus trap, Escape close, restore focus, dan close button.
- Delete confirm harus jelas dan tidak destructive by default.
- Icon-only mobile tetap harus punya accessible name.

#### Kesimpulan Lintas Persona

Jika HERTZ ingin terasa seperti Twitter/X untuk komunitas trading, fase spec pertama perlu memprioritaskan:

1. Social continuity: repost timeline, saved history, profile activity.
2. Fast interaction: share sheet, detail modal desktop, local update untuk action penting.
3. Mobile comfort: tablet breakpoint, mobile detail prioritizing post, compose shortcut.
4. Trust and control: confirm delete, guest access role, admin gating.
5. Discoverability: social search, hashtag/topik, profile bio/statistik.
6. Feedback loop: minimal notifications dan clear empty/error states.

### Catatan Role Saat Ini

Role database aplikasi saat ini hanya:

- `member`
- `admin`

Untuk kebutuhan frontend dan menu permission, spec akan memakai access role:

- `guest`
- `member`
- `admin`

Bukti:

- `shared/types/index.ts` mendefinisikan `UserRole.MEMBER` dan `UserRole.ADMIN`.
- Admin user form hanya menawarkan `Member` dan `Admin`.
- API update user hanya menerima `member` dan `admin`.
- Data live VPS saat dicek: `admin` 3 user, `member` 17 user.

Istilah `owner` tidak dipakai dalam spec frontend agar bahasa tetap sejalan dengan role aplikasi. Dalam konteks post, gunakan istilah `member pembuat post` atau `author`.

Catatan implementasi nanti:

- `guest` dihitung dari kondisi `currentUser === null`.
- `member` dihitung dari `currentUser.role === 'member'`.
- `admin` dihitung dari `currentUser.role === 'admin'`.
- Menu dan fitur frontend membaca access role ini, bukan mengecek `currentUser` tersebar di banyak komponen.

## Catatan untuk Spec Nanti

Spec implementasi berikutnya harus memuat:

- scope yang masuk dan tidak masuk;
- file yang akan disentuh;
- behavior desktop/mobile;
- state guest/member/admin;
- acceptance criteria;
- verifikasi build produksi;
- rencana commit per batch.
