# Implementation Plan: HERTZ Platform Refactor

## Overview

Implementasi wajib dikerjakan berurutan. Setiap task yang selesai dan sudah diverifikasi langsung diubah dari `[ ]` menjadi `[x]`. Refactor ini total: Horizon landing pindah ke `/`, HERTZ pindah ke `/hertz`, domain lama `Signal Ledger` diganti, action memakai `Pulse`, dan schema baru memakai `hertz_*`.

## Tasks

- [x] 1. Final audit before coding
  - [x] 1.1 Read current code and schema
    - Inspect current routes, API routes, bot handlers, admin pages, migrations, seed, and env files
    - Identify all `signal-ledger`, `Signal Ledger`, `SIGNAL_LEDGER_ENABLED`, and old `/post/[id]` usages
    - _Requirements: 1.1-1.8, 16.1-16.14, 21.1-21.9_

  - [x] 1.2 Read relevant Next.js docs
    - Inspect `node_modules/next/dist/docs/` before app route edits
    - Note any route handler or app router conventions needed by this Next version
    - _Requirements: 21.8_

  - [x] 1.3 Create implementation checklist/audit note
    - Record current gaps against requirements
    - Keep a checkpoint file for final audit
    - _Requirements: 20.12_

- [x] 2. Database reset and `hertz_*` schema
  - [x] 2.1 Design reset-safe migration plan
    - Decide exact migration file order after auditing current migrations
    - Document destructive reset assumptions
    - Ensure destructive reset cannot run against production without explicit confirmation
    - _Requirements: 16.1-16.5, 20.11_

  - [x] 2.2 Create HERTZ post schema
    - Create `hertz_posts`
    - Create `hertz_post_media`
    - Create `hertz_post_market_context`
    - Create indexes for feed, author, category, status, and `short_id`
    - _Requirements: 8.1-8.12, 16.6-16.7_

  - [x] 2.3 Create interaction schema
    - Create `hertz_reactions`
    - Create `hertz_comments`
    - Create `hertz_reposts`
    - Create `hertz_bookmarks`
    - Create `hertz_views`
    - Enforce one active Pulse/bookmark/repost where required
    - _Requirements: 9.1-9.12, 16.8-16.11_

  - [x] 2.4 Create community note schema
    - Create `hertz_community_notes`
    - Create `hertz_community_note_sources`
    - Create `hertz_community_note_ratings`
    - Store required source URLs
    - _Requirements: 10.1-10.10, 16.12_

  - [x] 2.5 Create DM schema
    - Create `hertz_conversations`
    - Create `hertz_conversation_participants`
    - Create `hertz_messages`
    - Create `hertz_message_attachments`
    - Create `hertz_message_reports`
    - Create `hertz_blocks`
    - _Requirements: 14.1-14.18, 16.13-16.14_

  - [x] 2.6 Create membership and credit schema
    - Create or refactor member session/membership tables to HERTZ naming
    - Create `hertz_credit_settings`
    - Create `hertz_credit_ledger`
    - Add idempotency key constraints for credit events
    - _Requirements: 7.1-7.12, 17.1-17.11_

- [x] 3. Shared domain types and repositories
  - [x] 3.1 Add shared HERTZ types
    - Define post, category, author, viewer state, media, note, DM, blog, and credit DTOs
    - Export types from shared type entrypoints
    - _Requirements: 21.4_

  - [x] 3.2 Add HERTZ post repositories
    - Implement post create/list/detail/update/delete queries
    - Implement `shortId` lookup
    - Implement media and market context queries
    - _Requirements: 2.1-2.11, 8.1-8.12_

  - [x] 3.3 Add interaction repositories
    - Implement Pulse, comment, repost, quote, bookmark, and view persistence
    - Implement owner/admin query helpers
    - _Requirements: 9.1-9.12_

  - [x] 3.4 Add community note repositories
    - Implement note create/list/edit/delete/rating
    - Implement primary note selection
    - _Requirements: 10.1-10.10_

  - [x] 3.5 Add Blog and Outlook repositories/adapters
    - Add Blog create/edit/delete/slug queries
    - Keep Outlook WordPress adapter behavior aligned with current implementation
    - _Requirements: 11.1-11.12, 12.1-12.8_

  - [x] 3.6 Add DM repositories
    - Implement inbox list, conversation detail, direct conversation creation, messages, read state, block, and report
    - _Requirements: 14.1-14.18_

  - [x] 3.7 Add credit repositories
    - Implement admin settings read/write
    - Implement idempotent ledger insert
    - _Requirements: 17.1-17.11_

- [x] 4. Auth, membership, and permissions
  - [x] 4.1 Implement Telegram login verification
    - Validate Telegram identity
    - Call membership endpoint with server-side bearer token
    - Fail login when `isMember` is false
    - _Requirements: 7.1-7.6_

  - [x] 4.2 Implement membership persistence and recheck
    - Store verified status and checked timestamp
    - Recheck on login and important write actions
    - Revoke write access after failed recheck
    - _Requirements: 7.7-7.9_

  - [x] 4.3 Implement member/admin viewer resolver
    - Resolve Guest, Verified_Member, and Admin consistently
    - Return badge state for UI
    - Ensure Pro Member is never emitted
    - _Requirements: 6.1-6.8, 7.10-7.12_

  - [x] 4.4 Add auth API routes
    - Implement login, me, logout routes as needed by current app
    - Keep secrets server-only
    - _Requirements: 7.1-7.12_

