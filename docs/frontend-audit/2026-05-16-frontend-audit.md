# Audit Frontend Horizon / HERTZ

Tanggal audit: 16 Mei 2026  
Lingkup: halaman publik Horizon, HERTZ feed/detail/DM, Outlook, Blog, Gallery, Tools, dan admin login.

## Metode Audit

- Inventarisasi route di `frontend/src/app` dan komponen di `frontend/src/components`.
- Sweep responsive dengan Playwright terhadap aplikasi yang sedang berjalan di VPS melalui `http://127.0.0.1:3888`.
- Viewport yang dicek: desktop 1440x1000, tablet 768x1024, mobile 390x844, mobile kecil 320x740.
- Audit ini dilakukan dalam kondisi guest/read-only. Flow yang butuh session Telegram pemilik postingan, seperti tombol edit/delete milik owner, perlu regression test terpisah memakai akun login asli.
- Bukti teknis sementara tersimpan di `/tmp/horizon-frontend-audit/results.json` dan screenshot di `/tmp/horizon-frontend-audit/*.png`.

## Ringkasan Eksekutif

Frontend HERTZ feed sudah jauh lebih rapi setelah rebuild design: feed utama, detail postingan, Outlook, Blog, Gallery, dan Tools hub tidak menunjukkan global horizontal overflow pada viewport 390px dan 320px. Namun masih ada beberapa titik yang perlu diprioritaskan sebelum UI dianggap matang di semua device.

Masalah paling jelas ada di halaman Direct Message mobile/tablet, landing page pada lebar 320px, dan tabel tools yang masih mengandalkan horizontal scroll. Selain itu navigasi HERTZ belum lengkap karena route Gallery tersedia tetapi tidak muncul di rail/bottom nav, serta belum ada entry profile/credit member seperti yang biasanya diharapkan pengguna login Telegram.

## Temuan Responsif

| Prioritas | Area | Temuan | Dampak | Rekomendasi |
| --- | --- | --- | --- | --- |
| P1 | `/hertz/messages` | Panel thread DM tetap memakai lebar desktop. Pada mobile 390px, `.threadHeader` melebar sampai `right: 482px`; pada mobile 320px sampai `right: 479px`. `.messages`, `.composer`, input, dan tombol `Send` ikut terpotong. | DM tidak nyaman dipakai di mobile; tombol dan input bisa keluar layar walaupun body tidak terlihat overflow karena clipping parent. | Ubah DM mobile menjadi two-step layout: list conversation dulu, lalu thread sebagai layar penuh. Tambahkan `min-width: 0`, `width: 100%`, dan `max-width: 100%` pada panel aktif. Sembunyikan panel inactive pada mobile. |
| P1 | `/` landing | Mobile 320px horizontal overflow. `scrollWidth: 353` dengan viewport 320. Offender utama: `.copy`, `h1`, `.lead`, `.subcopy`, `.actions`, dan `.featureGrid` selebar 334px dengan posisi kanan 353px. | Halaman awal terlihat bergeser dan kurang profesional di HP kecil. | Tambahkan breakpoint kecil untuk hero: kecilkan `h1`, clamp container ke `max-width: 100%`, ubah action button menjadi stack, dan pastikan padding kiri-kanan tidak membuat konten melewati viewport. |
| P2 | `/tools/profitability` | Tabel hasil simulator memiliki `min-width: 760px`. Pada mobile 390px bagian kanan tabel melewati viewport sampai 404px; pada 320px sampai 474px. | Data bisa diakses lewat scroll horizontal, tetapi UX mobile berat dan rawan dianggap rusak. | Untuk `<640px`, ubah tabel hasil menjadi card rows atau summary list. Alternatif minimal: beri affordance scroll, sticky first column, dan gradient hint di sisi kanan. |
| P2 | `/tools/order-book` | Tabel order book juga `min-width: 760px`. Pada mobile 390px bagian kanan tabel melewati viewport sampai 404px; pada 320px sampai 474px. | Trader mobile sulit membaca price/long/short tanpa menggeser. | Buat layout compact mobile: price sebagai row title, Long/Short sebagai stacked bars. |
| P2 | Tablet HERTZ shell | Pada tablet 768px, left rail desktop masih muncul di beberapa halaman, sedangkan bottom nav belum muncul sampai breakpoint mobile. | Tablet terasa seperti desktop sempit; ruang konten menjadi panjang dan padat. | Definisikan pengalaman tablet: either pakai compact side rail 64px dengan konten lebih lega, atau pakai bottom nav mulai dari breakpoint yang lebih besar. |
| P3 | HERTZ detail | Detail postingan sudah tidak overflow di 390px/320px, tetapi area market media dan meta bisa menjadi tinggi dan padat. | Tidak rusak, namun scanning setup trading di mobile masih belum optimal. | Pertimbangkan compact market summary di atas media, lalu chart/media di bawah dengan spacing lebih stabil. |

