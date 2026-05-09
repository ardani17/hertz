# Diskusi Refactor Total Horizon dan HERTZ

Tanggal: 2026-05-09
Status: Siap diturunkan menjadi spec

## Tujuan

Refactor ini mengubah arah web Horizon secara total dari feed lama menjadi ekosistem baru:

- **Horizon** adalah platform dan brand utama.
- **HERTZ** adalah produk social media komunitas trading di dalam Horizon.
- Landing page Horizon berada di `/`.
- Aplikasi social feed HERTZ berada di `/hertz`.

Perubahan ini bukan hanya rename UI. Scope refactor mencakup:

- route publik,
- shell UI desktop,
- nama domain dan module,
- schema database,
- admin panel,
- feed sosial,
- blog member,
- Outlook dari WordPress,
- Direct Message,
- credit,
- dan migrasi/hapus data lama.

## Acuan Visual

Mock HERTZ desktop saat ini berada di Figma file Horizon.

Frame penting:

- `V3 / Desktop Final Draft`
- `V3 / Outlook Desktop Draft`
- `V3 / Blog Desktop Draft`
- `V3 / Tools Desktop Draft`
- `V3 / Direct Message Desktop Draft`
- `Horizon Landing / Desktop Mock 02`

Mock PNG lokal:

- `docs/signal-ledger/signal-ledger-mock-03.png`
- `docs/signal-ledger/desktop-mocks/outlook-desktop.png`
- `docs/signal-ledger/desktop-mocks/blog-desktop.png`
- `docs/signal-ledger/desktop-mocks/tools-desktop.png`
- `docs/signal-ledger/desktop-mocks/direct-message-desktop.png`
- `docs/horizon-landing-mocks/horizon-landing-desktop-02.png`

## Naming

Keputusan:

- Nama produk social media adalah **HERTZ**.
- Di UI, brand ditulis uppercase: `HERTZ`.
- Di kode, naming mengikuti standar pengkodean:
  - `HertzPage`
  - `HertzShell`
  - `hertzService`
  - `hertz_posts`
- Semua teks `Signal Ledger` diganti menjadi `Hertz` atau `HERTZ` sesuai konteks.
- Semua route dan admin menu `signal-ledger` diganti menjadi `hertz`.
- Istilah action lama **Signal** diganti menjadi **Pulse** agar selaras dengan identitas HERTZ.

Catatan:

- HERTZ adalah nama produk.
- Pulse adalah action/interaksi di dalam HERTZ.

## Route Publik

Keputusan route:

- `/` adalah landing page Horizon.
- `/hertz` adalah home/feed HERTZ.
- `/hertz/post/[shortId]` adalah detail post HERTZ.
- `/blog` tetap route Blog.
- `/outlook` tetap route Outlook.
- `/tools` tetap route Tools.
- `/hertz/messages` dipakai untuk Direct Message.

Keputusan untuk detail post:

- ID publik tidak boleh angka mentah.
- Detail post memakai `shortId` berbentuk teks pendek atau hashed.
- Format final `shortId`: prefix `hz_` + 8 karakter acak, contoh `hz_k8m2q9la`.
- `shortId` bersifat immutable dan tidak berubah walaupun judul atau konten diedit.
- ID internal database boleh tetap UUID atau numeric jika diperlukan, tetapi tidak ditampilkan langsung di URL publik.

## Landing Page Horizon

Landing Horizon dibuat di `/`.

Tujuan landing:

- memperkenalkan Horizon sebagai platform utama,
- menjelaskan HERTZ sebagai produk social media,
- memberi akses cepat ke HERTZ, Outlook, Blog, dan Tools,
- menjaga visual tetap satu keluarga dengan HERTZ,
- memakai tema black dan emerald,
- disiapkan dengan SEO yang rapi.

Mock awal:

- `docs/horizon-landing-mocks/horizon-landing-desktop-02.png`
- Figma frame: `Horizon Landing / Desktop Mock 02`

Section yang disarankan dan disetujui:

- Hero Horizon,
- product gateway HERTZ,
- Outlook,
- Blog,
- Tools,
- membership CTA,
- footer sederhana.

## HERTZ Desktop Shell

Menu desktop final:

- Home
- Outlook
- Blog
- Tools
- Direct Message

Perilaku menu:

- Home di dalam HERTZ mengarah ke `/hertz`.
- Outlook mengarah ke `/outlook`.
- Blog mengarah ke `/blog`.
- Tools mengarah ke `/tools`.
- Direct Message mengarah ke route message HERTZ.

Left rail:

- memakai logo atom Horizon dan tulisan HERTZ,
- tidak memakai nama `Signal Ledger`,
- active state mengikuti mock Figma,
- admin menu tetap tersedia untuk admin, tetapi tidak harus terlihat untuk semua user.

Right rail:

- tampil di Home HERTZ, Outlook, Blog, dan Tools.
- tidak tampil di Direct Message.
- berisi 3 panel:
  - Forex Market
  - Crypto Market
  - Stock Market
- mini chart di setiap row memakai line chart merah/hijau, bukan candlestick.
- data market boleh mock/fallback dulu.
- jika data belum live, jangan klaim live.

## Blog

Keputusan baru:

- Blog tetap berada di `/blog`.
- Blog bukan lagi hanya admin-only.
- Verified member boleh membuat blog.
- Blog berfungsi seperti blogger/article publishing di Horizon.
- Blog tetap sistem terpisah dari feed HERTZ.
- Blog tetap memakai shell visual HERTZ pada desktop.
- Blog post yang published memberi credit kepada author.
- Blog verified member langsung publish tanpa review.
- Verified member boleh edit dan delete blog miliknya sendiri.
- Admin boleh edit/delete semua blog.

Hal yang perlu disiapkan:

- create/edit blog untuk verified member,
- status publish langsung untuk verified member,
- ownership edit/delete,
- media cover,
- slug,
- SEO metadata,
- credit event untuk blog published.

## Outlook

Keputusan:

- Outlook tetap berada di `/outlook`.
- Outlook mengambil data dari WordPress sesuai sistem yang sekarang.
- Outlook bukan dibuat dari HERTZ feed.
- Outlook tetap sistem terpisah dari Blog dan HERTZ feed.
- Outlook memakai shell visual HERTZ pada desktop.
- Scope import/filter WordPress tetap mengikuti implementasi yang saat ini sudah berjalan.

Catatan:

- Sistem WordPress import/sync yang sekarang dipertahankan.
- Jika import sudah ada, refactor jangan merusak alur itu.

## Tools

Keputusan:

- Tools tetap berada di `/tools`.
- Tools tetap menjadi kumpulan tool trading/research.
- Tools memakai shell visual HERTZ pada desktop.
- Right rail market tetap tampil di Tools.

Catatan:

- Halaman detail tool seperti profitability, CFTC, economic calendar, dan lainnya tidak harus ikut total shell pada fase pertama jika terlalu besar.
- Minimal `/tools` hub harus mengikuti desain HERTZ.

## Direct Message

Keputusan:

- Direct Message jadi fitur nyata, bukan hanya mock.
- Direct Message untuk verified member.
- Tahap awal memakai polling 5-10 detik.
- Tidak memakai websocket pada fase awal.
- Direct Message tidak memakai right rail market.
- Semua verified member boleh DM semua verified member.
- DM bersifat private secara default.
- Admin tidak melihat isi DM kecuali ada mekanisme report/moderasi.
- DM fase awal langsung mendukung attachment.
- Blocking/report disiapkan sebagai guardrail awal.

Kebutuhan awal:

- conversation list,
- message thread,
- send message,
- read state,
- unread count,
- access control verified member,
- polling endpoint,
- soft delete atau hide message jika dibutuhkan,
- attachment upload,
- block/report,
- admin moderation berbasis report.

## Auth dan Permission

Keputusan yang tetap berlaku:

- Guest hanya read-only.
- Guest bisa membaca `/hertz`, `/hertz/post/[shortId]`, `/blog`, `/outlook`, dan `/tools`.
- Tombol action tetap terlihat untuk guest, tetapi memunculkan prompt login.
- Write action butuh login Telegram dan verified member.
- Verified member adalah user Telegram yang sudah lolos membership check grup Horizon.
- Admin tetap punya akses admin panel.

Write action untuk verified member:

- membuat post HERTZ,
- membuat Blog,
- comment,
- Pulse,
- repost,
- quote repost,
- bookmark,
- membuat community note sesuai aturan,
- mengirim Direct Message.

## Admin Panel

Keputusan:

- Admin panel tetap dipakai.
- Menu dan module `Signal Ledger` diganti menjadi `Hertz`.
- Route admin diganti dari `/admin/signal-ledger` menjadi `/admin/hertz`.
- Semua copy admin yang menyebut Signal Ledger diganti ke Hertz.
- Credit amount harus bisa diatur manual dari admin dashboard.

Catatan:

- Route lama tidak perlu dipertahankan; semua langsung diganti ke route HERTZ baru.
- Karena data lama belum production, kompatibilitas data lama bukan prioritas.

