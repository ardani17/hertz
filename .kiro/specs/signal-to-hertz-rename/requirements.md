# Requirements Document

## Introduction

Complete the "Signal" → "Hertz" naming migration across the Horizon codebase. Routes and admin pages already use `/hertz`, but many frontend component files, shared type definitions, service layers, repository methods, environment variables, seed data, and bot utilities still reference the old "Signal" / "SignalLedger" naming. This spec covers renaming files, exports, types, interfaces, methods, SQL aliases, env variables, and seed data references to use "Hertz" / "hertz" consistently — while explicitly preserving unrelated uses of the word "signal" (e.g., `AbortSignal`, trading buy/sell signals in `ElliottWaveTool`).

## Glossary

- **Rename_Tool**: The combination of IDE refactoring, find-and-replace, and file-system rename operations used to execute the migration
- **Frontend_Components**: React component files located in `frontend/src/components/feed/`
- **Barrel_Export**: The `index.ts` file that re-exports all public components from a directory
- **Shared_Types**: TypeScript type and interface definitions in `shared/types/feed.ts`
- **Repository_Layer**: Data-access modules in `shared/repositories/` that execute SQL queries
- **Service_Layer**: Business-logic modules in `shared/services/` that transform data between repository and API layers
- **Bot_Code**: Telegram bot source code in `bot/src/`
- **Seed_Data**: SQL seed files in `db/seeds/` used to populate development/test databases
- **Migration_Files**: SQL migration files in `db/migrations/` that define schema changes
- **Env_Variable**: Environment variable defined in the `.env` file
- **Exclusion_List**: The set of code references that must NOT be renamed: `AbortSignal` (Web API), trading signal concepts in `ElliottWaveTool.tsx`, and the word "Signal" when used in non-SignalLedger contexts

## Requirements

### Requirement 1: Rename Frontend Component Files

**User Story:** As a developer, I want all frontend component files in the feed directory to use "Hertz" naming, so that file names are consistent with the product's current branding.

#### Acceptance Criteria

1. WHEN the Rename_Tool is applied to `frontend/src/components/feed/`, THE Rename_Tool SHALL rename each file whose name starts with "Signal" by replacing the prefix "Signal" with "Hertz" (e.g., `SignalComposer.tsx` → `HertzComposer.tsx`, `SignalPost.tsx` → `HertzPost.tsx`) and replacing "SignalLedger" with "Hertz" (e.g., `SignalLedgerPage.tsx` → `HertzPage.tsx`, `SignalLedgerHeader.tsx` → `HertzHeader.tsx`)
2. WHEN a `.module.css` file shares the same base filename as a renamed `.tsx` component file, THE Rename_Tool SHALL rename the CSS module file to match the new component base name (e.g., `SignalComposer.module.css` → `HertzComposer.module.css`, `SignalLedgerPage.module.css` → `HertzPage.module.css`)
3. WHEN a component file is renamed, THE Rename_Tool SHALL update all internal references within that file — including the exported function name, CSS module import path, and React `displayName` string if present — to use the new "Hertz"-based name
4. THE Rename_Tool SHALL rename exactly 24 files in `frontend/src/components/feed/`: the 14 `.tsx` files and 10 `.module.css` files whose names start with "Signal"
5. IF a file in the Exclusion_List (as defined in the Glossary) contains the prefix "Signal" in a non-SignalLedger context, THEN THE Rename_Tool SHALL leave that file unchanged

### Requirement 2: Update Barrel Export File

**User Story:** As a developer, I want the barrel export in `frontend/src/components/feed/index.ts` to reflect the new file and component names, so that consumers import from correctly named modules.

#### Acceptance Criteria

1. WHEN component files are renamed from "Signal" to "Hertz" prefixes, THE Rename_Tool SHALL update each corresponding export statement in `frontend/src/components/feed/index.ts` to reference the new file path and export the new component name (e.g., `export { HertzPage } from './HertzPage'` instead of `export { SignalLedgerPage } from './SignalLedgerPage'`)
2. THE Barrel_Export SHALL export `HertzPage`, `HertzComposer`, `HertzPostCard`, `HertzAuthorLine`, `HertzPostMedia`, `HertzMarketMeta`, `HertzDetailInteractions`, `HertzLeftRail`, and `HertzRightRail` replacing the following Signal equivalents respectively: `SignalLedgerPage`, `SignalComposer`, `SignalPostCard`, `SignalAuthorLine`, `SignalPostMedia`, `SignalMarketMeta`, `SignalDetailInteractions`, `SignalLeftRail`, `SignalRightRail`
3. WHEN the barrel export file is updated, THE Rename_Tool SHALL preserve all non-Signal export statements unchanged, including `FeedList`, `ArticleCard`, `ArticleCardData`, `ArticleLongCard`, `CategoryTabs`, `CategoryFilter`, `CommunityNoteCard`, and `QuotePostCard`
4. IF a renamed target file does not exist at the expected path, THEN THE Rename_Tool SHALL report an error indicating which export could not be resolved and SHALL NOT remove the original export statement

