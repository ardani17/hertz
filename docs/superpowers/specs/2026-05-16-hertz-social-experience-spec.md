# HERTZ Social Experience Spec

Tanggal: 16 Mei 2026  
Status: Draft untuk review user sebelum implementation plan  
Sumber diskusi: `docs/frontend-discussion/2026-05-16-hertz-frontend-review-discussion.md`  
Target produk: HERTZ terasa seperti Twitter/X untuk komunitas trading.

## Tujuan

HERTZ harus berkembang dari feed trading/community menjadi pengalaman sosial yang utuh:

1. User bisa membaca, membuat, membalas, menyukai, merepost, menyimpan, dan membagikan post dengan alur cepat.
2. Member pembuat post punya kontrol jelas untuk edit dan delete post miliknya sendiri.
3. Admin tetap punya kontrol penuh untuk edit/delete semua post dan metadata trading.
4. Guest bisa membaca konten publik, tetapi action yang butuh login diarahkan ke CTA login Telegram.
5. Desktop mendukung browsing feed tanpa kehilangan posisi scroll.
6. Mobile dan tablet terasa seperti app sosial, bukan desktop layout yang dipaksa sempit.
7. Profile menjadi pusat aktivitas member: post, repost, simpan, komentar, credit, dan session.

## Prinsip Eksekusi

- Semua improvement HERTZ dikerjakan dalam satu fase besar.
- Satu fase besar ini harus dipecah menjadi unit kerja kecil yang bisa diverifikasi satu per satu.
- Setiap unit kerja nanti wajib punya acceptance criteria dan verification command/check.
- Tidak menjalankan dev server di VPS. Verifikasi memakai build/check produksi dan pengecekan live sesuai kebutuhan.
- Setelah unit kerja atau batch kecil selesai diverifikasi, langsung commit agar histori jelas.
- Worktree bisa memiliki perubahan lain milik user. Implementasi nanti hanya boleh stage file yang relevan dengan unit kerja.
- Karena proyek memakai Next.js dengan aturan lokal khusus, sebelum edit kode implementasi nanti wajib membaca guide relevan di `node_modules/next/dist/docs/`.
- Tooling review yang sudah tersedia harus dipakai sejak planning, bukan ditambahkan setelah kode selesai: Playwright visual regression, Playwright MCP/browser agent, Axe accessibility audit, DOM snapshot/diff, dan rrweb session replay audit-only.
- Artifact review tidak masuk commit kecuali sengaja dijadikan baseline atau bukti diskusi.

## Role dan Access State

Role database tetap dua:

- `member`
- `admin`

Access state frontend menjadi tiga:

- `guest`: user belum login atau tidak punya session member aktif.
- `member`: user login Telegram dengan `currentUser.role === 'member'`.
- `admin`: user login dengan `currentUser.role === 'admin'`.

Istilah `owner` tidak dipakai sebagai role. Dalam konteks post, gunakan istilah:

- `member pembuat post`
- `author`
- `pembuat postingan`

Aturan umum:

- `guest` dihitung dari `currentUser === null`.
- `member` dihitung dari user login dengan role `member`.
- `admin` dihitung dari user login dengan role `admin`.
- UI action dan menu membaca helper access role terpusat, bukan mengecek `currentUser` secara tersebar.
- `guest` boleh membaca feed dan post publik.
- `guest` tidak boleh melakukan post, comment, like, repost, bookmark, DM operasional, edit, delete, atau report aktif.
- `guest` tetap boleh memakai `Bagikan` dan `Salin link` untuk post publik karena berbagi link tidak membutuhkan session.
- `guest` melihat CTA login Telegram pada action yang membutuhkan login.
- Menu Tools disembunyikan untuk `guest`.
- DM dan Profile boleh terlihat untuk `guest`, tetapi isinya langsung mengarah ke CTA login Telegram.
- `member` bisa mengelola post miliknya sendiri.
- `admin` bisa mengelola seluruh post dan metadata.

## Scope Masuk

### 1. App Shell dan Navigation

HERTZ shell harus konsisten untuk feed, detail post, profile, DM, dan route publik HERTZ lain yang relevan.

Behavior:

