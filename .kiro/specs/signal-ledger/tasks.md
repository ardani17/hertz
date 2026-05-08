# Implementation Plan: Signal Ledger

## Overview

Implement Signal Ledger in dependency order: schema and shared contracts first, then auth and membership, then feed domain services and APIs, then Telegram bot integration, then UI, admin moderation, deploy wiring, and final audit.

Tasks reference requirements from `requirements.md`.

## Tasks

- [x] 1. Database migration and shared types
  - [x] 1.1 Create `db/migrations/008_create_signal_ledger.sql`
    - Add user profile and moderation columns
    - Create `member_sessions`
    - Create `telegram_memberships`
    - Create `feed_posts`
    - Create `post_market_context`
    - Create `post_reactions`
    - Create `post_bookmarks`
    - Create `post_reposts`
    - Create `post_views`
    - Create `post_comments`
    - Create `community_notes`
    - Create `community_note_sources`
    - Create `community_note_ratings`
    - Create `post_reports`
    - Add required indexes and unique constraints
    - Ensure migration is additive and idempotent where practical
    - _Requirements: 7.1-7.17_

  - [x] 1.2 Add shared Signal Ledger types
    - Create `shared/types/feed.ts`
    - Create `shared/types/membership.ts`
    - Create `shared/types/communityNote.ts`
    - Export types from `shared/types/index.ts`
    - _Requirements: 8.6, 21.4_

  - [x] 1.3 Add feature flag helper
    - Add a server-safe helper for `SIGNAL_LEDGER_ENABLED`
    - Ensure flag can be used by `/` route
    - _Requirements: 1.1, 1.2, 1.3_

- [x] 2. Repositories
  - [x] 2.1 Create feed repository
    - Implement list feed with cursor pagination
    - Implement get post detail
    - Implement insert article/feed_post helpers
    - Implement status update helpers
    - _Requirements: 8.1-8.9_

  - [x] 2.2 Create member auth repositories
    - Implement `memberSessionRepository.ts`
    - Implement `membershipRepository.ts`
    - _Requirements: 3.9, 4.1-4.8_

  - [x] 2.3 Create interaction repositories
    - Implement `postReactionRepository.ts`
    - Implement `postBookmarkRepository.ts`
    - Implement `postRepostRepository.ts`
    - Implement `postViewRepository.ts`
    - _Requirements: 9.1-9.7, 10.1-10.11, 11.1-11.8, 12.1-12.6_

  - [x] 2.4 Create comment and community note repositories
    - Implement `postCommentRepository.ts`
    - Implement `communityNoteRepository.ts`
    - _Requirements: 13.1-13.9, 14.1-14.16_

- [x] 3. Member authentication and membership verification
  - [x] 3.1 Implement Telegram signature validation
    - Validate Telegram Login Widget hash using bot token
    - Reject invalid auth data
    - _Requirements: 3.1, 3.2_

  - [x] 3.2 Implement membership service
    - Call `MEMBERSHIP_CHECK_URL`
    - Use server-side `MEMBERSHIP_CHECK_TOKEN`
    - Store result in `telegram_memberships`
    - Fail closed when required
    - _Requirements: 3.3-3.9_

  - [x] 3.3 Implement member session service
    - Create session tokens
    - Hash tokens before storage
    - Read current member from cookie
    - Logout and clear cookie
    - _Requirements: 4.1-4.8_

  - [x] 3.4 Add auth API routes
    - Implement `POST /api/auth/telegram`
    - Implement `GET /api/auth/me`
    - Implement `POST /api/auth/logout`
    - _Requirements: 3.1-3.12, 4.6, 4.7_

  - [x] 3.5 Add tests for auth and membership
    - Invalid Telegram signature rejected
    - `isMember:false` rejected with agreed message
    - `isMember:true` creates member session
    - Membership endpoint failure fails closed
    - _Requirements: 3.2-3.8_