## Menu dan Navigasi yang Terlewat

1. **Gallery belum masuk navigasi utama HERTZ.** Route `/gallery` sudah ada dan responsive, tetapi left rail dan mobile bottom nav hanya menampilkan Home, Outlook, Blog, Tools, dan Direct Message.
2. **Profile/member area belum jelas.** Ada kartu user/guest di rail, tetapi tidak menjadi entry menuju halaman profile, credit, postingan saya, atau pengaturan akun Telegram. Untuk user login, ini penting agar mereka tahu status akun, credit, dan riwayat aktivitas.
3. **Label mobile `Direct Message` terlalu panjang.** Pada bottom nav mobile, label ini mudah terasa padat. Gunakan `DM` atau `Chat` di mobile, tetap simpan accessible label lengkap.
4. **Tools detail routes tidak memakai HERTZ shell yang sama.** `/tools` berada dalam shell HERTZ, tetapi detail seperti `/tools/profitability` dan `/tools/order-book` tampil sebagai tool standalone tanpa bottom nav HERTZ. Ini membuat alur mobile terasa pindah aplikasi.
5. **HorizonFX tool masih berupa placeholder/audit link.** Route `/tools/horizonfx` ada, tetapi dari inventarisasi terlihat masih belum setara dengan tool lain secara produk.
6. **Admin dashboard tidak diaudit penuh karena butuh login.** Admin login responsive, tetapi dashboard table/editor perlu audit authenticated karena komponen admin banyak memakai tabel, editor, log viewer, import panel, dan stats card.

## Gap Fitur dan Interaksi

1. **Edit/delete postingan owner perlu regression test login Telegram.** Komponen menu postingan sudah mendukung state owner, tetapi audit ini guest/read-only. Harus ada skenario: login Telegram, buat postingan, buka feed, buka detail, edit, delete, lalu pastikan menu non-owner hanya menampilkan copy link.
2. **Action bar HERTZ masih minimal.** Feed saat ini menonjolkan Komentar dan Suka. Untuk pengalaman social yang lengkap, pertimbangkan Bookmark, Share, Repost/Quote, dan Copy Link sebagai action langsung atau menu yang konsisten.
3. **Composer belum sekuat kebutuhan trading.** Field utama Trading hanya Pair/Risk dan konten; sementara model market/detail sudah mengenal entry, stop loss, take profit, direction, confidence, timeframe, dan key level. Field ini sebaiknya tersedia saat kategori Trading.
4. **Media upload hanya terlihat relevan untuk Trading.** Jika Life/General juga boleh gambar, composer perlu mengizinkan media lintas kategori. Jika tidak boleh, UI harus menjelaskan rule dengan halus.
5. **Telegram login guest state menampilkan risiko konfigurasi.** Pada screenshot sebelumnya widget menampilkan `Bot domain invalid`. Jika domain production belum sesuai konfigurasi bot Telegram, user tidak bisa login. Perlu fallback UI yang jelas dan validasi domain.
6. **DM belum punya empty/auth state yang kuat.** Saat guest, halaman tetap menunjukkan panel conversation/thread dengan action Archive/Block/Image/Send. Untuk user belum login, sebaiknya CTA login lebih dominan dan composer/action nonaktif.
7. **Market data mobile belum punya akses pengganti right rail.** Di desktop ada right rail market/global data, tetapi di mobile rail hilang. Tambahkan tab, drawer, atau mini ticker agar informasi market tetap tersedia.

