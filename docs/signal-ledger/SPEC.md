# Signal Ledger Technical Specification

Tanggal: 2026-05-08
Status: Draft implementasi
Acuan diskusi: `docs/signal-ledger/DISCUSSION.md`
Acuan visual: `docs/signal-ledger/signal-ledger-mock-03.png`

## 1. Ringkasan

Signal Ledger adalah refactor feed Horizon dari model artikel/blog-card menjadi timeline sosial komunitas trading. Refactor ini bukan hanya perubahan UI. Sistem baru harus membangun domain feed yang mendukung post dari Telegram dan web, interaksi member, repost, quote repost, bookmark, community notes, view insight, dan metadata trading.

Keputusan utama:

- Signal Ledger mengambil pola timeline X/Twitter, tetapi tidak menjadi clone 100%.
- Identitas Horizon tetap hijau/emerald, trading-community, dan Telegram-first.
- Guest hanya read-only.
- Write action hanya untuk user login Telegram yang terverifikasi sebagai member grup Horizon.
- Post dari web oleh verified member langsung published.
- Post dari Telegram member tetap mengikuti flow lama: draft/pending sampai admin `/publish`.
- Post dari Telegram admin boleh auto publish.
- Repost dan quote repost langsung tampil.
- Community note langsung tampil untuk verified member, tetapi wajib minimal satu source URL.
- Blog dan Outlook tetap sistem terpisah, tidak masuk Signal Ledger.
- Artikel lama belum production dan tidak menjadi blocker migration utama.

## 2. Scope

### 2.1 In Scope Phase Awal

- Feed utama baru bernama Signal Ledger.
- Route detail baru `/post/[id]`.
- Composer web untuk verified Telegram member.
- Integrasi Telegram bot ke domain Signal Ledger.
- Repost biasa.
- Quote repost.
- Signal sebagai pengganti like baru.
- Bookmark private.
- Comment untuk post Signal Ledger.
- Community note dengan source wajib dan rating.
- View/Insight count dengan dedupe ringan.
- Admin moderation minimal untuk draft Telegram, hide/delete post, hide/delete comment, hide/delete note.
- Membership verification Telegram group.
- Feature flag `SIGNAL_LEDGER_ENABLED`.
- Right rail Market Pulse mock/fallback dengan label `Data sementara`.
- UI mengikuti mock 03 sebagai acuan utama.

### 2.2 Out Of Scope Phase Awal

- Chart engine trading baru untuk post feed.
- Live market data endpoint permanen.
- Notification center penuh.
- Follow system.
- DM.
- Full report center kompleks.
- Video pipeline baru dari web.
- Migrasi besar untuk artikel testing lama.
- Memasukkan Blog atau Outlook ke timeline Signal Ledger.

Catatan: schema boleh disiapkan agar fitur phase lanjut tidak menabrak desain awal, tetapi UI tidak boleh menampilkan fitur palsu yang belum bekerja.

## 3. Source Of Truth Teknis

- Source of truth schema adalah `db/migrations`.
- Migration baru harus dibuat sebagai `db/migrations/008_create_signal_ledger.sql`.
- `prisma/schema.prisma` tidak menjadi sumber utama untuk implementasi ini.
- Next.js yang dipakai adalah versi baru dengan breaking changes; sebelum mengubah route/app code, baca guide relevan di `node_modules/next/dist/docs/`.
- Kode harus mengikuti pola repo sekarang:
  - API route tipis di `frontend/src/app/api`.
  - Business logic di `shared/services`.
  - Query database di `shared/repositories`.
  - Type contract di `shared/types`.
  - UI component di `frontend/src/components/feed`.

## 4. Roles Dan Permission

### 4.1 Guest

Guest adalah user tanpa member session.

Boleh:

- melihat feed,
- membuka `/post/[id]`,
- melihat media,
- melihat comment,
- melihat community notes,
- melihat Signal/repost/comment/view counts,
- klik action button yang kemudian membuka login prompt.

Tidak boleh:

- membuat post,
- comment,
- Signal,
- repost,
- quote repost,
- bookmark,
- membuat community note,
- rating community note,
- report.

Backend harus menolak semua mutasi guest dengan `401 UNAUTHENTICATED`.

### 4.2 Verified Member

Verified member adalah user yang:

- berhasil validasi Telegram Login signature,
- membership check ke grup Horizon return `{"isMember": true}`,
- memiliki session member aktif.

Boleh:

- membuat web post langsung published,
- membuat post dari Telegram sesuai flow bot,
- comment,
- edit/delete comment milik sendiri,
- Signal toggle,
- repost,
- quote repost,
- bookmark private,
- membuat community note dengan source URL,
- rating community note,
- delete post milik sendiri dengan soft delete,
- edit post milik sendiri dalam window 15 menit.

### 4.3 Admin

Admin adalah `users.role = 'admin'`.

Boleh:

- semua aksi verified member,
- publish/reject draft Telegram,
- hide/delete post apa pun,
- hide/delete comment,
- hide/delete community note,
- edit metadata post,
- melihat pending Telegram review count,
- melihat audit logs,
- melihat admin moderation minimal.

Admin badge berbeda dari verified badge.

## 5. Auth Dan Membership

### 5.1 Environment

Tambahkan env:

```env
SIGNAL_LEDGER_ENABLED=true
MEMBERSHIP_CHECK_URL=https://satpam.cloudnexify.com/api/membership/check
MEMBERSHIP_CHECK_TOKEN=
HORIZON_TELEGRAM_GROUP_ID=-1001916607651
TELEGRAM_BOT_TOKEN=
MEMBER_SESSION_SECRET=
```

Token membership harus server-side saja dan tidak boleh masuk frontend bundle.

Token yang pernah dibagikan di chat harus di-rotate sebelum production.

### 5.2 Telegram Login

Login member harus dua lapis:

1. Validasi Telegram Login Widget signature memakai bot token.
2. Cek membership grup Horizon lewat endpoint membership.

Request internal:

```http
POST /api/auth/telegram
Content-Type: application/json

{
  "id": 5963323428,
  "first_name": "Nama",
  "last_name": "Opsional",
  "username": "username",
  "photo_url": "https://...",
  "auth_date": 1710000000,
  "hash": "telegram_hash"
}
```

Jika membership false:

```json
{
  "error": {
    "code": "NOT_GROUP_MEMBER",
    "message": "Akun Telegram Anda belum terdaftar sebagai member grup Horizon."
  }
}
```

Jika success:

```json
{
  "user": {
    "id": "uuid",
    "telegramId": "5963323428",
    "username": "username",
    "role": "member",
    "badge": "verified_member"
  }
}
```

### 5.3 Membership Cache

Membership dicek:

- saat login,
- saat mutasi penting jika cache lebih lama dari 24 jam,
- saat session ditemukan tetapi status membership perlu revalidasi.

Jika endpoint membership gagal:

- login baru: fail closed, return `503 MEMBERSHIP_CHECK_UNAVAILABLE`,
- session existing: boleh tetap read-only sementara, tetapi mutasi yang butuh verified member harus fail closed jika revalidation gagal.

## 6. Data Model

Migration baru harus additive. Tidak boleh menghapus data lama.

### 6.1 Users Extension

Tambahkan kolom ke `users`:

```sql
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS display_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(1000),
  ADD COLUMN IF NOT EXISTS telegram_first_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS telegram_last_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS verified_member_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS muted_until TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS banned_at TIMESTAMP WITH TIME ZONE;
```

Aturan:

- Semua member grup yang verified mendapat badge `Verified Member`.
- Admin mendapat badge `Admin`.
- `banned_at` dan `muted_until` disiapkan untuk masa depan; phase awal cukup hide/delete content.

### 6.2 member_sessions

Session member tidak boleh dicampur dengan `admin_sessions`.

```sql
CREATE TABLE member_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_member_sessions_token_hash ON member_sessions(token_hash);
CREATE INDEX idx_member_sessions_expires_at ON member_sessions(expires_at);
```

Cookie:

- name: `horizon_member_session`
- httpOnly: true
- sameSite: lax
- secure: true di production

### 6.3 telegram_memberships

```sql
CREATE TABLE telegram_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  telegram_id BIGINT NOT NULL,
  group_id BIGINT NOT NULL,
  is_member BOOLEAN NOT NULL DEFAULT false,
  checked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  last_verified_at TIMESTAMP WITH TIME ZONE,
  raw_response JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(telegram_id, group_id)
);

CREATE INDEX idx_telegram_memberships_user_id ON telegram_memberships(user_id);
CREATE INDEX idx_telegram_memberships_status ON telegram_memberships(is_member, last_verified_at);
```

### 6.4 feed_posts

`feed_posts` adalah domain timeline. Untuk original/quote, konten utama tetap disimpan di `articles` agar alur lama dan credit tetap kompatibel. Untuk repost biasa, `article_id` boleh null.

```sql
CREATE TABLE feed_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID REFERENCES articles(id) ON DELETE SET NULL,
  author_id UUID NOT NULL REFERENCES users(id),
  post_type VARCHAR(20) NOT NULL DEFAULT 'original',
  source VARCHAR(30) NOT NULL,
  category VARCHAR(50) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'published',
  visibility VARCHAR(20) NOT NULL DEFAULT 'public',
  quoted_post_id UUID REFERENCES feed_posts(id) ON DELETE SET NULL,
  repost_id UUID,
  telegram_message_id BIGINT,
  telegram_chat_id BIGINT,
  pinned_at TIMESTAMP WITH TIME ZONE,
  edited_at TIMESTAMP WITH TIME ZONE,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CHECK (post_type IN ('original', 'quote', 'repost')),
  CHECK (source IN ('telegram', 'web', 'admin', 'system')),
  CHECK (status IN ('draft', 'pending_review', 'published', 'hidden', 'rejected', 'deleted')),
  CHECK (visibility IN ('public'))
);

CREATE INDEX idx_feed_posts_status_created ON feed_posts(status, created_at DESC);
CREATE INDEX idx_feed_posts_author ON feed_posts(author_id, created_at DESC);
CREATE INDEX idx_feed_posts_category_created ON feed_posts(category, created_at DESC);
CREATE INDEX idx_feed_posts_article_id ON feed_posts(article_id);
CREATE INDEX idx_feed_posts_quoted_post_id ON feed_posts(quoted_post_id);
CREATE INDEX idx_feed_posts_telegram_message ON feed_posts(telegram_chat_id, telegram_message_id);
```

