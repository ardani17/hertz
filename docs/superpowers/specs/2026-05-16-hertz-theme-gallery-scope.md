# HERTZ Theme Unification + Gallery Inactive Scope

Tanggal: 16 Mei 2026  
Status: Draft untuk review user sebelum implementasi  
Instruksi user: jangan edit code dulu; buat spec/todo agar scope jelas.

## Tujuan

1. Gallery tidak ditampilkan sebagai menu aktif karena belum diperlukan.
2. Jika user membuka `/gallery` langsung, halaman harus memberi keterangan bahwa Gallery sementara tidak aktif.
3. Semua frontend publik, termasuk Tools dan tool detail, mengikuti tema visual HERTZ: dark, emerald accent, rail/bottom navigation yang konsisten, panel rapat, dan responsive behavior yang sama.

## Prinsip Scope

- Tidak menghapus route Gallery dan tidak menghapus data Gallery. Hanya menyembunyikan dari navigasi dan menampilkan inactive state.
- Tidak mengubah backend/data seed untuk Gallery.
- Tidak menjalankan dev server di VPS. Verifikasi memakai build/check dan Playwright terhadap web VPS.
- Worktree saat ini punya perubahan lain yang belum committed; implementasi nanti harus hanya stage file yang relevan.
- Karena ini menyentuh banyak halaman, eksekusi harus bertahap dan tiap tahap punya commit sendiri.

## Keputusan Produk

### Gallery

Gallery dianggap fitur dormant.

Perilaku yang diinginkan:

- Tidak muncul di `HertzLeftRail`.
- Tidak muncul di `MobileBottomNav`.
- Tidak dipromosikan dari landing, Tools, Blog, Outlook, atau halaman lain.
- Route `/gallery` tetap ada, tetapi isinya diganti menjadi inactive notice:
  - Judul: `Gallery sementara tidak aktif`
  - Body: `Fitur Gallery belum dibuka untuk publik. Konten akan tersedia setelah kurasi media selesai.`
  - CTA: kembali ke `/hertz`
- Jika ada link lama yang mengarah ke Gallery, user tidak melihat broken page.

### Tema HERTZ untuk Semua Frontend

Tema HERTZ menjadi default visual language untuk public frontend:

- Background utama: near-black seperti HERTZ shell.
- Accent: emerald/green `#13d27b` atau token setara.
- Border: subtle green/white low opacity.
- Radius: 6-8px, menghindari card bulat besar.
- Layout: dense, utilitarian, trading/community focused.
- Navigation: HERTZ shell untuk halaman publik utama dan tool detail.
- Mobile: bottom nav HERTZ konsisten di halaman publik.
- Copywriting UI: utamakan Indonesia, kecuali istilah produk yang sengaja English.

## Area yang Masuk Scope

### Public App Shell

Files:

- `frontend/src/components/hertz/HertzAppShell.tsx`
- `frontend/src/components/hertz/HertzAppShell.module.css`
- `frontend/src/components/hertz/MobileBottomNav.tsx`
- `frontend/src/components/hertz/MobileBottomNav.module.css`
- `frontend/src/components/feed/HertzLeftRail.tsx`
- `frontend/src/components/feed/HertzRails.module.css`

Target:

- Jadikan shell ini standar untuk public pages.
- Tetap tanpa Gallery di nav.
- Label mobile `Direct Message` dipendekkan menjadi `DM`, dengan `aria-label="Direct Message"`.

### Landing

Files:

- `frontend/src/app/page.tsx`
- `frontend/src/app/HorizonLanding.module.css`

Target:

- Pertahankan hero landing, tetapi visualnya mengikuti HERTZ.
- Fix overflow mobile 320px.
- Jangan membuat landing seperti marketing card-heavy; tetap langsung mengarah ke produk HERTZ.

### Outlook dan Blog

Files:

- `frontend/src/app/outlook/page.tsx`
- `frontend/src/app/outlook/page.module.css`
- `frontend/src/app/outlook/[slug]/page.tsx`
- `frontend/src/app/outlook/[slug]/page.module.css`
- `frontend/src/app/blog/page.tsx`
- `frontend/src/app/blog/page.module.css`
- `frontend/src/app/blog/[slug]/page.tsx`
- `frontend/src/app/blog/[slug]/page.module.css`
- `frontend/src/components/outlook/*`
- `frontend/src/components/blog/*`
- `frontend/src/components/article/*`

Target:

- List dan detail mengikuti HERTZ shell, spacing, card radius, border, typography.
- Detail article tetap mudah dibaca, tidak terlalu sempit, dan punya back affordance.

### Tools

Files:

- `frontend/src/app/tools/page.tsx`
- `frontend/src/app/tools/tools.module.css`
- `frontend/src/app/tools/*/page.tsx`
- `frontend/src/components/tools/ToolsHub.tsx`
- `frontend/src/components/tools/ToolShell.module.css`
- `frontend/src/components/tools/ToolNav.tsx`
- `frontend/src/components/tools/*Tool*.tsx`

Target:

- Tools hub dan semua tool detail mengikuti tema HERTZ.
- Tool detail tetap punya navigasi HERTZ/mobile bottom nav atau minimal public shell yang konsisten.
- Tabel Profitability, Order Book, Economic Calendar, dan tabel tool lain harus punya mobile card mode, bukan hanya horizontal scroll.

### Gallery Inactive

Files:

- `frontend/src/app/gallery/page.tsx`
- `frontend/src/app/gallery/page.module.css`
- `frontend/src/components/gallery/*`

Target:

- `/gallery` menampilkan inactive notice.
- Komponen Gallery lama tidak perlu dihapus; cukup tidak dipakai sampai fitur diaktifkan lagi.

### Admin

Admin termasuk frontend, tetapi scope implementasi tema HERTZ untuk admin dipisah sebagai tahap akhir agar tidak mengganggu workflow internal.

Files:

- `frontend/src/app/admin/login/page.tsx`
- `frontend/src/app/admin/login/page.module.css`
- `frontend/src/app/admin/(dashboard)/**`
- `frontend/src/components/admin/**`

Target tahap akhir:

- Admin login dan dashboard memakai token warna HERTZ.
- Dashboard tetap lebih utilitarian dan padat, tidak perlu memakai public HERTZ rail.

## Out of Scope untuk Batch Pertama

- Menghapus data Gallery.
- Menghapus route Gallery.
- Mengubah backend API.
- Menambahkan fitur baru seperti Profile Center, Bookmark/Repost action bar, atau DM redesign penuh.
- Mengubah autentikasi Telegram.
- Mengubah desain admin dashboard secara besar-besaran.

## Risiko

- Menyamakan semua halaman sekaligus bisa memicu regression responsif. Karena itu perlu tahap kecil dan commit per area.
- Tool detail punya banyak tabel/data grid; mengganti ke mobile card mode perlu audit per tool.
- Jika HERTZ shell dipakai di semua public page, perlu memastikan right rail tidak membuat halaman detail terlalu sempit.

## Acceptance Criteria

- Gallery tidak tampil di left rail, bottom nav, dan promosi publik.
- `/gallery` tidak broken dan menampilkan pesan inactive.
- Landing tidak overflow di 320px.
- Public pages utama memakai warna, border, spacing, radius, dan navigation HERTZ.
- Tools hub dan tool detail terasa satu tema dengan HERTZ.
- Tool detail mobile tidak hanya bergantung pada horizontal table scroll untuk data utama.
- Build frontend berhasil.
- Playwright responsive sweep minimal untuk `/`, `/hertz`, `/outlook`, `/blog`, `/gallery`, `/tools`, `/tools/profitability`, `/tools/order-book`, `/tools/economic-calendar` di 1440, 768, 390, 320.
