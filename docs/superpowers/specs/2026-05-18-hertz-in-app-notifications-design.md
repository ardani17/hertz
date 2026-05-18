# HERTZ In-App Notifications Design

Date: 2026-05-18
Status: Approved for implementation

## Goal

Add a lightweight in-app notification experience for HERTZ social activity that feels like common social media: visible when useful, unobtrusive while reading the feed, easy to scan, and quick to act on.

The first implementation covers:

- like/pulse notifications;
- comment notifications;
- repost and quote notifications;
- direct-message notifications;
- fresh unread badges on desktop and mobile.

## Current State

HERTZ currently has only minimal notification indicators:

- mobile bottom navigation shows a DM unread badge from `/api/auth/me`;
- desktop right rail shows an activity card with DM unread copy;
- DM inbox and thread state track unread count via `hertz_conversation_participants.last_read_at`;
- backend push events exist for DM and comments, but there is no in-app notification center.

This means social activity such as likes, comments, reposts, and quotes does not appear in a unified app UI.

## User Experience

### Desktop

Add a `Notifikasi` entry to the HERTZ left rail with a small unread badge. It should behave like other social navigation items and not cover the feed.

Add a dedicated `/hertz/notifications` page that lists activity in a compact timeline. This avoids a disruptive modal and works well with the existing HERTZ app shell.

The desktop right rail activity card may continue to show a lightweight summary, but it should be backed by the same notification summary endpoint instead of only DM unread state.

### Mobile

Add a compact `Notif` tab to the bottom navigation with the same unread badge behavior. To avoid crowding, mobile labels stay short: `Home`, `Outlook`, `Blog`, `Tools`, `Notif`, `DM`, `Akun` only if the layout remains acceptable. If space becomes too tight, `Tools` can remain visible but labels are already small and the nav supports compact sizing.

The notification page uses a normal full-page mobile layout, not a blocking overlay. This keeps feed reading comfortable and avoids popups.

### Notification List

Each item shows:

- actor name/avatar fallback;
- action text in Indonesian;
- target preview;
- relative/short timestamp;
- unread visual state;
- destination link.

Examples:

- `Budi menyukai postingan Anda.`
- `Sari mengomentari postingan Anda.`
- `Andi me-repost postingan Anda.`
- `Rina mengutip postingan Anda.`
- `Anda menerima DM baru.`

Clicking an item navigates to the relevant target:

- post interactions: `/hertz/post/[shortId]`;
- comment interactions: `/hertz/post/[shortId]` with comment metadata stored for future deep linking;
- quote/repost: original post destination for the first version;
- DM: `/hertz/messages`.

The notification page includes a `Tandai semua dibaca` action.

## Data Model

Create a dedicated HERTZ notification table, separate from mobile push `notification_events` because in-app read state and social timeline behavior are different from device delivery logs.

Proposed table: `hertz_notifications`

Columns:

- `id uuid primary key default gen_random_uuid()`;
- `user_id uuid not null references users(id) on delete cascade` — recipient;
- `actor_user_id uuid references users(id) on delete set null`;
- `type text not null` with allowed values:
  - `pulse`
  - `comment`
  - `repost`
  - `quote`
  - `dm`
- `target_type text not null` with allowed values:
  - `post`
  - `comment`
  - `conversation`
- `target_id uuid not null`;
- `post_id uuid references hertz_posts(id) on delete cascade` when the target belongs to a post;
- `conversation_id uuid references hertz_conversations(id) on delete cascade` for DM;
- `metadata jsonb not null default '{}'::jsonb` for short IDs, preview text, message IDs, and future deep-link hints;
- `read_at timestamptz`;
- `created_at timestamptz not null default now()`.

Indexes:

- `(user_id, created_at desc)` for timeline;
- `(user_id, read_at)` for unread count;
- partial dedupe indexes where useful to prevent spam from repeated toggles.

## Notification Creation Rules

### Pulse/Like

When a member pulses another user's post, create a `pulse` notification for the post author. Do not notify when the actor is the author. Do not create a new notification when the pulse is toggled off. For repeated on/off/on behavior, prefer updating or reusing a recent notification rather than creating excessive duplicates.

### Comment

When a member comments on another user's post, create a `comment` notification for the post author. Do not notify the commenter if they comment on their own post.

### Repost/Quote

When a member reposts or quotes another user's post, create `repost` or `quote` notification for the original post author. Do not notify for self-repost attempts, which are already blocked.

### DM

When a member sends a DM, create a `dm` notification for the other participant. Existing DM unread counts remain the source of truth for unread DM badge math, while the in-app notification timeline provides the social activity record.

## API Design

Add HERTZ notification endpoints:

- `GET /api/hertz/notifications`
  - requires member login;
  - returns recent notifications, newest first;
  - includes unread count summary;
  - optional limit defaults to a safe small number.

- `GET /api/hertz/notifications/summary`
  - requires member login;
  - returns `{ unreadCount, unreadDmCount }`;
  - used by nav badges and right-rail activity.

- `POST /api/hertz/notifications/read`
  - requires member login;
  - marks all notifications as read, or one notification if `id` is provided.

`/api/auth/me` can continue to return the existing notification summary for compatibility, but new HERTZ UI should use the dedicated endpoints.

## Frontend Components

Add focused notification UI pieces:

- `HertzNotificationBadge` or shared helper for badge labels;
- notification nav integration in:
  - `frontend/src/components/feed/HertzLeftRail.tsx`;
  - `frontend/src/components/hertz/MobileBottomNav.tsx`;
- notification page:
  - `frontend/src/app/hertz/notifications/page.tsx`;
  - `frontend/src/app/hertz/notifications/NotificationsClient.tsx`;
  - page CSS module.

Polling should be light:

- fetch summary on mount;
- refresh every 25 seconds while the nav component is mounted;
- refresh immediately after marking read;
- avoid aggressive per-second polling.

## Error and Empty States

- Guest users see a login CTA similar to DM/profile flows.
- Logged-in users with no notifications see an empty state: `Belum ada notifikasi` with explanation that likes, komentar, repost, quote, and DM will appear here.
- API failures should show a compact retryable error without blocking the rest of HERTZ.

## Testing and Verification

Add unit tests for notification summary helpers and service/repository behavior where existing test setup supports it.

Required verification before completion:

- run the relevant frontend check/build command, not a dev server;
- verify TypeScript/build compatibility with Next.js 16 conventions;
- ensure unrelated dirty working-tree changes are not included in commits.

## Out of Scope for First Version

- User-configurable notification settings;
- browser permission prompt UX;
- realtime WebSocket/SSE updates;
- deep scroll-to-comment behavior;
- notification grouping/aggregation such as `3 orang menyukai postingan Anda`.