Kategori phase awal:

- `trading`
- `life_story`
- `general`

Blog dan Outlook tidak masuk kategori Signal Ledger.

Status rule:

- web member: `published`
- web admin: `published`
- Telegram member: `pending_review`
- Telegram admin: `published`
- repost/quote repost: `published`
- soft delete: set `deleted_at`, status `deleted`
- admin hide: status `hidden`

### 6.5 post_market_context

Metadata trading hanya untuk Trading Room dan optional.

```sql
CREATE TABLE post_market_context (
  post_id UUID PRIMARY KEY REFERENCES feed_posts(id) ON DELETE CASCADE,
  pair VARCHAR(30),
  timeframe VARCHAR(30),
  risk_percent NUMERIC(8, 4),
  direction VARCHAR(20),
  entry_price NUMERIC(20, 8),
  entry_zone VARCHAR(120),
  stop_loss NUMERIC(20, 8),
  take_profit NUMERIC(20, 8),
  take_profit_1 NUMERIC(20, 8),
  take_profit_2 NUMERIC(20, 8),
  take_profit_3 NUMERIC(20, 8),
  setup_type VARCHAR(80),
  confidence_percent NUMERIC(5, 2),
  broker_or_source VARCHAR(120),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

Rules:

- Pair dan Risk hanya muncul di composer jika category `trading`.
- Field metadata tidak wajib.
- Telegram bot mengisi dari hashtag/format jika tersedia, jika tidak kosong.
- Chart di mock adalah media image upload, bukan chart engine.

### 6.6 post_reactions

Signal menggantikan like fingerprint lama.

```sql
CREATE TABLE post_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES feed_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reaction_type VARCHAR(30) NOT NULL DEFAULT 'signal',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE UNIQUE INDEX uniq_active_post_signal
  ON post_reactions(post_id, user_id, reaction_type)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_post_reactions_post_id ON post_reactions(post_id);
CREATE INDEX idx_post_reactions_user_id ON post_reactions(user_id);
```

Rules:

- klik pertama membuat Signal,
- klik berikutnya soft-delete Signal,
- guest harus login prompt,
- old `likes` fingerprint tidak menjadi sumber utama Signal baru.

### 6.7 post_bookmarks

```sql
CREATE TABLE post_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES feed_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE UNIQUE INDEX uniq_active_post_bookmark
  ON post_bookmarks(post_id, user_id)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_post_bookmarks_user_id ON post_bookmarks(user_id, created_at DESC);
```

Bookmark private. Count tidak perlu ditampilkan publik.

### 6.8 post_reposts

```sql
CREATE TABLE post_reposts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_post_id UUID NOT NULL REFERENCES feed_posts(id) ON DELETE CASCADE,
  repost_post_id UUID REFERENCES feed_posts(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  repost_type VARCHAR(20) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,
  CHECK (repost_type IN ('repost', 'quote'))
);

CREATE UNIQUE INDEX uniq_active_plain_repost
  ON post_reposts(original_post_id, user_id, repost_type)
  WHERE deleted_at IS NULL AND repost_type = 'repost';

CREATE INDEX idx_post_reposts_original ON post_reposts(original_post_id);
CREATE INDEX idx_post_reposts_user ON post_reposts(user_id, created_at DESC);
```

Rules:

- repost biasa ke post sendiri ditolak,
- quote repost ke post sendiri boleh,
- repost biasa bisa dibatalkan oleh pembuat,
- quote repost membuat post baru dengan `post_type = 'quote'`,
- repost dan quote langsung published,
- repost/quote tidak mendapat credit otomatis.

### 6.9 post_views

```sql
CREATE TABLE post_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES feed_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  session_hash VARCHAR(255),
  ip_hash VARCHAR(255),
  user_agent_hash VARCHAR(255),
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_post_views_post_id_viewed ON post_views(post_id, viewed_at DESC);
CREATE INDEX idx_post_views_session ON post_views(post_id, session_hash, viewed_at DESC);
```

Rules:

- guest view dihitung,
- dedupe per session/user/IP-ish dalam window tertentu, default 6 jam,
- jangan simpan IP mentah,
- Insight phase awal berarti view count agregat.

### 6.10 post_comments

Signal Ledger memakai table comment baru agar tidak membawa anonymous legacy comment.

```sql
CREATE TABLE post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES feed_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES post_comments(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'visible',
  edited_at TIMESTAMP WITH TIME ZONE,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CHECK (status IN ('visible', 'hidden', 'deleted'))
);