- [x] 5. HERTZ feed services and APIs
  - [x] 5.1 Implement `shortId` generation
    - Generate `hz_` + 8 random characters
    - Ensure uniqueness and immutability
    - _Requirements: 2.9-2.11_

  - [x] 5.2 Implement HERTZ post service
    - Create web post
    - Create Telegram pending/auto-published post
    - Publish/reject/hide/delete post
    - Edit own post where allowed
    - _Requirements: 8.1-8.12, 15.1-15.11_

  - [x] 5.3 Implement feed list/detail APIs
    - `GET /api/hertz/posts`
    - `POST /api/hertz/posts`
    - `GET /api/hertz/posts/[shortId]`
    - `PATCH /api/hertz/posts/[shortId]`
    - `DELETE /api/hertz/posts/[shortId]`
    - _Requirements: 2.3, 8.1-8.12_

  - [x] 5.4 Implement interaction services and APIs
    - Pulse toggle
    - Bookmark toggle
    - Plain repost
    - Quote repost
    - View tracking
    - _Requirements: 9.1-9.12_

  - [x] 5.5 Implement comments and community notes APIs
    - Comment list/create/edit/delete
    - Note list/create/edit/delete/rating
    - Source URL validation
    - _Requirements: 9.3-9.5, 10.1-10.10_

  - [x] 5.6 Add validation and rate limits
    - Validate text length, category, pair/risk, media count, and source URLs
    - Rate limit post, comment, Pulse, repost, bookmark, note, and rating writes
    - _Requirements: 6.7, 8.7-8.9, 10.2-10.3, 21.1-21.9_

- [x] 6. Telegram bot HERTZ refactor
  - [x] 6.1 Rename bot/admin copy to HERTZ
    - Replace Signal Ledger wording in bot responses and admin queue messages
    - _Requirements: 18.1-18.4_

  - [x] 6.2 Map existing hashtags to HERTZ categories
    - Preserve current hashtag behavior
    - Map into Trading Room, Life & Coffee, General, and Community Note where applicable
    - _Requirements: 18.5_

  - [x] 6.3 Wire Telegram post creation to HERTZ services
    - Member Telegram posts become pending
    - Admin Telegram posts follow current auto-publish behavior
    - Media saves as HERTZ post media
    - Duplicate prevention uses Telegram message id
    - _Requirements: 8.5-8.9, 18.1-18.8_

  - [x] 6.4 Preserve `/publish`
    - Publish pending Telegram post
    - Award credit once from admin settings
    - Make repeated publish idempotent
    - _Requirements: 18.2, 17.1-17.8_

- [x] 7. HERTZ desktop shell and landing UI
  - [x] 7.1 Implement Horizon landing `/`
    - Use `Horizon Landing / Desktop Mock 02`
    - Add Hero, HERTZ, Outlook, Blog, Tools, membership CTA, and footer
    - Add SEO title, description, canonical, and OG image
    - _Requirements: 3.1-3.11_

  - [x] 7.2 Implement `HertzShell`
    - Left rail with atom logo and HERTZ
    - Menu: Home, Outlook, Blog, Tools, Direct Message
    - Use Home, Outlook, Blog, chart-candlestick Tools, and message-circle Direct Message icon direction
    - Use full black `#000000` as dominant page background
    - Ignore stale Figma layer names that still say `Signal Ledger`, `Gallery`, or `HERTS`
    - Admin-only menu
    - Remove duplicate old header/footer from HERTZ pages
    - _Requirements: 4.1-4.17_

  - [x] 7.3 Implement market right rail
    - Forex Market
    - Crypto Market
    - Stock Market
    - Red/green mini line charts
    - Mock/fallback data without live claim
    - _Requirements: 5.1-5.7_

  - [x] 7.4 Implement HERTZ feed UI
    - Composer
    - Category tabs: All, Trading Room, Life & Coffee, General
    - Compact composer chips for chart/media, pair, and risk
    - Timeline
    - Post card
    - Category/source spine indicator
    - Trading/send, community, media, and coffee/life spine icon states
    - Long post truncation to `/hertz/post/[shortId]`
    - Guest login prompts
    - _Requirements: 6.1-6.8, 8.1-8.16, 9.1-9.12_

  - [x] 7.5 Implement post detail UI
    - Full content
    - Media
    - Comments
    - Community notes
    - Actions
    - _Requirements: 2.3, 8.10-8.12, 10.5-10.10_

