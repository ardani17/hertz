# Requirements Document

## Introduction

Signal Ledger refactors the Horizon home feed from the current article-card feed into a social trading timeline inspired by X/Twitter, while preserving Horizon's own emerald trading-community identity. The feature supports posts from Telegram and web, verified Telegram group membership, media/chart previews, Signal interactions, comments, reposts, quote reposts, private bookmarks, community notes with required sources, view insights, credit awards, and minimal admin moderation.

This is not only a UI redesign. It creates a new feed domain that coexists with the current `articles`, `media`, Telegram bot, admin dashboard, and credit system. Blog and Outlook remain separate systems and are not part of the Signal Ledger timeline.

## Glossary

- **Signal_Ledger**: The new Horizon social trading timeline shown on the home feed when enabled.
- **Signal_Post**: A timeline record stored in `feed_posts`, connected to an `articles` record for original and quote posts.
- **Signal**: The new member-only reaction that replaces fingerprint-based likes for Signal Ledger.
- **Verified_Member**: A user who has valid Telegram login data and passes Horizon Telegram group membership verification.
- **Guest**: A visitor without an active member session. Guests can read only.
- **Admin**: A user with `users.role = 'admin'`, allowed to moderate and publish Telegram drafts.
- **Composer**: The web form used by verified members to create Signal Ledger posts.
- **Trading_Room**: The Signal Ledger category for trading posts, mapped to `trading`.
- **Life_Coffee**: The Signal Ledger category for community stories, mapped to `life_story`.
- **General**: The Signal Ledger category for general community posts, mapped to `general`.
- **Community_Note**: A member-created contextual note attached to a post, requiring at least one source URL.
- **Market_Context**: Optional trading metadata such as pair, risk, timeframe, direction, entry, stop loss, and take profit.
- **Market_Pulse**: The right rail market summary panel. In phase one it may use mock/fallback data labeled `Data sementara`.
- **Signal_Spine**: A Horizon-specific vertical visual indicator in the timeline that can show category/source context.
- **Verified_Badge**: The badge shown for every verified Horizon Telegram group member.
- **Admin_Badge**: The badge shown for admin users instead of a generic member badge.
- **Feature_Flag**: The `SIGNAL_LEDGER_ENABLED` environment flag used to control rollout.

## Requirements

### Requirement 1: Signal Ledger feature flag and routing

**User Story:** As a platform owner, I want the new Signal Ledger feed to be controlled by a feature flag, so that the refactor can be deployed and audited safely before final cutover.

#### Acceptance Criteria

1. THE system SHALL define a `SIGNAL_LEDGER_ENABLED` environment flag.
2. WHEN `SIGNAL_LEDGER_ENABLED` is true, THE home route `/` SHALL render the Signal Ledger timeline.
3. WHEN `SIGNAL_LEDGER_ENABLED` is false, THE home route `/` SHALL be able to fall back to the previous feed behavior.
4. THE system SHALL provide a new route `/post/[id]` for Signal Ledger post detail.
5. THE `/artikel/[slug]` route SHALL remain available for backward compatibility.
6. THE Signal Ledger timeline SHALL NOT include Blog or Outlook posts.
7. THE implementation SHALL NOT treat old testing articles as a production migration blocker.

### Requirement 2: Guest read-only access

**User Story:** As a guest visitor, I want to browse the community feed without logging in, so that I can read Horizon content before joining.

#### Acceptance Criteria

1. THE Guest SHALL be able to view the Signal Ledger feed.
2. THE Guest SHALL be able to open `/post/[id]`.
3. THE Guest SHALL be able to view media, comments, Signal counts, repost counts, view counts, and community notes.
4. WHEN a Guest clicks Signal, comment, repost, quote repost, bookmark, community note, or rating actions, THE UI SHALL show a login prompt.
5. WHEN a Guest calls any write endpoint directly, THE API SHALL return `401 UNAUTHENTICATED`.
6. THE Signal Ledger SHALL NOT support anonymous comments.
7. THE Signal Ledger SHALL NOT support fingerprint-based Signal reactions.

### Requirement 3: Telegram member authentication

**User Story:** As a Horizon member, I want to log in with Telegram and be verified against the Horizon group, so that only real group members can interact with the feed.

#### Acceptance Criteria