### Requirement 3: Update Page-Level Imports

**User Story:** As a developer, I want all Next.js page files that import feed components to use the new "Hertz" names, so that the application compiles without errors after the rename.

#### Acceptance Criteria

1. WHEN the feed component barrel (`@/components/feed`) exports `HertzPage` instead of `SignalLedgerPage`, THE Rename_Tool SHALL update the import in `frontend/src/app/hertz/page.tsx` to reference `HertzPage`, and SHALL update the type import from `@shared/types` to reference `HertzPost` instead of `SignalPost`
2. WHEN the feed components are renamed, THE Rename_Tool SHALL update imports in `frontend/src/app/hertz/post/[shortId]/page.tsx` to reference `HertzPostCard` (from `@/components/feed/HertzPost`), `HertzDetailInteractions` (from `@/components/feed/HertzDetailInteractions`), and `HertzViewTracker` (from `@/components/feed/HertzViewTracker`) in place of their `Signal`-prefixed equivalents
3. WHEN the feed components are renamed, THE Rename_Tool SHALL update `frontend/src/app/admin/(dashboard)/hertz/page.tsx` to rename the default export function from `AdminSignalLedgerPage` to `AdminHertzPage` and rename the local interface from `PendingSignalPost` to `PendingHertzPost`, preserving all existing interface fields unchanged
4. WHEN the feed component types are renamed, THE Rename_Tool SHALL update the type import in `frontend/src/app/page.tsx` from `import type { SignalPost } from '@shared/types'` to `import type { HertzPost } from '@shared/types'`, and SHALL update all local usages of the `SignalPost` type annotation within that file to `HertzPost`
5. WHEN all page-level import updates in criteria 1–4 are applied, THE Rename_Tool SHALL verify that running the TypeScript compiler (`tsc --noEmit`) against the frontend project produces zero type errors related to the renamed identifiers

### Requirement 4: Migrate Shared Type Definitions

**User Story:** As a developer, I want the primary type definitions in `shared/types/feed.ts` to use "Hertz" naming with optional backward-compatible aliases, so that the type system reflects the current product name.

#### Acceptance Criteria

1. THE Shared_Types SHALL define `HertzPostType`, `HertzPostSource`, `HertzPostCategory`, `HertzPostStatus`, `HertzAuthor`, `HertzMedia`, `HertzViewerState`, `HertzPostCounts`, `HertzPostContent`, `HertzPost`, `HertzPostDetail`, `HertzComment`, and `HertzPostInput` as the primary type definitions (interfaces and type literals, not aliases)
2. THE Shared_Types SHALL export `SignalPostType`, `SignalPostSource`, `SignalPostCategory`, `SignalPostStatus`, `SignalAuthor`, `SignalMedia`, `SignalViewerState`, `SignalPostCounts`, `SignalPostContent`, `SignalPost`, `SignalPostDetail`, `SignalComment`, and `SignalPostInput` as type aliases pointing to the corresponding primary `Hertz*` definitions
3. WHEN the `SignalPostCounts` interface is migrated to `HertzPostCounts`, THE Shared_Types SHALL rename the `signals` field to `pulses` and retain the `pulses`, `comments`, `reposts`, and `views` fields, resulting in exactly 4 numeric fields: `pulses`, `comments`, `reposts`, `views`
4. WHEN the `SignalViewerState` interface is migrated to `HertzViewerState`, THE Shared_Types SHALL replace the `hasSignaled` and `hasPulsed` fields with a single `hasPulsed` field, resulting in exactly 5 boolean fields: `hasPulsed`, `hasBookmarked`, `hasReposted`, `canEdit`, `canDelete`
5. THE Shared_Types SHALL update the `CursorFeedResult` interface to reference `HertzPost[]` instead of `SignalPost[]` in its `items` field

### Requirement 5: Update Repository Layer

**User Story:** As a developer, I want repository modules to import and use "Hertz" type names and rename legacy method wrappers, so that the data-access layer is consistent with the new naming.

#### Acceptance Criteria

