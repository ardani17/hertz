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
| 1 | Direct Message | Perlu keputusan | Ada bukti screenshot UI lama/terpotong dan baru saja ada cache/prerender fix. Perlu putuskan UX final DM. |
| 2 | HERTZ Feed dan Post Detail | Belum direview | Core produk, termasuk owner edit/delete, action bar, composer, dan detail post. |
| 3 | Profile / Member Center | Belum direview | Sudah ada route, perlu pastikan isi dan navigasi sesuai kebutuhan user Telegram. |
| 4 | Navigation Shell Desktop/Mobile | Belum direview | Menentukan rail kiri, rail kanan, bottom nav, menu yang disembunyikan, dan sticky behavior. |
| 5 | Landing Horizon | Belum direview | Perlu pastikan mobile kecil, brand signal, dan gateway ke HERTZ. |
| 6 | Blog | Belum direview | Perlu sinkron tema HERTZ, ownership, dan flow member/admin. |
| 7 | Outlook | Belum direview | Perlu sinkron tema HERTZ tanpa merusak sumber WordPress. |
| 8 | Tools Hub dan Tool Detail | Belum direview | Perlu konsistensi tema HERTZ dan responsive table/card mode. |
| 9 | Gallery Dormant | Belum direview | Fitur harus hidden/inactive sampai dibuka lagi. |
| 10 | Admin Frontend | Belum direview | Perlu pastikan tema cukup konsisten tanpa mengganggu operasional admin. |

## Review 1: Direct Message

Status: Perlu keputusan

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
5. Apakah upload gambar DM tetap maksimal 4 gambar dan hanya JPG/PNG/WEBP?

## Review Berikutnya

Setelah DM disepakati, area berikutnya yang disarankan adalah **HERTZ Feed dan Post Detail**, karena terkait langsung dengan:

- owner edit/delete postingan;
- action bar selain komentar/suka;
- copy link;
- composer kategori Trading/Life/General;
- detail post;
- responsive card post.

## Catatan untuk Spec Nanti

Spec implementasi berikutnya harus memuat:

- scope yang masuk dan tidak masuk;
- file yang akan disentuh;
- behavior desktop/mobile;
- state guest/member/admin;
- acceptance criteria;
- verifikasi build produksi;
- rencana commit per batch.
