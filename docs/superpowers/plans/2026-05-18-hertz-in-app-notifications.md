# HERTZ In-App Notifications Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build HERTZ in-app notifications for pulse/like, comments, repost/quote, and DM, with unobtrusive desktop/mobile badges and a dedicated notification page.

**Architecture:** Add a dedicated `hertz_notifications` table for in-app social timeline/read state, then expose it through shared repository/service classes and App Router route handlers. Existing social action services create notifications as side effects, while HERTZ navigation and the notification page consume lightweight summary/list APIs with modest polling.

**Tech Stack:** PostgreSQL migrations, shared TypeScript repositories/services, Next.js 16 App Router route handlers, React 19 client components, CSS modules, Vitest, existing HERTZ app shell.

---

## File Structure

- `db/migrations/013_create_hertz_notifications.sql` — creates the in-app notification table and indexes.
- `shared/repositories/hertzNotificationRepository.ts` — database persistence and queries for notification rows.
- `shared/services/hertzInAppNotificationService.ts` — business rules, summary/list/read operations, notification creation helpers.
- `shared/services/hertzInAppNotificationService.test.ts` — pure-helper tests.
- `shared/services/hertzNotificationService.ts` — compatibility summary for existing `/api/auth/me` consumers.
- `shared/services/hertzCommentService.ts` — creates comment notifications.
- `shared/services/hertzInteractionService.ts` — creates pulse/repost/quote notifications.
- `shared/services/hertzDmService.ts` — creates DM notifications.
- `frontend/src/app/api/hertz/notifications/route.ts` — list API.
- `frontend/src/app/api/hertz/notifications/summary/route.ts` — summary API for badges.
- `frontend/src/app/api/hertz/notifications/read/route.ts` — mark read API.
- `frontend/src/lib/hertzNotifications.ts` — client display helpers and DTOs.
- `frontend/src/lib/hertzNotifications.test.ts` — helper tests.
- `frontend/src/app/hertz/notifications/page.tsx` — page shell/metadata.
- `frontend/src/app/hertz/notifications/NotificationsClient.tsx` — interactive notification timeline.
- `frontend/src/app/hertz/notifications/page.module.css` — page styling.
- `frontend/src/components/feed/HertzLeftRail.tsx` — desktop notification nav item/badge.
- `frontend/src/components/feed/HertzRightRail.tsx` — summary-backed activity copy.
- `frontend/src/components/hertz/HertzAppShell.tsx` — active nav union.
- `frontend/src/components/hertz/MobileBottomNav.tsx` — mobile notification nav item/badge.

---

### Task 1: Database model

**Files:**
- Create: `db/migrations/013_create_hertz_notifications.sql`

- [x] **Step 1: Create migration**

Create `hertz_notifications` with recipient, actor, type, target, optional post/conversation references, metadata, `read_at`, and `created_at`. Add check constraints for `type` and `target_type`, timeline/unread indexes, and dedupe indexes for pulse and DM notifications.

- [x] **Step 2: Inspect SQL locally**

Run: `sed -n '1,220p' db/migrations/013_create_hertz_notifications.sql`
Expected: migration contains no placeholders and follows existing migration style.

---

### Task 2: Repository, service, and helper tests

**Files:**
- Create: `shared/repositories/hertzNotificationRepository.ts`
- Create: `shared/services/hertzInAppNotificationService.ts`
- Create: `shared/services/hertzInAppNotificationService.test.ts`

- [x] **Step 1: Write failing helper tests**

Test `buildHertzInAppNotificationSummary`, `getHertzNotificationHref`, and `shouldNotifyRecipient` before implementation.

- [x] **Step 2: Run test to verify failure**

Run: `npm test -- shared/services/hertzInAppNotificationService.test.ts`
Expected: FAIL because module does not exist.

- [x] **Step 3: Implement repository**

Implement create/list/count/read methods plus post/conversation recipient lookup helpers with existing `query`, `queryOne`, and `execute` helpers.

- [x] **Step 4: Implement service**

Implement pure helpers and class methods: `summary`, `list`, `markRead`, `markAllRead`, `notifyPulse`, `notifyComment`, `notifyRepost`, `notifyQuote`, and `notifyDm`.

