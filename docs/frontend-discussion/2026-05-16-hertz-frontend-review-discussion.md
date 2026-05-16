# Diskusi Review Frontend Horizon / HERTZ

Tanggal: 16 Mei 2026  
Status: Draft diskusi sebelum spec  
Tujuan: review frontend satu per satu, mencatat keputusan, lalu menurunkannya menjadi spec/todo implementasi yang jelas.

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
- Screenshot masalah DM: `docs/teswebimg/pasted file.png`

## Prinsip Review

- Jangan langsung edit kode saat fase diskusi.
- Setiap keputusan harus punya alasan dan dampak user.
- UI desktop dan mobile harus dibahas bersamaan.
- Public frontend harus tetap mengikuti tema HERTZ.
- Build di VPS hanya production build, tidak menjalankan dev server.
- Setelah implementasi nanti, perubahan harus diverifikasi dan dicommit per scope kecil.

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
   `Bagikan` di action bar dan `Salin link` di menu tiga titik sama-sama copy link. Ini tidak salah, tetapi perlu diputuskan apakah dua entry ini memang sengaja: action bar untuk cepat, menu untuk fallback.

7. **Detail post perlu identitas halaman yang lebih kuat**
   Keputusan baru: desktop tidak pindah halaman saat membuka detail post dari feed. Desktop memakai popup/modal elegan agar user tetap berada di feed dan tidak perlu kembali manual. Mobile tetap pindah ke halaman detail karena modal detail post kurang nyaman di layar kecil.

8. **Komentar guest masih menampilkan form**
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
- `Bagikan` dan `Salin link` tetap ada, tetapi copy dan placement dibuat konsisten.

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

### Keputusan yang Perlu Dikonfirmasi

1. Life dan General boleh upload gambar juga. Upload media tidak lagi khusus Trading, tetapi tetap dibatasi sebagai gambar pada fase ini.
2. Member pembuat Trading post boleh edit metadata market miliknya sendiri. Admin juga boleh edit metadata market semua postingan.
3. Apakah delete post wajib memakai confirm dialog sebelum hapus?
4. Apakah `Bagikan` di action bar dan `Salin link` di menu tetap dua-duanya ada?
5. Untuk guest di detail post, apakah form komentar diganti CTA login Telegram atau tetap form dengan pesan login saat dipakai?

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
- Delete tidak terjadi tanpa confirm.
- Action bar tetap usable di mobile icon-only.
- Desktop detail post bisa dibuka sebagai modal tanpa meninggalkan feed.
- Mobile detail post tetap memakai halaman penuh dengan back affordance dan state komentar yang jelas.

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
