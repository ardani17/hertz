# Diskusi Refactor Feed Hertz Menjadi Signal Ledger

Tanggal: 2026-05-08

## Tujuan

Refactor feed Hertz bukan hanya mengganti UI menjadi mirip timeline sosial, tetapi membangun domain baru bernama **Signal Ledger**.

Signal Ledger adalah feed komunitas trading Hertz yang menyatukan:

- posting dari Telegram seperti fitur sekarang,
- posting dari web untuk member terverifikasi,
- media/chart inline,
- interaksi Signal,
- komentar,
- repost dan quote repost,
- bookmark/simpan,
- community notes,
- konteks market seperti pair, risk, timeframe, dan source.

Mock visual utama yang dipakai sebagai acuan:

- `docs/signal-ledger/signal-ledger-mock-03.png`

## Prinsip Produk

Signal Ledger tidak boleh menjadi clone X/Twitter 100%.

Yang diambil dari X/Twitter:

- timeline cepat discan,
- post row ringkas,
- media inline,
- action bar,
- repost/quote pattern,
- right rail informatif.

Yang harus tetap menjadi ciri Hertz:

- tema hijau/emerald,
- nuansa trading community,
- sumber Telegram sebagai bagian penting,
- chart/media sebagai konten utama,
- metadata market,
- istilah `Signal` sebagai pengganti like,
- right rail berisi market pulse, kalender ekonomi, tools cepat, dan topik komunitas,
- identitas Hertz yang terasa jelas.

## Definisi Composer

Composer adalah kotak/form untuk membuat post dari web.

Di mock, composer berupa input di bagian atas feed dengan placeholder seperti:

`Kirim jurnal dari Telegram atau tulis setup...`

Dalam implementasi, composer berarti fitur **buat post dari web**.

Composer tidak mengganti fitur Telegram. Keduanya harus berjalan:

- user tetap bisa membuat post dari Telegram,
- user juga bisa membuat post dari web jika sudah login dan terverifikasi sebagai member grup Hertz.

## Flow Posting Telegram Saat Ini

Fitur saat ini:

- user membuat artikel dari grup Telegram memakai hashtag,
- hashtag menentukan kategori,
- bot membuat artikel di database,
- media dari Telegram bisa ikut disimpan,
- member biasa masuk draft/menunggu approval,
- admin bisa publish,
- setelah publish artikel muncul di website.

Flow ini tetap dipertahankan.

Perubahan yang diinginkan:

Setelah artikel Telegram dibuat/published, sistem juga membuat entry Signal Ledger agar post muncul di timeline baru.

Alur target:

```txt
Telegram hashtag post
  -> bot handler
  -> articles
  -> media
  -> feed_posts
  -> Signal Ledger timeline
```

## Flow Posting Web

Posting web hanya untuk user yang sudah login Telegram dan terverifikasi sebagai member grup Hertz.

Alur target:

```txt
User login Telegram
  -> validasi Telegram auth
  -> cek membership grup Hertz
  -> user menulis post dari web
  -> articles
  -> media optional
  -> feed_posts
  -> Signal Ledger timeline
```

Posting web harus disimpan dengan source `web` atau `dashboard`, berbeda dari source `telegram`.

## Login dan Membership Verification

Login Telegram tidak boleh dianggap valid hanya karena Telegram widget berhasil.

Setelah Telegram identity diterima, backend harus memeriksa apakah user benar-benar member grup Hertz.

Endpoint membership yang disediakan:

```bash
curl -H "Authorization: Bearer <TOKEN>" \
"https://satpam.cloudnexify.com/api/membership/check?groupId=-1001916607651&userId=<TELEGRAM_ID>"
```

Jika member:

```json
{"isMember":true}
```

Jika bukan member:

```json
{"isMember":false}
```

Token endpoint tidak boleh disimpan di frontend. Token harus disimpan di environment server.

Env yang disarankan:

```env
MEMBERSHIP_CHECK_URL=https://satpam.cloudnexify.com/api/membership/check
MEMBERSHIP_CHECK_TOKEN=...
HERTZ_MEMBERSHIP_GROUP_ID=-1001916607651
```

Catatan keamanan:

Token yang pernah dibagikan di chat sebaiknya di-rotate sebelum production deploy.

## Permission Model

### Guest / Belum Login

User yang belum login hanya boleh melihat web.

Boleh:

- melihat feed,
- membuka detail post/artikel,
- melihat komentar,
- melihat jumlah Signal,
- melihat repost,
- melihat views/insight,
- melihat community notes,
- melihat media/chart.

Tidak boleh:

- membuat post,
- komentar,
- Signal/like,
- repost,
- quote repost,
- bookmark/simpan,
- rating community notes,
- mengusulkan community notes.

### Verified Telegram Member

Syarat:

- login Telegram valid,
- membership check return `isMember: true`.

Boleh:

- membuat post dari web,
- membuat post dari Telegram,
- komentar,
- Signal,
- repost,
- quote repost,
- bookmark/simpan,
- rating community notes,
- mengusulkan community notes jika fitur ini dibuka untuk member.

### Admin

Boleh semua fitur member, ditambah:

- approve/hide/delete post,
- moderasi komentar,
- approve/reject community notes,
- pin post,
- manage users,
- melihat audit logs,
- pengaturan platform.

## Anonymous Behavior

Sebelumnya komentar/like bisa anonymous/fingerprint.

Untuk Signal Ledger baru, keputusan diskusi:

- guest hanya bisa melihat,
- tidak ada komentar anonymous,
- tidak ada like/signal anonymous,
- tidak ada fingerprint untuk Signal baru.

Implikasi:

- `post_reactions.user_id` wajib,
- `post_bookmarks.user_id` wajib,
- `comments.user_id` wajib untuk komentar Signal Ledger,
- UI action untuk guest menampilkan prompt login.

## Repost

Repost harus nyata sejak awal.

Ada dua mode:

1. **Repost biasa**
   User membagikan ulang post tanpa teks tambahan.

2. **Quote repost**
   User membagikan ulang post dengan komentar/setup tambahan.

Target schema konseptual:

```txt
post_reposts
- id
- original_post_id
- repost_post_id nullable
- user_id
- repost_type: repost | quote
- created_at
```

Untuk quote repost, sistem dapat membuat feed post baru yang berisi teks quote, lalu menghubungkannya ke post asli.

## Community Notes

Community notes masuk scope lengkap, bukan placeholder.

Nama UI:

`Catatan komunitas`

Rekomendasi flow:

- verified member bisa mengusulkan catatan,
- admin approve/reject catatan,
- hanya catatan `published` yang tampil di timeline,
- verified member bisa memberi rating helpful/not helpful,
- guest hanya bisa membaca.

Target tabel konseptual:

```txt
community_notes
community_note_sources
community_note_ratings
```

## Data Model Konseptual

Existing table yang tetap dipakai:

```txt
users
articles
media
comments
activity_logs
admin_sessions
```

Tabel baru yang dibutuhkan untuk Signal Ledger:

```txt
feed_posts
post_market_context
post_reactions
post_bookmarks
post_reposts
post_views
community_notes
community_note_sources
community_note_ratings
telegram_memberships
```

### feed_posts

Lapisan timeline sosial. Tidak mengganti `articles`.

Kolom konseptual:

```txt
id
article_id
author_id
post_type
source
visibility
status
pinned_at
created_at
updated_at
```

### post_market_context

Metadata trading untuk post.

Kolom konseptual:

```txt
post_id
symbol
timeframe
risk_percent
direction
entry_price
stop_loss
take_profit
setup_type
```

### post_reactions

Pengganti like untuk domain baru.

Kolom konseptual:

```txt
id
post_id
user_id
reaction_type
created_at
```

`reaction_type` default: `signal`.

### telegram_memberships

Cache hasil membership check.

Kolom konseptual:

```txt
id
user_id
telegram_id
group_id
is_member
checked_at
last_verified_at
raw_response
```

## Struktur Kode Yang Diinginkan

Kode harus dipisah sesuai fungsi agar maintenance mudah.

Prinsip:

- route API tipis,
- query database masuk repository,
- business logic masuk service,
- type/domain contract dipisah,
- komponen UI kecil dan spesifik,
- jangan menumpuk semua logic di `page.tsx`.

Struktur yang disarankan:

```txt
frontend/src/app/
  page.tsx
  api/feed/route.ts
  api/feed/[postId]/signal/route.ts
  api/feed/[postId]/bookmark/route.ts
  api/feed/[postId]/repost/route.ts
  api/feed/[postId]/view/route.ts
  api/feed/community-notes/[noteId]/rating/route.ts

frontend/src/components/feed/
  SignalLedgerPage.tsx
  SignalLedgerHeader.tsx
  SignalComposer.tsx
  SignalPost.tsx
  SignalPostMedia.tsx
  SignalActionBar.tsx
  SignalMarketMeta.tsx
  CommunityNoteCard.tsx
  QuoteSetupCard.tsx
  SignalLeftRail.tsx
  SignalRightRail.tsx
  SignalEmptyState.tsx

shared/services/
  feedService.ts
  postReactionService.ts
  bookmarkService.ts
  repostService.ts
  communityNoteService.ts
  membershipService.ts
  marketContextService.ts

shared/repositories/
  feedRepository.ts
  postReactionRepository.ts
  bookmarkRepository.ts
  repostRepository.ts
  communityNoteRepository.ts
  membershipRepository.ts

shared/types/
  feed.ts
  membership.ts
```

## API Konseptual

API yang kemungkinan dibutuhkan:

```txt
GET  /api/feed
POST /api/feed
POST /api/feed/[postId]/signal
POST /api/feed/[postId]/bookmark
POST /api/feed/[postId]/repost
POST /api/feed/[postId]/view
POST /api/feed/community-notes
POST /api/feed/community-notes/[noteId]/rating
```

Auth:

```txt
POST /api/auth/telegram
GET  /api/auth/me
POST /api/auth/logout
```

Semua endpoint mutasi harus membutuhkan verified Telegram member, kecuali admin endpoint yang membutuhkan admin.

## UI Direction

Mengacu ke docs\signal-ledger\signal-ledger-mock-03.png:

- nama feed: `Signal Ledger`,
- dark green trading terminal feel,
- center timeline dengan signal spine,
- left rail Hertz,
- right rail market intelligence,
- post menampilkan metadata source/pair/risk/time,
- media chart tampil inline,
- action bar memakai istilah:
  - Komentar,
  - Repost,
  - Signal,
  - Insight,
  - Simpan,
  - Bagikan.

## Mobile Direction

Mobile harus tetap nyaman:

- left rail disembunyikan,
- right rail disembunyikan,
- center timeline full width,
- header sticky tetap,
- composer compact,
- post action bar tidak overflow,
- media responsive.

## Deploy dan Environment

Deploy perlu memastikan env baru masuk ke `deploy-docker.sh`, `docker-compose.yml`, dan dokumentasi `.env.example`.

Env baru yang kemungkinan dibutuhkan:

```env
MEMBERSHIP_CHECK_URL=
MEMBERSHIP_CHECK_TOKEN=
HERTZ_MEMBERSHIP_GROUP_ID=-1001916607651
```

Jika web posting memakai upload media ke R2, env R2 existing tetap dipakai.

## Hal Yang Perlu Diputuskan Di Spec

1. Apakah web post langsung `published`, atau masuk draft dulu?
2. Apakah member Telegram biasa boleh langsung membuat community note, atau hanya mengusulkan lalu admin approve?
3. Apakah repost bisa dibatalkan/delete oleh pembuatnya?
4. Apakah Signal bisa di-toggle seperti like sekarang?
5. Apakah views/insight dihitung per verified user, per session, atau aggregate sederhana?
6. Apakah post dari Telegram member tetap perlu approval admin seperti sekarang?
7. Bagaimana migrasi data lama ke `feed_posts`?

## Saran Tambahan Sebelum Spec

Bagian ini berisi hal-hal yang perlu dimasukkan ke spec agar implementasi tidak bolong di tengah jalan.

### 1. Moderation Workflow

Signal Ledger membutuhkan lifecycle status yang jelas.

Status yang disarankan:

```txt
draft
pending_review
published
hidden
rejected
deleted
```

Tujuannya:

- membedakan post yang baru dibuat, menunggu review, sudah tampil, disembunyikan, ditolak, atau dihapus,
- menjaga flow Telegram lama tetap aman,
- membuat admin dashboard mudah memfilter konten.

### 2. Web Post Approval Rule

Perlu keputusan final apakah web post member langsung tampil atau harus review.

Rekomendasi:

- admin post langsung `published`,
- member post dari web masuk `pending_review`,
- member post dari Telegram tetap mengikuti rule lama,
- repost biasa terhadap post published boleh langsung published,
- quote repost yang menambahkan teks bisa masuk review jika ingin moderasi lebih ketat.

### 3. Admin Dashboard Impact

Refactor Signal Ledger akan berdampak ke admin dashboard.

Admin perlu surface untuk:

- review web posts,
- review Telegram drafts,
- approve/reject community notes,
- hide/delete post,
- hide/delete repost,
- melihat report/abuse,
- melihat audit logs aktivitas Signal Ledger,
- manage user membership status.

Admin dashboard tidak boleh tertinggal dari domain baru, karena nanti konten sosial tidak punya tempat moderasi.

### 4. Report / Abuse System

Karena feed berubah menjadi sosial, perlu fitur report minimal.

Target tabel konseptual:

```txt
post_reports
- id
- post_id
- reporter_user_id
- reason
- details
- status
- reviewed_by
- reviewed_at
- created_at
```

Reason awal:

```txt
spam
misleading
abusive
off_topic
other
```

Guest tidak bisa report. Report hanya untuk verified member.

### 5. Notification

Notifikasi belum wajib di implementasi awal, tetapi perlu dipikirkan.

Event yang berpotensi membutuhkan notifikasi:

- post disetujui,
- post ditolak,
- post mendapat komentar,
- post mendapat Signal,
- post direpost,
- community note diterima,
- community note ditolak.

Rekomendasi:

- masukkan sebagai phase lanjut,
- jika tidak dikerjakan awal, jangan buat UI palsu,
- schema event bisa disiapkan ringan jika tidak menambah risiko.

### 6. Data Migration Detail

Existing articles perlu dimigrasikan ke `feed_posts`.

Aturan yang perlu dispesifikasikan:

- semua `articles.status = published` dibuatkan `feed_posts`,
- `feed_posts.article_id` menunjuk ke `articles.id`,
- `feed_posts.source` mengikuti `articles.source`,
- `feed_posts.created_at` mengikuti `articles.created_at`,
- `feed_posts.status` menjadi `published`,
- migration harus idempotent,
- migration tidak boleh menghapus data lama.

Pertanyaan penting:

- apakah kategori `outlook` masuk Signal Ledger?
- apakah kategori `blog` masuk Signal Ledger?

Rekomendasi:

- `outlook` tidak masuk feed utama Signal Ledger, tetap sebagai halaman editorial terpisah,
- `blog` tidak masuk timeline utama dulu, tetapi bisa muncul di right rail atau tab khusus jika diperlukan,
- Signal Ledger utama fokus pada `trading`, `life_story`, dan `general`.

### 7. Article Detail vs Post Detail

Saat user klik post, perlu diputuskan arahnya.

Opsi:

1. tetap ke `/artikel/[slug]`,
2. buat route baru `/post/[id]`,
3. hybrid: feed klik ke `/post/[id]`, lalu post detail tetap menampilkan artikel.

Rekomendasi tahap awal:

- klik post tetap ke `/artikel/[slug]` agar SEO dan detail artikel lama aman,
- backend tetap memakai `feed_posts.id` agar nanti bisa dibuat `/post/[id]`,
- spec harus menyebut `/artikel/[slug]` tetap hidup.

### 8. Telegram Membership Revalidation

Membership tidak boleh dicek sekali lalu dianggap permanen.

Aturan yang disarankan:

- cek membership saat login,
- simpan hasil ke `telegram_memberships`,
- simpan `last_verified_at`,
- re-check setiap 24 jam atau ketika user melakukan mutasi penting,
- jika endpoint return `isMember:false`, action write ditolak,
- session bisa tetap membaca web, tetapi hak member dicabut.

### 9. Telegram Auth Signature

Membership check saja tidak cukup.

Login harus dua lapis:

1. validasi signature Telegram Login Widget agar `telegram_id` tidak bisa dipalsukan,
2. cek membership grup Hertz lewat endpoint `membership/check`.

Jika salah satu gagal, user tidak boleh dianggap verified member.

### 10. Rate Limiting dan Anti-Spam

Signal Ledger butuh batas mutasi agar aman.

Rate limit yang disarankan:

- post dari web per user per jam,
- komentar per user per menit,
- Signal toggle per user per menit,
- repost per user per menit,
- community note proposal per user per hari,
- report per user per hari,
- upload media per post dan per user.

Rate limit harus server-side. UI hanya membantu, bukan sumber keamanan.

### 11. Media Rules

Perlu aturan media untuk post web dan Telegram.

Rekomendasi:

- gunakan R2 existing untuk upload media,
- maksimal 4 media per post,
- feed preview:
  - 1 media: tampil besar,
  - 2 media: grid dua kolom,
  - 3-4 media: grid compact,
- image dan video tetap didukung,
- validasi tipe dan ukuran file tetap memakai helper existing jika memungkinkan,
- chart/screenshot trading dianggap image biasa.

### 12. Market Metadata Extraction

Metadata seperti pair, risk, timeframe, direction, entry, SL, dan TP perlu sumber data jelas.

Opsi:

- user input manual dari web,
- admin edit metadata setelah publish,
- bot parse dari teks Telegram,
- metadata optional dan post tetap valid tanpa metadata.

Rekomendasi awal:

- metadata optional,
- web post menyediakan field manual,
- Telegram post boleh kosong dulu,
- admin bisa edit metadata,
- parsing otomatis dari Telegram menjadi phase lanjut.

### 13. Views / Insight Definition

Istilah UI `Insight` perlu definisi teknis.

Rekomendasi awal:

- `Insight` tahap awal berarti view count,
- hitung aggregate view per post,
- deduplicate per user/session dalam window tertentu, misalnya 6-24 jam,
- guest view boleh dihitung,
- jangan tampilkan analytics kompleks sebelum datanya tersedia.

### 14. Backward Compatibility

Refactor tidak boleh mematikan fitur lama tanpa keputusan jelas.

Yang perlu dijaga:

- `/artikel/[slug]` tetap berjalan,
- komentar lama tetap bisa dibaca,
- SEO metadata dan sitemap tetap aman,
- media existing tetap tampil,
- Telegram bot flow lama tetap berjalan,
- admin login/session tetap berjalan,
- old `likes` tidak otomatis menjadi `Signal` kecuali ada migration eksplisit.

Komentar baru pada Signal Ledger mengikuti rule baru: harus verified member.

