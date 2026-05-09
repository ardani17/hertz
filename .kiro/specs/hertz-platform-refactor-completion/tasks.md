# Implementation Plan: HERTZ Platform Refactor Completion

## Overview

Kerjakan berurutan dari blocker runtime ke domain migration, lalu DM/Blog/Admin, lalu QA. Checklist hanya boleh diubah ke `[x]` setelah task terkait diverifikasi.

## Tasks

- [x] 1. Stabilize current runtime
  - [x] 1.1 Reproduce and fix `GET /api/hertz/posts` 500
    - Capture actual server error from local runtime
    - Fix DB/env/service path causing 500
    - Verify API returns seeded posts
    - _Requirements: 1.1, 1.3-1.5_

  - [x] 1.2 Fix HERTZ post detail seed lookup
    - Ensure seeded `hertz_posts.short_id` can render `/hertz/post/[shortId]`
    - Verify one seeded detail route returns 200
    - _Requirements: 1.2, 1.5_

- [x] 2. Replace feed runtime with HERTZ domain
  - [x] 2.1 Implement real `HertzPostRepository`
    - Read list/detail from `hertz_posts`
    - Join author, media, market context, counts, viewer state, and primary note
    - Stop extending `FeedRepository`
    - _Requirements: 2.1-2.5, 4.9_

  - [x] 2.2 Implement real `HertzPostService`
    - Create web posts
    - Create Telegram pending/published posts
    - Edit/delete/publish/reject/hide posts
    - Generate immutable `hz_` short IDs
    - _Requirements: 2.2, 2.5-2.8, 5.1, 5.5_

  - [x] 2.3 Update HERTZ API routes
    - Replace `FeedService` imports with `HertzPostService`
    - Ensure response DTOs match current UI needs
    - _Requirements: 2.5, 1.1-1.3_

  - [x] 2.4 Update `/hertz` and detail page data loading
    - Render DB-backed `hertz_posts`
    - Keep demo fallback only for DB unavailable/empty states
    - _Requirements: 1.2-1.3, 2.8_

- [x] 3. Normalize categories
  - [x] 3.1 Update shared category types
    - Use `trading_room`, `life_coffee`, `general`, `community_note`
    - Keep UI label mapping centralized
    - _Requirements: 3.1-3.2_

  - [x] 3.2 Update composer/filter/API category handling
    - Convert old request values only at compatibility boundary
    - Emit only new values from HERTZ API
    - _Requirements: 3.4-3.5_

  - [x] 3.3 Update Telegram hashtag mapping
    - Map existing hashtags into new category values
    - Ensure `/publish` keeps category consistency
    - _Requirements: 3.3, 2.7_

- [x] 4. Move interactions to `hertz_*`
  - [x] 4.1 Implement HERTZ interaction repositories
    - Pulse, bookmark, repost, quote, view
    - Use `hertz_reactions`, `hertz_bookmarks`, `hertz_reposts`, `hertz_views`
    - _Requirements: 4.1-4.5, 4.9-4.10_

  - [x] 4.2 Implement HERTZ comment service
    - Create/edit/delete/hide comments via `hertz_comments`
    - Preserve owner/admin permissions
    - _Requirements: 4.2, 4.9-4.10_

  - [x] 4.3 Implement HERTZ community note service
    - Create/edit/delete/hide notes
    - Require valid source URLs
    - Implement helpful/not helpful rating
    - _Requirements: 4.6-4.10_

  - [x] 4.4 Update action APIs and UI calls
    - Ensure all action routes use HERTZ services
    - Verify counts update from `hertz_*`
    - _Requirements: 4.1-4.10_

- [x] 5. Complete composer media
  - [x] 5.1 Store post media in `hertz_post_media`
    - Attach existing uploaded media or direct URLs
    - Preserve sort order and alt text if available
    - _Requirements: 5.2_

  - [x] 5.2 Enforce Trading Room metadata
    - Require pair and risk for `trading_room`
    - Store market context in `hertz_post_market_context`
    - _Requirements: 5.3-5.4_

