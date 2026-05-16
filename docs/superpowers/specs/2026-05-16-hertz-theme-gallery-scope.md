# HERTZ Theme Unification + Gallery Inactive Scope

Tanggal: 16 Mei 2026  
Status: Draft untuk review user sebelum implementasi  
Instruksi user: jangan edit code dulu; buat spec/todo agar scope jelas.

## Tujuan

1. Gallery tidak ditampilkan sebagai menu aktif karena belum diperlukan.
2. Jika user membuka `/gallery` langsung, halaman harus memberi keterangan bahwa Gallery sementara tidak aktif.
3. Semua frontend publik, termasuk Tools dan tool detail, mengikuti tema visual HERTZ: dark, emerald accent, rail/bottom navigation yang konsisten, panel rapat, dan responsive behavior yang sama.
4. Semua temuan pada audit frontend `docs/frontend-audit/2026-05-16-frontend-audit-rerun.md` masuk scope pengerjaan, kecuali yang secara eksplisit dibatasi oleh keputusan Gallery dormant.

## Prinsip Scope

- Tidak menghapus route Gallery dan tidak menghapus data Gallery. Hanya menyembunyikan dari navigasi dan menampilkan inactive state.
- Tidak mengubah backend/data seed untuk Gallery.
- Tidak menjalankan dev server di VPS. Verifikasi memakai build/check dan Playwright terhadap web VPS.
- Worktree saat ini punya perubahan lain yang belum committed; implementasi nanti harus hanya stage file yang relevan.
- Karena ini menyentuh banyak halaman, eksekusi harus bertahap dan tiap tahap punya commit sendiri.
- Temuan audit yang menyentuh UX inti harus selesai dalam batch ini: DM mobile/tablet, landing 320px, tools mobile tables, public theme consistency, Gallery dormant, Profile/member center, owner edit/delete regression, social action surface, composer Trading completeness, mobile market access, copywriting consistency, and accessibility pass.

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
- Tambahkan entry/profile affordance menuju member center.
- Tambahkan mobile market access pengganti right rail yang hilang di mobile.
- Pada desktop, right sidebar/market rail harus tetap diam saat halaman discroll, konsisten dengan left sidebar. Konten di dalam right rail boleh scroll sendiri jika melebihi tinggi viewport.

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
- Tool detail yang sangat panjang harus punya section anchor/sticky utility nav agar mobile tidak terasa tersesat.

### Gallery Inactive

Files:

- `frontend/src/app/gallery/page.tsx`
- `frontend/src/app/gallery/page.module.css`
- `frontend/src/components/gallery/*`

Target:

- `/gallery` menampilkan inactive notice.
- Komponen Gallery lama tidak perlu dihapus; cukup tidak dipakai sampai fitur diaktifkan lagi.

### HERTZ DM

Files:

- `frontend/src/app/hertz/messages/page.tsx`
- `frontend/src/app/hertz/messages/page.module.css`

Target:

- Fix panel thread yang terpotong pada tablet/mobile.
- Mobile menjadi alur dua layar: inbox list dan thread detail.
- Guest state tidak menampilkan action operasional seperti Archive, Block, Image, Send sebagai fungsi aktif.
- Copywriting diselaraskan ke Indonesia.

### HERTZ Profile/Member Center

Files:

- `frontend/src/app/hertz/profile/page.tsx`
- `frontend/src/app/hertz/profile/page.module.css`
- `frontend/src/components/feed/HertzLeftRail.tsx`
- `frontend/src/components/hertz/MobileBottomNav.tsx`
- API existing yang dibaca: `/api/auth/me`, `/api/credit/balance`, `/api/credit/history`

Target:

- User punya halaman untuk melihat status Telegram, role, credit, dan shortcut ke post/aktivitas.
- Guest melihat CTA login Telegram.
- Rail profile card menjadi link ke halaman ini.

### HERTZ Post Actions dan Composer

Files:

- `frontend/src/components/feed/HertzActionBar.tsx`
- `frontend/src/components/feed/HertzActionBar.module.css`
- `frontend/src/components/feed/HertzPostMenu.tsx`
- `frontend/src/components/feed/HertzPostMenu.module.css`
- `frontend/src/components/feed/HertzComposer.tsx`
- `frontend/src/components/feed/HertzComposer.module.css`
- `frontend/src/components/feed/HertzPost.module.css`

Target:

- Action bar menampilkan social surface yang sesuai API: komentar, suka, bookmark, repost/quote, dan share/copy.
- Owner edit/delete flow tetap tersedia dari menu dan harus diuji dengan session Telegram.
- Composer Trading menyediakan field penting saat create: pair, timeframe, direction, risk, entry, stop loss, take profit, confidence.
- Media policy Life/General harus eksplisit: jika tetap tidak bisa upload, UI menjelaskan; jika diaktifkan, upload bekerja lintas kategori.
- New posting/composer harus punya outline hijau tipis.
- Outline card posting harus ditipiskan dan disamakan dengan outline new posting agar feed konsisten.

### Copywriting dan Accessibility

Files:

- Semua file UI publik yang disentuh task di atas.

Target:

- Copy UI utama memakai Indonesia: contoh `Read-only` menjadi `Mode baca`, `Archive` menjadi `Arsipkan`, `Block` menjadi `Blokir`, `Send` menjadi `Kirim`, `Copy link` menjadi `Salin link`.
- Icon-only controls punya `aria-label`.
- Focus state tetap terlihat pada nav, action, tab, menu, form, dan CTA.

### Admin

Admin termasuk frontend dan tetap masuk scope audit lengkap. Implementasi admin dikerjakan setelah public frontend agar workflow internal tidak rusak di tengah pengerjaan.

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
- Mengubah autentikasi Telegram.
- Mengubah desain admin dashboard menjadi public HERTZ rail.
- Menambahkan fitur yang tidak ada di audit, kecuali diperlukan langsung untuk menyelesaikan temuan audit.

## Risiko

- Menyamakan semua halaman sekaligus bisa memicu regression responsif. Karena itu perlu tahap kecil dan commit per area.
- Tool detail punya banyak tabel/data grid; mengganti ke mobile card mode perlu audit per tool.
- Jika HERTZ shell dipakai di semua public page, perlu memastikan right rail tidak membuat halaman detail terlalu sempit.
- Profile/member center dapat membutuhkan API credit yang belum lengkap untuk semua data; jika ada gap, tampilkan fallback state yang jujur.
- Owner edit/delete regression membutuhkan session Telegram asli; jika session tidak tersedia, hasil harus dicatat sebagai belum terverifikasi, bukan dianggap selesai.

## Acceptance Criteria

- Gallery tidak tampil di left rail, bottom nav, dan promosi publik.
- `/gallery` tidak broken dan menampilkan pesan inactive.
- Landing tidak overflow di 320px.
- Public pages utama memakai warna, border, spacing, radius, dan navigation HERTZ.
- Tools hub dan tool detail terasa satu tema dengan HERTZ.
- Tool detail mobile tidak hanya bergantung pada horizontal table scroll untuk data utama.
- `/hertz/messages` tidak memotong thread/composer pada 768px, 390px, dan 320px.
- Profile/member center tersedia dan linked dari rail/profile affordance.
- HERTZ action bar menampilkan Bookmark/Repost/Share/Copy sesuai API yang tersedia.
- Composer Trading punya field market utama saat create.
- New posting dan card posting memakai outline hijau tipis yang konsisten.
- Mobile punya akses market data pengganti hidden right rail.
- Desktop right rail tetap visible/sticky/fixed saat scroll halaman utama.
- Copywriting publik yang disentuh sudah konsisten Indonesia.
- Focus/aria untuk kontrol utama sudah diaudit.
- Build frontend berhasil.
- Playwright responsive sweep minimal untuk `/`, `/hertz`, `/hertz/messages`, `/hertz/profile`, `/outlook`, `/blog`, `/gallery`, `/tools`, `/tools/profitability`, `/tools/order-book`, `/tools/economic-calendar`, `/admin/login` di 1440, 768, 390, 320.