- Desktop memakai left rail dan right rail.
- Right rail desktop harus sticky/fixed seperti left rail ketika user scroll.
- Tablet di bawah breakpoint desktop tidak boleh memakai desktop rail penuh jika membuat feed terlalu sempit.
- Pada lebar sekitar 768px, layout memakai mode compact/mobile-like: content utama full-width, rail desktop disembunyikan atau diperkecil, bottom nav aktif.
- Mobile memakai bottom nav yang diprioritaskan berdasarkan access role.
- Bottom nav guest tidak menampilkan Tools.
- Bottom nav member/admin menampilkan entry penting tanpa membuat label bertabrakan.
- Label mobile untuk Direct Message adalah `DM`, dengan accessible label `Direct Message`.

Acceptance:

- `/hertz` pada 320px, 390px, 768px, dan desktop tidak horizontal overflow.
- Tablet 768px tidak lagi menghasilkan card post/detail yang sangat sempit.
- Right rail tetap terlihat saat desktop feed discroll.
- Guest navigation tidak menampilkan Tools.

### 2. Feed Timeline

Feed harus terasa seperti timeline sosial.

Behavior:

- Post card menampilkan author, source, waktu, kategori, konten, media, metadata trading jika ada, action bar, dan menu tiga titik.
- Outline composer dan post card memakai hijau tipis yang konsisten.
- Outline post tidak lebih tebal dari composer.
- Feed memiliki loading, empty, dan error state yang jelas.
- Action penting tidak boleh membuat feed kehilangan posisi scroll jika bisa di-update lokal.
- Social activity yang ringan boleh muncul di right rail atau indicator kecil, seperti DM unread atau aktivitas baru.

Acceptance:

- Feed bisa dibaca nyaman di desktop, tablet, mobile, dan mobile kecil.
- Empty state menjelaskan kondisi, misalnya tidak ada hasil search atau tidak ada post tersimpan.
- Error state memberi pesan yang bisa dipahami.
- Post card dan composer punya outline konsisten.

### 3. Composer dan Upload Media

Composer mendukung kategori:

- Trading
- Life
- General

Behavior:

- Trading tetap memiliki field Pair, TF, Arah, Risk, Entry, SL, TP, dan Confidence.
- Life dan General bisa upload gambar juga.
- Upload fase ini hanya gambar.
- Batas upload post maksimal 4 gambar.
- Format gambar: JPG, PNG, WEBP.
- Composer menampilkan preview thumbnail sebelum submit.
- Setiap preview punya tombol remove.
- Validasi format, jumlah, dan ukuran tampil sebagai pesan UI.
- Progress upload terlihat agar user tidak bingung saat jaringan lambat.
- Mobile member memiliki shortcut compose setelah user scroll, misalnya floating compose button atau affordance kembali ke composer.
- Guest melihat CTA login Telegram, bukan composer aktif penuh.

Acceptance:

- Member bisa membuat Trading post dengan metadata dan gambar.
- Member bisa membuat Life post dengan gambar.
- Member bisa membuat General post dengan gambar.
- File kelima ditolak dengan pesan jelas.
- Format non-gambar ditolak dengan pesan jelas.
- Guest tidak melihat composer aktif.

### 4. Edit dan Delete Post

Behavior:

- Member pembuat post bisa edit konten post miliknya sendiri.
- Member pembuat Trading post bisa edit metadata Pair, TF, Arah, Risk, Entry, SL, TP, dan Confidence miliknya sendiri.
- Admin bisa edit konten dan metadata semua post.
- Non-author member tidak melihat action edit/delete pada post orang lain.
- Delete post wajib memakai confirm dialog sebelum request DELETE dijalankan.
- Confirm dialog memiliki action utama yang jelas dan tombol batal.
- Delete tidak destructive by default: fokus awal berada pada tombol batal atau close, bukan tombol hapus.

Acceptance:

- Login sebagai `ARDANI | vastara.id` menampilkan `Edit postingan` dan `Hapus postingan` pada post miliknya sendiri.
- Login sebagai non-author member tidak menampilkan edit/delete pada post milik user lain.
- Admin melihat edit/delete pada semua post.
- Member pembuat Trading post bisa memperbarui metadata market miliknya.
- Delete tidak terjadi sebelum user mengonfirmasi.
- Dialog delete bisa ditutup dengan tombol batal, close, backdrop sesuai desain, dan Escape.

