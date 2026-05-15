# Implementation Plan: Signal-to-Hertz Rename

## Overview

Codebase-wide rename/refactoring from "Signal"/"SignalLedger" naming to "Hertz" naming. Executed bottom-up: Types → Repositories → Services → Frontend → Bot → Environment → Build Verification. This is a mechanical refactoring with no behavioral changes.

## Tasks

- [x] 1. Migrate shared type definitions
  - [x] 1.1 Invert type aliases in `shared/types/feed.ts`
    - Rename all `Signal*` primary definitions to `Hertz*` primary definitions (HertzPostType, HertzPostSource, HertzPostCategory, HertzPostStatus, HertzAuthor, HertzMedia, HertzViewerState, HertzPostCounts, HertzPostContent, HertzPost, HertzPostDetail, HertzComment, HertzPostInput)
    - Add backward-compatible `Signal*` type aliases pointing to the new `Hertz*` definitions
    - Consolidate `HertzPostCounts`: remove `signals` field, keep only `pulses`, `comments`, `reposts`, `views` (4 fields)
    - Consolidate `HertzViewerState`: remove `hasSignaled`, keep single `hasPulsed` plus `hasBookmarked`, `hasReposted`, `canEdit`, `canDelete` (5 fields)
    - Update `CursorFeedResult.items` to reference `HertzPost[]`
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 2. Update repository layer
  - [x] 2.1 Update type imports and SQL aliases in `shared/repositories/feedRepository.ts`
    - Change type imports from `SignalPostType`, `SignalPostSource`, `SignalPostCategory`, `SignalPostStatus` to `HertzPostType`, `HertzPostSource`, `HertzPostCategory`, `HertzPostStatus`
    - Rename SQL alias `signal_count` → `pulse_count` in `listPublished` and `findById` queries
    - Rename SQL alias `viewer_has_signaled` → `viewer_has_pulsed` in `listPublished` and `findById` queries
    - Update `FeedListRow` interface: `signal_count` → `pulse_count`, `viewer_has_signaled` → `viewer_has_pulsed`
    - _Requirements: 5.1, 5.5, 5.6, 5.7_

  - [x] 2.2 Update type imports in `shared/repositories/hertzPostRepository.ts`
    - Change type imports from `SignalPostType`, `SignalPostSource`, `SignalPostCategory`, `SignalPostStatus` to `HertzPostType`, `HertzPostSource`, `HertzPostCategory`, `HertzPostStatus`
    - Update all in-file usages of those type names
    - _Requirements: 5.2_

  - [x] 2.3 Remove wrapper methods from `shared/repositories/postReactionRepository.ts`
    - Delete the `hasSignal()` wrapper method (retaining only `hasPulse()`)
    - Delete the `toggleSignal()` wrapper method (retaining only `togglePulse()`)
    - _Requirements: 5.3, 5.4_

- [x] 3. Update service layer
  - [x] 3.1 Update type imports and field mappings in `shared/services/feedService.ts`
    - Change all `Signal*` type imports to `Hertz*` equivalents (HertzAuthor, HertzComment, HertzMedia, HertzPost, HertzPostCategory, HertzPostDetail, HertzPostInput, HertzPostSource, HertzPostStatus)
    - Update `mapPosts()` viewer mapping: read from `row.viewer_has_pulsed` → `hasPulsed`
    - Update `mapPosts()` counts mapping: read from `row.pulse_count` → `pulses`
    - Remove duplicate `hasSignaled`/`signals` fields that previously mirrored `hasPulsed`/`pulses`
    - _Requirements: 6.1, 6.3, 6.4_

  - [x] 3.2 Update type imports in `shared/services/hertzPostService.ts`
    - Change all `Signal*` type imports to `Hertz*` equivalents
    - Update all in-file usages of those type names
    - _Requirements: 6.2_

  - [x] 3.3 Remove wrapper and delete legacy file in service layer
    - Remove `toggleSignal()` method from `shared/services/postReactionService.ts` (retain only `togglePulse()`)
    - Delete `shared/services/signalLedgerAdminService.ts` entirely
    - _Requirements: 6.5, 6.6_