### 15. Testing dan Audit Acceptance

Spec harus punya acceptance checklist konkret.

Minimal yang harus diuji:

- guest bisa membaca feed dan detail,
- guest tidak bisa komentar, Signal, repost, bookmark, rating note, atau post,
- Telegram login dengan `isMember:false` tidak mendapat hak write,
- Telegram login dengan `isMember:true` mendapat hak member,
- verified member bisa membuat web post sesuai rule review,
- verified member bisa komentar,
- verified member bisa Signal toggle,
- verified member bisa repost dan quote repost,
- verified member bisa bookmark,
- verified member bisa rating community notes,
- admin bisa approve/reject/hide/delete sesuai haknya,
- migration membuat `feed_posts` dari article lama tanpa menghapus data,
- build frontend sukses,
- bot build sukses,
- API contract dites,
- responsive mobile dicek,
- deploy env baru masuk `.env.example`, `docker-compose.yml`, dan `deploy-docker.sh` jika diperlukan.

## Saran Tambahan Review Kedua

Bagian ini menambahkan hal-hal yang lebih operasional: session, security, pagination, data integrity, migration safety, dan rollback.

### 16. Member Session Model

Admin saat ini memakai `admin_sessions`.

Untuk verified Telegram member, spec perlu memutuskan model session:

1. membuat tabel baru `member_sessions`,
2. atau menggeneralisasi menjadi tabel `sessions`,
3. atau memperluas `admin_sessions` menjadi session multi-role.

Hal yang perlu diputuskan:

- nama cookie member,
- masa berlaku session,
- logout behavior,
- apakah admin dan member session bisa aktif bersamaan,
- apakah session menyimpan status verified atau selalu cek database,
- bagaimana session dicabut jika membership sudah tidak valid.

Rekomendasi awal:

- jangan campur cookie admin dan member,
- gunakan cookie member berbeda, misalnya `hertz_member_session`,
- session member tetap mengarah ke `users.id`,
- status membership terbaru dibaca dari `telegram_memberships`.

### 17. Membership Endpoint Failure Behavior

Endpoint membership eksternal bisa timeout, down, atau return error.

Spec harus menentukan perilaku saat gagal.

Rekomendasi:

- login baru: fail closed, artinya login member ditolak sementara jika membership check gagal,
- user yang sudah verified: boleh memakai cache membership terakhir maksimal 24 jam,
- action write setelah cache kedaluwarsa harus re-check,
- jika re-check gagal setelah cache kedaluwarsa, action write ditolak,
- read-only tetap boleh.

Hal ini mencegah user non-member mendapat akses write saat endpoint bermasalah.

### 18. CSRF Protection

Karena Signal Ledger akan memakai session cookie untuk mutasi, spec perlu menyebut perlindungan CSRF.

Endpoint mutasi meliputi:

- post,
- comment,
- Signal,
- repost,
- bookmark,
- community note,
- rating,
- report.

Opsi proteksi:

- cookie `SameSite=Strict` atau minimal `Lax`,
- validasi `Origin` / `Referer` untuk mutasi,
- CSRF token untuk form/action yang sensitif.

Rekomendasi awal:

- gunakan `SameSite=Strict` untuk session,
- validasi `Origin` pada semua mutasi API,
- jangan menerima mutasi cross-origin.

### 19. Cursor Pagination

Timeline tidak boleh memakai offset pagination untuk jangka panjang.

Gunakan cursor pagination:

```txt
GET /api/feed?limit=20&cursor=<cursor>
```

Response konseptual:

```json
{
  "items": [],
  "nextCursor": "..."
}
```

Sort yang disarankan:

```txt
ORDER BY feed_posts.created_at DESC, feed_posts.id DESC
```

Cursor harus cukup stabil untuk infinite scroll dan tidak mudah menghasilkan duplikasi saat ada post baru.

### 20. Count Aggregation Strategy

Feed membutuhkan count untuk:

- Signal,
- komentar,
- repost,
- quote repost,
- views/insight,
- bookmark state user.

Jangan mengandalkan banyak subquery mentah tanpa strategi jika data membesar.

Opsi:

1. kolom counter di `feed_posts`,
2. aggregate table terpisah,
3. materialized view,
4. query optimized dengan index.

Rekomendasi awal:

- tambahkan counter denormalized di `feed_posts` untuk `signal_count`, `comment_count`, `repost_count`, `view_count`,
- update counter di transaction saat mutasi,
- audit ulang jika nanti perlu reconciliation job.

### 21. Unique Constraints

Schema harus memiliki constraint untuk mencegah duplikasi.

Constraint yang disarankan:

```txt
post_reactions unique(post_id, user_id, reaction_type)
post_bookmarks unique(post_id, user_id)
post_reposts unique(original_post_id, user_id, repost_type) untuk repost biasa
community_note_ratings unique(note_id, user_id)
post_reports unique(post_id, reporter_user_id, reason) atau aturan lain yang jelas
feed_posts unique(article_id) untuk post artikel biasa jika hanya satu feed post per article
telegram_memberships unique(telegram_id, group_id)
```

Quote repost bisa berbeda dari repost biasa karena menghasilkan post baru.

### 22. Repost Cycle Prevention

Repost dan quote repost perlu aturan agar tidak membentuk loop atau nested chain berlebihan.

Hal yang perlu diputuskan:

- apakah user boleh repost post sendiri,
- apakah repost biasa bisa di-repost lagi,
- apakah quote repost bisa di-quote lagi,
- seberapa dalam nested quote ditampilkan.

Rekomendasi awal:

- render nested quote maksimal satu level,
- simpan `root_post_id` agar chain bisa dilacak,
- repost biasa hanya menunjuk ke original/root post,
- quote repost boleh mengutip post lain tetapi UI hanya menampilkan satu nested card.

### 23. Soft Delete vs Hard Delete

Untuk audit dan moderation, konten sosial sebaiknya tidak langsung hard delete.

Kolom yang disarankan:

```txt
deleted_at
deleted_by
hidden_at
hidden_by
hidden_reason
moderation_reason
```

Rekomendasi:

- admin hide/delete memakai soft delete,
- user delete post sendiri juga soft delete,
- hard delete hanya untuk maintenance/admin database jika benar-benar perlu,
- feed publik hanya menampilkan data aktif.

### 24. Activity Log Coverage

Existing `activity_logs` harus mencatat aktivitas Signal Ledger.

Event yang disarankan:

```txt
member_login_success
member_login_failed
membership_verified
membership_revoked
post_created
post_submitted_for_review
post_approved
post_rejected
post_hidden
post_deleted
comment_created
comment_hidden
signal_created
signal_removed
bookmark_created
bookmark_removed
repost_created
repost_removed
community_note_proposed
community_note_approved
community_note_rejected
community_note_rated
post_reported
post_report_resolved
```

Log harus fail-safe: kegagalan logging tidak boleh menjatuhkan action utama, tetapi error perlu dicatat server-side.

### 25. Content Sanitization

Semua konten user-generated harus aman.

Sumber konten:

- Telegram post,
- web post,
- quote repost,
- comment,
- community note,
- report details.

Keputusan yang perlu dibuat:

- web composer menerima plain text atau rich text?
- apakah link auto-link?
- apakah HTML dari user dilarang?

Rekomendasi awal:

- web composer plain text dulu,
- convert ke HTML aman memakai helper seperti `textToHtml`,
- render HTML memakai sanitizer existing,
- community note dan comment disimpan sebagai plain text atau escaped text,
- jangan menerima raw HTML dari member biasa.

### 26. Migration Failure Policy

Migration Signal Ledger akan besar dan menyentuh production data.

Saat ini migration runner di `db/init.sh` bisa lanjut walau satu migration gagal.

Spec perlu menyebut policy baru:

- migration penting harus fail hard,
- deploy script harus menolak lanjut jika migration Signal Ledger gagal,
- migration harus idempotent,
- migration tidak boleh drop data lama,
- migration harus bisa dijalankan ulang dengan aman.

Ini penting agar production tidak berada dalam kondisi setengah migrasi.

### 27. Rollback Plan dan Feature Flag

Refactor besar perlu rollback plan.

Rekomendasi:

- migration awal additive-only,
- jangan drop table/column lama,
- old feed query tetap bisa dipakai sementara,
- tambahkan env feature flag jika perlu:

```env
SIGNAL_LEDGER_ENABLED=true
```

Jika rollout bermasalah:

- nonaktifkan Signal Ledger UI,
- kembali ke feed lama,
- data baru tetap tersimpan,
- tidak perlu restore database dari backup kecuali ada kerusakan data.

### 28. URL dan Canonical Strategy

Jika nanti ada route `/post/[id]`, perlu strategi SEO agar tidak duplikat dengan `/artikel/[slug]`.

Rekomendasi:

- tahap awal tetap gunakan `/artikel/[slug]` sebagai canonical,
- `/post/[id]` jika dibuat nanti bisa menjadi social/thread view,
- set canonical ke artikel jika post berbasis artikel,
- quote/repost bisa punya canonical sendiri hanya jika memang menjadi konten mandiri.

### 29. Empty, Error, Loading, dan Pending States

Spec UI perlu mencakup state berikut:

- feed kosong,
- belum login,
- login bukan member grup,
- membership endpoint gagal,
- upload media gagal,
- post berhasil dikirim tapi pending review,
- post ditolak,
- no more posts,
- community note pending review,
- action gagal karena session expired.

State ini harus tampil jelas dan tidak hanya diam-diam gagal.