- [x] 4. Feed domain services
  - [x] 4.1 Implement `feedService.ts`
    - Create web post
    - Create Telegram post
    - Publish Telegram draft
    - List feed
    - Get post detail
    - Edit and soft delete post
    - Award credit in publish transaction
    - Write activity logs
    - _Requirements: 5.1-5.12, 6.1-6.10, 8.1-8.12, 15.1-15.7, 16.1-16.8_

  - [x] 4.2 Implement interaction services
    - `postReactionService.ts`
    - `postBookmarkService.ts`
    - `postRepostService.ts`
    - `postViewService.ts`
    - _Requirements: 9.1-9.7, 10.1-10.11, 11.1-11.8, 12.1-12.6_

  - [x] 4.3 Implement comment service
    - Create comment
    - Edit own comment
    - Delete own comment
    - Admin hide/delete
    - _Requirements: 13.1-13.9_

  - [x] 4.4 Implement community note service
    - Create note with required source URL
    - Pick primary note
    - Edit/delete owner note
    - Admin hide/delete
    - Rating helpful/not_helpful
    - _Requirements: 14.1-14.16_

  - [x] 4.5 Add rate limit guards
    - Web post create
    - Comment create
    - Signal toggle
    - Repost/quote
    - Bookmark toggle
    - Community note create/rating
    - Add sanitization and URL validation guards where needed
    - _Requirements: 2.5, 9.2, 10.2, 11.2, 13.5, 14.6, 22.1-22.10_

- [x] 5. Feed API routes
  - [x] 5.1 Implement feed list/create/detail routes
    - `GET /api/feed`
    - `POST /api/feed`
    - `GET /api/feed/[postId]`
    - `PATCH /api/feed/[postId]`
    - `DELETE /api/feed/[postId]`
    - _Requirements: 8.1-8.9, 15.1-15.7_

  - [x] 5.2 Implement interaction routes
    - `POST /api/feed/[postId]/view`
    - `POST /api/feed/[postId]/signal`
    - `POST /api/feed/[postId]/bookmark`
    - `POST /api/feed/[postId]/repost`
    - _Requirements: 9.1-9.7, 10.1-10.11, 11.1-11.8, 12.1-12.6_

  - [x] 5.3 Implement comment routes
    - `GET /api/feed/[postId]/comments`
    - `POST /api/feed/[postId]/comments`
    - `PATCH /api/feed/comments/[commentId]`
    - `DELETE /api/feed/comments/[commentId]`
    - _Requirements: 13.1-13.9_

  - [x] 5.4 Implement community note routes
    - `GET /api/feed/[postId]/community-notes`
    - `POST /api/feed/[postId]/community-notes`
    - `PATCH /api/feed/community-notes/[noteId]`
    - `DELETE /api/feed/community-notes/[noteId]`
    - `POST /api/feed/community-notes/[noteId]/rating`
    - _Requirements: 14.1-14.16_

  - [x] 5.5 Add API tests for permission boundaries
    - Guest mutation returns 401
    - Verified member mutation succeeds
    - Admin moderation succeeds
    - Community note without source fails
    - _Requirements: 2.4, 2.5, 14.7, 14.8, 17.1-17.9_

- [x] 6. Telegram bot integration
  - [x] 6.1 Update hashtag parsing and mapping
    - Preserve `#trading`, `#cerita`, `#general`
    - Map to Signal Ledger categories
    - _Requirements: 6.1-6.4_

  - [x] 6.2 Update hashtag handler
    - Create article and feed_post through shared service
    - Member posts become pending review
    - Admin posts auto publish
    - Preserve media upload behavior
    - Store Telegram chat/message identifiers
    - _Requirements: 6.5, 6.6, 6.10_

  - [x] 6.3 Update publish handler
    - Publish linked article and feed_post
    - Award credit once
    - Keep `/publish` as admin approval
    - Make repeated publish idempotent
    - _Requirements: 6.7-6.10, 16.2, 16.7_

  - [x] 6.4 Add bot tests
    - Member hashtag creates pending Signal_Post
    - Admin hashtag creates published Signal_Post
    - `/publish` publishes both records
    - Credit is not double-awarded
    - _Requirements: 6.5-6.10_