- [x] 6. Complete Direct Message
  - [x] 6.1 Expand DM repositories and DTOs
    - Inbox peer profile, preview, unread count, archived state
    - Conversation detail with block state
    - _Requirements: 6.1-6.5_

  - [x] 6.2 Add member search and direct conversation UI
    - Search verified members
    - Start or reuse direct conversation
    - _Requirements: 6.3-6.4_

  - [x] 6.3 Add archive, delete, block, and report APIs
    - Archive/unarchive conversation
    - Soft delete own message
    - Block/unblock users
    - Report message
    - _Requirements: 6.5-6.8, 6.15_

  - [x] 6.4 Add DM image attachments
    - Persist to `hertz_message_attachments`
    - Enforce type, size, and count limits
    - Add attachment picker UI
    - _Requirements: 6.9-6.12_

  - [x] 6.5 Polish DM UI
    - Inbox/Unread/Admin/Archived filters
    - Peer profile and timestamps
    - Polling 5-10 seconds
    - No market rail
    - _Requirements: 6.1-6.2, 6.13-6.14_

- [x] 7. Complete Blog member flow
  - [x] 7.1 Add Blog edit/delete owner APIs
    - Verified member can edit/delete own articles
    - Admin can manage all Blog articles
    - _Requirements: 7.1-7.3_

  - [x] 7.2 Add Blog cover and SEO support
    - Cover image in create/edit
    - SEO metadata on detail pages
    - _Requirements: 7.4-7.5_

  - [x] 7.3 Add Blog report/takedown and credit verification
    - Report/takedown guardrail
    - Idempotent credit from settings
    - _Requirements: 7.6-7.7_

- [x] 8. Complete Admin HERTZ
  - [x] 8.1 Rename/admin service cleanup
    - Replace runtime dependency on `signalLedgerAdminService`
    - Use `hertzAdminService`
    - _Requirements: 8.1_

  - [x] 8.2 Expand moderation coverage
    - Pending Telegram posts
    - Posts, comments, notes
    - Blog reports/takedown
    - DM reports with limited context
    - _Requirements: 8.2-8.6, 8.8_

  - [x] 8.3 Verify credit settings admin
    - Ensure settings drive HERTZ post, Telegram publish, Blog, and optional actions
    - _Requirements: 8.7_

- [x] 9. Docker and env QA
  - [x] 9.1 Review env templates and deploy script
    - Ensure all HERTZ env vars are documented
    - Ensure missing env fails clearly
    - _Requirements: 9.1-9.2_

  - [x] 9.2 Run Docker production path
    - Use `bash deploy-docker.sh` when Docker is available
    - Verify constructed DB URL, migrations, seed/reset notes
    - _Requirements: 9.3-9.6_

- [x] 10. Behavioral tests
  - [x] 10.1 Add HERTZ post/domain tests
    - List/detail uses `hertz_posts`
    - Short ID lookup works
    - Composer media persists to `hertz_post_media`
    - _Requirements: 10.1-10.2, 10.5_

  - [x] 10.2 Add interaction tests
    - Pulse uniqueness
    - Note source requirement and rating
    - Counts from `hertz_*`
    - _Requirements: 10.3-10.4_

  - [x] 10.3 Add DM tests
    - Search, send, read, archive, block, report, attachments
    - _Requirements: 10.6_

  - [x] 10.4 Add Blog/Admin tests
    - Blog edit/delete/cover/credit
    - Admin report/moderation paths
    - _Requirements: 10.7_

- [x] 11. Final verification and audit
  - [x] 11.1 Run regression suite
    - `npm.cmd --workspace frontend run build`
    - `npm.cmd --workspace bot run build`
    - `npm.cmd --workspaces=false run test`
    - _Requirements: 10.8-10.10_

  - [x] 11.2 Run runtime smoke
    - `/`
    - `/hertz`
    - `/api/hertz/posts`
    - `/hertz/post/[seedShortId]`
    - `/blog`
    - `/outlook`
    - `/tools`
    - `/hertz/messages`
    - _Requirements: 1.5, 10.9_

  - [x] 11.3 Write final implementation audit
    - Compare implementation against this spec line by line
    - Record build/test/runtime evidence
    - Leave residual risks explicit
    - _Requirements: 10.8-10.10_