1. WHEN the shared types are renamed, THE Repository_Layer SHALL update all type imports in `shared/repositories/feedRepository.ts` from `SignalPostType`, `SignalPostSource`, `SignalPostCategory`, and `SignalPostStatus` to `HertzPostType`, `HertzPostSource`, `HertzPostCategory`, and `HertzPostStatus` respectively, and update all references to these types within the file
2. WHEN the shared types are renamed, THE Repository_Layer SHALL update all type imports in `shared/repositories/hertzPostRepository.ts` from `SignalPostType`, `SignalPostSource`, `SignalPostCategory`, and `SignalPostStatus` to `HertzPostType`, `HertzPostSource`, `HertzPostCategory`, and `HertzPostStatus` respectively, and update all references to these types within the file
3. THE Repository_Layer SHALL remove the `hasSignal()` wrapper method from `shared/repositories/postReactionRepository.ts` so that only the `hasPulse()` method remains as the sole public method for checking pulse existence
4. THE Repository_Layer SHALL remove the `toggleSignal()` wrapper method from `shared/repositories/postReactionRepository.ts` so that only the `togglePulse()` method remains as the sole public method for toggling pulse state
5. WHEN the SQL aliases are updated in `feedRepository.ts`, THE Repository_Layer SHALL rename the `signal_count` column alias to `pulse_count` in both the `listPublished` and `findById` query methods
6. WHEN the SQL aliases are updated in `feedRepository.ts`, THE Repository_Layer SHALL rename the `viewer_has_signaled` column alias to `viewer_has_pulsed` in both the `listPublished` and `findById` query methods
7. WHEN the SQL aliases are renamed in `feedRepository.ts`, THE Repository_Layer SHALL update the `FeedListRow` interface to rename the `signal_count` property to `pulse_count` and the `viewer_has_signaled` property to `viewer_has_pulsed`

### Requirement 6: Update Service Layer

**User Story:** As a developer, I want service modules to use "Hertz" type names and updated field mappings, so that the business-logic layer is consistent with the renamed types and repositories.

#### Acceptance Criteria

1. WHEN the shared types are renamed, THE Service_Layer SHALL update all type imports in `shared/services/feedService.ts` from `Signal*` names (SignalAuthor, SignalComment, SignalMedia, SignalPost, SignalPostCategory, SignalPostDetail, SignalPostInput, SignalPostSource, SignalPostStatus) to their corresponding `Hertz*` names (HertzAuthor, HertzComment, HertzMedia, HertzPost, HertzPostCategory, HertzPostDetail, HertzPostInput, HertzPostSource, HertzPostStatus) and update all in-file usages of those type names accordingly
2. WHEN the shared types are renamed, THE Service_Layer SHALL update all type imports in `shared/services/hertzPostService.ts` from `Signal*` names to their corresponding `Hertz*` names and update all in-file usages of those type names accordingly
3. WHEN the repository field `viewer_has_signaled` is renamed to `viewer_has_pulsed`, THE Service_Layer SHALL update the mapping in `feedService.ts` so that the `viewer` object reads from `row.viewer_has_pulsed` and maps it to the `hasPulsed` output property
4. WHEN the repository field `signal_count` is renamed to `pulse_count`, THE Service_Layer SHALL update the mapping in `feedService.ts` so that the `counts` object reads from `row.pulse_count` and maps it to the `pulses` output property
5. THE Service_Layer SHALL delete the file `shared/services/signalLedgerAdminService.ts` since it contains only a single re-export of `HertzAdminService` that is no longer needed
6. WHEN the `toggleSignal()` method is renamed in the repository, THE Service_Layer SHALL remove the `toggleSignal()` method from `shared/services/postReactionService.ts` and retain only the `togglePulse()` method as the sole public method for toggling pulse reactions

### Requirement 7: Update Bot Code

**User Story:** As a developer, I want the Telegram bot source code to import and use "Hertz" type names, so that the bot module is consistent with the shared type definitions.

#### Acceptance Criteria

1. WHEN the shared types are renamed, THE Bot_Code SHALL update the import in `bot/src/utils/hashtag.ts` from `SignalPostCategory` to `HertzPostCategory`, referencing the same import path `../../../shared/types/feed`
2. WHEN the shared types are renamed, THE Bot_Code SHALL update the import in `bot/src/handlers/hashtagHandler.ts` from `SignalPostCategory` to `HertzPostCategory`, referencing the same import path `../../../shared/types/feed`
3. WHEN the shared types are renamed, THE Bot_Code SHALL update the import in `bot/src/index.ts` from `SignalPostCategory` to `HertzPostCategory`, referencing the same import path `../../shared/types/feed`
4. THE Bot_Code SHALL update all internal usages of the `SignalPostCategory` type annotation to `HertzPostCategory` in function signatures, variable declarations, and generic type parameters across all files in `bot/src/`
5. IF a file in `bot/src/` references `SignalPostCategory` after the rename is applied, THEN THE Bot_Code SHALL report a compilation error indicating the missed reference

### Requirement 8: Rename Environment Variable

**User Story:** As a developer, I want the environment variable to use "Hertz" naming, so that configuration is consistent with the product name.

#### Acceptance Criteria