1. THE system SHALL provide `POST /api/auth/telegram`.
2. THE Telegram login flow SHALL validate the Telegram Login Widget signature before trusting the Telegram identity.
3. THE backend SHALL call the membership check endpoint using server-side `MEMBERSHIP_CHECK_TOKEN`.
4. THE frontend SHALL NOT receive or expose `MEMBERSHIP_CHECK_TOKEN`.
5. WHEN membership check returns `{"isMember":true}`, THE system SHALL create or update the user as a Verified_Member.
6. WHEN membership check returns `{"isMember":false}`, THE API SHALL reject login with code `NOT_GROUP_MEMBER`.
7. THE non-member error message SHALL be `Akun Telegram Anda belum terdaftar sebagai member grup Horizon.`
8. WHEN the membership endpoint is unavailable during new login, THE system SHALL fail closed.
9. THE system SHALL store membership check results in `telegram_memberships`.
10. THE system SHALL give every Verified_Member a verified member badge.
11. THE system SHALL give Admin users an admin badge.
12. THE Signal Ledger SHALL NOT display `Pro Member` unless a future tier system is explicitly created.

### Requirement 4: Member session separation

**User Story:** As a platform maintainer, I want member sessions separated from admin sessions, so that public member login does not weaken admin authentication.

#### Acceptance Criteria

1. THE system SHALL create a `member_sessions` table.
2. THE member session cookie SHALL be named `horizon_member_session`.
3. THE member session cookie SHALL be httpOnly.
4. THE member session cookie SHALL use sameSite lax.
5. THE member session SHALL NOT reuse `admin_sessions`.
6. THE system SHALL provide `GET /api/auth/me`.
7. THE system SHALL provide `POST /api/auth/logout`.
8. THE member session SHALL point to `users.id`.

### Requirement 5: Web composer publishing

**User Story:** As a verified member, I want to publish directly from the web composer, so that I can contribute without going through Telegram.

#### Acceptance Criteria

1. THE Composer SHALL be visible as an active form only to Verified_Members and Admins.
2. THE Composer SHALL show a login prompt or read-only prompt to Guests.
3. WHEN a Verified_Member submits a web post, THE system SHALL create an `articles` record.
4. WHEN a Verified_Member submits a web post, THE system SHALL create a linked `feed_posts` record with `source = 'web'`.
5. THE web post SHALL be immediately `published`.
6. THE web post SHALL receive credit immediately after successful publish when its category is eligible.
7. THE Composer SHALL allow category selection for Trading Room, Life & Coffee, and General.
8. THE Composer SHALL show Pair and Risk fields only for Trading Room.
9. THE Composer SHALL allow Trading Room text-only posts.
10. THE Composer SHALL allow at most 4 media items per post.
11. THE phase-one web Composer SHALL support image media.
12. THE phase-one web Composer SHALL NOT require a new video upload pipeline.

### Requirement 6: Telegram posting flow preservation

**User Story:** As a Horizon admin, I want existing Telegram posting to keep working, so that the refactor does not break the current community workflow.

#### Acceptance Criteria

1. THE Telegram bot SHALL continue to process `#trading`, `#cerita`, and `#general`.
2. THE bot SHALL map `#trading` to `trading`.
3. THE bot SHALL map `#cerita` to `life_story`.
4. THE bot SHALL map `#general` to `general`.
5. WHEN a member posts from Telegram, THE bot SHALL create an article and Signal_Post in pending review state.
6. WHEN an admin posts from Telegram, THE bot SHALL auto publish the article and Signal_Post.
7. THE `/publish` command SHALL remain the approval mechanism for member Telegram posts.
8. WHEN `/publish` approves a member Telegram post, THE system SHALL publish both the article and the linked Signal_Post.
9. THE publish flow SHALL award credit only once.
10. THE Telegram flow SHALL be idempotent for repeated updates or repeated `/publish` calls.

### Requirement 7: Signal Ledger schema

**User Story:** As a developer, I want an additive database migration for Signal Ledger, so that the new domain is versioned and does not destroy existing data.

#### Acceptance Criteria

