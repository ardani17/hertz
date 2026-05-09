# Requirements Document

## Introduction

HERTZ Platform Refactor Completion menutup gap dari audit `2026-05-09`. Spec lama sudah membangun fondasi besar, tetapi audit membuktikan implementasi belum 100% karena runtime HERTZ masih banyak memakai domain lama `feed_posts`, `post_*`, dan `community_notes`. Spec ini fokus pada penyelesaian final: HERTZ harus memakai `hertz_*` sebagai source of truth, DM harus menjadi fitur nyata, Blog/Admin harus lengkap, dan QA harus membuktikan runtime, bukan hanya keberadaan file.

Source audit: `.kiro/specs/hertz-platform-refactor/re-audit-2026-05-09.md`.

## Requirements

### Requirement 1: Fix runtime blockers

**User Story:** Sebagai tester, saya ingin route/API HERTZ berjalan dari seed lokal, sehingga UI tidak bergantung pada fallback.

#### Acceptance Criteria

1. THE `GET /api/hertz/posts` endpoint SHALL return `200`.
2. THE `/hertz/post/[shortId]` route SHALL return `200` for seeded published HERTZ short IDs.
3. THE `/hertz` page SHALL render DB-backed HERTZ posts, not demo fallback, when data exists.
4. THE error response SHALL expose safe diagnostic codes in development without leaking secrets.
5. THE runtime smoke test SHALL verify `/hertz`, `/api/hertz/posts`, and one seeded post detail.

### Requirement 2: Make `hertz_*` the source of truth

**User Story:** Sebagai maintainer, saya ingin HERTZ tidak lagi bergantung pada tabel lama, sehingga domain baru bersih dan mudah dirawat.

#### Acceptance Criteria

1. THE HERTZ post repository SHALL read from `hertz_posts`.
2. THE HERTZ post repository SHALL write to `hertz_posts`.
3. THE HERTZ post media SHALL read/write `hertz_post_media`.
4. THE HERTZ feed SHALL not depend on `feed_posts` for new HERTZ runtime.
5. THE HERTZ public APIs SHALL use `HertzPostService`, not `FeedService`.
6. THE legacy `feed_posts` path MAY remain only for migration/admin compatibility until explicitly removed.
7. THE Telegram publish flow SHALL create or synchronize `hertz_posts`.
8. THE seeded `hertz_posts` SHALL be visible in `/hertz` without duplicating into legacy tables.

### Requirement 3: Normalize HERTZ categories

**User Story:** Sebagai developer dan admin, saya ingin kategori konsisten dari UI sampai database.

#### Acceptance Criteria

1. THE API category values SHALL be `trading_room`, `life_coffee`, `general`, and `community_note`.
2. THE UI labels SHALL remain `Trading Room`, `Life & Coffee`, `General`, and community note display.
3. THE service SHALL map old Telegram hashtags into new category values.
4. THE old category values `trading` and `life_story` SHALL not be emitted by HERTZ APIs.
5. THE category filter on `/hertz` SHALL query the new category values.

### Requirement 4: Migrate interactions to `hertz_*`

**User Story:** Sebagai member, saya ingin Pulse, comment, repost, bookmark, notes, and views bekerja pada domain HERTZ baru.

#### Acceptance Criteria

1. THE Pulse action SHALL use `hertz_reactions`.
2. THE comment action SHALL use `hertz_comments`.
3. THE repost and quote action SHALL use `hertz_reposts` and quote `hertz_posts`.
4. THE bookmark action SHALL use `hertz_bookmarks`.
5. THE view action SHALL use `hertz_views`.
6. THE community note action SHALL use `hertz_community_notes`.
7. THE community note sources SHALL use `hertz_community_note_sources`.
8. THE community note ratings SHALL use `hertz_community_note_ratings`.
9. THE action counts in feed/detail SHALL come from `hertz_*` tables.
10. THE legacy `post_*` tables SHALL not be required for HERTZ UI actions.

### Requirement 5: Complete web composer and media flow

**User Story:** Sebagai verified member, saya ingin membuat post HERTZ dari web lengkap dengan media dan metadata trading.

#### Acceptance Criteria

1. THE web composer SHALL create `hertz_posts` immediately for verified members.
2. THE composer SHALL support images through `hertz_post_media`.
3. THE composer SHALL require `pair` and `risk` for `trading_room`.
4. THE composer SHALL allow optional market context fields only when relevant.
5. THE composer SHALL return the created post short ID.
6. THE composer SHALL not create duplicate legacy feed rows as the primary write path.