## Detail UI yang Masih Perlu Dipoles

- **Konsistensi visual antar area.** HERTZ feed sudah memakai gaya dark emerald baru, tetapi landing, tool detail, dan beberapa halaman standalone masih terasa berbeda dari bahasa visual HERTZ.
- **Bottom nav mobile perlu safe-area padding.** Tinggi 66px sudah stabil, tetapi perlu pastikan `env(safe-area-inset-bottom)` dipakai agar aman di iPhone dengan gesture bar.
- **Touch target kategori feed.** Tab For You/Trending/All/Trading/Life/General sudah muat, tetapi di 320px perlu active state yang lebih jelas dan ruang sentuh yang konsisten.
- **Loading dan error state right rail.** Market/right rail sebaiknya punya skeleton/empty state yang selaras dengan desain, bukan hanya teks kecil.
- **Focus state keyboard.** Audit visual belum memverifikasi focus ring. Semua button icon, menu, tab, dan link perlu focus state yang terlihat.
- **Icon-only controls.** Tombol menu tiga titik, rail icon, action icon, dan beberapa tool control perlu `aria-label` konsisten serta tooltip untuk desktop.
- **Copywriting campuran.** Masih ada campuran Indonesia/English seperti `Read-only`, `Direct Message`, `Archive`, `Block`, `Send`, dan `Image`. Pilih satu pola, atau gunakan English hanya untuk istilah produk yang disengaja.
- **Scroll depth mobile Blog.** `/blog` mobile 320px punya tinggi sekitar 6072px. Secara teknis tidak rusak, tetapi list panjang akan lebih enak dengan filter, search, atau pagination yang lebih dekat ke atas.
- **Gallery membutuhkan affordance lightbox.** Grid responsive, tetapi user perlu sinyal visual bahwa item bisa dibuka, serta navigasi next/prev di lightbox mobile.
- **Admin login sudah responsive, tapi brand alignment minimal.** Halaman login admin tidak rusak, namun belum sejalan dengan visual HERTZ terbaru.

## Rekomendasi Prioritas

1. **Perbaiki P1 responsive breakage:** `/hertz/messages` mobile/tablet dan landing page 320px.
2. **Lengkapi navigasi:** tambah Gallery ke left rail dan bottom nav, pendekkan label DM mobile, dan rancang profile/member area.
3. **Samakan shell tools:** pastikan semua tool detail tetap punya navigasi HERTZ/mobile atau minimal breadcrumb/back yang konsisten.
4. **Ubah tabel tools di mobile:** mulai dari Profitability dan Order Book karena temuan overflow terukur paling besar.
5. **Perkuat owner flow postingan:** test login Telegram, create post, edit, delete, copy link, dan akses non-owner.
6. **Rapikan composer Trading:** tambah field market penting agar post trading tidak perlu bergantung pada teks bebas.
7. **Buat regression checklist responsive:** jalankan otomatis untuk viewport 1440, 768, 390, dan 320 setiap kali rebuild frontend.

## Route yang Sudah Dicek

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
- `/admin/login`

## Catatan Batasan

Audit ini belum mencakup semua flow authenticated dan belum memverifikasi seluruh route detail dynamic seperti artikel/blog slug lain, admin dashboard setelah login, serta semua tool subroute. Karena itu, dokumen ini sebaiknya dipakai sebagai baseline backlog pertama, lalu dilanjutkan dengan audit authenticated setelah akun Telegram dan admin session tersedia.