## Database dan Data Lama

Keputusan:

- Rename database mengikuti saran refactor total.
- Domain baru memakai nama `hertz_*`.
- Semua data lama di-reset/dihapus.
- Tidak perlu menjaga data testing lama.
- Migration boleh dibuat bersih untuk domain HERTZ.
- Feature flag lama `SIGNAL_LEDGER_ENABLED` tidak dipertahankan sebagai mode ganda.
- Refactor dilakukan total ke HERTZ.

Prinsip:

- Hindari schema campuran `signal_ledger` dan `hertz`.
- Gunakan nama tabel, enum, service, repository, dan type yang konsisten.
- Jika ada route/API lama, langsung ganti ke route/API HERTZ baru.
- Route/API lama yang memakai domain lama langsung diganti ke route/API HERTZ baru.
- Nama internal interaction memakai `pulse` dan tidak memakai istilah lama `signal`.

Contoh arah naming:

- `hertz_posts`
- `hertz_post_media`
- `hertz_comments`
- `hertz_reactions`
- `hertz_reposts`
- `hertz_bookmarks`
- `hertz_community_notes`
- `hertz_messages`
- `hertz_conversations`

Catatan:

- Perlu audit schema aktual sebelum final spec.
- Migration lama `signal_ledger` boleh diganti/drop/create karena data lama reset total.

## Credit

Keputusan:

- HERTZ post published mendapat credit.
- Telegram post published mendapat credit.
- Blog verified member mendapat credit.
- Credit tetap dipertahankan dalam refactor.
- Besaran credit tidak hardcoded.
- Besaran credit diatur manual melalui admin dashboard.

Catatan:

- Outlook dari WordPress sebaiknya tidak memberi credit otomatis kecuali author Horizon jelas.
- Direct Message tidak perlu memberi credit.
- Pulse/comment/repost/blog/post credit mengikuti konfigurasi admin dashboard.

## Telegram

Keputusan:

- Telegram flow lama tetap penting.
- Post dari Telegram tetap mengikuti flow yang sudah ada.
- Jika member biasa posting dari Telegram, admin tetap bisa publish seperti sekarang.
- HERTZ harus menerima konten dari Telegram dan web.

Perubahan naming:

- Bot copy dan admin queue yang menyebut Signal Ledger harus diganti menjadi Hertz.

## Mobile

Keputusan:

- Mobile ditunda dulu.
- Backend dan struktur code tetap harus siap untuk mobile.
- Desktop menjadi fokus desain awal.

Catatan:

- Jangan membuat struktur desktop yang akan menyulitkan mobile nanti.
- Mobile mock lama tetap disimpan sebagai referensi.

## Implementasi Yang Disarankan

Urutan implementasi yang disarankan:

1. Finalisasi diskusi.
2. Buat spec `hertz-platform-refactor`.
3. Audit schema dan code lama.
4. Buat migration bersih `hertz_*`.
5. Rename service/repository/type/API dari Signal Ledger ke Hertz.
6. Buat Horizon landing `/`.
7. Pindahkan HERTZ feed ke `/hertz`.
8. Buat shared desktop shell HERTZ.
9. Terapkan shell ke Home HERTZ, Outlook, Blog, dan Tools.
10. Buat Blog verified member flow.
11. Buat Direct Message backend dan UI desktop.
12. Update admin panel dari Signal Ledger ke Hertz.
13. Seed data lengkap.
14. Audit ulang terhadap spec.
15. Build, test, dan screenshot QA.

## Risiko dan Catatan

- Refactor ini besar dan menyentuh route, schema, UI, admin, dan bot.
- Rename database total aman karena data lama belum production, tetapi tetap perlu hati-hati agar migration lokal dan docker tidak gagal.
- Blog verified member menambah permission surface baru.
- Direct Message menambah domain baru yang butuh access control dan privacy.
- Outlook WordPress harus dipertahankan agar tidak tercampur dengan Blog member.
- Landing `/` akan mengubah perilaku home lama, jadi semua link internal harus dicek ulang.

## Keputusan Final Dari Tanya Jawab

1. Format `shortId` memakai `hz_` + 8 karakter acak.
2. Route Direct Message final memakai `/hertz/messages`.
3. Blog verified member langsung publish.
4. Verified member boleh edit/delete blog sendiri.
5. Semua verified member boleh DM semua verified member.
6. DM private secara default; admin hanya masuk lewat report/moderasi.
7. DM fase awal langsung mendukung attachment.
8. Outlook WordPress mengikuti alur yang saat ini sudah berjalan.
9. Credit amount diatur manual dari admin dashboard.
10. Guest bisa membaca, tetapi semua action memunculkan prompt login.
11. Refactor dilakukan total; feature flag lama tidak dipertahankan sebagai mode ganda.
12. Semua data lama di-reset/dihapus.
13. Landing Horizon memakai struktur SEO: hero, HERTZ, Outlook, Blog, Tools, membership CTA, dan footer sederhana.

