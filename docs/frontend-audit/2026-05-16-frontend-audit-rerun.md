# Audit Ulang Frontend Horizon / HERTZ

Tanggal audit: 16 Mei 2026  
Workflow: Superpowers `using-superpowers` + audit/review + `verification-before-completion`  
Lingkup: landing, HERTZ feed/detail/DM, Outlook, Blog, Gallery, Tools hub/detail, dan admin guest/redirect.

## Metode

- Inventarisasi route dan komponen dari `frontend/src/app` serta `frontend/src/components`.
- Sweep responsive dengan Playwright terhadap web VPS di `http://127.0.0.1:3888`.
- Viewport: desktop 1440x1000, tablet 768x1024, mobile 390x844, dan mobile kecil 320x740.
- Total kombinasi yang dicek: 68 route/viewport.
- Build verification: `npm --prefix frontend run build`.
- Bukti teknis: `/tmp/horizon-frontend-audit-20260516-rerun/results.json` dan screenshot di `/tmp/horizon-frontend-audit-20260516-rerun/*.png`.

## Status Singkat

Build frontend berhasil. HERTZ feed, HERTZ detail, Outlook, Blog, Gallery, Tools hub, dan admin login tidak menunjukkan global horizontal overflow pada viewport utama. Perbaikan desain HERTZ feed masih bertahan.

Namun beberapa masalah penting masih ada dan terukur ulang: landing 320px overflow, HERTZ DM terpotong di tablet/mobile, dan tabel di beberapa tool detail masih melebar jauh melewati layar mobile. Dari audit kode, menu Gallery belum masuk navigasi HERTZ, profile/member area belum menjadi halaman, dan fitur social seperti bookmark/repost sudah ada di API tetapi belum tampil di action bar feed.

## Temuan Prioritas

| Prioritas | Area | Bukti | Dampak | Rekomendasi |
| --- | --- | --- | --- | --- |
| P1 | `/hertz/messages` | Tablet 768: `.threadHeader` `right: 1088px`, overflow 320px. Mobile 390: `right: 482px`, overflow 92px. Mobile 320: `right: 479px`, overflow 159px. | DM mobile terasa patah; header, composer, input, dan tombol Send keluar area baca. | Ubah mobile DM menjadi mode dua layar: inbox list dan thread detail. Pada mobile, render hanya panel aktif atau buat thread full-width. Tambahkan `min-width: 0`, `width: 100%`, `max-width: 100%` untuk `.thread`, `.threadHeader`, `.messages`, dan `.composer`. |
| P1 | `/` landing | Mobile 320: `scrollWidth: 353`, viewport 320. Offender utama `.copy`, `h1`, `.lead`, `.subcopy`, `.actions`, `.featureGrid` dengan right 353px. | Homepage masih bergeser di HP kecil. | Tambah breakpoint `max-width: 360px`: kecilkan H1, stack tombol action, set `.copy`, `.featureGrid`, `.actions` ke `max-width: 100%`, dan pastikan padding tidak menambah lebar efektif. |
| P2 | `/tools/profitability` | Tabel `min-width: 760px`; mobile 390 overflow kanan 404px, mobile 320 overflow 474px. | Simulator sulit dibaca di mobile. | Buat card-row mobile untuk hasil simulasi, atau minimal sticky first column + gradient scroll hint. |
| P2 | `/tools/order-book` | Tabel `min-width: 760px`; mobile 390 overflow kanan 404px, mobile 320 overflow 474px. | Data long/short sulit dibandingkan di HP. | Ubah menjadi compact row: price sebagai title, long/short sebagai stacked bars. |
| P2 | `/tools/economic-calendar` | Tabel `min-width: 760px`; mobile 390 overflow kanan 404px, mobile 320 overflow 474px. | Calendar mobile membutuhkan geser horizontal untuk kolom penting. | Buat event card mobile: time/country/impact di header, actual/forecast/previous sebagai grid kecil. |
| P2 | Tools detail shell | `/tools` memakai HERTZ shell + bottom nav, tetapi detail `/tools/profitability`, `/tools/order-book`, dan route tool lain memakai shell standalone tanpa bottom nav HERTZ. | Saat user mobile masuk tool detail, navigasi terasa pindah aplikasi. | Samakan shell atau tambahkan mobile bottom nav/back affordance yang konsisten. |
| P2 | Navigasi HERTZ | `ActiveNav` sudah punya `gallery`, route `/gallery` ada, tetapi `HertzLeftRail` dan `MobileBottomNav` tidak memasukkan Gallery. | Menu Gallery tidak discoverable dari HERTZ nav. | Tambahkan Gallery ke left rail dan mobile nav. Jika 6 item terlalu penuh, pakai More menu atau ganti label pendek. |
| P2 | Owner/social action | API punya endpoint bookmark/repost, menu punya edit/delete/report, tetapi action bar feed hanya Komentar dan Suka. | Social surface belum lengkap; user tidak tahu fitur bookmark/repost/copy selain menu tiga titik. | Tambahkan Bookmark, Repost/Quote, Share/Copy ke action bar atau menu konsisten. |