### 30. Composer Upload Lifecycle

Upload media dari web perlu flow jelas.

Opsi:

1. upload saat file dipilih,
2. upload saat submit post,
3. simpan draft dulu lalu upload media.

Hal yang perlu diputuskan:

- bagaimana cleanup jika upload berhasil tapi submit post gagal,
- apakah media orphan boleh ada,
- apakah media post pending review langsung public URL atau disembunyikan,
- apakah video boleh dari web composer.

Rekomendasi awal:

- upload saat submit post,
- transaction database dibuat setelah upload media sukses,
- jika database insert gagal, hapus object R2 best-effort atau log untuk cleanup,
- media pending review tidak ditampilkan publik sampai post published.

### 31. Index Strategy

Migration spec harus menyertakan index sejak awal.

Index yang disarankan:

```txt
feed_posts(status, created_at DESC, id DESC)
feed_posts(author_id)
feed_posts(article_id)
feed_posts(root_post_id)
post_market_context(post_id)
post_reactions(post_id, user_id)
post_bookmarks(post_id, user_id)
post_reposts(original_post_id)
post_reposts(user_id)
post_views(post_id)
community_notes(post_id, status)
community_note_ratings(note_id, user_id)
post_reports(post_id, status)
telegram_memberships(telegram_id, group_id)
member_sessions(token_hash)
```

Index harus mengikuti schema final, tetapi kebutuhan query timeline harus menjadi prioritas.

## Saran Tambahan Review Ketiga

Bagian ini menambahkan hal-hal yang muncul dari review tahap ketiga: identity, profile, reward, edit behavior, search/topic, right rail data source, accessibility, migration old data, dan batas phase.

### 32. Role dan Identity Model

Existing `users.role` hanya membedakan `member` dan `admin`.

Signal Ledger membutuhkan identitas member yang lebih kaya untuk UI timeline.

Field atau konsep yang perlu dipertimbangkan:

```txt
display_name
avatar_url
telegram_username
membership_status
is_verified_member
is_banned
last_seen_at
bio
```

Hal yang perlu diputuskan:

- apakah `username` existing cukup untuk display name,
- apakah avatar dari Telegram akan disimpan,
- apakah banned user tetap bisa login read-only,
- apakah admin bisa ban/mute member,
- bagaimana menampilkan user tanpa username.

Rekomendasi awal:

- gunakan `users.username` sebagai handle awal,
- tambahkan display fallback dari Telegram first name,
- simpan avatar Telegram jika tersedia,
- tambahkan status membership atau ban jika dibutuhkan untuk moderation.

### 33. Profile / Member Page

Jika Signal Ledger punya post, repost, Signal, dan bookmark, maka author di timeline akan terasa perlu bisa diklik.

Perlu diputuskan:

- apakah membuat route `/u/[username]` sekarang atau phase lanjut,
- apakah guest boleh melihat profile,
- apa yang tampil di profile: posts, reposts, notes, stats, atau hanya ringkas,
- bagaimana jika username kosong atau berubah.

Rekomendasi awal:

- profile page bisa menjadi phase lanjut,
- klik author tahap awal boleh non-link atau menuju filter author,
- schema tetap menyiapkan user identity yang cukup.

### 34. Follow / Following

Karena UI memakai pola social timeline, perlu eksplisit apakah ada follow system.

Rekomendasi:

- jangan buat follow/following di phase awal,
- feed tetap community-wide,
- tab `Following` tidak digunakan dulu,
- jika perlu tab, gunakan kategori Hertz seperti `Semua`, `Trading Room`, `Life & Coffee`, `General`.

Ini menjaga scope tetap sesuai komunitas grup, bukan membangun social network penuh.

### 35. Credit / Reward System Impact

Sistem lama memberi kredit saat artikel dipublish.

Signal Ledger perlu aturan kredit baru agar reward tidak kacau.

Pertanyaan:

- apakah web post mendapat kredit?
- apakah repost mendapat kredit?
- apakah quote repost mendapat kredit?
- apakah community note mendapat kredit?
- apakah Signal count mempengaruhi kredit?
- apakah post pending review mendapat kredit saat dibuat atau saat published?

Rekomendasi awal:

- kredit tetap diberikan saat post/article published, bukan saat draft,
- web post kategori `trading`, `life_story`, dan `general` bisa mengikuti credit settings existing,
- repost biasa tidak mendapat kredit,
- quote repost tidak mendapat kredit awal kecuali nanti dianggap konten mandiri,
- community note tidak mendapat kredit awal,
- Signal count tidak mempengaruhi kredit di phase awal.

Spec harus memastikan `credit_transactions` tidak double-award saat migration atau repost.

### 36. Draft / Pending Review Visibility

Jika post member masuk review, user perlu tahu statusnya.

State UI yang perlu ada:

```txt
Menunggu review
Ditolak
Dipublikasikan
Disembunyikan admin
```

Hal yang perlu diputuskan:

- apakah member punya halaman "post saya",
- apakah pending post tampil hanya untuk pembuat,
- apakah alasan penolakan ditampilkan,
- apakah user bisa edit/resubmit.

Rekomendasi awal:

- pending post tidak tampil di public timeline,
- pembuat bisa melihat status pending di area khusus atau composer feedback,
- admin rejection reason disimpan untuk audit dan bisa ditampilkan ke pembuat.

### 37. Edit Behavior

Perlu aturan edit untuk konten user-generated.

Konten yang mungkin diedit:

- web post,
- quote repost,
- comment,
- community note proposal,
- market metadata.

Rekomendasi awal:

- post pending bisa diedit oleh pembuat,
- post published jika diedit masuk `pending_review` ulang atau membuat revision,
- komentar bisa dihapus oleh pembuat, edit komentar opsional,
- community note proposal bisa diedit sebelum review,
- admin bisa edit metadata atau status,
- semua edit penting dicatat di `activity_logs`.

Jika revision history tidak dibuat awal, spec harus menyebut batasannya.

### 38. Slug Strategy Untuk Web Post

`articles.slug` wajib unique. Web post pendek atau duplikat perlu slug aman.

Rekomendasi slug:

```txt
<first-words>-<shortid>
```

Fallback:

```txt
post-<shortid>
```

Aturan:

- slug dibuat server-side,
- slug tidak boleh collision,
- slug tidak berubah setelah published kecuali admin action khusus,
- quote repost yang menjadi article juga perlu slug.

### 39. Pinned Post dan Announcement

`pinned_at` sudah masuk konsep, tetapi behavior perlu jelas.

Hal yang perlu diputuskan:

- berapa post yang bisa dipin,
- apakah pinned tampil di atas timeline,
- apakah pinned berlaku global atau per kategori,
- apakah pinned bisa expire otomatis,
- apakah admin saja yang bisa pin.

Rekomendasi awal:

- hanya admin bisa pin,
- maksimal 1-3 pinned post global,
- pinned post tampil di atas timeline dengan label khusus,
- unpin manual dulu.

### 40. Search dan Filter

Signal Ledger membutuhkan search/filter agar feed tidak menjadi daftar panjang tanpa kontrol.

Filter yang disarankan:

```txt
category
source: telegram | web | admin | wordpress
symbol/pair
author
topic
status untuk admin
```

Search:

```txt
q=<text>
```

Sort:

```txt
latest
top
most_signaled
most_discussed
```

Rekomendasi awal:

- public feed phase awal cukup `category`, `source`, dan cursor latest,
- admin feed perlu filter status,
- search full-text bisa phase lanjut jika terlalu besar.

### 41. Right Rail Data Source

Mock 03 memiliki right rail:

- Market Pulse,
- High Impact,
- Tools cepat,
- Topik panas.

Spec perlu menjelaskan sumber datanya.

Rekomendasi:

- `High Impact` memakai API economic calendar existing,
- `Tools cepat` memakai link statis ke tools yang sudah ada,
- `Market Pulse` bisa static/fallback awal atau memakai API market jika tersedia,
- `Topik panas` bisa dihitung dari topic/hashtag setelah model topic ada,
- jika upstream down, panel menampilkan fallback/empty state yang jelas.

Jangan membuat angka market palsu tanpa label demo/fallback.

### 42. Hashtag / Topic Model

Feed Hertz akan lebih kuat jika topik seperti `#gold`, `#riskmanagement`, dan `#journal` bisa muncul.

Target model konseptual:

```txt
topics
post_topics
```

Sumber topic:

- hashtag dari teks Telegram,
- input manual dari web composer,
- admin edit,
- extraction otomatis phase lanjut.

Rekomendasi awal:

- simpan hashtag/topic yang ditemukan dari teks,
- tampilkan di post,
- hitung topik panas dari `post_topics`,
- topik tidak wajib untuk membuat post.

### 43. Bahasa / Internationalization

Tools memiliki dukungan bahasa ID/EN, tetapi Signal Ledger belum perlu ikut kompleks.

Rekomendasi:

- Signal Ledger default Indonesia,
- istilah trading boleh campuran seperlunya,
- jangan tambah toggle bahasa feed di phase awal,
- pastikan copy UI konsisten: `Signal`, `Komentar`, `Repost`, `Simpan`, `Bagikan`, `Catatan komunitas`.

### 44. Accessibility

Spec UI harus mencakup aksesibilitas.

Hal yang perlu dijaga:

- semua action button punya `aria-label`,
- action state seperti Signal/bookmark punya `aria-pressed`,
- media/chart punya alt text,
- focus state terlihat,
- contrast emerald di dark mode cukup,
- keyboard navigation bisa membuka post dan menjalankan action,
- composer bisa dipakai tanpa mouse.