CREATE INDEX idx_post_comments_post_id_created ON post_comments(post_id, created_at ASC);
CREATE INDEX idx_post_comments_user_id ON post_comments(user_id);
```

Rules:

- guest tidak boleh comment,
- comment bisa edit dan delete oleh owner,
- delete memakai soft delete,
- admin bisa hide/delete,
- phase awal boleh 1 level reply atau flat; jika reply belum dibangun UI, tetap simpan `parent_comment_id` untuk masa depan.

### 6.11 community_notes

```sql
CREATE TABLE community_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES feed_posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'published',
  helpful_count INTEGER NOT NULL DEFAULT 0,
  not_helpful_count INTEGER NOT NULL DEFAULT 0,
  edited_at TIMESTAMP WITH TIME ZONE,
  hidden_at TIMESTAMP WITH TIME ZONE,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CHECK (status IN ('published', 'hidden', 'deleted'))
);

CREATE INDEX idx_community_notes_post_id ON community_notes(post_id, created_at DESC);
CREATE INDEX idx_community_notes_status ON community_notes(status);
```

Rules:

- verified member boleh membuat note langsung published,
- source URL wajib,
- banyak note boleh disimpan per post,
- feed menampilkan satu note utama: note published dengan helpful score tertinggi, fallback terbaru,
- detail post menampilkan daftar note published,
- creator boleh delete note sendiri,
- edit note dibatasi 10 menit atau sebelum ada rating,
- admin bisa hide/delete kapan saja.

### 6.12 community_note_sources

```sql
CREATE TABLE community_note_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID NOT NULL REFERENCES community_notes(id) ON DELETE CASCADE,
  source_url VARCHAR(1500) NOT NULL,
  source_title VARCHAR(500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_community_note_sources_note_id ON community_note_sources(note_id);
```

Validasi:

- minimal satu source URL,
- URL harus `http` atau `https`,
- panjang maksimal 1500,
- source title optional.

### 6.13 community_note_ratings

```sql
CREATE TABLE community_note_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID NOT NULL REFERENCES community_notes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating VARCHAR(20) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CHECK (rating IN ('helpful', 'not_helpful')),
  UNIQUE(note_id, user_id)
);

CREATE INDEX idx_community_note_ratings_note_id ON community_note_ratings(note_id);
```

### 6.14 post_reports

Report minimal disiapkan, tetapi UI report penuh boleh phase lanjut. Jika action menu report dibuat phase awal, endpoint harus benar-benar bekerja.

```sql
CREATE TABLE post_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES feed_posts(id) ON DELETE CASCADE,
  reporter_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason VARCHAR(50) NOT NULL,
  details TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'open',
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CHECK (reason IN ('spam', 'misleading', 'abusive', 'off_topic', 'other')),
  CHECK (status IN ('open', 'reviewing', 'resolved', 'rejected'))
);

CREATE INDEX idx_post_reports_status_created ON post_reports(status, created_at DESC);
CREATE UNIQUE INDEX uniq_post_report_user_open
  ON post_reports(post_id, reporter_user_id)
  WHERE status IN ('open', 'reviewing');
```

## 7. Content Lifecycle

### 7.1 Web Post

```txt
verified member
  -> POST /api/feed
  -> create articles row
  -> attach media if any
  -> create feed_posts row status published source web
  -> create post_market_context if category trading and fields provided
  -> award credit in same transaction
  -> activity log
  -> return post
```

Rules:

- Web post langsung published.
- Credit langsung diberikan setelah create/publish berhasil.
- Credit hanya untuk post original category `trading`, `life_story`, `general`.
- Repost/quote/community note tidak mendapat credit otomatis.
- Max 4 media.
- Image wajib didukung; video web tidak wajib phase awal.

### 7.2 Telegram Member Post

```txt
Telegram hashtag post by member
  -> bot hashtag handler
  -> create/update users
  -> create articles row status draft/pending
  -> upload media if any
  -> create feed_posts row status pending_review source telegram
  -> admin /publish
  -> set article/feed_post published
  -> award credit once
  -> activity log
```

Rules:

- Flow lama tetap dipertahankan.
- Member Telegram tidak langsung publish.
- Bot perlu menyimpan mapping Telegram message ke article/feed_post agar `/publish` idempotent.
- Hashtag lama tetap didukung:
  - `#trading` -> `trading`
  - `#cerita` -> `life_story`
  - `#general` -> `general`

### 7.3 Telegram Admin Post

```txt
Telegram hashtag post by admin
  -> bot handler
  -> create article/feed_post published
  -> award credit once if eligible
  -> activity log
```

### 7.4 Long Post