1. THE database migration SHALL be named `008_create_signal_ledger.sql`.
2. THE migration SHALL create `member_sessions`.
3. THE migration SHALL create `telegram_memberships`.
4. THE migration SHALL create `feed_posts`.
5. THE migration SHALL create `post_market_context`.
6. THE migration SHALL create `post_reactions`.
7. THE migration SHALL create `post_bookmarks`.
8. THE migration SHALL create `post_reposts`.
9. THE migration SHALL create `post_views`.
10. THE migration SHALL create `post_comments`.
11. THE migration SHALL create `community_notes`.
12. THE migration SHALL create `community_note_sources`.
13. THE migration SHALL create `community_note_ratings`.
14. THE migration SHALL create `post_reports`.
15. THE migration SHALL add user profile and moderation columns needed for member identity.
16. THE migration SHALL be additive and SHALL NOT drop existing tables or columns.
17. THE migration SHALL use indexes for common feed, author, status, reaction, bookmark, repost, note, and view lookups.

### Requirement 8: Feed list and post detail API

**User Story:** As a frontend user, I want the feed and post detail pages to load quickly and consistently, so that the timeline feels like a real social product.

#### Acceptance Criteria

1. THE system SHALL provide `GET /api/feed`.
2. THE system SHALL provide `POST /api/feed`.
3. THE system SHALL provide `GET /api/feed/[postId]`.
4. THE feed API SHALL support cursor pagination.
5. THE feed API SHALL support `category` filtering for `trading`, `life_story`, and `general`.
6. THE feed API SHALL return author badge, source, category, content excerpt, media, market context, viewer state, counts, and primary community note.
7. THE post detail API SHALL return full content, comments, and community notes.
8. THE feed SHALL return only public published posts by default.
9. THE feed SHALL exclude deleted and hidden posts for non-admin viewers.
10. THE feed SHALL truncate long post text to a short excerpt.
11. WHEN a post is truncated, THE UI SHALL provide `Baca lanjut` or an equivalent control that opens `/post/[id]`.
12. THE system SHALL avoid unsafe raw HTML truncation.

### Requirement 9: Signal reactions

**User Story:** As a verified member, I want to Signal a post, so that I can express useful trading/community value without anonymous likes.

#### Acceptance Criteria

1. THE system SHALL provide `POST /api/feed/[postId]/signal`.
2. THE Signal endpoint SHALL require Verified_Member or Admin.
3. THE first Signal action SHALL create an active `post_reactions` record.
4. THE second Signal action by the same user on the same post SHALL remove or soft-delete the active Signal.
5. THE system SHALL enforce one active Signal per user per post.
6. THE Signal count SHALL be visible to Guests and members.
7. THE old `likes` fingerprint table SHALL NOT be used as the source of truth for Signal.

### Requirement 10: Repost and quote repost

**User Story:** As a verified member, I want to repost or quote repost, so that important setups can spread through the community timeline.

#### Acceptance Criteria

1. THE system SHALL provide `POST /api/feed/[postId]/repost`.
2. THE repost endpoint SHALL require Verified_Member or Admin.
3. THE repost endpoint SHALL support `type = 'repost'`.
4. THE repost endpoint SHALL support `type = 'quote'`.
5. THE plain repost SHALL appear immediately.
6. THE quote repost SHALL appear immediately.
7. THE plain repost SHALL be cancellable by its creator.
8. THE plain repost SHALL be rejected when the original post author is the same as the current user.
9. THE quote repost SHALL be allowed for the user's own post.
10. THE quote repost SHALL create a new Signal_Post linked to the original post.
11. THE repost and quote repost SHALL NOT award credit automatically.

### Requirement 11: Private bookmarks

**User Story:** As a verified member, I want to save posts privately, so that I can revisit trading setups without exposing my saved list.

#### Acceptance Criteria

1. THE system SHALL provide `POST /api/feed/[postId]/bookmark`.
2. THE bookmark endpoint SHALL require Verified_Member or Admin.
3. THE first bookmark action SHALL create an active bookmark.
4. THE second bookmark action SHALL remove or soft-delete the active bookmark.
5. THE system SHALL enforce one active bookmark per user per post.
6. THE bookmark list SHALL be private to the user.
7. THE public feed SHALL NOT expose bookmark owner identities.
8. THE public feed SHALL NOT need to display bookmark count.

### Requirement 12: View insight

**User Story:** As a reader, I want to see post insight counts, so that I can understand how widely a setup has been viewed.

#### Acceptance Criteria

1. THE system SHALL provide `POST /api/feed/[postId]/view`.
2. THE view endpoint SHALL accept Guest views.
3. THE view endpoint SHALL deduplicate repeated views using user/session/IP-ish hashes.
4. THE system SHALL NOT store raw IP addresses in `post_views`.
5. THE view count SHALL be publicly visible as the phase-one meaning of Insight.
6. THE dedupe window SHALL be between 6 and 24 hours.

