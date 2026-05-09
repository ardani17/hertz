# Implementation Plan: Simplify Bot Commands

## Overview

This plan removes redundant bot commands (`/story`, `/cerita`), eliminates hashtag aliases (`#jurnal`, `#kehidupan`), adds the `#general` hashtag, strips recognized hashtags from article content, drops the unused `content_type` column from the database and all application code, and deletes dead handler files. Tasks are ordered so each step builds on the previous, with bot-side changes first, then shared types, database migration, and finally frontend cleanup.

## Tasks

- [x] 1. Update hashtag utilities and add stripRecognizedHashtags
  - [x] 1.1 Update HASHTAG_CATEGORY_MAP and add stripRecognizedHashtags in `bot/src/utils/hashtag.ts`
    - Replace the map with exactly 3 entries: `{ trading: 'trading', cerita: 'life_story', general: 'general' }` (removes `jurnal` and `kehidupan`)
    - Add `RECOGNIZED_HASHTAGS` Set derived from map keys
    - Add `stripRecognizedHashtags(text: string): string` function that removes recognized hashtags via regex, preserves unrecognized ones, and normalizes whitespace
    - Export `stripRecognizedHashtags`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 4.1, 5.1, 5.2, 5.3, 5.4, 10.1, 10.3, 10.4_

  - [ ]* 1.2 Write property test for strict 1:1 hashtag-to-category mapping
    - **Property 2: Strict 1:1 hashtag-to-category mapping**
    - For any list of parsed hashtags, `mapHashtagToCategory` returns the correct category based on the first recognized hashtag, or `'general'` if none recognized. No other category is returned.
    - **Validates: Requirements 1.3, 2.3, 3.3, 3.4, 4.1, 5.1, 5.2, 5.3, 5.4, 9.3, 9.4**

  - [ ]* 1.3 Write property test for first recognized hashtag determines category
    - **Property 3: First recognized hashtag determines category**
    - For any list containing multiple recognized hashtags, `mapHashtagToCategory` returns the category of the first recognized hashtag regardless of subsequent ones.
    - **Validates: Requirements 5.5**

  - [ ]* 1.4 Write property test for hashtag stripping
    - **Property 4: Hashtag stripping removes only recognized hashtags and normalizes whitespace**
    - For any text with a mix of recognized (`#trading`, `#cerita`, `#general`) and unrecognized hashtags, `stripRecognizedHashtags` removes all recognized hashtags, preserves unrecognized ones, and produces output with no leading/trailing whitespace and no consecutive spaces.
    - **Validates: Requirements 10.1, 10.3, 10.4**

- [x] 2. Update HashtagHandler to strip hashtags and remove content_type
  - [x] 2.1 Modify `bot/src/handlers/hashtagHandler.ts`
    - Import `stripRecognizedHashtags` from `../utils/hashtag`
    - Call `stripRecognizedHashtags(text)` before passing text to `textToHtml()`
    - Remove `content_type: 'short'` from the `insertArticle` call
    - Update the `insertArticle` dependency type in `HashtagHandlerDeps` to remove `content_type` field
    - Update handler description to reflect new hashtag set (`#trading`, `#cerita`, `#general`)
    - _Requirements: 7.3, 10.1, 10.2, 10.3, 10.4_

  - [ ]* 2.2 Write unit tests for HashtagHandler hashtag stripping
    - Test that `#trading Hari ini saya belajar tentang support` produces content without `#trading`
    - Test that unrecognized hashtags like `#bitcoin` are preserved
    - Test that middle-of-text recognized hashtags are removed with normalized whitespace
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [x] 3. Update PublishHandler to strip hashtags and remove content_type
  - [x] 3.1 Modify `bot/src/handlers/publishHandler.ts`
    - Import `stripRecognizedHashtags` from `../utils/hashtag`
    - Call `stripRecognizedHashtags(text)` on the replied-to message text before `textToHtml()`
    - Remove `content_type: 'short'` from the `insertArticle` call
    - Update the `insertArticle` dependency type in `PublishHandlerDeps` to remove `content_type` field
    - _Requirements: 7.4, 9.5, 10.5_

- [x] 4. Update bot entry point — remove commands, add #general, update insertArticle
  - [x] 4.1 Modify `bot/src/index.ts`
    - Remove imports of `StoryHandler` and `CeritaHandler`
    - Remove instantiation of `storyHandler` and `ceritaHandler`
    - Remove `commandRegistry.register(storyHandler)` and `commandRegistry.register(ceritaHandler)`
    - Remove `commandRegistry.register(createHashtagAlias('#jurnal'))` and `commandRegistry.register(createHashtagAlias('#kehidupan'))`
    - Add `commandRegistry.register(createHashtagAlias('#general'))`
    - Update `insertArticle` function: remove `content_type` from parameter type, SQL INSERT columns, VALUES placeholders, and values array
    - _Requirements: 1.1, 1.2, 2.1, 2.2, 3.1, 3.2, 4.3, 7.5, 11.3_

  - [ ]* 4.2 Write property test for removed commands resolve to null
    - **Property 1: Removed commands resolve to null**
    - For any message text starting with `/story` or `/cerita` (followed by any content), `CommandRegistry.resolve()` returns `null`.
    - **Validates: Requirements 1.1, 2.1**