### 5. Repost dan Quote

Behavior:

- Tombol `Repost` pada action bar melakukan plain repost cepat.
- Plain repost harus muncul sebagai item timeline.
- Item repost memakai post original dengan header kecil seperti `ARDANI | vastara.id merepost`.
- Count repost dan toggle active sinkron dengan item timeline.
- Membatalkan repost menghilangkan item repost dari timeline milik viewer setelah refresh atau local update.
- `Quote postingan` tetap tersedia sebagai action sekunder.
- Quote membuat post baru yang mengutip post original.
- User tidak boleh merepost post miliknya sendiri pada fase ini; error harus terlihat jelas.

Acceptance:

- Setelah member menekan `Repost`, count naik dan timeline menampilkan item repost.
- Setelah member menekan ulang `Repost`, count turun dan item repost tidak muncul lagi untuk repost tersebut.
- Header repost menunjukkan member yang merepost, bukan mengubah author original.
- Quote tetap membuat post quote terpisah.

### 6. Bookmark dan Profile Disimpan

Behavior:

- Tombol `Simpan` menyimpan bookmark post.
- Profile/member center memiliki tab atau section `Disimpan`.
- `Disimpan` menampilkan histori post yang dibookmark member.
- Unsave dari feed atau profile menghapus post dari daftar `Disimpan`.
- Guest profile menampilkan CTA login Telegram dan manfaat login.

Acceptance:

- Member bisa menyimpan post dari feed.
- Post yang disimpan muncul di profile `Disimpan`.
- Member bisa membuka post dari daftar `Disimpan`.
- Jika bookmark dibatalkan, post hilang dari daftar `Disimpan`.
- Guest tidak melihat daftar bookmark kosong yang membingungkan; guest melihat CTA login.

### 7. Share Sheet

Behavior:

- Tombol `Bagikan` pada action bar membuka share sheet, bukan langsung copy link.
- Desktop memakai popover/modal kecil yang elegan.
- Mobile memakai bottom sheet.
- Opsi minimal:
  - Salin link
  - Telegram
  - WhatsApp
  - X/Twitter
  - Facebook
  - Native share jika `navigator.share` tersedia
- Semua opsi memakai canonical URL `/hertz/post/[shortId]`.
- `Salin link` di menu tiga titik tetap tersedia sebagai shortcut langsung.
- Setelah action berhasil, tampil feedback singkat seperti `Link disalin`.

Acceptance:

- Klik `Bagikan` di desktop membuka share sheet tanpa pindah halaman.
- Klik `Bagikan` di mobile membuka bottom sheet.
- `Salin link` menyalin canonical URL.
- Link Telegram, WhatsApp, X/Twitter, dan Facebook memakai URL post yang benar.
- Native share hanya ditampilkan atau dipakai jika browser mendukung.

### 8. Post Detail Desktop dan Mobile

Behavior:

- Desktop: klik post dari feed membuka detail post dalam modal.
- Desktop modal berisi post, action bar, komentar, dan comment CTA/form sesuai role.
- Desktop modal tidak membuat feed kehilangan posisi scroll.
- Desktop modal bisa ditutup dengan close button, backdrop click, dan Escape.
- Focus kembali ke elemen pembuka setelah modal ditutup.
- Mobile: klik post tetap pindah ke `/hertz/post/[shortId]`.
- Direct link `/hertz/post/[shortId]` tetap bekerja untuk desktop dan mobile.
- Mobile detail memprioritaskan post dan komentar.
- Market Live pada mobile detail tidak boleh mendominasi sebelum konten post; buat collapsible atau posisikan setelah konten utama.

Acceptance:

- Desktop feed tetap berada pada posisi scroll yang sama setelah modal ditutup.
- Mobile membuka halaman penuh detail post.
- Direct link detail post tetap bisa dibuka.
- Mobile detail menampilkan post sebelum market block panjang.

### 9. Comment dan Guest CTA

Behavior:

- Member/admin bisa komentar pada post.
- Guest detail post tidak melihat textarea aktif penuh.
- Guest melihat CTA login Telegram untuk ikut komentar.
- Comment state punya loading, error, dan success feedback.
- Comment action pada feed membuka detail modal di desktop dan detail page di mobile.

Acceptance:

- Guest tidak bisa submit komentar tanpa login.
- Guest melihat CTA login yang jelas pada area komentar.
- Member bisa submit komentar dan melihat komentar muncul.
- Error submit komentar tampil jelas.

### 10. Profile / Member Center

Profile menjadi pusat aktivitas sosial member.

Section/tab minimal:

- Ringkasan akun Telegram.
- Role/access state.
- Bio singkat.
- Statistik dasar.
- Joined date.
- Post saya.
- Disimpan.
- Repost saya.
- Komentar saya.
- Credit/history.
- Setting Telegram/session.

Behavior:

- Profile rail card menjadi link ke `/hertz/profile`.
- Guest profile menampilkan CTA login Telegram dan manfaat login: posting, simpan post, DM, komentar, histori aktivitas.
- Member profile menampilkan tab aktivitas.
- Admin bisa memakai profile sebagai member juga, dengan badge admin yang jelas.
- Bio bisa kosong dengan empty state yang rapi.

Acceptance:

- Guest `/hertz/profile` tidak kosong; ada CTA login dan manfaat login.
- Member melihat post miliknya di `Post saya`.
- Member melihat bookmark di `Disimpan`.
- Member melihat plain repost/quote miliknya di `Repost saya`.
- Member melihat komentar miliknya di `Komentar saya`.
- Credit/history tetap tersedia.

### 11. Direct Message

Behavior:

- Desktop boleh memakai label `Direct Message`.
- Mobile memakai label `DM`.
- Guest yang membuka DM langsung melihat CTA login Telegram.
- Guest tidak melihat inbox filter, archive, block, upload, composer, atau send action operasional.
- Member mobile memakai alur dua layar:
  - layar 1: inbox list dan search member;
  - layar 2: thread aktif dengan back ke inbox.
- Header thread bersih: identitas conversation, status, dan menu tiga titik.
- Action sekunder seperti `Arsipkan` dan `Blokir` berada di menu tiga titik.
- DM tetap memakai polling 5-10 detik.
- Tidak memakai websocket pada fase ini.
- Upload gambar DM maksimal 4 gambar per pesan.
- Format gambar DM: JPG, PNG, WEBP.
- Composer DM memakai UI HERTZ, bukan input file browser default.

Acceptance:

- Guest `/hertz/messages` langsung melihat CTA login Telegram.
- Member mobile bisa pindah dari inbox ke thread dan kembali.
- Header thread tidak penuh action sekunder.
- Polling tidak lebih sering dari 5 detik.
- Upload gambar kelima ditolak dengan pesan jelas.

### 12. Search Sosial dan Hashtag/Topik

Behavior:

- Search kanan atas difungsikan sebagai social search.
- Search mencari:
  - post;
  - member;
  - hashtag/topik;
  - pair/market symbol jika tersedia di metadata.
- Hashtag di konten post menjadi link/filter.
- Hasil search punya empty state.
- Mobile search tetap mudah diakses tanpa menabrak bottom nav atau composer.

Acceptance:

- Search `xau` mengembalikan post/topik/pair relevan jika data ada.
- Search nama member mengembalikan member.
- Klik hashtag membuka feed/filter hashtag.
- Empty search menampilkan pesan jelas.

### 13. Notifikasi Minimal

Scope notifikasi fase ini kecil.

Behavior:

- DM unread badge tampil di nav/DM entry.
- Activity indicator ringan untuk aktivitas sosial tersedia, misalnya comment/repost/like baru pada post user.
- Tidak membuat notification center penuh.
- Notification settings tidak masuk fase ini.

Acceptance:

- Member dengan unread DM melihat badge di DM nav.
- Guest tidak melihat unread badge palsu.
- Activity indicator tidak mengganggu feed dan punya empty state.

### 14. SEO dan Social Preview

Behavior:

- Detail post memiliki title dan description yang berasal dari konten post.
- Open Graph dan Twitter metadata dibuat untuk direct link detail post.
- Metadata tidak membocorkan data private.
- Jika post tidak ditemukan, metadata memakai fallback HERTZ.

