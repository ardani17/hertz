# Implementation Plan: Horizon Community Platform

## Overview

Implementasi Horizon Community Platform mengikuti 5 milestone berurutan: scaffold & theme, database setup, public views, S3 integration & admin panel, dan Telegram integration. Setiap task membangun di atas task sebelumnya, memastikan tidak ada kode yang orphan. Testing menggunakan Vitest dan fast-check untuk property-based tests.

## Tasks

- [x] 1. Scaffold & Theme
  - [x] 1.1 Initialize Next.js project with TypeScript strict mode and install dependencies
    - Run `npx create-next-app@latest` with App Router and TypeScript
    - Install dependencies: `embla-carousel-react`, `lucide-react`, `@prisma/client`, `prisma`, `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`
    - Install dev dependencies: `vitest`, `fast-check`, `@testing-library/react`, `@testing-library/jest-dom`
    - Enable strict mode in `tsconfig.json`
    - _Requirements: 1.1, 1.2, 1.3_

  - [x] 1.2 Configure Tailwind CSS with Horizon color palette and typography
    - Set primary colors: Forest Green (`#228B22`), Emerald Green (`#50C878`)
    - Set background colors: Off-white (`#FAF9F6`), Pale Cream (`#FFFDD0`)
    - Configure fonts: Nunito for headings, Inter for body text via `next/font/google`
    - _Requirements: 1.1, 1.2, 1.3_

  - [x] 1.3 Build RootLayout and Navbar component
    - Create `app/layout.tsx` with font configuration and global theme
    - Create `components/navbar.tsx` with three navigation links: Beranda (`/`), Gallery (`/gallery`), Tools (external `https://tools.horizon.com` with `target="_blank"` and `rel="noopener noreferrer"`)
    - Display "Horizon" branding in navbar
    - Ensure Navbar renders consistently on all pages
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 1.4_

  - [x] 1.4 Set up Vitest configuration for the project
    - Create `vitest.config.ts` with path aliases matching `tsconfig.json`
    - Configure test environment for React component testing
    - Add test scripts to `package.json`
    - _Requirements: (infrastructure)_

- [x] 2. Checkpoint - Verify scaffold and theme
  - Ensure the project builds without errors, Navbar renders correctly, and Vitest runs. Ask the user if questions arise.

- [ ] 3. Database Setup
  - [x] 3.1 Initialize Prisma with PostgreSQL schema
    - Run `npx prisma init`
    - Create `prisma/schema.prisma` with Post model (id, title, content, type, media, createdAt, updatedAt), Media model (id, url, mediaType, order, postId), PostType enum (SHORT_STORY, ARTICLE, GALLERY), and MediaType enum (IMAGE, VIDEO)
    - Configure cascade delete on Post → Media relation
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_

  - [ ] 3.2 Create Prisma client singleton and seed data
    - Create `lib/prisma.ts` with singleton pattern for Prisma client
    - Create `prisma/seed.ts` with sample data: a few SHORT_STORY posts, an ARTICLE post with title and content, and a GALLERY post with Media records
    - Configure seed script in `package.json`
    - _Requirements: 10.1, 10.2, 10.3_

- [ ] 4. Public Views
  - [ ] 4.1 Create content formatter utility
    - Create `lib/content-formatter.ts` with `formatContent()` function that preserves line breaks
    - Handle edge cases: empty string, string without line breaks, string with multiple consecutive line breaks
    - _Requirements: 12.1, 12.3, 7.3_

  - [ ]* 4.2 Write property test for content round-trip (Property 6)
    - **Property 6: Round-trip konten post mempertahankan format asli**
    - Generator: random string with `\n` line breaks using fast-check
    - Assertion: `formatContent(content)` preserves all line breaks from original content
    - Minimum 100 iterations
    - **Validates: Requirements 7.3, 12.1, 12.3**

  - [ ] 4.3 Build Home Page with FeedCard component
    - Create `app/page.tsx` as Server Component querying Post where type IN (SHORT_STORY, ARTICLE), ordered by `createdAt` descending
    - Create `components/feed-card.tsx` that visually differentiates SHORT_STORY vs ARTICLE
    - ARTICLE: display title prominently with distinct styling
    - SHORT_STORY: compact display without prominent title
    - Format content preserving line breaks using `formatContent()`
    - Show empty state message "Belum ada cerita dari Keluarga Horizon" when no posts exist
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 1.4_

  - [ ] 4.4 Build Gallery Page with GalleryCard and MediaCarousel components
    - Create `app/gallery/page.tsx` as Server Component querying Post where type = GALLERY, including media relation ordered by `order` ascending
    - Create `components/gallery-card.tsx` that renders single media or carousel based on media count
    - Create `components/media-carousel.tsx` as Client Component using `embla-carousel-react` for swipeable carousel
    - Render `<img>` for IMAGE and `<video controls>` for VIDEO with `w-full aspect-square object-cover` styling
    - Display caption below media
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 5. Checkpoint - Verify public views
  - Ensure all tests pass, Home Page and Gallery Page render correctly with seed data. Ask the user if questions arise.