## Hal Kecil Yang Bisa Diputuskan Saat Spec

1. Route lama `/post/[id]` langsung diganti ke `/hertz/post/[shortId]`; tidak perlu legacy redirect karena data lama reset total.
2. Nama internal action memakai `pulse` agar tidak membawa istilah lama yang membingungkan.
3. Attachment DM fase awal hanya gambar.
4. Ukuran attachment DM maksimal `5MB` per file.
5. Jumlah attachment DM maksimal `4` gambar per pesan.
6. SEO Landing dan Blog mengikuti rekomendasi spec: title pattern, description, canonical, dan OG image.

## Rekomendasi Penutup Celah Diskusi

1. **Apakah action `Signal` tetap dipakai?**
   Rekomendasi: UI boleh memakai istilah khas HERTZ seperti `Pulse`, tetapi database memakai nama netral `hertz_reactions` dengan enum `pulse`. Hindari nama internal `signal` agar tidak terasa seperti sisa Signal Ledger.

2. **Bagaimana aturan Community Note?**
   Rekomendasi: verified member boleh membuat community note, source URL wajib minimal satu, note langsung tampil, dan admin bisa remove/hide jika abuse. Setiap note menyimpan daftar source agar bisa diaudit.

3. **Bagaimana membership Telegram diverifikasi?**
   Rekomendasi: login Telegram hanya valid jika endpoint membership mengembalikan `isMember: true`. Simpan status verified dengan timestamp, lalu recheck berkala saat login dan saat write action penting. Jika user keluar grup, akses write dicabut setelah recheck berikutnya.

4. **Bagaimana credit dibuat aman?**
   Rekomendasi: semua credit memakai ledger event yang idempotent. Satu event hanya boleh memberi credit sekali untuk satu entity dan satu user, misalnya `hertz_post_published:postId:userId`. Edit/re-publish tidak boleh menggandakan credit.

5. **Bagaimana keamanan attachment DM?**
   Rekomendasi: fase awal hanya gambar `jpg`, `jpeg`, `png`, dan `webp`; maksimal `5MB` per file; maksimal `4` gambar per pesan; validasi mime dan ekstensi; simpan di storage khusus DM; hapus/hide attachment saat message dihapus.

6. **Bagaimana report DM bekerja tanpa merusak privacy?**
   Rekomendasi: DM private default. Jika user report, admin hanya melihat message yang direport plus konteks terbatas beberapa pesan sebelum/sesudahnya, bukan seluruh inbox user.

7. **Bagaimana guardrail Blog yang langsung publish?**
   Rekomendasi: verified member langsung publish, tetapi admin punya takedown/unpublish, report, edit/delete semua blog, slug unik, cover image, SEO metadata, dan audit log minimal untuk tindakan admin.

8. **Bagaimana Telegram bot dipetakan ke HERTZ?**
   Rekomendasi: bot mempertahankan flow sekarang dengan `/publish`, tetapi naming queue dan copy menjadi HERTZ. Hashtag lama dipetakan ke kategori HERTZ, media ikut tersimpan sebagai `hertz_post_media`, dan duplicate prevention memakai telegram message id.

9. **Bagaimana kategori dan composer HERTZ?**
   Rekomendasi: kategori awal adalah `Trading Room`, `Life & Coffee`, `General`, dan `Community Note`. Field `pair` dan `risk` hanya wajib untuk `Trading Room`; kategori lain bebas tanpa field trading.

10. **Bagaimana repost dan quote repost?**
    Rekomendasi: repost biasa hanya satu kali per user per post. Quote repost langsung publish, boleh berisi teks dan media, punya count sendiri, dan bisa dihapus oleh author atau admin.

11. **Bagaimana reset data dibuat aman?**
    Rekomendasi: karena data lama reset total, migration boleh drop/create domain lama. Tetap sediakan catatan deployment dan seed baru. Hindari command reset otomatis tanpa konfirmasi eksplisit di production.

12. **Bagaimana Outlook WordPress dijaga?**
    Rekomendasi: Outlook tetap memakai konfigurasi WordPress yang sekarang, tidak memberi credit otomatis, konten disanitasi sebelum render, dan UI punya fallback ketika WordPress gagal diakses.