### 45. Image Optimization

Media inline di timeline bisa berat.

Aturan yang disarankan:

- gunakan lazy loading untuk media feed,
- image preview punya max height,
- video `preload="metadata"`,
- grid media responsive,
- gunakan domain image yang sudah diizinkan di Next config,
- jika perlu thumbnail/optimized URL, siapkan di service media.

### 46. Concurrency / Race Condition

Action seperti Signal, repost, bookmark bisa diklik cepat atau bersamaan dari beberapa tab.

Spec perlu mensyaratkan:

- mutation memakai transaction,
- unique constraint menjadi sumber kebenaran,
- toggle action idempotent,
- counter update konsisten,
- jika terjadi conflict, API mengembalikan state terbaru.

### 47. Admin / Member / Public API Namespace

API perlu dipisah jelas agar maintenance mudah.

Rekomendasi:

```txt
GET  /api/feed                     public read
POST /api/feed                     verified member create
POST /api/feed/[postId]/signal     verified member action
POST /api/feed/[postId]/repost     verified member action
POST /api/feed/[postId]/bookmark   verified member action

GET  /api/admin/feed               admin moderation list
POST /api/admin/feed/[postId]/approve
POST /api/admin/feed/[postId]/reject
POST /api/admin/feed/[postId]/hide
POST /api/admin/feed/[postId]/pin
```

Admin endpoint harus memakai admin session, bukan member session.

### 48. Old Likes / Comments Migration

Existing comments dan likes perlu aturan.

Rekomendasi:

- comments lama tetap dihitung untuk article yang punya feed_post,
- comments lama tetap tampil di detail artikel,
- komentar baru di Signal Ledger wajib verified member,
- old likes berbasis fingerprint tidak otomatis menjadi Signal karena rule baru user-based,
- jika ingin menampilkan old likes, tampilkan sebagai legacy count terpisah atau abaikan dalam Signal count.

Jangan mencampur fingerprint like lama dengan `post_reactions` user-based tanpa keputusan eksplisit.

### 49. Backup Before Production Migration

Migration safety perlu menyebut backup production.

Rekomendasi:

- backup database sebelum deploy migration Signal Ledger,
- dokumentasikan command backup,
- jangan pakai `down -v`, volume removal, atau prune saat deploy normal,
- migration additive-only tetap menjadi prinsip utama.

### 50. Spec Phase Boundary

Diskusi ini bersifat all-in, tetapi spec perlu membagi scope agar implementasi tetap rapi.

Format phase yang disarankan:

```txt
Required for first release
Schema-prepared but UI later
Future phase
```

Contoh:

- first release: feed timeline, login verified member, web post, Signal, comment, repost, bookmark, community note proposal/review,
- schema-prepared: notifications, profile page, topic analytics,
- future: follow/following, advanced analytics, automatic Telegram metadata parsing.

Pembagian phase bukan untuk mengurangi scope, tetapi untuk menjaga urutan implementasi dan audit.

### 51. Schema Source of Truth

Repo memiliki `prisma/schema.prisma`, tetapi aplikasi aktif memakai SQL migrations di `db/migrations`.

Spec harus menyatakan source of truth schema.

Rekomendasi:

- untuk Signal Ledger, source of truth adalah `db/migrations`,
- jangan edit Prisma schema sebagai sumber utama kecuali diputuskan untuk sinkronisasi penuh,
- jika Prisma tetap tidak dipakai, beri catatan agar developer tidak salah arah,
- migration baru diberi nomor berikutnya setelah `007_create_wordpress_import_jobs.sql`.

## Saran Tambahan Review Keempat

Bagian ini menambahkan aspek production-readiness: privacy, external dependency handling, observability, idempotency, transaction boundaries, content policy, dan ownership implementasi.

### 52. Privacy dan Data Retention

Signal Ledger akan menyimpan data identitas dan aktivitas user.

Data yang berpotensi disimpan:

```txt
telegram_id
telegram_username
display_name
avatar_url
membership check result
activity logs
post reports
community note ratings
post/comment/repost/signal/bookmark history
```

Hal yang perlu diputuskan:

- data apa yang wajib disimpan,
- apakah `raw_response` membership perlu disimpan penuh atau cukup metadata,
- berapa lama activity logs disimpan,
- berapa lama report details disimpan,
- apakah user bisa meminta profil/data dihapus,
- apakah avatar Telegram disimpan permanen atau hanya URL/cache.

Rekomendasi awal:

- jangan simpan raw response eksternal penuh kecuali diperlukan,
- simpan metadata minimal untuk audit,
- jangan simpan token atau header Authorization di log,
- activity log tetap disimpan untuk audit admin,
- user-generated content memakai soft delete terlebih dahulu.

### 53. External API Timeout dan Retry Policy

Signal Ledger bergantung pada beberapa external service:

- membership check endpoint,
- Telegram API,
- R2/S3 upload,
- economic calendar API,
- market pulse/upstream market data,
- OANDA/QuantAPI jika dipakai di right rail/tools.

Spec perlu menentukan:

- timeout default,
- retry count,
- fallback behavior,
- error message ke user,
- logging internal.

Rekomendasi awal:

- membership check timeout 5-10 detik,
- R2 upload timeout lebih panjang sesuai ukuran file,
- external market/right rail failure tidak boleh menjatuhkan feed utama,
- membership check failure untuk login baru fail closed,
- jangan log token/API key,
- tampilkan fallback state yang jelas saat external data gagal.

### 54. Secret Management

Secret baru seperti `MEMBERSHIP_CHECK_TOKEN` harus aman.

Aturan:

- token tidak boleh masuk frontend/client bundle,
- token tidak boleh masuk log,
- token tidak boleh ditulis di source code,
- `.env.example` hanya berisi placeholder,
- deploy script tidak mencetak nilai secret,
- token membership yang pernah dibagikan di chat harus di-rotate sebelum production deploy.

### 55. Observability dan Monitoring

Setelah deploy, admin perlu tahu sistem sehat atau tidak.

Hal yang perlu dipantau:

- membership check success/fail count,
- login member success/fail,
- post created/pending/published,
- Signal/repost/comment/bookmark count,
- R2 upload failure,
- feed API latency,
- right rail upstream failures,
- migration success/failure.

Rekomendasi:

- tambahkan log terstruktur untuk error penting,
- gunakan `activity_logs` untuk event domain yang perlu audit,
- tambahkan admin status surface minimal jika memungkinkan,
- health check tidak perlu memanggil semua upstream berat, tetapi bisa menampilkan status konfigurasi.

### 56. Idempotency Untuk Mutasi Penting

Double click, retry browser, atau network retry bisa membuat data dobel.

Mutasi yang perlu idempotency/guard:

- create web post,
- upload media + submit post,
- repost,
- quote repost,
- community note proposal,
- report post.

Opsi:

- idempotency key dari client,
- unique constraints,
- server-side duplicate detection dalam time window pendek.

Rekomendasi awal:

- action toggle seperti Signal/bookmark/repost biasa mengandalkan unique constraint,
- create web post memakai server guard atau idempotency key,
- quote repost memakai guard agar double-submit tidak membuat dua quote identik.

### 57. Transaction Boundaries

Spec harus menjelaskan operasi mana yang wajib atomik.

Transaksi inti:

```txt
create article + feed_post + media records + activity log
approve post + activate feed_post + award credit + activity log
signal toggle + counter update
bookmark toggle
repost create/delete + counter update
comment create + counter update
community note approve/reject + activity log
membership verification cache update + session create
```

Rekomendasi:

- gunakan transaction untuk perubahan multi-table,
- logging boleh fail-safe jika tidak ingin menjatuhkan action utama,
- counter harus konsisten dengan unique constraints.

### 58. Data Ownership Rules

Perlu aturan siapa boleh mengubah/menghapus data.

Pertanyaan:

- apakah author bisa delete post sendiri?
- apakah author bisa edit post published?
- apakah author bisa delete comment sendiri?
- apakah user bisa remove repost sendiri?
- apakah admin bisa hard delete?

Rekomendasi awal:

- author bisa soft delete post sendiri jika belum published atau jika policy mengizinkan,
- author bisa delete comment sendiri,
- user bisa remove repost/bookmark/signal sendiri,
- admin bisa hide/delete semua konten via soft delete,
- hard delete hanya maintenance/admin database,
- semua action moderation dicatat.

### 59. Admin Impersonation / Support Action

Jika admin mengedit metadata atau status post, action harus dicatat sebagai admin action.

Aturan:

- admin tidak boleh terlihat sebagai author asli saat melakukan perubahan,
- audit log menyimpan `actor_id` admin,
- details menyimpan target user/post,
- jika admin membuat post sendiri, barulah author adalah admin.

### 60. Trading Content Policy

Karena Hertz adalah komunitas trading, perlu aturan konten khusus.

Prinsip:

- post bukan financial advice,
- Signal bukan rekomendasi entry,
- chart/setup adalah jurnal atau area observasi,
- community note bisa menandai risiko news/high impact,
- admin bisa hide post yang misleading, manipulatif, spam, atau berbahaya.

UI bisa menampilkan disclaimer ringan di composer atau footer feed.

### 61. Membership Ban / Mute

Membership true tidak selalu berarti user boleh melakukan semua action jika ada pelanggaran.

Status moderation yang perlu dipertimbangkan:

```txt
active
muted
banned
read_only
```

Aturan:

- muted user tidak bisa post/comment/repost/signal selama durasi mute,
- banned user tidak bisa mendapat write access,
- guest/read-only tetap bisa membaca jika web publik,
- admin bisa memberi alasan dan durasi,
- status harus dicek pada semua endpoint mutasi.

### 62. Telegram Bot Backward Compatibility Detail

Flow bot lama harus tetap aman.

Hal yang perlu dipastikan di spec:

- hashtag lama `#trading`, `#cerita`, `#general` tetap bekerja,
- `/publish` lama tetap berjalan,
- `/publish` harus approve article dan membuat/mengaktifkan `feed_post`,
- response bot ke grup tetap jelas,
- jika feed_post creation gagal, harus jelas apakah article tetap dibuat atau transaction rollback,
- media upload Telegram tetap menggunakan R2 flow existing,
- bot logs mencatat kegagalan Signal Ledger integration.

Rekomendasi:

- article + feed_post dibuat dalam transaction jika memungkinkan,
- untuk member draft, feed_post bisa dibuat status `pending_review` atau dibuat saat publish,
- jangan sampai artikel published tanpa feed_post jika Signal Ledger sudah menjadi feed utama.

### 63. Admin Review Queue Ordering

Admin dashboard membutuhkan review queue yang bisa dipakai.

Filter/ordering yang disarankan:

```txt
newest first
source: telegram | web
category
status
author
reported only
```

Pertanyaan:

- apakah ada bulk approve/reject,
- apakah admin bisa preview post seperti timeline,
- apakah rejection reason wajib.

Rekomendasi awal:

- newest first,
- filter source/status/category,
- rejection reason opsional tapi disarankan,
- bulk action bisa phase lanjut.

### 64. Community Notes Quality Control

Community notes perlu batas kualitas.

Aturan yang perlu diputuskan:

- note max length,
- source URL wajib atau opsional,
- minimal jumlah source,
- maksimal note published per post,
- apakah note bisa diedit setelah published,
- apakah rating helpful/not helpful mempengaruhi visibility,
- apakah admin bisa pin satu note utama.

Rekomendasi awal:

- note wajib punya teks,
- source URL opsional tapi disarankan,
- maksimal satu published note utama per post di phase awal,
- rating hanya untuk feedback, tidak otomatis menyembunyikan note di phase awal,
- admin approve/reject tetap gate utama.

### 65. API Error Code Registry

Existing `ErrorCode` perlu diperluas untuk Signal Ledger.

Kode yang disarankan:

```txt
MEMBERSHIP_REQUIRED
MEMBERSHIP_CHECK_FAILED
MEMBERSHIP_NOT_IN_GROUP
SESSION_EXPIRED
CSRF_INVALID
ACTION_NOT_ALLOWED
POST_PENDING_REVIEW
POST_REJECTED
DUPLICATE_ACTION
MEDIA_UPLOAD_FAILED
RATE_LIMIT_EXCEEDED
```

Spec harus menentukan HTTP status dan response shape agar frontend konsisten.

### 66. Seed / Default Data

Jika ada topic/right rail, perlu default data awal.

Contoh default topics:

```txt
gold
riskmanagement
journal
xauusd
psychology
news
```

Rekomendasi:

- seed topic awal optional,
- tools cepat bisa hardcoded link awal,
- topik panas lebih baik dihitung dari `post_topics` jika data sudah ada.

### 67. Spec Ownership dan Work Breakdown

Karena refactor besar, spec harus membagi area kerja.

Area ownership:

```txt
migrations
shared repositories/services
auth/session/membership
API routes
frontend feed components
admin dashboard moderation
bot integration
tests
deploy/env
audit review
```

Tujuannya:

- implementasi tidak bercampur,
- mudah review,
- mudah audit apakah semua sesuai spec,
- menghindari file besar yang sulit dirawat.

## Saran Tambahan Dari Perbandingan Mock 03

Bagian ini mencatat elemen visual dan UX dari `signal-ledger-mock-03.png` yang harus ikut masuk spec agar implementasi tidak kehilangan rasa desain mock.

### 68. Signal Spine Behavior

Mock 03 memiliki garis vertikal hijau di sisi kiri timeline dengan node per post/kategori.

Spec perlu menjelaskan:

- apakah spine hanya dekoratif atau punya makna data,
- apakah node beda warna per kategori,
- apakah node mewakili category/source/status,
- apakah node clickable,
- apakah spine tampil di mobile,
- bagaimana node untuk community note dan quote repost.

Rekomendasi awal:

- spine menjadi elemen visual khas Hertz,
- node mewakili tipe/kategori post,
- node tidak perlu clickable phase awal,
- mobile bisa menyederhanakan spine menjadi garis tipis atau disembunyikan jika terlalu sempit.

### 69. Header Actions: Filter dan History

Mock menampilkan tombol `Filter` dan ikon jam/history di header kanan.

Spec perlu memutuskan:

- tombol Filter membuka panel/filter dropdown apa,
- ikon jam berarti latest/history/pending/recent activity,
- apakah kedua tombol masuk first release atau future phase.

Rekomendasi awal:

- Filter masuk first release untuk category/source/symbol,
- ikon jam bisa future phase atau dipakai untuk "post saya / pending review" jika diperlukan.

### 70. Composer Micro-Fields

Composer di mock memiliki input utama plus control kecil:

```txt
Chart
Pair
Risk
Image upload
Publish
```

Spec perlu menentukan:

- `Chart` berarti upload media/chart,
- `Pair` berarti input symbol seperti XAUUSD/BTCUSDT,
- `Risk` berarti risk percent,
- semua field optional atau wajib,
- apakah field tampil inline, popover, atau modal,
- bagaimana validasi risk dan symbol.

Rekomendasi awal:

- text wajib,
- chart/media optional,
- pair optional,
- risk optional,
- micro-fields inline atau popover kecil agar composer tetap compact.

### 71. Telegram Sync Module

Mock menampilkan module kiri bawah:

```txt
Telegram sync active
3 draft menunggu review
```

Spec perlu menentukan:

- siapa yang bisa melihat module ini,
- count berasal dari draft Telegram saja atau semua pending review,
- klik module menuju halaman apa,
- apakah module menampilkan status bot/webhook.

Rekomendasi awal:

- admin melihat count pending review,
- member melihat status "Telegram sync active" tanpa count admin jika tidak relevan,
- klik admin menuju review queue,
- status bot mengambil dari health/status bot jika tersedia.

### 72. Member Tier / Pro Member Badge

Mock menampilkan current user:

```txt
Ardani Trader
Pro Member
```

Spec perlu menentukan apakah tier ini nyata.

Pertanyaan:

- apakah semua verified member disebut member biasa,
- apakah ada tier `Pro Member`,
- apakah tier berasal dari credit, role, subscription, manual admin, atau Telegram group status,
- apakah tier tampil ke public.

Rekomendasi awal:

- jika belum ada tier nyata, gunakan label `Verified Member`,
- jangan tampilkan `Pro Member` kecuali ada data/aturan jelas.

### 73. Verified Badge di Post

Mock menampilkan badge check di author post.

Spec perlu menentukan:

- apakah semua verified Telegram group member mendapat badge,
- apakah admin punya badge berbeda,
- apakah badge berwarna biru atau Hertz emerald,
- apakah badge bisa muncul untuk non-member lama.

Rekomendasi awal:

- verified group member mendapat badge kecil,
- admin badge berbeda atau label admin,
- gunakan visual Hertz/emerald agar tidak terlalu mirip X/Twitter.

### 74. Post Overflow Menu

Mock menampilkan menu `...` pada tiap post.

Action yang perlu dipertimbangkan:

```txt
copy link
report
hide
delete own post
edit own pending post
edit metadata
pin
approve/reject
```

Rekomendasi:

- guest: copy link saja,
- verified member: copy link, report, delete own post jika allowed,
- admin: semua moderation action sesuai permission.

### 75. Text Truncation dan Baca Lanjut

Mock menampilkan `Baca lanjut` untuk post panjang.

Spec perlu menentukan:

- jumlah baris sebelum truncate,
- apakah `Baca lanjut` expand inline atau menuju detail,
- bagaimana memotong HTML dengan aman,
- apakah media tetap tampil saat text terpotong.

Rekomendasi awal:

- truncate 4-6 baris di feed,
- `Baca lanjut` membuka detail artikel/post,
- jangan memotong raw HTML secara sembarang; gunakan plain text excerpt atau sanitizer-safe renderer.

### 76. Setup Reference Card Detail

Mock quote/setup card menampilkan:

```txt
Entry
TP
SL
Confidence
Risk
```

Spec perlu memperluas market metadata jika ingin mengikuti mock.

Tambahan field konseptual:

```txt
confidence_percent
broker_or_source
entry_zone
take_profit_1
take_profit_2
take_profit_3
```

Rekomendasi awal:

- `confidence_percent` optional,
- multiple TP optional,
- source/broker optional,
- UI hanya menampilkan field yang tersedia.

### 77. Search Shortcut / Command Hint

Mock search menampilkan hint seperti `⌘ K`.

Spec perlu menentukan apakah keyboard shortcut ada.

Rekomendasi:

- bisa future phase,
- jika dibuat, Windows juga perlu support `Ctrl+K`,
- jangan tampilkan hint jika shortcut belum diimplementasikan.

### 78. Right Rail Freshness dan Connection State

Mock menampilkan:

```txt
Data delay 15m
Connected
Lihat semua
```

Spec perlu menentukan:

- data live, delayed, demo, atau fallback,
- timestamp update terakhir,
- connected/error state,
- `Lihat semua` menuju halaman mana,
- apa yang tampil jika upstream gagal.

Rekomendasi:

- setiap panel market/right rail punya freshness label,
- jika data demo/fallback, label harus jelas,
- jangan tampilkan angka market palsu sebagai live.

### 79. High Impact Countdown

Mock menampilkan event kalender dengan countdown:

```txt
02:14:32 lagi
```

Spec perlu menentukan:

- timezone Asia/Jakarta,
- update interval countdown,
- format ketika event sudah lewat,
- fallback ketika kalender API gagal,
- apakah event impact medium/high saja.

Rekomendasi awal:

- High Impact menggunakan Asia/Jakarta,
- countdown update client-side,
- tampilkan high impact lebih dulu,
- fallback empty state jika API gagal.

### 80. Icon Vocabulary

Mock memakai line icons yang compact dan trading-style.

Spec UI perlu menyatakan:

- gunakan icon line style konsisten,
- active icon memakai emerald,
- hindari emoji di production UI,
- icon action punya label/tooltip/aria label.

### 81. Visual Density dan Layout Dimensions

Mock memiliki ukuran layout spesifik:

```txt
left rail sekitar 230px
center timeline sekitar 680px
right rail sekitar 360px
```

Spec perlu menyimpan target ini agar implementasi tidak berubah menjadi dashboard terlalu longgar.

Rekomendasi:

- desktop menggunakan 3 column layout,
- center timeline menjadi fokus,
- right rail hilang di tablet/mobile,
- left rail berubah menjadi compact/mobile nav di layar kecil.

### 82. Design Tokens Dari Mock

Mock memakai dark green terminal identity.

Token yang perlu ditetapkan di spec:

```txt
background: deep green-black
surface: graphite green
border: green-tinted border
accent: Hertz emerald
muted text: green-gray
danger/down: red
warning: amber
success/up: emerald
```

Spec harus menjelaskan hover, active, focus, disabled, pending, dan error states.

## Keputusan User Setelah Tanya Jawab

Bagian ini mencatat keputusan produk yang sudah dijawab user dan harus menjadi dasar spec teknis.

### 83. Publishing Rule Web vs Telegram

Keputusan:

- post dari web oleh verified member boleh langsung `published`,
- post dari Telegram tetap mengikuti alur lama,
- post Telegram dari member tetap harus admin `/publish`,
- admin `/publish` tetap menjadi mekanisme approval Telegram.

Implikasi:

- web post membuat `articles` dan `feed_posts` langsung published,
- web post langsung mendapat credit sesuai aturan kategori,
- Telegram post member tetap draft/pending sampai admin publish,
- saat admin `/publish`, sistem mengaktifkan artikel/feed_post dan memberi credit.

### 84. Repost dan Quote Repost Publishing

Keputusan:

- repost biasa langsung tampil,
- quote repost langsung tampil,
- quote repost tidak perlu pending review.

Implikasi:

- repost/quote repost mengikuti pola social media umum,
- moderation dilakukan lewat report/hide/delete setelah publish,
- quote repost tetap harus dicatat dan bisa dimoderasi admin.

### 85. Member Label dan Badge

Keputusan:

- tidak ada konsep `Pro Member`,
- semua member grup yang verified mendapat label/badge verified member,
- admin mendapat badge admin.

Implikasi UI:

- sidebar user menampilkan `Verified Member`,
- post author member menampilkan verified badge,
- post author admin menampilkan admin badge,
- jangan memakai label `Pro Member` pada implementasi awal.

### 86. Signal Spine dan Chart/Image Interpretation

Keputusan:

- chart pada mock dipahami sebagai image upload dari grup/post, bukan chart murni dari tools,
- fokus saat ini adalah UI model social media,
- chart dari tools/API market bukan fokus phase ini.

Implikasi:

- media inline feed berasal dari upload Telegram/web,
- jangan membangun chart engine khusus untuk post feed,
- signal spine cukup menjadi elemen visual/indikator kategori/source pada phase awal,
- tools chart bisa menjadi phase terpisah nanti.

### 87. Composer Pair dan Risk

Keputusan:

- field `Pair` dan `Risk` hanya untuk Trading Room,
- untuk kategori lain field ini tidak wajib.

Implikasi:

- composer perlu category-aware,
- jika user memilih `Trading Room`, tampilkan Pair/Risk sebagai metadata input,
- Pair/Risk bisa tidak muncul untuk `Life & Coffee` dan `General`,
- validasi Pair/Risk mengikuti kategori.

### 88. Telegram Metadata dan Bot Refactor

Keputusan:

- post Telegram harus disesuaikan dengan refactor baru,
- bot ikut diperbarui,
- metadata mengikuti hashtag/flow yang ada sekarang,
- tidak hanya kosong/manual admin.

Implikasi:

- bot handler perlu membuat/menghubungkan data Signal Ledger,
- hashtag lama tetap didukung,
- bot dapat mengisi category/source/media sesuai struktur baru,
- Pair/Risk dari Telegram perlu dirancang berdasarkan teks/format baru atau tetap optional jika tidak ditemukan.

### 89. Community Notes

Keputusan:

- member boleh membuat community note langsung,
- community note tidak perlu admin approve pada phase ini,
- source URL wajib untuk setiap community note.

Implikasi:

- community note langsung tampil setelah dibuat verified member,
- admin tetap harus bisa hide/delete jika note bermasalah,
- rating note tetap verified member,
- create community note harus menyertakan minimal satu source URL valid.

### 90. Baca Lanjut / Long Post Behavior

Keputusan:

- perilaku mengikuti X/Twitter,
- post pendek bisa dibaca langsung di feed,
- post panjang harus diklik dulu untuk dibaca penuh.

Implikasi:

- feed menampilkan excerpt/truncated text,
- `Baca lanjut` atau equivalent membuka post detail,
- tidak perlu expand inline pada phase awal kecuali diputuskan lagi,
- truncation harus aman untuk HTML/plain text.

### 91. Post Detail Route

Keputusan:

- Signal Ledger memakai route baru `/post/[id]`,
- tidak memakai `/artikel/[slug]` sebagai tujuan utama feed.

Implikasi:

- perlu membuat post detail route,
- `/artikel/[slug]` tetap dijaga untuk backward compatibility/SEO lama,
- post feed klik ke `/post/[id]`,
- canonical strategy perlu diputuskan agar tidak duplikat SEO.

### 92. Guest Action Behavior

Keputusan:

- guest benar-benar read-only,
- action button tetap dimunculkan,
- saat guest klik action, tampilkan login prompt.

Implikasi:

- action bar tetap terlihat untuk guest,
- Signal/comment/repost/bookmark/rating membuka prompt login,
- backend tetap wajib menolak mutasi guest,
- UI tidak boleh hanya mengandalkan disabled client-side.

### 93. Right Rail Market Pulse

Keputusan:

- Market Pulse sementara boleh mock/fallback,
- nanti akan dibuat API/endpoint sumber data sendiri.

Implikasi:

- data mock/fallback harus diberi label jelas jika bukan live,
- jangan mengklaim live data saat belum ada endpoint,
- struktur komponen/API sebaiknya siap diganti ke live source nanti.

### 94. Telegram Sync Module Visibility

Keputusan:

- module/count `draft menunggu review` hanya untuk admin.

Implikasi:

- member biasa tidak melihat count global draft review,
- admin melihat pending Telegram review count,
- klik module admin menuju review queue/admin moderation.

### 95. Old Likes Fingerprint

Keputusan:

- old likes fingerprint dirombak sesuai sistem baru,
- Signal baru mengikuti model user/member verified.

Implikasi:

- jangan mempertahankan fingerprint like lama sebagai Signal utama,
- migration/compatibility harus jelas apakah old likes diabaikan atau dikonversi hanya jika memungkinkan,
- sistem baru berbasis user_id.

### 96. Credit Untuk Web Post

Keputusan:

- web post member mendapat credit langsung setelah publish,
- karena web post langsung publish, credit diberikan saat create/publish berhasil.

Implikasi:

- create web post harus menjalankan credit award dalam transaction,
- credit mengikuti category/credit_settings,
- repost/quote repost tetap tidak otomatis mendapat credit kecuali diputuskan nanti,
- perlu guard agar credit tidak double-award.

## Keputusan Final Tambahan Sebelum Spec

Bagian ini mengunci keputusan kecil yang sebelumnya masih berupa rekomendasi, supaya spec teknis berikutnya tidak membuka ulang hal yang sudah diputuskan.

### 97. Community Note Source Wajib

Keputusan:

- setiap community note wajib memiliki source,
- source URL tidak optional.

Implikasi:

- form community note wajib meminta minimal satu source URL,
- API harus memvalidasi minimal satu source valid sebelum note dibuat,
- table `community_note_sources` menjadi bagian wajib dari transaksi create note,
- UI feed/detail dapat menampilkan ringkasan source atau jumlah source.

### 98. Jumlah Community Note Per Post

Keputusan:

- mengikuti rekomendasi: banyak community note boleh disimpan,
- feed menampilkan satu note utama, misalnya latest/top note,
- detail post bisa menampilkan daftar note yang relevan.

Implikasi:

- data model tidak boleh hanya menyimpan satu note per post,
- perlu aturan pemilihan note utama untuk feed,
- rating/helpfulness bisa dipakai nanti untuk menentukan top note.

### 99. Edit/Delete Community Note

Keputusan:

- mengikuti rekomendasi: creator boleh delete note miliknya,
- edit note dibatasi sekitar 10 menit atau sebelum ada rating,
- admin bisa hide/delete kapan saja.

Implikasi:

- perlu `deleted_at`, `hidden_at`, atau status moderasi,
- perlu audit log untuk aksi admin,
- note yang sudah memiliki rating tidak diedit diam-diam agar trust tetap terjaga.

### 100. Delete Post Oleh Author

Keputusan:

- mengikuti rekomendasi: author boleh soft delete post miliknya.

Implikasi:

- delete tidak menghapus permanen data utama,
- `deleted_at` wajib dipakai untuk feed_posts,
- comment/repost/note terkait harus punya tampilan state `post unavailable` atau disembunyikan sesuai konteks,
- admin tetap dapat melihat jejak untuk audit.

### 101. Edit Post Setelah Publish

Keputusan:

- mengikuti rekomendasi: edit post hanya boleh sekitar 15 menit setelah publish,
- setelah lewat batas waktu, koreksi dilakukan lewat reply/comment atau edit admin.

Implikasi:

- perlu field timestamp edit, misalnya `edited_at`,
- UI menampilkan label edited jika post berubah,
- API harus menolak edit author setelah window berakhir,
- admin edit perlu tercatat di audit log.

### 102. Edit/Delete Comment

Keputusan:

- comment bisa diedit dan bisa dihapus.

Implikasi:

- comment butuh `edited_at` dan `deleted_at`,
- edit comment tetap harus dibatasi author/admin,
- deleted comment sebaiknya soft delete,
- UI bisa menampilkan state ringkas seperti komentar dihapus jika thread membutuhkan konteks.

### 103. Repost Post Sendiri

Keputusan:

- mengikuti rekomendasi: repost biasa ke post sendiri tidak perlu diizinkan.

Implikasi:

- API repost harus menolak `author_id == current_user_id` untuk repost biasa,
- mengurangi noise dan count buatan sendiri.

### 104. Quote Repost Post Sendiri

Keputusan:

- mengikuti rekomendasi: quote repost post sendiri boleh untuk update/konteks tambahan.

Implikasi:

- quote repost diperlakukan sebagai post baru,
- original post ditampilkan sebagai quoted card,
- credit tidak otomatis diberikan untuk quote repost kecuali diputuskan berbeda di masa depan.

### 105. Signal Toggle

Keputusan:

- mengikuti rekomendasi: Signal bisa toggle.

Implikasi:

- klik pertama membuat Signal,
- klik berikutnya menghapus/menonaktifkan Signal,
- perlu unique constraint per `post_id + user_id + reaction_type`,
- guest tetap melihat tombol tetapi diarahkan ke login prompt.

### 106. Bookmark Private

Keputusan:

- bookmark bersifat private.

Implikasi:

- count bookmark tidak harus ditampilkan publik,
- daftar bookmark hanya milik user terkait,
- admin tidak memakai bookmark sebagai sinyal publik kecuali untuk agregasi internal yang tidak menampilkan identitas.

### 107. Views

Keputusan:

- mengikuti rekomendasi: guest view ikut dihitung,
- dedupe dilakukan berbasis session/IP-ish agar tidak terlalu mudah inflate,
- count agregat boleh tampil publik.

Implikasi:

- `post_views` perlu menyimpan hash/session key, bukan data sensitif mentah,
- perlu aturan window dedupe, misalnya per post per session dalam periode tertentu,
- view count harus diupdate efisien agar feed tidak berat.

### 108. Admin Telegram Auto Publish

Keputusan:

- mengikuti rekomendasi: post Telegram dari admin boleh auto publish.

Implikasi:

- bot tetap membedakan admin dan member biasa,
- member Telegram tetap masuk draft dan butuh `/publish`,
- admin Telegram yang valid bisa langsung membuat feed post published,
- semua aksi tetap masuk activity log.

### 109. Credit Categories

Keputusan:

- mengikuti rekomendasi: credit hanya untuk kategori utama,
- kategori awal: trading, life_story, dan general,
- repost, quote repost, dan community note tidak mendapat credit otomatis.

Implikasi:

- credit award dipanggil hanya pada create/publish post original,
- perlu guard idempotency agar publish Telegram tidak double-credit,
- category mapping dari hashtag Telegram harus jelas.

### 110. Pair/Risk Untuk Trading Room

Keputusan:

- mengikuti rekomendasi: Pair dan Risk hanya berlaku untuk Trading Room,
- field ini optional.

Implikasi:

- composer menampilkan Pair/Risk hanya saat category Trading Room,
- bot dapat mengisi dari hashtag/metadata jika tersedia,
- post trading tetap boleh text-only tanpa pair/risk.

### 111. Media Requirement Trading Room

Keputusan:

- mengikuti rekomendasi: Trading Room boleh text-only.

Implikasi:

- chart/image bukan syarat wajib,
- UI tetap memberi affordance upload chart,
- validasi backend tidak boleh mewajibkan media untuk kategori trading.

### 112. Max Media Per Post

Keputusan:

- mengikuti rekomendasi: maksimal 4 media per post.

Implikasi:

- web composer dan bot ingestion harus membatasi media,
- feed memakai grid media seperti social timeline,
- perlu pesan error yang jelas saat melebihi batas.

### 113. Video Release Awal

Keputusan:

- mengikuti rekomendasi: release awal web fokus image,
- video Telegram hanya dipertahankan jika alur existing memang sudah mendukung tanpa refactor besar.

Implikasi:

- scope implementasi awal tidak perlu membangun video pipeline baru,
- spec harus memisahkan image support wajib dan video support opsional/compatibility,
- UI tetap disiapkan agar media type bisa diperluas.

### 114. Post Detail

Keputusan:

- mengikuti rekomendasi: `/post/[id]` menampilkan post lengkap, comments, dan community note.

Implikasi:

- detail route adalah sumber baca lengkap untuk long post,
- feed cukup menampilkan excerpt,
- comments dan note tidak bergantung pada route artikel lama.

### 115. Artikel Lama

Keputusan:

- artikel lama belum production dan belum dipakai, hanya testing.

Implikasi:

- migration dari artikel lama tidak menjadi blocker utama,
- backward compatibility tetap boleh dijaga secara ringan,
- prioritas spec adalah Signal Ledger baru, bukan mempertahankan data testing lama.

### 116. Blog Dan Outlook Tetap Terpisah

Keputusan:

- Blog dan Outlook jangan masuk ke Signal Ledger,
- keduanya adalah sistem terpisah.

Implikasi:

- timeline utama tidak mencampur Blog/Outlook,
- route dan schema Signal Ledger berdiri sendiri,
- integrasi lintas sistem hanya dilakukan jika nanti diputuskan sebagai fitur baru.

### 117. Label Market Pulse Mock

Keputusan:

- Market Pulse fallback/mock diberi label jelas.

Implikasi:

- UI harus menampilkan label seperti `Data sementara`,
- jangan ada klaim live market data sebelum endpoint tersedia,
- komponen tetap disiapkan agar nanti mudah diganti data live.

### 118. Admin Moderation Page

Keputusan:

- mengikuti rekomendasi: phase awal cukup minimal review queue/admin moderation.

Implikasi:

- admin perlu melihat draft Telegram pending,
- admin bisa publish/hide/delete seperlunya,
- fitur moderation lanjutan seperti report center penuh bisa menyusul.

### 119. Pesan Login Non-Member

Keputusan:

- mengikuti rekomendasi: non-member diberi pesan jelas saat login gagal membership.

Copy awal:

`Akun Telegram Anda belum terdaftar sebagai member grup Hertz.`

Implikasi:

- jangan menyebut detail token/API,
- UI perlu memberi arah singkat bahwa user harus bergabung/terverifikasi di grup Hertz,
- backend tetap mengembalikan error code yang konsisten.

### 120. Ban/Mute

Keputusan:

- mengikuti rekomendasi: schema siap untuk ban/mute,
- release awal cukup hide/delete content dan moderation dasar.

Implikasi:

- `users` atau table moderation bisa punya field status untuk masa depan,
- implementasi awal tidak perlu UI ban/mute lengkap,
- admin action tetap dicatat agar siap diperluas.

### 121. Feature Flag

Keputusan:

- mengikuti rekomendasi: gunakan feature flag `SIGNAL_LEDGER_ENABLED`.

Implikasi:

- rollout bisa dikontrol lewat env,
- route/component baru bisa disiapkan tanpa memaksa cutover langsung,
- audit review bisa membandingkan old feed dan Signal Ledger sebelum final switch.

## Rekomendasi Awal

Rekomendasi awal sudah dipersempit menjadi keputusan spec berikut:

- Telegram member post tetap mengikuti rule lama: member draft, admin publish.
- Telegram admin post boleh auto publish.
- Web post verified member langsung publish.
- Signal bisa toggle.
- Repost bisa toggle/delete oleh pembuat.
- Quote repost menjadi post baru dan langsung tampil.
- Community note dibuat langsung oleh verified member, tetapi source wajib.
- Rating note hanya verified member.
- Guest read-only, action tetap terlihat dan memunculkan login prompt.
- Artikel lama belum production dan tidak menjadi blocker migration utama.

## Tahapan Kerja Yang Disepakati

1. Diskusi
2. Membuat spec lengkap
3. Implementasi
4. Audit review memastikan hasil sesuai spec

Dokumen ini adalah hasil diskusi awal. Dokumen berikutnya harus berupa spec teknis yang lebih tegas, lengkap dengan migration, API contract, component contract, dan acceptance criteria.
