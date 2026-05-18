# HERTZ Comment Replies Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add one-level reply support to HERTZ comments.

**Architecture:** Use existing `parent_comment_id` schema, extend repository/service/API to accept parent IDs, and map flat rows into a one-level comment tree for UI rendering. The UI adds inline reply forms under each comment and renders replies indented below their parent.

**Tech Stack:** PostgreSQL existing schema, shared TypeScript repositories/services/types, Next.js App Router route handlers, React client component, CSS modules, Vitest, Next build.

---

### Task 1: Backend comment tree and parent creation

**Files:**
- Modify: `shared/types/feed.ts`
- Modify: `shared/repositories/hertzCommentRepository.ts`
- Modify: `shared/services/hertzCommentService.ts`
- Modify: `shared/services/hertzPostService.ts`
- Modify: `frontend/src/app/api/hertz/posts/[shortId]/comments/route.ts`
- Test: `tests/unit/shared/hertzCommentReplies.test.ts`

- [ ] Write failing unit tests for one-level comment tree behavior.
- [ ] Extend `HertzComment` with `parentCommentId` and `replies`.
- [ ] Let repository create comments with optional `parentCommentId`.
- [ ] Validate parent comment belongs to same post and is visible.
- [ ] Map comments into top-level comments with replies.
- [ ] API accepts optional `parentCommentId`.
- [ ] Run focused backend tests.

### Task 2: UI reply form and nested display

**Files:**
- Modify: `frontend/src/components/feed/HertzDetailInteractions.tsx`
- Modify: `frontend/src/components/feed/HertzDetailInteractions.module.css`
- Test: `tests/unit/frontend/hertzMessages.test.ts` or `tests/unit/frontend/hertzPostDetail.test.ts`

- [ ] Add reply state and submit handler using `parentCommentId`.
- [ ] Add `Balas` action for logged-in users.
- [ ] Render reply form under active parent comment.
- [ ] Render replies indented under parent comment.
- [ ] Run focused frontend tests.

### Task 3: Verification and commit

**Files:**
- All related files above.

- [ ] Run focused tests.
- [ ] Run `npm run build:frontend`.
- [ ] Stage only reply-comment related files.
- [ ] Commit implementation.