Acceptance:

- `/hertz/post/[shortId]` punya title yang lebih informatif dari shortId saja.
- Link share ke Telegram/WhatsApp/X memakai metadata post.
- Deleted/hidden post tidak menampilkan konten private pada metadata.

### 15. Accessibility

Overlay yang wajib accessible:

- Desktop post detail modal.
- Share sheet.
- Delete confirm.
- Edit post dialog.
- DM menu tiga titik.

Requirement:

- Setiap overlay punya close button.
- Escape menutup overlay.
- Focus trap aktif saat overlay terbuka.
- Focus kembali ke elemen pembuka setelah overlay ditutup.
- Icon-only control punya accessible name.
- Focus state terlihat untuk keyboard user.
- Dialog destruktif tidak memfokuskan tombol hapus sebagai default.

Acceptance:

- Navigasi keyboard bisa membuka dan menutup modal/sheet/menu.
- Screen reader name tersedia untuk action icon-only.
- Tidak ada focus hilang ke body setelah overlay ditutup.

## Scope Tidak Masuk

- Follow/following.
- Websocket/realtime DM.
- Notification center penuh.
- Notification settings.
- Block/mute/report lanjutan.
- Histori report lengkap untuk member.
- Video upload.
- Upload selain gambar.
- Redesign admin dashboard besar.
- Menghapus route lama detail post.
- Menghapus data lama.

## Data dan API Requirement

Implementasi nanti perlu mengecek dan menambah API/data berikut sesuai kondisi kode saat ini.

### Access Role

- Helper frontend `guest/member/admin`.
- Helper permission untuk nav, post action, composer, DM, profile, dan admin action.

### Feed Repost

- Feed harus bisa menggabungkan original post dan plain repost.
- Plain repost item membutuhkan data:
  - original post;
  - user yang merepost;
  - waktu repost;
  - repost id atau stable key;
  - viewer state original post.
- Count repost tetap berdasarkan `hertz_reposts` aktif.

### Bookmark History

- Endpoint/query untuk list bookmark user.
- Data minimal:
  - post;
  - waktu disimpan;
  - viewer state post.

### Profile Activity

- Endpoint/query untuk:
  - post milik user;
  - saved/bookmarked posts;
  - repost/quote user;
  - komentar user;
  - statistik dasar;
  - joined date;
  - credit/history.

### Market Metadata Edit

- Service edit post perlu menerima update market metadata untuk author post dan admin.
- Authorization:
  - author boleh edit metadata miliknya;
  - admin boleh edit metadata semua post;
  - non-author member ditolak.

### Search Sosial

- Endpoint/search handler untuk post, member, hashtag/topik, dan pair.
- Hasil search harus typed agar UI bisa membedakan jenis result.

### DM Minimal Notification

- Endpoint atau response auth/profile menyediakan unread count DM.
- Polling unread count tidak boleh terlalu sering.

### SEO Metadata

- Detail post route mengambil post server-side untuk metadata.
- Metadata fallback dipakai jika post tidak ditemukan atau hidden/deleted.

## Copywriting Dictionary

UI utama memakai bahasa Indonesia, dengan istilah produk yang umum tetap boleh dipakai.

- `Direct Message`: desktop label, boleh dipakai sebagai nama fitur.
- `DM`: mobile label.
- `Mode baca`: guest/read-only state.
- `Masuk dengan Telegram`: login CTA.
- `Suka`: like/pulse.
- `Repost`: repost.
- `Quote postingan`: quote.
- `Simpan`: bookmark.
- `Bagikan`: share.
- `Salin link`: copy link.
- `Komentar`: comments.
- `Arsipkan`: archive.
- `Blokir`: block.
- `Kirim`: send.
- `Hapus postingan`: delete.
- `Edit postingan`: edit.
- `Member`: logged-in regular user.
- `Admin`: application admin.

## Review Tooling Gates

Tooling review sudah tersedia di `docs/review-tooling/README.md` dan menjadi bagian dari spec ini.

### Baseline Sebelum Kode

Sebelum implementation plan dieksekusi untuk batch UI besar:

- Buat atau perbarui baseline visual hanya jika kondisi live saat ini memang diterima sebagai baseline.
- Buat baseline DOM untuk route utama sebelum perubahan struktural besar.
- Catat route dan viewport yang akan dibandingkan pada task terkait.

Command:

```bash
REVIEW_BASE_URL=https://horizon.cloudnexify.com npm run review:visual:update
REVIEW_BASE_URL=https://horizon.cloudnexify.com npm run review:dom:update
```

Baseline tidak boleh diperbarui setelah perubahan hanya untuk membuat test hijau. Jika snapshot berubah, perubahan harus dijelaskan sebagai expected change atau diperbaiki.

### Visual Regression

Wajib dipakai untuk perubahan yang menyentuh:

- layout shell;
- feed card;
- composer;
- profile;
- DM;
- detail post;
- modal/sheet;
- responsive breakpoint;
- spacing, border, atau theme.

Command:

```bash
REVIEW_BASE_URL=https://horizon.cloudnexify.com npm run review:visual
```

Jika visual diff muncul, hasilnya harus diklasifikasikan:

- expected: sesuai spec dan boleh diterima;
- regression: harus diperbaiki sebelum lanjut;
- baseline stale: baseline hanya boleh di-update setelah user/developer menerima tampilan baru.

### Accessibility Audit

Wajib dipakai untuk perubahan yang menyentuh:

- overlay;
- dialog;
- menu tiga titik;
- share sheet;
- delete confirm;
- edit dialog;
- composer;
- form komentar;
- DM composer;
- navigation;
- icon-only action.

Command:

```bash
REVIEW_BASE_URL=https://horizon.cloudnexify.com npm run review:a11y
```

Critical dan serious violation harus diperbaiki sebelum task dianggap selesai, kecuali dicatat eksplisit sebagai existing issue yang tidak tersentuh task.

### Snapshot + DOM Diff

Wajib dipakai untuk perubahan yang menyentuh:

- conditional rendering guest/member/admin;
- nav gating;
- profile tabs;
- saved/repost/comment lists;
- DM guest/member state;
- search result sections;
- SEO/direct link route structure.

Command:

```bash
REVIEW_BASE_URL=https://horizon.cloudnexify.com npm run review:dom
```

DOM diff dipakai untuk memastikan elemen yang harus hilang/ada benar-benar berubah, misalnya Tools hilang untuk guest atau DM guest tidak lagi menampilkan composer operasional.

### Browser Agent / Computer-Use

Gunakan Playwright MCP ketika static check tidak cukup.

Command:

```bash
npm run review:mcp
```

Pakai untuk:

- membuka route live;
- klik post dan memastikan modal desktop terbuka;
- keyboard Escape/backdrop close;
- membuka share sheet;
- mengetes menu tiga titik;
- memastikan focus tidak hilang;
- melihat network request saat action sosial berjalan.

MCP server berjalan sampai dihentikan manual. Jangan biarkan sesi MCP berjalan saat pekerjaan sudah selesai.

### Session Replay

Gunakan replay untuk flow yang perlu bukti run dan akan sering direview ulang.

Command:

```bash
REVIEW_BASE_URL=https://horizon.cloudnexify.com REVIEW_REPLAY_ROUTE=/hertz REVIEW_REPLAY_SECONDS=30 npm run review:replay
```

Replay dipakai untuk:

- post detail modal desktop;
- share sheet desktop/mobile;
- DM mobile two-screen;
- composer upload preview/remove;
- delete confirm;
- profile saved history;
- repost timeline.

rrweb replay adalah audit-only injection. Recorder tidak boleh dipasang permanen ke UI produksi dalam fase ini.

## Verification Matrix

Viewport wajib:

- 1440px desktop.
- 1365px desktop jika perlu membandingkan screenshot lama.
- 768px tablet.
- 390px mobile.
- 320px mobile kecil.

Role wajib:

- Guest.
- Member pembuat post: `ARDANI | vastara.id`.
- Non-author member.
- Admin.

Route wajib:

- `/hertz`
- `/hertz/post/[shortId]`
- `/hertz/profile`
- `/hertz/messages`
- search/topik route jika dibuat

Command/check:

- Tidak menjalankan dev server.
- Jalankan lint/typecheck/test yang tersedia dan relevan.
- Jalankan build produksi frontend sebelum mengklaim selesai.
- Untuk UI responsive/layout, jalankan `npm run review:visual` pada route terdampak.
- Untuk overlay/form/nav/action keyboard, jalankan `npm run review:a11y`.
- Untuk conditional UI atau perubahan struktur route, jalankan `npm run review:dom`.
- Untuk flow interaktif yang tidak cukup dibuktikan oleh screenshot/static audit, gunakan `npm run review:mcp` atau `npm run review:replay`.
- Lakukan screenshot/check live VPS setelah build dan deploy/reload sesuai proses yang dipakai di proyek.

## Unit Kerja untuk Implementation Plan Berikutnya

Implementation plan nanti harus memecah spec ini menjadi unit kecil seperti ini:

1. Access role helper dan nav gating.
2. Tablet/mobile shell breakpoint dan right rail sticky desktop.
3. Feed/card/composer outline consistency.
4. Composer media lintas kategori dengan preview/remove/validation.
5. Edit post + metadata author/admin.
6. Delete confirm dialog.
7. Plain repost timeline.
8. Profile activity tabs, termasuk `Disimpan`.
9. Share sheet desktop/mobile.
10. Desktop detail modal dan mobile detail priority.
11. Guest comment CTA.
12. DM guest CTA, mobile two-screen, menu tiga titik, polling guard, image composer.
13. Social search dan hashtag/topik.
14. Minimal notification badges.
15. SEO/social preview detail post.
16. Accessibility pass untuk overlay.
17. Review tooling baseline/check pass: visual, a11y, DOM diff, MCP/replay sesuai area.
18. Full verification pass dan cleanup.

Setiap unit kerja harus memiliki:

- file path yang disentuh;
- failing test atau baseline verification sebelum implementasi jika memungkinkan;
- implementasi minimal;
- build/check;
- responsive/auth/review tooling verification jika relevan;
- commit setelah verified.

## Risiko dan Mitigasi

Risiko: scope besar menyentuh feed, profile, DM, API, dan responsive shell.  
Mitigasi: tetap satu fase, tetapi plan dipecah menjadi unit kecil dengan verification gate.

Risiko: tablet 768px rusak karena desktop rail.  
Mitigasi: breakpoint tablet dibuat eksplisit dan menjadi acceptance awal.

Risiko: repost timeline mengubah query feed dan bisa memengaruhi ordering/count.  
Mitigasi: buat test/query verification untuk plain repost, quote, original post, dan viewer state.

Risiko: permission edit/delete bisa bocor ke non-author.  
Mitigasi: test guest, author member, non-author member, dan admin.

Risiko: overlay banyak dan accessibility tertinggal.  
Mitigasi: pakai pola modal/sheet/menu yang reusable sejak awal.

Risiko: share/SEO butuh direct link yang tetap stabil.  
Mitigasi: route detail tetap dipertahankan walaupun desktop feed memakai modal.

Risiko: snapshot/visual baseline bisa disalahgunakan untuk menerima regression.  
Mitigasi: baseline hanya di-update sebelum coding atau setelah perubahan visual diterima eksplisit; visual diff setelah coding harus diklasifikasikan.

Risiko: artifact replay/screenshot memenuhi repo.  
Mitigasi: artifact review tetap ignored dan tidak dicommit kecuali sengaja dijadikan baseline atau bukti diskusi.

## Self-Review Spec

- Placeholder: tidak ada bagian yang sengaja dibiarkan kosong.
- Konsistensi role: database tetap `member/admin`, access frontend `guest/member/admin`.
- Konsistensi responsive: desktop memakai modal detail, mobile memakai route detail penuh, tablet memakai compact/mobile-like layout.
- Scope: semua keputusan diskusi HERTZ masuk fase ini; fitur yang ditunda dicatat eksplisit di scope tidak masuk.
- Ambiguitas utama sudah dipilih: Tools disembunyikan untuk guest, DM guest tetap visible sebagai CTA login, websocket ditunda, upload fase ini gambar saja.
- Tooling review sudah masuk spec sebagai gate sebelum dan sesudah implementasi, bukan scope fitur produksi.