- [x] 8. Blog, Outlook, and Tools surfaces
  - [x] 8.1 Implement Blog verified member flow
    - Create/edit/delete own Blog
    - Direct publish
    - Cover image
    - Unique slug
    - SEO fields
    - Credit publish event
    - _Requirements: 11.1-11.12, 17.1-17.8_

  - [x] 8.2 Wrap Outlook with HERTZ shell
    - Preserve current WordPress import/sync behavior
    - Add content sanitization/fallback if missing
    - Do not award automatic credit
    - _Requirements: 12.1-12.8_

  - [x] 8.3 Wrap Tools hub with HERTZ shell
    - Preserve existing tools
    - Add right rail on hub
    - Avoid breaking detail tools
    - _Requirements: 13.1-13.6_

- [x] 9. Direct Message implementation
  - [x] 9.1 Implement DM services and APIs
    - Conversation list
    - Direct conversation create
    - Thread detail
    - Message send/list
    - Read state
    - Block/report
    - _Requirements: 14.1-14.21_

  - [x] 9.2 Implement DM image attachments
    - Accept jpg, jpeg, png, webp
    - Enforce 5MB per file
    - Enforce max 4 images per message
    - Validate mime and extension
    - _Requirements: 14.12-14.15_

  - [x] 9.3 Implement DM UI
    - Conversation list
    - Inbox, Unread, Admin, and Archived filter tabs where backend supports them
    - Thread
    - Polling 5-10 seconds
    - Compose bar
    - Attachment picker
    - No market right rail
    - _Requirements: 14.1-14.18_

  - [x] 9.4 Implement DM report privacy
    - Report message
    - Admin sees reported message plus limited context only
    - No general admin access to all DM inboxes
    - _Requirements: 14.16-14.18_

- [x] 10. Admin HERTZ panel
  - [x] 10.1 Implement `/admin/hertz`
    - Pending Telegram queue
    - HERTZ posts moderation
    - Comments moderation
    - Community notes moderation
    - Reports moderation
    - _Requirements: 15.1-15.11_

  - [x] 10.2 Implement credit settings admin
    - Configure credit amounts manually
    - Save settings for post, Telegram publish, Blog, and optional actions
    - Ensure frontend/backend use settings
    - _Requirements: 15.7, 17.1-17.11_

  - [x] 10.3 Implement admin audit logs
    - Log publish/reject/hide/delete/unpublish/report actions
    - Avoid logging DM message bodies
    - _Requirements: 15.11, 14.16-14.18_

- [x] 11. Seed data and environment
  - [x] 11.1 Update `.env.example` and deployment env docs
    - Membership API URL/token
    - Horizon group id
    - Member session secret
    - Upload/storage settings for DM images if needed
    - Remove old Signal Ledger feature flag assumptions
    - _Requirements: 1.7, 7.1-7.12, 20.11_

  - [x] 11.2 Create rich seed data
    - Many HERTZ posts
    - All categories
    - Images/media
    - Comments, Pulse, reposts, bookmarks, notes
    - Blog examples
    - DM conversations/messages
    - Market mock data
    - _Requirements: 20.1-20.7_

  - [x] 11.3 Verify reset path
    - Reset local data
    - Re-seed cleanly
    - Confirm destructive reset guard for production
    - _Requirements: 16.3-16.5, 20.1-20.7_

- [x] 12. Testing, Docker, and final audit
  - [x] 12.1 Add automated tests
    - Membership success/failure
    - Guest write rejection
    - ShortId uniqueness
    - Pulse uniqueness
    - Community note source requirement
    - Credit idempotency
    - Blog direct publish
    - DM attachment validation
    - Telegram duplicate prevention
    - _Requirements: 2.9-2.11, 6.1-6.8, 7.1-7.12, 10.1-10.10, 14.12-14.18, 17.1-17.11, 18.7_

  - [x] 12.2 Run build and tests
    - `npm.cmd --workspace frontend run build`
    - `npm.cmd --workspace bot run build`
    - `npm.cmd --workspaces=false run test`
    - Record unrelated failures separately
    - _Requirements: 20.8-20.9_

  - [x] 12.3 Run local UI QA
    - Compare `/` with landing mock
    - Compare `/hertz` with desktop final mock
    - Compare `/outlook`, `/blog`, `/tools`, and `/hertz/messages` with Figma frames
    - Verify Figma node references `40:2`, `84:2`, `84:1368`, `84:2770`, `84:4014`, and `104:2`
    - Verify visible brand is `HERTZ`, not stale `HERTS`
    - Verify menu uses Direct Message, not stale Gallery copy
    - Verify guest prompts
    - Verify no duplicate header/footer
    - _Requirements: 3.1-3.11, 4.1-4.17, 5.1-5.9, 20.10, 20.13-20.15_

  - [x] 12.4 Run Docker QA
    - Start app through Docker path used for production
    - Verify frontend, bot, migrations, seed, and env wiring
    - _Requirements: 20.11_

  - [x] 12.5 Final spec audit
    - Compare implementation against every requirement
    - Update task checkboxes as completed
    - Record residual risks
    - Stop only when all tasks are complete or explicitly deferred by user
    - _Requirements: 20.12, 21.1-21.9_