- [x] 5. Checkpoint — Ensure all bot-side changes compile and tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Delete handler files and update shared types
  - [x] 6.1 Delete `bot/src/handlers/storyHandler.ts` and `bot/src/handlers/ceritaHandler.ts`
    - Delete both files from the repository
    - _Requirements: 11.1, 11.2_

  - [x] 6.2 Remove ContentType and content_type from `shared/types/index.ts`
    - Remove the `ContentType` const object and its type export
    - Remove the `content_type: ContentType` field from the `Article` interface
    - _Requirements: 7.1, 7.2_

- [x] 7. Create database migration to drop content_type column
  - [x] 7.1 Create `db/migrations/003_drop_content_type.sql`
    - Add `ALTER TABLE articles DROP COLUMN content_type;` with a descriptive comment
    - _Requirements: 6.1, 6.2, 6.3_

- [x] 8. Remove content_type from frontend feed and article pages
  - [x] 8.1 Update `frontend/src/components/feed/ArticleCard.tsx`
    - Remove `content_type` from the `ArticleCardData` interface
    - _Requirements: 7.6_

  - [x] 8.2 Update `frontend/src/components/feed/FeedList.tsx`
    - Remove conditional rendering based on `content_type === 'long'`
    - Always render `ArticleCard` for all articles (remove `ArticleLongCard` import and usage)
    - _Requirements: 7.6_

  - [x] 8.3 Update `frontend/src/app/page.tsx` (Feed Page)
    - Remove `content_type` from `ArticleRow` interface
    - Remove `a.content_type` from SQL SELECT query
    - Remove `content_type` from the mapping to `ArticleCardData`
    - _Requirements: 6.4, 7.6_

  - [x] 8.4 Update `frontend/src/components/article/ArticleContent.tsx`
    - Remove `contentType` prop from the interface
    - Use a single layout style (remove long/short distinction)
    - _Requirements: 7.6_

  - [x] 8.5 Update `frontend/src/app/artikel/[slug]/page.tsx`
    - Remove `content_type` from `ArticleRow` and mapped data interfaces
    - Remove `a.content_type` from SQL SELECT
    - Remove `isLong` variable and related conditional logic
    - Remove `contentType` prop from `ArticleContent` usage
    - _Requirements: 6.4, 7.6_

  - [x] 8.6 Update `frontend/src/app/outlook/[slug]/page.tsx`
    - Remove `content_type` from row types and SQL SELECT
    - Remove `contentType` prop from `ArticleContent` usage
    - _Requirements: 6.4, 7.6_

- [x] 9. Remove content_type from frontend API routes
  - [x] 9.1 Update `frontend/src/app/api/articles/route.ts`
    - Remove `content_type` from GET response mapping
    - Remove `content_type` from POST body destructuring and INSERT SQL
    - _Requirements: 6.4, 7.6_

  - [x] 9.2 Update `frontend/src/app/api/articles/[id]/route.ts`
    - Remove `content_type` from PUT body destructuring and dynamic update logic
    - _Requirements: 6.4, 7.6_

  - [x] 9.3 Update `frontend/src/app/api/users/[id]/route.ts`
    - Remove `content_type` from article data mapping
    - _Requirements: 7.6_

- [x] 10. Remove content_type from admin components and pages
  - [x] 10.1 Update `frontend/src/components/admin/ArticleEditor.tsx`
    - Remove `content_type` from `ArticleData` interface
    - Remove `CONTENT_TYPES` array and the content type `<select>` dropdown
    - Remove `contentType` state variable
    - Remove `content_type` from the submitted data object
    - _Requirements: 7.6_

  - [x] 10.2 Update `frontend/src/components/admin/OutlookEditor.tsx`
    - Remove `content_type: 'long'` from `OutlookArticleData` interface
    - Remove `content_type` from the submitted data object
    - _Requirements: 7.6_

  - [x] 10.3 Update `frontend/src/app/admin/(dashboard)/outlook/new/page.tsx`
    - Remove `content_type: 'long'` from the API request body
    - _Requirements: 7.6_

  - [x] 10.4 Update `frontend/src/app/admin/(dashboard)/articles/page.tsx`
    - Remove `content_type` from the article row type interface
    - _Requirements: 7.6_

  - [x] 10.5 Update `frontend/src/app/admin/(dashboard)/articles/[id]/edit/page.tsx`
    - Remove `content_type` from the article row type and `initialData` mapping
    - _Requirements: 7.6_

  - [x] 10.6 Update `frontend/src/app/admin/(dashboard)/users/[id]/page.tsx`
    - Remove `content_type` from the article row type interface
    - _Requirements: 7.6_

  - [x] 10.7 Update `frontend/src/components/admin/UserProfile.tsx`
    - Remove `content_type` from the article type interface
    - _Requirements: 7.6_

- [x] 11. Final checkpoint — Ensure all tests pass and no content_type references remain
  - Ensure all tests pass, ask the user if questions arise.
  - Verify no remaining references to `content_type` in bot or frontend source code (excluding migration files and this spec).

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- The `/help` handler requires no code changes — it dynamically reads from the command registry
- `ArticleLongCard` component is no longer used after task 8.2 and can be cleaned up separately