- [x] 4. Checkpoint - Verify backend layers compile
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Rename frontend component files and update internals
  - [x] 5.1 Rename 24 component files in `frontend/src/components/feed/`
    - Rename 14 `.tsx` files and 10 `.module.css` files from `Signal*`/`SignalLedger*` to `Hertz*` per the design mapping table
    - Update internal references in each renamed file: exported function names, CSS module import paths, and `displayName` strings
    - Rename `SignalIcons.tsx` → `HertzIcons.tsx` and rename the `SignalIcon` export to `PulseIcon`
    - Do NOT modify files on the Exclusion List (AbortSignal, ElliottWaveTool trading signals)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 10.2, 10.3, 10.4, 11.1, 11.2, 11.3, 11.4_

  - [x] 5.2 Update barrel export in `frontend/src/components/feed/index.ts`
    - Update all export statements to reference new file paths and component names
    - Export: HertzPage, HertzComposer, HertzPostCard, HertzAuthorLine, HertzPostMedia, HertzMarketMeta, HertzDetailInteractions, HertzLeftRail, HertzRightRail
    - Preserve all non-Signal exports unchanged (FeedList, ArticleCard, ArticleLongCard, CategoryTabs, CommunityNoteCard, QuotePostCard)
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 5.3 Update page-level imports across Next.js pages
    - Update `frontend/src/app/hertz/page.tsx`: import `HertzPage` instead of `SignalLedgerPage`, import `HertzPost` type instead of `SignalPost`
    - Update `frontend/src/app/hertz/post/[shortId]/page.tsx`: import `HertzPostCard`, `HertzDetailInteractions`, `HertzViewTracker`
    - Update `frontend/src/app/admin/(dashboard)/hertz/page.tsx`: rename `AdminSignalLedgerPage` → `AdminHertzPage`, rename `PendingSignalPost` → `PendingHertzPost`
    - Update `frontend/src/app/page.tsx`: import `HertzPost` type instead of `SignalPost`, update all local usages
    - Update admin API keys page placeholder text: "Contoh: Signal Tool, Trading Bot" → "Contoh: Hertz Tool, Trading Bot"
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 10.1_

- [x] 6. Update bot code
  - [x] 6.1 Update type imports in bot source files
    - Update `bot/src/utils/hashtag.ts`: import `HertzPostCategory` instead of `SignalPostCategory`
    - Update `bot/src/handlers/hashtagHandler.ts`: import `HertzPostCategory` instead of `SignalPostCategory`
    - Update `bot/src/index.ts`: import `HertzPostCategory` instead of `SignalPostCategory`
    - Update all internal usages of `SignalPostCategory` type annotation to `HertzPostCategory` across all bot files
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 7. Update environment variables and seed data
  - [x] 7.1 Rename environment variable
    - Rename `SIGNAL_LEDGER_ENABLED` → `HERTZ_ENABLED` in `.env` (preserve value)
    - Rename `SIGNAL_LEDGER_ENABLED` → `HERTZ_ENABLED` in `.env.example` if present
    - Update all code references that read `SIGNAL_LEDGER_ENABLED` to read `HERTZ_ENABLED`
    - _Requirements: 8.1, 8.2, 8.3_

  - [x] 7.2 Update seed data files
    - Rename `db/seeds/001_signal_ledger_review_seed.sql` → `db/seeds/001_hertz_review_seed.sql`
    - Update slug values: `signal-seed-*` → `hertz-seed-*`
    - Update image paths: `/images/signal-seed/` → `/images/hertz-seed/`
    - Update `db/seeds/002_hertz_full_review_seed.sql`: change remaining `/images/signal-seed/` paths to `/images/hertz-seed/`
    - Do NOT modify migration SQL statements
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 8. Checkpoint - Verify full build integrity
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Build verification and grep checks
  - [x] 9.1 Run frontend and bot builds
    - Run `npm run build` in the frontend directory — expect zero exit code
    - Run `npm run build` in the bot directory — expect zero exit code
    - _Requirements: 12.1, 12.2, 12.3_

  - [x] 9.2 Run grep verification for missed references
    - Verify zero results for `SignalLedgerPage|SignalComposer|SignalPostCard|SignalAuthorLine` in `.ts`/`.tsx` files (excluding `.kiro/`, `docs/`, `node_modules/`)
    - Verify zero results for `hasSignal|toggleSignal` in `.ts` files (excluding `node_modules/`)
    - Verify zero results for `SIGNAL_LEDGER_ENABLED` in `.ts`/`.tsx`/`.env` files
    - Fix any missed references found and re-run builds
    - _Requirements: 3.5, 7.5, 8.4, 12.4_

- [x] 10. Final checkpoint - Ensure all builds pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- This is a mechanical rename/refactoring — no behavioral changes, no new features
- Backward-compatible `Signal*` type aliases ensure existing consumers still compile
- Database column names and SQL migration files are NOT modified (only TypeScript aliases change)
- The Exclusion List (AbortSignal, ElliottWaveTool trading signals, OS signals) must remain untouched
- Each phase should be committed independently for granular rollback capability
- Property-based testing does not apply to this rename refactoring; build verification is the primary validation

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["2.1", "2.2", "2.3"] },
    { "id": 2, "tasks": ["3.1", "3.2", "3.3"] },
    { "id": 3, "tasks": ["5.1", "6.1", "7.1", "7.2"] },
    { "id": 4, "tasks": ["5.2"] },
    { "id": 5, "tasks": ["5.3"] },
    { "id": 6, "tasks": ["9.1"] },
    { "id": 7, "tasks": ["9.2"] }
  ]
}
```