- [x] 7. Signal Ledger frontend UI
  - [x] 7.1 Read relevant Next.js docs before app route edits
    - Inspect `node_modules/next/dist/docs/` for current app route conventions
    - _Requirements: 1.2, 1.4_

  - [x] 7.2 Implement Signal Ledger page shell
    - `SignalLedgerPage`
    - `SignalLedgerHeader`
    - `SignalLeftRail`
    - `SignalRightRail`
    - Feature flag switch in home route
    - Verified Member label, Admin badge, no Pro Member label
    - _Requirements: 1.1-1.7, 18.1-18.17_

  - [x] 7.3 Implement post components
    - `SignalPost`
    - `SignalAuthorLine`
    - `SignalPostMedia`
    - `SignalMarketMeta`
    - `SignalActionBar`
    - `CommunityNoteCard`
    - `QuotePostCard`
    - Signal Spine/category-source indicator
    - Long post truncation with `Baca lanjut` to `/post/[id]`
    - Role-aware overflow menu
    - _Requirements: 8.6, 8.10-8.12, 18.6, 18.7, 18.12, 18.14, 18.16_

  - [x] 7.4 Implement Composer
    - Guest login prompt
    - Category selector
    - Pair/Risk only for Trading Room
    - Media max 4
    - Image media support for phase one
    - Do not build a new web video upload pipeline
    - Submit to `POST /api/feed`
    - _Requirements: 5.1-5.12_

  - [x] 7.5 Implement guest login prompt behavior
    - Signal click prompts login
    - Comment click prompts login
    - Repost click prompts login
    - Bookmark click prompts login
    - Community note/rating click prompts login
    - _Requirements: 2.4, 2.5_

  - [x] 7.6 Implement `/post/[id]` detail page
    - Full content
    - Media
    - Comments
    - Community notes
    - Actions
    - _Requirements: 1.4, 8.7, 13.1-13.9, 14.1-14.16_

  - [x] 7.7 Implement responsive behavior
    - Hide right rail on mobile
    - Compact/hide left rail on mobile
    - Prevent action overflow
    - Verify media grid
    - _Requirements: 19.1-19.8_

- [x] 8. Admin moderation
  - [x] 8.1 Implement admin Signal Ledger page
    - Add admin route/page
    - Show pending Telegram drafts
    - Show admin-only pending count
    - _Requirements: 17.1-17.3, 18.9_

  - [x] 8.2 Implement admin moderation APIs
    - Pending queue
    - Publish draft
    - Reject draft
    - Hide/restore post
    - Hide comment
    - Hide community note
    - _Requirements: 17.4-17.8_

  - [x] 8.3 Add activity logs for admin actions
    - Publish/reject
    - Hide/delete
    - Note/comment moderation
    - _Requirements: 17.9_

- [x] 9. Deployment and configuration
  - [x] 9.1 Update `.env.example`
    - Add `SIGNAL_LEDGER_ENABLED`
    - Add `MEMBERSHIP_CHECK_URL`
    - Add `MEMBERSHIP_CHECK_TOKEN`
    - Add `HORIZON_TELEGRAM_GROUP_ID`
    - Add `MEMBER_SESSION_SECRET`
    - _Requirements: 20.1_

  - [x] 9.2 Update Docker/deploy configuration
    - Ensure server env values are passed
    - Ensure secrets are not printed
    - Verify `deploy-docker.sh` path
    - _Requirements: 20.2, 20.3_

- [x] 10. Testing and audit
  - [x] 10.1 Run build checks
    - `npm.cmd --workspace frontend run build`
    - `npm.cmd --workspace bot run build`
    - _Requirements: 20.4, 20.5_

  - [x] 10.2 Run test checks
    - `npm.cmd --workspaces=false run test`
    - Record unrelated existing failures separately
    - _Requirements: 20.6_

  - [x] 10.3 Manual guest audit
    - Guest can read feed and detail
    - Guest actions show login prompt
    - Guest write APIs return 401
    - _Requirements: 2.1-2.7_

  - [x] 10.4 Manual member audit
    - Telegram login works for member
    - Verified member badge appears and Pro Member does not appear
    - Web post publishes immediately
    - Signal toggle works
    - Repost/quote works
    - Bookmark private works
    - Comment edit/delete works
    - Community note requires source
    - _Requirements: 3.1-3.12, 5.1-5.12, 9.1-14.16, 18.13-18.15_

  - [x] 10.5 Manual admin audit
    - Pending Telegram queue visible only to admin
    - Publish/reject works
    - Hide/delete moderation works
    - Activity logs are written
    - _Requirements: 17.1-17.9_

  - [x] 10.6 Visual audit
    - Compare desktop UI against mock 03
    - Verify Horizon identity is not a direct X clone
    - Verify mobile layout has no overlap or overflow
    - Verify Market Pulse mock is labeled `Data sementara`
    - Verify Signal Spine/category-source indicator exists
    - Verify long post `Baca lanjut` opens `/post/[id]`
    - Verify no unimplemented keyboard shortcut hint is shown
    - _Requirements: 18.1-18.17, 19.1-19.8_

  - [x] 10.7 Final checkpoint
    - Confirm all requirements are implemented or explicitly deferred
    - Update task checkboxes
    - Record residual risks
    - Ask the user before any final production deploy