Feed menampilkan excerpt 4 sampai 6 baris. `Baca lanjut` membuka `/post/[id]`. Tidak perlu expand inline phase awal.

Truncation harus memakai plain text excerpt atau renderer yang aman, bukan memotong raw HTML secara sembarang.

## 8. API Contract

Semua response error memakai format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Pesan singkat"
  }
}
```

### 8.1 Auth

```txt
POST /api/auth/telegram
GET  /api/auth/me
POST /api/auth/logout
```

`GET /api/auth/me` response:

```json
{
  "user": {
    "id": "uuid",
    "username": "ardani",
    "displayName": "Ardani",
    "role": "member",
    "badge": "verified_member",
    "avatarUrl": "https://..."
  }
}
```

Guest:

```json
{ "user": null }
```

### 8.2 Feed

```txt
GET  /api/feed
POST /api/feed
GET  /api/feed/[postId]
PATCH /api/feed/[postId]
DELETE /api/feed/[postId]
POST /api/feed/[postId]/view
POST /api/feed/[postId]/signal
POST /api/feed/[postId]/bookmark
POST /api/feed/[postId]/repost
```

`GET /api/feed` query:

```txt
cursor?: string
limit?: number default 20 max 50
category?: trading | life_story | general
source?: telegram | web
```

Response:

```json
{
  "items": [
    {
      "id": "uuid",
      "type": "original",
      "source": "telegram",
      "category": "trading",
      "status": "published",
      "author": {
        "id": "uuid",
        "name": "Ardani",
        "username": "ardani",
        "badge": "verified_member",
        "avatarUrl": "https://..."
      },
      "content": {
        "html": "<p>...</p>",
        "text": "plain excerpt",
        "isTruncated": true
      },
      "media": [
        {
          "id": "uuid",
          "url": "https://...",
          "type": "image",
          "alt": null
        }
      ],
      "market": {
        "pair": "XAUUSD",
        "riskPercent": 1.0,
        "timeframe": "H1",
        "direction": "long"
      },
      "viewer": {
        "hasSignaled": false,
        "hasBookmarked": false,
        "canEdit": false,
        "canDelete": false
      },
      "counts": {
        "comments": 2,
        "signals": 12,
        "reposts": 4,
        "views": 1500
      },
      "primaryCommunityNote": {
        "id": "uuid",
        "content": "Catatan...",
        "sourceCount": 2,
        "viewerRating": null
      },
      "createdAt": "2026-05-08T15:00:00.000Z",
      "updatedAt": "2026-05-08T15:00:00.000Z"
    }
  ],
  "nextCursor": "opaque-cursor"
}
```

`POST /api/feed` request:

```json
{
  "category": "trading",
  "content": "Teks post",
  "mediaIds": ["uuid"],
  "market": {
    "pair": "XAUUSD",
    "riskPercent": 1,
    "timeframe": "H1",
    "direction": "long"
  }
}
```

Rules:

- Requires verified member.
- Content wajib.
- `mediaIds` maksimal 4.
- `market` hanya diproses untuk category `trading`.

`POST /api/feed/[postId]/repost` request:

```json
{
  "type": "repost"
}
```

Quote request:

```json
{
  "type": "quote",
  "content": "Tambahan konteks",
  "mediaIds": []
}
```

### 8.3 Comments

```txt
GET    /api/feed/[postId]/comments
POST   /api/feed/[postId]/comments
PATCH  /api/feed/comments/[commentId]
DELETE /api/feed/comments/[commentId]
```

Rules:

- Requires verified member for write.
- Owner bisa edit/delete.
- Admin bisa hide/delete.
- Comment edit harus sanitasi content.

### 8.4 Community Notes

```txt
GET    /api/feed/[postId]/community-notes
POST   /api/feed/[postId]/community-notes
PATCH  /api/feed/community-notes/[noteId]
DELETE /api/feed/community-notes/[noteId]
POST   /api/feed/community-notes/[noteId]/rating
```

Create request:

```json
{
  "content": "Konteks tambahan yang membantu pembaca.",
  "sources": [
    {
      "url": "https://example.com/source",
      "title": "Judul opsional"
    }
  ]
}
```

Rules:

- Requires verified member.
- `sources` minimal satu.
- Source URL wajib valid http/https.
- Note langsung published.
- Rating hanya `helpful` atau `not_helpful`.

### 8.5 Admin

```txt
GET  /api/admin/signal-ledger/pending
POST /api/admin/signal-ledger/posts/[postId]/publish
POST /api/admin/signal-ledger/posts/[postId]/reject
POST /api/admin/signal-ledger/posts/[postId]/hide
POST /api/admin/signal-ledger/posts/[postId]/restore
POST /api/admin/signal-ledger/comments/[commentId]/hide
POST /api/admin/signal-ledger/community-notes/[noteId]/hide
```

Minimal admin page:

```txt
frontend/src/app/admin/(dashboard)/signal-ledger/page.tsx
```

Menampilkan:

- pending Telegram drafts,
- hidden/deleted moderation controls,
- quick counts,
- link ke post detail,
- action publish/reject/hide/delete.

## 9. Service Dan Repository Structure

Target struktur:

```txt
shared/types/
  feed.ts
  membership.ts
  communityNote.ts