### Requirement 13: Signal Ledger comments

**User Story:** As a verified member, I want to comment on posts, so that discussions happen directly under setups and community posts.

#### Acceptance Criteria

1. THE system SHALL provide `GET /api/feed/[postId]/comments`.
2. THE system SHALL provide `POST /api/feed/[postId]/comments`.
3. THE system SHALL provide `PATCH /api/feed/comments/[commentId]`.
4. THE system SHALL provide `DELETE /api/feed/comments/[commentId]`.
5. THE create, edit, and delete comment endpoints SHALL require Verified_Member or Admin.
6. THE comment owner SHALL be able to edit their comment.
7. THE comment owner SHALL be able to delete their comment.
8. THE admin SHALL be able to hide or delete any comment.
9. THE Signal Ledger SHALL store comments in `post_comments`, not anonymous legacy comments.

### Requirement 14: Community notes

**User Story:** As a verified member, I want to add sourced community notes, so that readers can get important context on posts.

#### Acceptance Criteria

1. THE system SHALL provide `GET /api/feed/[postId]/community-notes`.
2. THE system SHALL provide `POST /api/feed/[postId]/community-notes`.
3. THE system SHALL provide `PATCH /api/feed/community-notes/[noteId]`.
4. THE system SHALL provide `DELETE /api/feed/community-notes/[noteId]`.
5. THE system SHALL provide `POST /api/feed/community-notes/[noteId]/rating`.
6. THE create note endpoint SHALL require Verified_Member or Admin.
7. THE create note endpoint SHALL require at least one source URL.
8. THE system SHALL reject community note creation without a source URL.
9. THE source URL SHALL be valid `http` or `https`.
10. THE community note SHALL publish immediately.
11. THE feed SHALL display one primary community note per post.
12. THE detail page SHALL be able to display multiple community notes.
13. THE note creator SHALL be able to delete their note.
14. THE note creator SHALL be able to edit their note within a limited edit window or before rating.
15. THE admin SHALL be able to hide or delete any community note.
16. THE rating endpoint SHALL allow `helpful` and `not_helpful` only.

### Requirement 15: Post edit and delete

**User Story:** As a verified member, I want limited correction controls for my posts, so that I can fix mistakes without rewriting timeline history.

#### Acceptance Criteria

1. THE post author SHALL be able to soft delete their own post.
2. THE post author SHALL be able to edit their own post within approximately 15 minutes after publish.
3. THE system SHALL set `edited_at` when a post is edited.
4. THE system SHALL set `deleted_at` and status `deleted` when a post is deleted.
5. THE admin SHALL be able to hide or delete any post.
6. THE admin SHALL be able to edit market metadata.
7. THE UI SHALL show an edited state when a visible post has been edited.

### Requirement 16: Credit rules

**User Story:** As a member, I want my original published contributions to earn credits, so that Horizon's reward system remains meaningful after the refactor.

#### Acceptance Criteria

1. THE system SHALL award credit for original web posts when published.
2. THE system SHALL award credit for Telegram member posts when admin publishes them.
3. THE system SHALL award credit for Telegram admin posts when auto published if eligible.
4. THE system SHALL use existing `credit_settings` category rules.
5. THE eligible categories SHALL be `trading`, `life_story`, and `general`.
6. THE system SHALL NOT award credit for Signal, comment, bookmark, repost, quote repost, or community note actions.
7. THE system SHALL prevent double credit awards for the same published post.
8. THE post publish transaction SHALL roll back if a required credit award fails.

### Requirement 17: Admin moderation

**User Story:** As an admin, I want a minimal Signal Ledger moderation page, so that Telegram drafts and social content can be managed safely.

#### Acceptance Criteria

1. THE admin dashboard SHALL include a Signal Ledger moderation page.
2. THE admin moderation page SHALL show pending Telegram drafts.
3. THE pending draft count SHALL be visible only to Admins.
4. THE admin SHALL be able to publish Telegram drafts.
5. THE admin SHALL be able to reject Telegram drafts.
6. THE admin SHALL be able to hide or delete posts.
7. THE admin SHALL be able to hide or delete comments.
8. THE admin SHALL be able to hide or delete community notes.
9. THE system SHALL write activity logs for moderation actions.