- [ ] 6. S3 Integration & Admin Panel
  - [ ] 6.1 Create S3 client and helper utilities
    - Create `lib/s3.ts` with `getS3Client()`, `generatePresignedUrl()`, and `deleteS3Object()` functions
    - Use `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner`
    - Configure via environment variables (S3 endpoint, bucket, access key, secret key, region)
    - _Requirements: 6.4, 11.3_

  - [ ] 6.2 Create file validation utility
    - Create `lib/validators.ts` with `validateFileSize()` function
    - Accept `FileValidationInput` with `size` (bytes) and `mediaType` (IMAGE | VIDEO)
    - IMAGE: max 5MB (5 * 1024 * 1024 bytes), VIDEO: max 25MB (25 * 1024 * 1024 bytes)
    - Return `{ valid: boolean; error?: string }` with descriptive error messages
    - _Requirements: 6.2, 6.3_

  - [ ]* 6.3 Write property test for file size validation (Property 1)
    - **Property 1: File size validation menolak file yang melebihi batas**
    - Generator: random file size (0 - 100MB), random mediaType (IMAGE | VIDEO) using fast-check
    - Assertion: accepted iff (IMAGE && size <= 5MB) || (VIDEO && size <= 25MB)
    - Minimum 100 iterations
    - **Validates: Requirements 6.2, 6.3**

  - [ ] 6.4 Create upload API route for pre-signed URLs
    - Create `app/api/upload/route.ts` with POST handler
    - Accept `{ filename, contentType }` in request body
    - Validate content type (must be image/* or video/*)
    - Generate pre-signed URL via `generatePresignedUrl()`
    - Return `{ presignedUrl, finalUrl }`
    - _Requirements: 6.4_

  - [ ] 6.5 Build Admin authentication with Server Action
    - Create `lib/actions/post-actions.ts` with `validateAdminPassword()` Server Action
    - Validate against `ADMIN_PASSWORD` environment variable
    - Return false if `ADMIN_PASSWORD` is not configured
    - Create `components/admin/auth-form.tsx` with password input form
    - Display error message on invalid password
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [ ] 6.6 Build Admin Dashboard page with tab navigation
    - Create `app/admin/page.tsx` as Client Component managing auth state
    - Show `AdminAuthForm` when not authenticated
    - After authentication: show tabs/sections for Gallery Upload, Article Editor, and Moderation
    - _Requirements: 5.1, 5.2_

  - [ ] 6.7 Build Gallery Upload form
    - Create `components/admin/gallery-upload-form.tsx` as Client Component
    - Multi-file input with `accept="image/*,video/*"`
    - Client-side file size validation using `validateFileSize()`
    - Upload files to S3 via pre-signed URLs from `/api/upload`
    - Input field for caption
    - Create `lib/actions/gallery-actions.ts` with `createGalleryPost()` Server Action to save Post (type=GALLERY) + Media records
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

  - [ ] 6.8 Build Article Editor form
    - Create `components/admin/article-editor-form.tsx` as Client Component
    - Form with Title (text input) and Content (textarea supporting line breaks)
    - Create `createArticle()` Server Action in `lib/actions/post-actions.ts` to save Post (type=ARTICLE)
    - _Requirements: 7.1, 7.2, 7.3_

  - [ ] 6.9 Build Post Moderation list with delete functionality
    - Create `components/admin/post-moderation-list.tsx` as Client Component
    - Display list of all posts with type indicator
    - "Delete" button per post with confirmation dialog
    - Create `deletePost()` Server Action in `lib/actions/post-actions.ts`
    - Cascade delete: remove Post + Media from DB, delete S3 files for Gallery posts
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [ ] 7. Checkpoint - Verify admin panel and S3 integration
  - Ensure all tests pass, admin authentication works, gallery upload and article creation function correctly. Ask the user if questions arise.

- [ ] 8. Telegram Integration
  - [ ] 8.1 Create Telegram message parser utility
    - Create `lib/telegram-parser.ts` with `parseTelegramMessage()` function
    - Parse `/story <text>` → `{ type: 'SHORT_STORY', content: text }`
    - Parse `/cerita <title>\n<body>` → `{ type: 'ARTICLE', title, content: body }`
    - Return `{ type: 'IGNORED' }` for unrecognized messages
    - Handle edge cases: empty text after command, command without space
    - _Requirements: 9.4, 9.5, 9.6, 9.7, 12.2_

  - [ ]* 8.2 Write property test for /story parsing (Property 3)
    - **Property 3: Parsing command /story menghasilkan SHORT_STORY**
    - Generator: random non-empty string `t` using fast-check
    - Assertion: `parseTelegramMessage('/story ' + t)` returns `{ type: 'SHORT_STORY', content: t }`
    - Minimum 100 iterations
    - **Validates: Requirements 9.4**

  - [ ]* 8.3 Write property test for /cerita parsing (Property 4)
    - **Property 4: Parsing command /cerita mengekstrak title dan content**
    - Generator: random non-empty string `title` (no newlines), random string `body` (can be multi-line) using fast-check
    - Assertion: `parseTelegramMessage('/cerita ' + title + '\n' + body)` returns `{ type: 'ARTICLE', title, content: body }`
    - Minimum 100 iterations
    - **Validates: Requirements 9.5, 9.6, 12.2**

  - [ ]* 8.4 Write property test for unrecognized messages (Property 5)
    - **Property 5: Pesan tanpa command yang dikenali diabaikan**
    - Generator: random string that does NOT start with `/story ` or `/cerita ` using fast-check
    - Assertion: `parseTelegramMessage(text)` returns `{ type: 'IGNORED' }`
    - Minimum 100 iterations
    - **Validates: Requirements 9.7**

  - [ ] 8.5 Build Telegram webhook API route
    - Create `app/api/telegram/route.ts` with POST handler
    - Validate `chat.id` against `ALLOWED_CHAT_ID` environment variable
    - Process messages from all members of the allowed group (no user ID restriction)
    - Use `parseTelegramMessage()` to determine action
    - Save SHORT_STORY or ARTICLE posts to database
    - Always return HTTP 200 OK (even for invalid/ignored messages)
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7_

  - [ ]* 8.6 Write property test for chat-level authorization (Property 2)
    - **Property 2: Chat-level authorization memproses hanya grup yang diizinkan**
    - Generator: random chat ID (number), random user ID (number) using fast-check
    - Assertion: message is processed iff `chatId === ALLOWED_CHAT_ID`, regardless of user ID
    - Minimum 100 iterations
    - **Validates: Requirements 9.2, 9.3**

- [ ] 9. Deployment Configuration
  - [ ] 9.1 Create Dockerfile and README documentation
    - Create optimized `Dockerfile` for Next.js standalone build
    - Create/update `README.md` with project setup instructions
    - Include note: "If deploying with Nginx, ensure `client_max_body_size 100M;` is set to allow video uploads"
    - Document all required environment variables: `DATABASE_URL`, `ADMIN_PASSWORD`, `ALLOWED_CHAT_ID`, S3 credentials
    - Create `.env.example` with all required environment variables
    - _Requirements: 11.1, 11.2, 11.3_

- [ ] 10. Final Checkpoint - Ensure all tests pass
  - Run full test suite, verify all property-based tests pass with minimum 100 iterations. Ensure all components are wired together and no orphaned code exists. Ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation after each milestone
- Property tests validate universal correctness properties using fast-check
- Unit tests validate specific examples and edge cases using Vitest
- All code uses TypeScript with strict mode enabled
- The project follows the 5-milestone execution roadmap from the user's specification