1. THE Env_Variable `SIGNAL_LEDGER_ENABLED` in the `.env` file SHALL be renamed to `HERTZ_ENABLED`, preserving its current value
2. WHEN the env variable is renamed, THE Rename_Tool SHALL update all code references that read `SIGNAL_LEDGER_ENABLED` to read `HERTZ_ENABLED` instead, including references in TypeScript files, configuration files, and documentation files within the project root
3. THE Env_Variable `SIGNAL_LEDGER_ENABLED` in the `.env.example` file (if present) SHALL be renamed to `HERTZ_ENABLED`, preserving its placeholder or default value
4. IF a code file still references `SIGNAL_LEDGER_ENABLED` after the rename, THEN THE Rename_Tool SHALL identify and update the missed reference to `HERTZ_ENABLED`

### Requirement 9: Update Seed Data and Migration Comments

**User Story:** As a developer, I want seed data files to use "Hertz" naming in slugs and asset paths, so that development data reflects the current branding.

#### Acceptance Criteria

1. THE Seed_Data file `db/seeds/001_signal_ledger_review_seed.sql` SHALL be renamed to `db/seeds/001_hertz_review_seed.sql`
2. WHEN the seed file is renamed, THE Seed_Data SHALL update all slug values matching the pattern `signal-seed-*` to `hertz-seed-*` (e.g., `signal-seed-xauusd-london-plan` becomes `hertz-seed-xauusd-london-plan`)
3. WHEN the seed file references image paths containing `/images/signal-seed/`, THE Seed_Data SHALL update those paths to `/images/hertz-seed/`, preserving the filename portion after the directory prefix
4. THE Seed_Data file `db/seeds/002_hertz_full_review_seed.sql` SHALL update all remaining `/images/signal-seed/` path references to `/images/hertz-seed/`, preserving the filename portion after the directory prefix
5. THE Migration_Files SHALL NOT be modified in their SQL statements (migrations are immutable), but comments referencing "Signal" MAY be left as historical context

### Requirement 10: Update Placeholder Text and Icon Names

**User Story:** As a developer, I want UI placeholder text and icon component names to reflect "Hertz" branding, so that the user-facing copy and developer-facing code are consistent.

#### Acceptance Criteria

1. WHEN the admin API keys page contains placeholder text "Contoh: Signal Tool, Trading Bot", THE Rename_Tool SHALL update it to "Contoh: Hertz Tool, Trading Bot"
2. THE Frontend_Components SHALL rename the `SignalIcon` component export in `SignalIcons.tsx` to `PulseIcon`, and THE file `SignalIcons.tsx` SHALL be renamed to `HertzIcons.tsx`
3. WHEN any component file imports from `./SignalIcons` or `./SignalIcons.tsx`, THE Rename_Tool SHALL update the import path to reference `./HertzIcons`
4. IF a component imports the renamed `SignalIcon` by its old name after the file rename, THEN THE Rename_Tool SHALL update the import specifier to the new component name (`PulseIcon`)

### Requirement 11: Preserve Exclusion List References

**User Story:** As a developer, I want unrelated uses of the word "signal" to remain unchanged, so that standard Web APIs and domain-specific trading terminology are not broken by the rename.

#### Acceptance Criteria

1. THE Rename_Tool SHALL NOT modify any occurrence of `AbortSignal` in API route handlers (this is a standard Web API)
2. THE Rename_Tool SHALL NOT modify any use of "Signal" in `ElliottWaveTool.tsx` where it refers to trading buy/sell signal concepts
3. THE Rename_Tool SHALL NOT modify any occurrence of "signal" that is unrelated to the SignalLedger feature (e.g., OS signals, event signals in third-party libraries, DOM event signal references)
4. IF the Rename_Tool encounters an ambiguous occurrence of "signal" that could refer to either the SignalLedger feature or an unrelated concept, THEN THE Rename_Tool SHALL leave the occurrence unchanged

### Requirement 12: Verify Build Integrity

**User Story:** As a developer, I want the application to compile and pass type-checking after all renames are complete, so that I can confirm no references were missed.

#### Acceptance Criteria

1. WHEN all renames are complete, THE Frontend_Components SHALL compile without TypeScript errors when running `npm run build` in the frontend directory, producing a zero exit code
2. WHEN all renames are complete, THE Bot_Code SHALL compile without TypeScript errors when running `npm run build` in the bot directory, producing a zero exit code
3. WHEN all renames are complete, THE Shared_Types SHALL produce no type errors when referenced by both frontend and bot builds (verified by both builds succeeding)
4. IF a TypeScript error occurs after the rename due to a missed `Signal`-to-`Hertz` reference, THEN THE Rename_Tool SHALL identify the file and line containing the error, update the reference to the new name, and re-run the build to confirm the fix