shared/repositories/
  feedRepository.ts
  memberSessionRepository.ts
  membershipRepository.ts
  postReactionRepository.ts
  postBookmarkRepository.ts
  postRepostRepository.ts
  postCommentRepository.ts
  communityNoteRepository.ts
  postViewRepository.ts

shared/services/
  feedService.ts
  memberAuthService.ts
  membershipService.ts
  postReactionService.ts
  postBookmarkService.ts
  postRepostService.ts
  postCommentService.ts
  communityNoteService.ts
  postViewService.ts
  signalLedgerAdminService.ts
```

Rules:

- API routes tidak boleh berisi SQL besar.
- Service memegang transaction dan business rule.
- Repository hanya query dan mapping row.
- Shared types menjadi kontrak frontend, bot, dan tests.
- Credit award harus lewat `shared/services/creditService.ts` existing.
- Activity log harus lewat `shared/services/activityLog.ts` existing.

## 10. Frontend UI Spec

### 10.1 Route

Jika `SIGNAL_LEDGER_ENABLED=true`:

- `/` menampilkan Signal Ledger.
- `/post/[id]` menampilkan post detail.

Jika flag false:

- `/` tetap dapat fallback ke feed lama.

### 10.2 Component Structure

```txt
frontend/src/components/feed/
  SignalLedgerPage.tsx
  SignalLedgerPage.module.css
  SignalLedgerHeader.tsx
  SignalComposer.tsx
  SignalComposer.module.css
  SignalPost.tsx
  SignalPost.module.css
  SignalPostMedia.tsx
  SignalActionBar.tsx
  SignalMarketMeta.tsx
  SignalAuthorLine.tsx
  CommunityNoteCard.tsx
  QuotePostCard.tsx
  SignalLeftRail.tsx
  SignalRightRail.tsx
  SignalLoginPrompt.tsx
  SignalEmptyState.tsx
  SignalSkeleton.tsx