## Temuan Menu dan Produk

1. **Gallery belum ada di rail/bottom nav.** Ini gap navigasi paling jelas karena route dan page sudah siap.
2. **Profile/member center belum tersedia.** Rail menampilkan kartu Guest/Member, tetapi bukan link ke profile, credit, postingan saya, atau setting Telegram.
3. **Mobile label `Direct Message` masih panjang.** CSS sudah mencoba menghindari overflow, tetapi label tetap padat. Gunakan `DM` di mobile dengan `aria-label="Direct Message"`.
4. **Admin routes guest redirect sudah benar.** `/admin`, `/admin/hertz`, dan `/admin/users` redirect ke `/admin/login` saat guest. Audit authenticated dashboard belum dilakukan.
5. **HorizonFX masih berposisi sebagai audit/placeholder.** Di Tools hub masih tampil sebagai `HorizonFX V2 Audit`, belum terasa seperti tool final.
6. **Market right rail hilang di mobile tanpa pengganti.** Desktop punya data market, mobile tidak punya mini ticker/drawer/tab untuk informasi yang sama.

## Detail UI dan UX

- **HERTZ feed mobile aman dari overflow**, tetapi bottom nav 5 item sudah penuh. Jika Gallery ditambahkan, desain nav perlu dipikirkan ulang.
- **Edit/delete post owner belum terbukti lewat akun login.** Kode `HertzPostMenu` mendukung `canEdit`/`canDelete` dan fallback `/api/auth/me`, tetapi audit ini guest/read-only. Perlu test login Telegram: create post, menu owner, edit, delete, non-owner hanya copy/report.
- **Modal edit post lebih baik dari sebelumnya.** CSS sekarang menggunakan fixed backdrop dan bottom sheet di mobile; ini mengurangi risiko panel menabrak konten. Masih perlu diuji dengan post panjang dan keyboard mobile.
- **DM guest state terlalu operasional.** Walaupun user belum login, halaman masih menampilkan Archive, Block, Image, dan Send. CTA login harus lebih dominan dan action nonaktif/tersembunyi.
- **Composer Trading kurang lengkap.** Composer hanya Pair dan Risk, sedangkan edit market metadata punya timeframe, direction, entry, SL, TP, confidence. Untuk posting trading, field ini seharusnya tersedia sejak create.
- **Media hanya untuk Trading.** Life/General tidak bisa upload gambar karena state media direset saat kategori bukan Trading. Jika ini aturan produk, UI perlu menjelaskan; jika bukan, ini gap fitur.
- **Copywriting masih campur Indonesia/English.** Contoh: `Read-only`, `Direct Message`, `Archive`, `Block`, `Send`, `Image`, `Copy link`, `Edit post`. Tentukan bahasa UI utama.
- **Landing masih terlalu hero-heavy untuk mobile kecil.** H1 besar dan action row menjadi sumber overflow.
- **Tool detail terlalu panjang di mobile.** Profitability mobile 320 mencapai tinggi sekitar 8891px, Order Book sekitar 8409px. Perlu sticky nav atau section anchor.
- **Accessibility perlu audit lanjutan.** Beberapa icon button sudah punya `aria-label`, tetapi focus state dan tooltip belum diverifikasi menyeluruh.

## Route yang Dicek

- `/`
- `/hertz`
- `/hertz/post/hzx_live01`
- `/hertz/messages`
- `/outlook`
- `/blog`
- `/gallery`
- `/tools`
- `/tools/profitability`
- `/tools/order-book`
- `/tools/pivot-point`
- `/tools/economic-calendar`
- `/tools/horizonfx`
- `/admin/login`
- `/admin`
- `/admin/hertz`
- `/admin/users`

## Verifikasi

`npm --prefix frontend run build` berhasil:

- Compile: sukses.
- TypeScript: selesai tanpa error.
- Static generation: 44/44 halaman selesai.
- Route baru `/api/market/rail` ikut terdeteksi di build.

## Urutan Perbaikan yang Disarankan

1. Fix P1: DM mobile/tablet dan landing 320px.
2. Tambahkan Gallery ke navigasi HERTZ, lalu desain ulang bottom nav jika 6 item terlalu padat.
3. Buat profile/member center untuk user Telegram: profile, credit, post saya, setting.
4. Ubah tabel Profitability, Order Book, dan Economic Calendar menjadi card mode di mobile.
5. Samakan navigasi tools detail dengan HERTZ shell/mobile bottom nav.
6. Tambahkan action Bookmark/Repost/Share di HERTZ feed karena endpoint sudah tersedia.
7. Jalankan regression test authenticated untuk create/edit/delete post owner.