### Requirement 18: Signal Ledger UI

**User Story:** As a Horizon visitor, I want the feed to feel like a modern social trading timeline, so that the site feels current while still unmistakably Horizon.

#### Acceptance Criteria

1. THE Signal Ledger UI SHALL use `docs/signal-ledger/signal-ledger-mock-03.png` as the visual reference.
2. THE desktop layout SHALL have a left rail, center timeline, and right rail.
3. THE center timeline SHALL be the primary focus.
4. THE visual theme SHALL use dark green-black backgrounds and emerald accents.
5. THE UI SHALL NOT look like a 100% clone of X/Twitter.
6. THE post card SHALL show author, badge, source, timestamp, category, content, media, market context, counts, and actions.
7. THE action bar SHALL include comment, repost, Signal, Insight, bookmark, and share.
8. THE Market Pulse panel SHALL show `Data sementara` when using mock/fallback data.
9. THE Telegram Sync pending module SHALL be visible only to Admins.
10. THE UI SHALL use line-style icons with accessible labels.
11. THE UI SHALL avoid emoji as production action icons.
12. THE center timeline SHALL include a Signal_Spine visual treatment or equivalent Horizon-specific category/source indicator.
13. THE sidebar/current user area SHALL display `Verified Member` for verified group members.
14. THE post author line SHALL display a verified badge for verified members and an admin badge for admins.
15. THE UI SHALL NOT display `Pro Member` in phase one.
16. THE post overflow menu SHALL support role-appropriate actions such as copy link, report, delete own post, and admin moderation actions.
17. THE UI SHALL NOT display keyboard shortcut hints unless the shortcut is implemented.

### Requirement 19: Responsive behavior

**User Story:** As a mobile visitor, I want Signal Ledger to work cleanly on small screens, so that posts and actions remain readable and usable.

#### Acceptance Criteria

1. ON mobile, THE left rail SHALL be hidden or replaced by compact navigation.
2. ON mobile, THE right rail SHALL be hidden.
3. ON mobile, THE center timeline SHALL use the available width.
4. THE header SHALL remain usable on mobile.
5. THE composer SHALL be compact on mobile.
6. THE action bar SHALL NOT overflow horizontally.
7. THE media grid SHALL be responsive.
8. THE UI text SHALL NOT overlap with other UI elements.

### Requirement 20: Deployment configuration

**User Story:** As a developer, I want deployment configuration to include new Signal Ledger environment variables, so that production deploys do not fail silently.

#### Acceptance Criteria

1. THE `.env.example` file SHALL document Signal Ledger env values.
2. THE Docker/deploy configuration SHALL pass required server env values to the app.
3. THE deploy script SHALL not expose secret values in logs.
4. THE system SHALL continue to build the frontend.
5. THE system SHALL continue to build the bot.
6. THE implementation audit SHALL record any unrelated existing test failures separately.

### Requirement 21: Code organization

**User Story:** As a maintainer, I want Signal Ledger code separated by function, so that the refactor remains maintainable.

#### Acceptance Criteria

1. THE API routes SHALL remain thin and delegate business rules to services.
2. THE business logic SHALL live under `shared/services`.
3. THE database query logic SHALL live under `shared/repositories`.
4. THE shared domain types SHALL live under `shared/types`.
5. THE feed UI components SHALL live under `frontend/src/components/feed`.
6. THE implementation SHALL NOT put all feed logic inside `page.tsx`.
7. THE services SHALL use transactions for multi-table publish, credit, and activity log operations.

### Requirement 22: Safety, rate limiting, and content validation

**User Story:** As a platform maintainer, I want Signal Ledger write actions protected by validation and rate limits, so that the new social feed is safe to deploy.

#### Acceptance Criteria

1. THE server SHALL rate limit web post creation.
2. THE server SHALL rate limit comment creation.
3. THE server SHALL rate limit Signal toggles.
4. THE server SHALL rate limit repost and quote repost creation.
5. THE server SHALL rate limit bookmark toggles.
6. THE server SHALL rate limit community note creation and rating.
7. THE server SHALL validate and sanitize user-generated text content.
8. THE server SHALL validate community note source URLs.
9. THE server SHALL avoid logging membership secrets or session tokens.
10. THE schema SHALL prepare ban/mute fields, while phase one UI may limit moderation to hide/delete actions.