```

### 10.3 Layout Desktop

Target dari mock 03:

- Left rail: sekitar 230px.
- Center timeline: sekitar 680px.
- Right rail: sekitar 360px.
- Background: deep green-black.
- Surface: graphite green.
- Border: green-tinted border.
- Accent: Horizon emerald.
- Danger/down: red.
- Warning: amber.
- Success/up: emerald.

Layout:

- 3 column desktop.
- Center timeline adalah fokus utama.
- Header sticky di center column.
- Composer di atas feed untuk verified member.
- Guest melihat composer read-only/login prompt compact, bukan form aktif.
- Right rail menampilkan Market Pulse mock/fallback dengan label `Data sementara`.
- Module Telegram Sync draft count hanya admin.

### 10.4 Mobile

- Left rail hidden.
- Right rail hidden.
- Center timeline full width.
- Header sticky.
- Composer compact.
- Action bar tidak overflow.
- Media grid responsive.
- Touch target minimal nyaman.

### 10.5 Post Card

Post card menampilkan:

- author avatar,
- display name,
- username,
- badge verified/admin,
- source label Telegram/Web,
- timestamp,
- category/source marker,
- content excerpt,
- `Baca lanjut` untuk long post,
- media grid,
- market meta jika ada,
- quote card jika quote repost,
- community note utama jika ada,
- action bar.

Action bar:

- comment,
- repost,
- Signal,
- Insight/views,
- bookmark,
- share.

Guest:

- action button tetap terlihat,
- klik action membuka `SignalLoginPrompt`.

### 10.6 Composer

Verified member:

- category segmented control: Trading Room, Life & Coffee, General.
- text input.
- media upload maksimal 4 image.
- Pair/Risk/Timeframe hanya tampil untuk Trading Room.
- submit langsung publish.

Guest:

- composer menampilkan login CTA.

Admin:

- composer sama seperti member, badge/admin context.

### 10.7 Accessibility

- Icon action harus punya `aria-label`.
- Focus ring memakai emerald yang terlihat.
- Text tidak boleh overlap.
- Button label tidak boleh pecah buruk di mobile.
- Jangan pakai emoji untuk icon production UI.
- Gunakan icon line style konsisten.

## 11. Telegram Bot Spec

File yang terdampak:

```txt
bot/src/handlers/hashtagHandler.ts
bot/src/handlers/publishHandler.ts
bot/src/middleware/autoRegister.ts
bot/src/utils/hashtag.ts
bot/src/services/mediaService.ts
shared/services/feedService.ts
```

### 11.1 Hashtag Mapping

```txt
#trading -> trading
#cerita  -> life_story
#general -> general
```

Bot harus:

- tetap membuat article seperti flow lama,
- membuat feed_post terkait,
- menyimpan media ke article/media,
- menyimpan `telegram_chat_id` dan `telegram_message_id`,
- menghindari double insert jika Telegram retry,
- mengisi market context jika metadata bisa diparse,
- tetap optional jika metadata tidak ditemukan.

### 11.2 Publish Command

`/publish` harus:

- mencari draft/pending article/feed_post,
- publish article,
- publish feed_post,
- award credit sekali,
- menulis activity log,
- idempotent jika dipanggil ulang.

## 12. Credit Rules

Credit diberikan untuk:

- original web post published,
- original Telegram post saat published,
- category `trading`,
- category `life_story`,
- category `general`.

Credit tidak diberikan untuk:

- repost biasa,
- quote repost,
- community note,
- comment,
- Signal,
- bookmark.

Transaction wajib memastikan:

- article dibuat,
- feed_post dibuat,
- media/market context tersimpan,
- credit transaction dibuat sekali,
- activity log dibuat.

Jika credit gagal, create/publish harus rollback agar tidak ada post tanpa credit saat seharusnya mendapat credit.

## 13. Moderation Dan Audit Log

Activity log action baru:

```txt
signal_ledger.post.created
signal_ledger.post.published
signal_ledger.post.rejected
signal_ledger.post.hidden
signal_ledger.post.deleted
signal_ledger.post.edited
signal_ledger.comment.created
signal_ledger.comment.edited
signal_ledger.comment.deleted
signal_ledger.comment.hidden
signal_ledger.signal.toggled
signal_ledger.bookmark.toggled
signal_ledger.repost.created
signal_ledger.repost.deleted
signal_ledger.community_note.created
signal_ledger.community_note.edited
signal_ledger.community_note.deleted
signal_ledger.community_note.hidden
signal_ledger.community_note.rated
signal_ledger.membership.checked
```

Admin moderation minimal:

- pending Telegram drafts,
- publish/reject,
- hide/delete post,
- hide/delete comment,
- hide/delete community note.

## 14. Rate Limit Dan Security

Server-side rate limit wajib untuk:

- web post create,
- comment create,
- Signal toggle,
- repost/quote,
- bookmark toggle,
- community note create,
- community note rating,
- media upload.

Minimum policy awal:

```txt
post create: 10 per hour per user
comment create: 30 per 10 minutes per user
signal toggle: 120 per 10 minutes per user
repost/quote: 30 per hour per user
community note create: 10 per day per user
media upload: max 4 per post
```

Security:

- HTML content harus sanitized.
- Source URL community note harus divalidasi.
- Telegram auth hash wajib diverifikasi.
- Membership token tidak boleh bocor ke client/log.
- Mutasi harus cek auth server-side.
- CSRF protection perlu diperhatikan untuk cookie session mutating endpoints.

## 15. Pagination Dan Counts

Feed memakai cursor pagination.

Cursor:

- opaque,
- berbasis `created_at` + `id`,
- stable untuk infinite scroll.

Counts:

- comments/signals/reposts/views dihitung agregat di query atau materialized ringan jika performa butuh.
- Untuk phase awal, query agregat dengan index cukup boleh.
- Bookmark count tidak publik.
- Community note primary dipilih berdasarkan score:

```txt
helpful_count - not_helpful_count DESC
created_at DESC
```

## 16. Deploy

Update minimal:

- `.env.example`
- `docker-compose.yml` jika env perlu disalurkan ke container,
- `deploy-docker.sh` agar preflight/env baru jelas,
- documentation deployment jika ada.

Build check:

```bash
npm.cmd --workspace frontend run build
npm.cmd --workspace bot run build
```

Test check:

```bash
npm.cmd --workspaces=false run test
```

Catatan: jika test existing punya failure lama yang tidak terkait, audit harus mencatatnya jelas.

## 17. Implementation Plan

### Phase 1: Schema Dan Types

- Buat migration `008_create_signal_ledger.sql`.
- Tambah shared types.
- Tambah repository dasar.
- Tambah service skeleton.
- Tambah feature flag helper.

### Phase 2: Auth Member

- Implement Telegram auth signature verification.
- Implement membership service.
- Implement member session.
- Implement `/api/auth/telegram`, `/api/auth/me`, `/api/auth/logout`.
- Tambah login prompt UI.

### Phase 3: Feed Domain API

- Implement create/list/detail post.
- Implement view tracking.
- Implement Signal toggle.
- Implement bookmark toggle.
- Implement repost/quote.
- Implement comments.
- Implement community notes.

### Phase 4: Telegram Integration

- Update hashtag handler.
- Update publish handler.
- Add idempotency around Telegram message.
- Ensure credit award once.

### Phase 5: UI Signal Ledger

- Build components from mock 03.
- Replace `/` behind feature flag.
- Build `/post/[id]`.
- Build responsive mobile.
- Build guest login prompt behavior.

### Phase 6: Admin Minimal

- Add admin Signal Ledger page.
- Pending Telegram queue.
- Publish/reject/hide/delete actions.
- Moderation action logs.

### Phase 7: Audit Review

- Run build/tests.
- Manual check guest/member/admin.
- Manual check Telegram flow.
- Verify spec acceptance checklist.
- Fix mismatch or update spec if product decision changes.

## 18. Acceptance Criteria

### 18.1 Guest

- Guest bisa membuka `/`.
- Guest bisa melihat Signal Ledger feed.
- Guest bisa membuka `/post/[id]`.
- Guest bisa melihat media, comments, community note, counts.
- Guest klik Signal/comment/repost/bookmark/rating mendapat login prompt.
- Guest mutasi via API ditolak `401`.

### 18.2 Auth

- Telegram login dengan signature invalid ditolak.
- Telegram login dengan `isMember:false` ditolak dengan pesan non-member.
- Telegram login dengan `isMember:true` membuat member session.
- Token membership tidak muncul di frontend bundle/log response.
- `/api/auth/me` mengembalikan user session atau null.

### 18.3 Web Post

- Verified member bisa membuat web post.
- Web post langsung published.
- Web post muncul di feed.
- Web post mendapat credit sesuai category.
- Pair/Risk hanya muncul untuk Trading Room.
- Trading Room boleh text-only.
- Media maksimal 4.

### 18.4 Telegram Post

- Telegram member post masuk pending/draft.
- Admin `/publish` membuat post published di Signal Ledger.
- Telegram admin post auto publish.
- Hashtag lama tetap berjalan.
- Publish idempotent dan tidak double-credit.

### 18.5 Interactions

- Signal toggle bekerja.
- Bookmark private bekerja.
- Repost biasa langsung tampil dan bisa dibatalkan.
- Repost biasa ke post sendiri ditolak.
- Quote repost langsung tampil.
- Quote repost post sendiri boleh.
- View count bertambah dengan dedupe.

### 18.6 Comments

- Verified member bisa comment.
- Comment bisa edit dan delete oleh owner.
- Admin bisa hide/delete comment.
- Guest tidak bisa comment.

### 18.7 Community Notes

- Verified member bisa membuat note dengan minimal satu source URL.
- Create note tanpa source ditolak.
- Note langsung tampil.
- Banyak note bisa ada di post detail.
- Feed menampilkan satu note utama.
- Rating helpful/not helpful bekerja.
- Note creator bisa delete.
- Edit note hanya dalam window yang diizinkan.
- Admin bisa hide/delete note.

### 18.8 UI

- UI desktop mengikuti mock 03: left rail, center timeline, right rail.
- Tema hijau Horizon terasa dominan.
- Tidak terlihat seperti clone X 100%.
- Right rail Market Pulse berlabel `Data sementara`.
- Telegram draft count hanya admin.
- Mobile tidak overflow.
- Action bar tetap rapi di mobile.
- Text long post tidak overlap dan membuka `/post/[id]`.

### 18.9 Admin

- Admin melihat pending Telegram draft.
- Admin bisa publish/reject.
- Admin bisa hide/delete post.
- Admin bisa hide/delete comment/note.
- Semua action penting masuk activity log.

### 18.10 Build Dan Deploy

- Frontend build sukses.
- Bot build sukses.
- Migration additive.
- Env baru terdokumentasi.
- Deploy script/docker env tidak melewatkan secret penting.

## 19. Audit Checklist Setelah Implementasi

Auditor harus membandingkan hasil dengan spec ini:

- Cek semua table/constraint/index dari migration.
- Cek API mutasi guest ditolak server-side.
- Cek member auth memakai Telegram signature dan membership endpoint.
- Cek token membership tidak ada di client.
- Cek service/repository dipisah, tidak semua logic di route.
- Cek Telegram old flow masih berjalan.
- Cek credit tidak double-award.
- Cek Blog/Outlook tidak masuk timeline.
- Cek screenshot desktop dan mobile terhadap mock 03.
- Cek build/test.
- Cek activity logs untuk action penting.

## 20. Open Notes Untuk Implementasi

Hal berikut boleh diputuskan saat implementasi tanpa mengubah prinsip spec:

- exact session duration member,
- exact dedupe window view antara 6-24 jam,
- exact post edit window jika 15 menit perlu disesuaikan,
- exact community note edit window jika 10 menit perlu disesuaikan,
- apakah `post_reports` UI masuk phase awal atau hanya schema/API,
- apakah quote repost memakai media upload phase awal atau text-only dulu.

Perubahan yang tidak boleh dilakukan tanpa diskusi ulang:

- membuat guest bisa write,
- menghapus flow Telegram `/publish` untuk member,
- memasukkan Blog/Outlook ke Signal Ledger,
- membuat community note tanpa source,
- memakai fingerprint like sebagai Signal baru,
- membuat web post member pending review,
- menghilangkan `/post/[id]`,
- mengklaim Market Pulse live saat masih mock.