### Requirement 6: Complete Direct Message

**User Story:** Sebagai verified member, saya ingin DM terasa seperti fitur sosial nyata, bukan placeholder.

#### Acceptance Criteria

1. THE DM UI SHALL show peer profile, last message preview, unread count, and last message time.
2. THE DM UI SHALL include Inbox, Unread, Admin, and Archived filters where supported.
3. THE DM SHALL support member search for new conversations.
4. THE DM SHALL support direct conversation creation from search.
5. THE DM SHALL support archive and unarchive per viewer.
6. THE DM SHALL support soft delete own messages.
7. THE DM SHALL support block and unblock.
8. THE DM SHALL support report message.
9. THE DM SHALL support image attachments only.
10. THE DM SHALL enforce jpg, jpeg, png, webp.
11. THE DM SHALL enforce 5MB per image.
12. THE DM SHALL enforce max 4 images per message.
13. THE DM SHALL keep polling at 5-10 seconds until realtime is explicitly added.
14. THE DM SHALL not show the market right rail.
15. THE admin SHALL see only reported DM message plus limited context, not a global private inbox.

### Requirement 7: Complete Blog member publishing

**User Story:** Sebagai verified member, saya ingin Blog bisa dikelola setelah publish.

#### Acceptance Criteria

1. THE verified member SHALL edit their own Blog articles.
2. THE verified member SHALL delete or hide their own Blog articles.
3. THE admin SHALL edit/delete/unpublish all Blog articles.
4. THE Blog create/edit flow SHALL support cover image.
5. THE Blog detail SHALL provide SEO title, description, canonical, and OG image.
6. THE Blog SHALL support report/takedown guardrail.
7. THE Blog credit event SHALL remain idempotent and use admin settings.

### Requirement 8: Complete Admin HERTZ moderation

**User Story:** Sebagai admin, saya ingin semua moderation HERTZ berada di admin panel yang jelas.

#### Acceptance Criteria

1. THE admin backend service SHALL use HERTZ naming.
2. THE admin panel SHALL manage pending Telegram HERTZ posts.
3. THE admin panel SHALL hide/delete/restore HERTZ posts.
4. THE admin panel SHALL moderate HERTZ comments.
5. THE admin panel SHALL moderate HERTZ community notes.
6. THE admin panel SHALL review HERTZ reports across post, comment, note, Blog, and DM.
7. THE admin panel SHALL manage credit settings used by HERTZ and Blog events.
8. THE admin logs SHALL avoid storing DM message bodies.

### Requirement 9: Docker and environment QA

**User Story:** Sebagai owner production, saya ingin deploy path Docker terbukti benar, bukan hanya build lokal.

#### Acceptance Criteria

1. THE `.env.example` SHALL include all required HERTZ completion variables.
2. THE deploy script SHALL fail clearly when HERTZ required env is missing.
3. THE Docker compose runtime SHALL construct a valid `DATABASE_URL`.
4. THE Docker path SHALL run migrations and seed/reset flow as documented.
5. THE Docker smoke SHALL verify frontend, bot status, `/hertz`, `/api/hertz/posts`, and DM auth rejection.
6. THE audit SHALL record if Docker cannot run because local Docker daemon is unavailable.

### Requirement 10: Behavioral tests and final audit

**User Story:** Sebagai maintainer, saya ingin test membuktikan perilaku, bukan hanya file ada.

#### Acceptance Criteria

1. THE tests SHALL cover HERTZ post list/detail using `hertz_posts`.
2. THE tests SHALL cover short ID lookup for seeded HERTZ posts.
3. THE tests SHALL cover Pulse uniqueness on `hertz_reactions`.
4. THE tests SHALL cover community note source requirement on `hertz_community_notes`.
5. THE tests SHALL cover composer media persistence to `hertz_post_media`.
6. THE tests SHALL cover DM search, send, read, archive, block, report, and attachment validation.
7. THE tests SHALL cover Blog edit/delete/cover and idempotent credit.
8. THE final audit SHALL compare this completion spec line by line against implementation.
9. THE final audit SHALL include build/test/runtime smoke output.
10. THE task checklist SHALL only be marked `[x]` after verification.