- [x] **Step 5: Run helper test**

Run: `npm test -- shared/services/hertzInAppNotificationService.test.ts`
Expected: PASS.

---

### Task 3: Wire notification creation into social actions

**Files:**
- Modify: `shared/services/hertzNotificationService.ts`
- Modify: `shared/services/hertzCommentService.ts`
- Modify: `shared/services/hertzInteractionService.ts`
- Modify: `shared/services/hertzDmService.ts`

- [x] **Step 1: Extend compatibility summary**

Keep `unreadDmCount`/`hasUnreadDm` and add total in-app `unreadCount`/`hasUnread` to `HertzNotificationService.summary()`.

- [x] **Step 2: Create source notifications**

Call the in-app notification service from comment, pulse, repost, quote, and DM source services as non-blocking side effects. Do not create notifications for self-actions or pulse unlikes.

---

### Task 4: API route handlers

**Files:**
- Create: `frontend/src/app/api/hertz/notifications/route.ts`
- Create: `frontend/src/app/api/hertz/notifications/summary/route.ts`
- Create: `frontend/src/app/api/hertz/notifications/read/route.ts`

- [x] **Step 1: Create authenticated endpoints**

Use Next.js 16 route handlers with `export const dynamic = 'force-dynamic'`, `getCurrentMember()`, and existing `apiSuccess`/`apiErrorFromUnknown` helpers.

- [x] **Step 2: Support list, summary, and read**

List returns recent notifications and summary, summary returns badge counts, and read marks one or all notifications read.

---

### Task 5: Notification page and frontend helpers

**Files:**
- Create: `frontend/src/lib/hertzNotifications.ts`
- Create: `frontend/src/lib/hertzNotifications.test.ts`
- Create: `frontend/src/app/hertz/notifications/page.tsx`
- Create: `frontend/src/app/hertz/notifications/NotificationsClient.tsx`
- Create: `frontend/src/app/hertz/notifications/page.module.css`

- [x] **Step 1: Write helper tests**

Test badge formatting, action copy, href fallback, and timestamp formatting.

- [x] **Step 2: Run test to verify failure**

Run: `npm test -- frontend/src/lib/hertzNotifications.test.ts`
Expected: FAIL because helper module does not exist.

- [x] **Step 3: Implement helpers, page, client, and CSS**

Build a full-page HERTZ notification timeline with guest CTA, loading, error, empty, unread state, item links, and mark-all-read.

- [x] **Step 4: Run helper test**

Run: `npm test -- frontend/src/lib/hertzNotifications.test.ts`
Expected: PASS.

---

### Task 6: Navigation badges and activity summary

**Files:**
- Modify: `frontend/src/components/hertz/HertzAppShell.tsx`
- Modify: `frontend/src/components/feed/HertzLeftRail.tsx`
- Modify: `frontend/src/components/hertz/MobileBottomNav.tsx`
- Modify: `frontend/src/components/feed/HertzRightRail.tsx`

- [x] **Step 1: Add notifications active nav**

Add `'notifications'` to active nav unions.

- [x] **Step 2: Add desktop and mobile nav badges**

Add `Notifikasi` desktop and `Notif` mobile entries using `Bell`, summary polling every 25 seconds, and badge labels capped at `99+`.

- [x] **Step 3: Update right rail**

Back the right rail activity card with `/api/hertz/notifications/summary`, showing unread social activity and DM counts.

---

### Task 7: Verification and commit

**Files:**
- All files changed above.

- [x] **Step 1: Run focused tests**

Run: `npm test -- shared/services/hertzInAppNotificationService.test.ts frontend/src/lib/hertzNotifications.test.ts`
Expected: PASS.

- [x] **Step 2: Run frontend build**

Run: `npm run build:frontend`
Expected: PASS. Do not start a dev server.

- [x] **Step 3: Stage only notification files**

Run: `git status --short`
Expected: unrelated pre-existing changes remain unstaged.

- [x] **Step 4: Commit implementation**

Commit message: `Add HERTZ in-app notifications`.
