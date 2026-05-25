# Signal Ledger UI/UX Migration Plan

## Tujuan

Migrasi UI Hertz ke fondasi `Tailwind CSS v4` dan `shadcn/ui` dilakukan bertahap agar feed tetap stabil, mudah dirawat, dan tetap punya ciri khas Hertz. Arah visual tetap mengikuti mock ketiga dan mobile mocks yang sudah disimpan di folder ini.

## Status Fondasi

- Next.js App Router tetap menjadi framework utama.
- CSS Modules masih menjadi sumber styling UI yang sedang aktif.
- Tailwind CSS v4 sudah dipasang untuk utility-first styling baru.
- shadcn/ui sudah dikonfigurasi dengan alias `@/components/ui`.
- Token shadcn dihubungkan ke token Hertz: background, foreground, border, ring, accent hijau, dan sidebar.
- Theme lama `data-theme` disinkronkan dengan class `.dark` / `.light` agar shadcn dark mode kompatibel.
- Komponen dasar tersedia: `Button`, `Input`, `Textarea`, `Badge`, `Card`, dan `Separator`.

## Figma Usage

Saat dicek, koneksi Figma aktif pada akun `ardani`, tetapi seat yang tersedia adalah `View`. Artinya Figma aman dipakai untuk membaca desain, screenshot, dan handoff ketika ada link file/node, tetapi tidak dijadikan blocker untuk implementasi repo.

Jika nanti ada file Figma:

- gunakan `get_design_context` untuk mengambil node UI yang disetujui;
- map komponen ke kode dengan Code Connect setelah nama komponen final stabil;
- jadikan frame mobile feed, post detail, dan composer sebagai acuan pixel QA;
- simpan screenshot hasil perbandingan di `docs/signal-ledger/`.

## Tahap Implementasi

1. **Foundation**
   - Pertahankan visual mock ketiga.
   - Gunakan shadcn hanya untuk primitive yang berulang: button, input, textarea, badge, card, separator.
   - Jangan mengganti semua CSS Modules sekaligus.

2. **Feed Surface**
   - Refactor action bar, composer, login Telegram, post menu, community note, dan detail interactions.
   - Pakai shadcn primitive untuk interactive states dan accessibility.
   - Pertahankan garis timeline/signal spine, rail kiri, rail kanan, dan avatar square khas Hertz.

3. **Admin Surface**
   - Refactor halaman admin Signal Ledger ke table/list yang lebih padat.
   - Pakai badge status, button action, empty state, dan filter controls.
   - Admin-only pending Telegram tetap terlihat jelas.

4. **Mobile QA**
   - Pastikan mobile mengikuti `mobile-mock-01-feed.png`, `mobile-mock-02-post-detail.png`, dan `mobile-mock-03-composer.png`.
   - Login Telegram harus mudah ditemukan.
   - Tidak boleh ada header/footer lama yang muncul lagi.

5. **Verification**
   - Jalankan `npm.cmd run build:frontend`.
   - Jalankan test unit/integration Signal Ledger yang relevan.
   - Jika browser lokal kuat, cek screenshot desktop dan mobile.

## Batasan

- Jangan mengubah flow backend saat migrasi UI kecuali ada bug wiring.
- Jangan memindahkan Blog dan Outlook ke Signal Ledger.
- Jangan memakai warna default shadcn mentah; semua harus lewat token Hertz.
- Jangan menghapus mock yang sudah disimpan karena itu acuan implementasi.
