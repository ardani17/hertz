# Requirements Document

## Introduction

Horizon Social UX Uplift is the social-feel and perceived-speed pass on top of the existing Horizon platform (HERTZ feed, profile, DM, notifications, blog, outlook, tools, gallery, admin). It does not redesign the product or introduce new domains. It locks the visual identity to a single base background and accent, replaces full-page navigations with client-side routing, removes the page-refresh feel from comments and other mutations, and adds the social primitives that are currently missing: a public profile at `/@username`, a DM-from-profile path, a polling-based typing indicator, and a notification bell dropdown.

The work is scoped to surface (UX, layout, navigation, client caching, polling) and small backend additions needed to support those surfaces (typing endpoint, public profile route mapping, optional incremental DM polling, optional feed counter denormalization). Realtime transport (WebSocket/SSE) is explicitly deferred. Cloudflare/WAF and aaPanel issues are out of scope because they are not Horizon application code.

This spec assumes the foundations delivered by `signal-ledger`, `hertz-platform-refactor`, `hertz-platform-refactor-completion`, and `modern-ui-redesign`, and does not duplicate their work.

## Glossary

- **Horizon**: The full product including HERTZ feed, profile, DM, notifications, blog, outlook, tools, gallery, and admin.
- **HERTZ**: The social feed surface within Horizon (`/hertz` and children).
- **Horizon_Shell**: The shared layout shell (currently `HertzLayout` and `HertzAppShell`) that wraps HERTZ and the public content surfaces (Blog, Outlook, Tools, Gallery).
- **Admin_Shell**: The admin dashboard layout under `/admin`.
- **Design_Tokens**: Global CSS custom properties defined in `globals.css` that all surfaces consume (e.g., `--horizon-bg-base`, `--horizon-accent`, `--horizon-surface`, `--horizon-border`, `--horizon-text`, `--horizon-text-muted`).
- **Internal_Route**: Any route served by the Horizon Next.js app (paths starting with `/`, excluding external `http(s)://` URLs).
- **SPA_Navigation**: Client-side route transition handled by the Next.js router (e.g., `next/link`, `router.push`) without a full document reload.
- **SWR_Layer**: The shared client data-fetching layer based on the SWR library, providing dedupe, cache, polling, and optimistic update primitives.
- **Optimistic_Update**: A UI state change that is applied locally before the server confirms, with a rollback on server error.
- **Public_Profile**: The read-only profile of any HERTZ member, accessible to both authenticated and unauthenticated viewers, served at the public URL `/@<username>`.
- **DM_Conversation**: A direct-message conversation between exactly two members.
- **Typing_Status**: A short-lived record `{conversationId, userId, displayName, lastTypingAt}` indicating that a user is currently composing a message.
- **Typing_TTL**: The server-side time-to-live after which a stored Typing_Status is considered expired and is no longer returned.
- **Notification_Bell**: The top-right bell icon in Horizon_Shell that opens the Notification_Dropdown.
- **Notification_Dropdown**: The popover panel anchored to Notification_Bell on desktop, and the bottom sheet on mobile, listing recent notifications with quick actions.
- **Notification_Page**: The full notifications archive at `/hertz/notifications`.
- **Visibility_Pause**: Behavior where a polling loop suspends fetches while `document.visibilityState === 'hidden'` and resumes when the document becomes visible again.
- **Counter_Cache**: A denormalized per-post counter table (`hertz_post_stats`) holding `comment_count`, `pulse_count`, `repost_count`, and `view_count`.

## Requirements

### Requirement 1: Locked Visual Identity Tokens

**User Story:** As a Horizon visitor, I want every page in the product to use the same base background and accent, so that Horizon feels like one product instead of a collection of different surfaces.

#### Acceptance Criteria

1. THE Design_Tokens SHALL define `--horizon-bg-base` with the value `#0a0a0f`.
2. THE Design_Tokens SHALL define `--horizon-accent` with the value `#13d27b`.
3. THE Design_Tokens SHALL define `--horizon-surface`, `--horizon-surface-strong`, `--horizon-border`, `--horizon-text`, and `--horizon-text-muted` as the single source of truth for panel, border, and text styling across Horizon.
4. WHERE a green color other than `#13d27b` is used (`#10b981`, `#00e38a`, `#34d399`, `#059669`), THE Design_Tokens SHALL expose it only as a derived secondary or state token, not as a primary brand accent.
5. THE Horizon_Shell SHALL render its page background using `--horizon-bg-base` as the base color.
6. THE Admin_Shell SHALL render its page background using `--horizon-bg-base` as the base color.
7. THE landing page (`/`) SHALL render its base background using `--horizon-bg-base`, and any depth gradient SHALL start from `--horizon-bg-base`.
8. THE HERTZ feed, profile, DM, notifications, blog, outlook, tools, gallery, and admin surfaces SHALL each render their page background from `--horizon-bg-base` with no hardcoded base color overriding it.
9. WHEN `--horizon-bg-base` or `--horizon-accent` is changed in `globals.css`, THE Horizon product SHALL reflect the new value on every surface listed in criterion 8 without further per-page changes.

### Requirement 2: SPA Navigation for Internal Routes

**User Story:** As a HERTZ user, I want navigating between feed, notifications, messages, profile, and tools to feel instant, so that the product feels like a modern app instead of a classic website.

#### Acceptance Criteria

1. WHEN a user activates an Internal_Route link in `HertzLayout`, `HertzLeftRail`, `MobileBottomNav`, the post-detail back link, or any other shell-level navigation control, THE Horizon product SHALL perform SPA_Navigation without a full document reload.
2. THE Horizon product SHALL render Internal_Route navigation controls using `next/link` (or `router.push` for action-driven transitions), and SHALL NOT use raw `<a href>` for Internal_Route navigation.
3. WHERE a link points to an external URL or to a resource that must be downloaded, THE Horizon product SHALL continue to use a raw `<a>` element.
4. WHEN SPA_Navigation occurs between two HERTZ tabs, THE Horizon_Shell SHALL preserve mounted shell state (sidebar, notification badge, and any cached client state) instead of re-mounting from scratch.
5. WHEN a user hovers an Internal_Route link in a desktop browser, THE Horizon product SHALL prefetch the target route using the Next.js link prefetch behavior unless prefetch is explicitly disabled for that link.

### Requirement 3: Shared Client Data Layer (SWR_Layer)

**User Story:** As a HERTZ user, I want the data on screen to stay fresh and consistent across components without me reloading, so that badges, counts, and lists do not contradict each other.

#### Acceptance Criteria

1. THE Horizon product SHALL use a single SWR_Layer for client-side data fetching of HERTZ comments, notification summary, notification list, DM inbox, DM thread, and current-user (`/api/auth/me`) data.
2. WHEN two or more components mount with the same SWR cache key during overlapping lifetimes, THE SWR_Layer SHALL deduplicate the underlying network request.
3. THE SWR_Layer SHALL expose a typed `fetcher` and a typed `useResource` (or equivalent hook) so that callers do not implement ad-hoc `fetch + useEffect + setState` patterns for the resources listed in criterion 1.
4. WHEN a mutation occurs (post comment, like, pulse, bookmark, mark-as-read, send DM), THE SWR_Layer SHALL revalidate the affected cache keys after the server confirms the mutation.
5. THE SWR_Layer SHALL pause periodic revalidation while `document.visibilityState === 'hidden'` and SHALL resume on the next visibility change to `visible`.

### Requirement 4: Optimistic UI for High-Frequency Mutations

**User Story:** As a HERTZ user, I want my likes, pulses, bookmarks, comments, mark-as-read, and DM sends to appear instantly, so that the product never feels like it is waiting on the network.

#### Acceptance Criteria

1. WHEN a user submits a comment, like, pulse, bookmark, mark-as-read, or DM send action, THE Horizon product SHALL apply an Optimistic_Update to the relevant SWR cache before the server response arrives.
2. IF the server returns a non-2xx response for an Optimistic_Update, THEN THE Horizon product SHALL roll back the cache to the pre-mutation state and SHALL surface a non-blocking error indication to the user.
3. WHEN the server confirms an Optimistic_Update with a 2xx response, THE Horizon product SHALL reconcile the optimistic entry with the server-returned canonical entity (id, timestamps, computed fields) without a visible re-flicker.
4. THE Horizon product SHALL apply Optimistic_Updates idempotently, so that retrying or duplicating an in-flight mutation SHALL NOT create duplicate items in the SWR cache.
5. WHEN an Optimistic_Update is rolled back, THE Horizon product SHALL restore counters, list order, and read/unread state to the values they held immediately before the optimistic step.

### Requirement 5: Comments Auto-Refresh Without Page Refresh

**User Story:** As a HERTZ user, I want new comments to appear without the page reloading, so that reading and replying feels like a conversation rather than a form submission.

#### Acceptance Criteria

1. WHEN a user submits, edits, deletes, or reports a comment on a HERTZ post detail, THE Horizon product SHALL update the comment list via the SWR_Layer and SHALL NOT call `router.refresh()` for that mutation in the success path.
2. WHILE a HERTZ post detail page is open and visible, THE Horizon product SHALL revalidate the comment list at a polling interval between 5 and 10 seconds inclusive.
3. WHEN a remote user posts a new comment on a HERTZ post that the current user is viewing, THE Horizon product SHALL display the new comment within one polling interval after it becomes available from the server.
4. WHILE the HERTZ post detail tab is hidden, THE Horizon product SHALL apply Visibility_Pause to comment polling.
5. IF a comment mutation request fails, THEN THE Horizon product MAY fall back to `router.refresh()` to recover authoritative state, and SHALL inform the user that the action did not complete.
6. WHEN a comment Optimistic_Update is reconciled with the server response, THE Horizon product SHALL preserve the user's scroll position on the post detail.

### Requirement 6: Infinite Feed and Skeleton Loaders

**User Story:** As a HERTZ user on a slow connection, I want the feed to show structure immediately and load more as I scroll, so that I never see a blank screen and never have to click a pagination control.

#### Acceptance Criteria

1. WHILE the HERTZ feed is fetching its first page, THE Horizon product SHALL render a skeleton loader that matches the post-card layout.
2. WHEN the user scrolls to within a configured threshold of the bottom of the HERTZ feed, THE Horizon product SHALL fetch and append the next page using the SWR_Layer.
3. WHILE additional feed pages are loading, THE Horizon product SHALL render a footer skeleton or spinner without removing already-rendered posts.
4. IF a feed page fetch fails, THEN THE Horizon product SHALL display a retry control without discarding posts already loaded.
5. THE Horizon product SHALL render skeleton loaders for the notification list, DM thread, and comment list while their first page is loading.

### Requirement 7: Public Profile at `/@username`

**User Story:** As a HERTZ visitor, I want to open another member's profile by visiting `/@username`, so that profile links are short, shareable, and recognizable as social URLs.

#### Acceptance Criteria

1. WHEN an authenticated or unauthenticated viewer requests `/@<username>` for an existing HERTZ member, THE Horizon product SHALL respond with the Public_Profile of that member.
2. THE Horizon product SHALL expose the Public_Profile under the public URL `/@<username>` regardless of how it is implemented internally (catch-all route, parallel route, or middleware rewrite to an internal path such as `/hertz/u/[username]`).
3. THE Public_Profile SHALL display only data that is safe to expose publicly (display name, username, avatar, bio, public counters, public posts) and SHALL NOT expose private fields such as email, session-bound counters, or admin-only data.
4. WHEN a viewer activates a username or avatar in the HERTZ feed, post detail, comment list, or DM list, THE Horizon product SHALL navigate to `/@<username>` via SPA_Navigation.
5. IF `<username>` does not match any existing member, THEN THE Horizon product SHALL respond with a 404 Public_Profile state.
6. WHEN the authenticated viewer opens their own Public_Profile, THE Horizon product SHALL render the same public view that other viewers see, with the DM action replaced by an "Edit profile" or equivalent self action.
7. THE Horizon product SHALL canonicalize the URL so that the displayed address bar value for a Public_Profile is `/@<username>` even if internal routing rewrites it.

### Requirement 8: DM From Public Profile

**User Story:** As a HERTZ user, I want to start a direct message from another member's profile with one click, so that DM discovery is a natural part of the social flow.

#### Acceptance Criteria

1. WHILE an authenticated viewer is on another member's Public_Profile, THE Horizon product SHALL render a DM action button.
2. WHEN the viewer activates the DM action button on another member's Public_Profile, THE Horizon product SHALL open the DM_Conversation with that member without showing a confirmation dialog.
3. WHEN the DM action is activated and a DM_Conversation between the viewer and the target member already exists, THE Horizon product SHALL reuse that existing conversation rather than creating a new one.
4. WHEN the DM action is activated and no DM_Conversation between the viewer and the target member exists, THE Horizon product SHALL create exactly one new DM_Conversation and SHALL then open it.
5. WHILE an unauthenticated viewer is on a Public_Profile, THE Horizon product SHALL either hide the DM action or render it in a state that prompts authentication when activated, and SHALL NOT call the conversation creation API as that viewer.
6. WHILE a viewer is on their own Public_Profile, THE Horizon product SHALL NOT render the DM action.
7. WHEN the DM action successfully opens a conversation, THE Horizon product SHALL focus the DM composer for that conversation.

### Requirement 9: Typing Indicator via Polling and TTL

**User Story:** As a HERTZ user in a DM, I want to see when the other person is typing without a heavy realtime stack, so that conversations feel alive while staying simple to operate.

#### Acceptance Criteria

1. WHILE a user is editing the DM composer for an active conversation, THE Horizon product SHALL emit a typing event to the server, throttled so that emissions occur no more often than once every 1.5 seconds and no less often than once every 2.0 seconds while the user is actively typing.
2. WHEN a typing event is received for a `(conversationId, userId)` pair, THE Horizon backend SHALL store a Typing_Status record and SHALL set its expiration so that records older than the Typing_TTL are no longer returned.
3. THE Typing_TTL SHALL be at least 5 seconds and at most 8 seconds inclusive.
4. WHILE a viewer has a DM_Conversation open and the tab is visible, THE Horizon product SHALL poll the conversation's typing status at an interval between 3 and 5 seconds inclusive.
5. WHEN the typing poll returns one or more non-self Typing_Status records that have not expired, THE Horizon product SHALL render a "typing" indicator naming up to a configured number of typing users.
6. WHEN the most recent Typing_Status for a `(conversationId, userId)` pair is older than the Typing_TTL, THE Horizon backend SHALL exclude that pair from typing responses.
7. WHEN the user sends a message in a conversation, THE Horizon product SHALL clear that user's Typing_Status for that conversation on the server.
8. WHILE the document is hidden, THE Horizon product SHALL apply Visibility_Pause to typing emission and to typing polling.
9. IF the typing endpoint returns an error, THEN THE Horizon product SHALL hide the typing indicator and SHALL NOT block message sending.

### Requirement 10: DM Composer Send Behavior

**User Story:** As a HERTZ user in a DM, I want Enter to send and Shift+Enter to add a newline, so that DM behaves like the chat apps I already know, even when I am sending an attachment.

#### Acceptance Criteria

1. WHEN a user presses `Enter` without `Shift` in the DM composer and the message has either non-empty trimmed text or at least one attached attachment, THE Horizon product SHALL send the message and SHALL clear the composer.
2. WHEN a user presses `Shift+Enter` in the DM composer, THE Horizon product SHALL insert a newline in the composer and SHALL NOT send the message.
3. WHEN a user presses `Enter` without `Shift` in the DM composer and the message has empty trimmed text and no attachments, THE Horizon product SHALL NOT send a message.
4. WHILE an upload is in progress for the active DM_Conversation, THE Horizon product SHALL prevent `Enter`-to-send from dispatching a new send for that conversation until the upload completes or fails.
5. WHEN a message is dispatched via `Enter` send, THE Horizon product SHALL apply the DM Optimistic_Update path defined in Requirement 4.

### Requirement 11: DM Fixed-Height Layout

**User Story:** As a HERTZ user in a DM, I want the DM page itself to stay still and only the message list to scroll, so that the composer and header are always reachable without page-level scroll fighting.

#### Acceptance Criteria

1. WHILE the DM page is open, THE Horizon product SHALL render the DM container with a fixed CSS height derived from `calc(100dvh - <horizon-shell-offset>)` on desktop and `calc(100svh - <horizon-mobile-offset>)` on mobile, and SHALL NOT use `min-height` for that container.
2. THE DM message list SHALL use `flex: 1`, `overflow-y: auto`, and `min-height: 0` so that only the message list scrolls within the DM container.
3. WHILE the DM composer is rendered inside the DM container, THE Horizon product SHALL keep the composer visually pinned to the bottom of the container regardless of message list length.
4. WHILE the DM thread header is rendered inside the DM container, THE Horizon product SHALL keep the header visually pinned to the top of the container regardless of message list length.
5. WHEN the viewport height changes (mobile keyboard open, browser chrome show/hide, window resize), THE Horizon product SHALL preserve the rule "only the message list scrolls" without producing a double-scroll on the page.
6. WHEN a new message is rendered while the message list is scrolled to the bottom, THE Horizon product SHALL keep the message list pinned to the bottom.
7. WHEN a new message is rendered while the message list is not scrolled to the bottom, THE Horizon product SHALL preserve the user's current scroll position and SHALL surface an unobtrusive "new message" affordance.

### Requirement 12: Notification Bell Dropdown

**User Story:** As a HERTZ user, I want a bell icon at the top of the shell that opens a small list of my recent notifications, so that I can act on them without leaving what I am doing.

#### Acceptance Criteria

1. THE Horizon_Shell SHALL render the Notification_Bell at the top-right of the shell on both desktop and mobile.
2. THE Notification_Bell SHALL display an unread badge derived from `/api/hertz/notifications/summary` via the SWR_Layer.
3. WHEN a user activates the Notification_Bell on a desktop viewport, THE Horizon product SHALL open the Notification_Dropdown as a popover anchored to the bell, with a width between 360 and 420 pixels inclusive and a max height no greater than 70% of the viewport height.
4. WHEN a user activates the Notification_Bell on a mobile viewport, THE Horizon product SHALL open the Notification_Dropdown as a bottom sheet.
5. THE Notification_Dropdown SHALL render a header with the title "Notifications" and a "Mark all as read" action.
6. THE Notification_Dropdown SHALL render a list of recent notifications fetched via `GET /api/hertz/notifications?limit=<n>` where `<n>` is between 5 and 10 inclusive, each item showing label/type, primary text, time, and a separator between items.
7. WHEN a user activates "Mark all as read" inside the Notification_Dropdown, THE Horizon product SHALL apply an Optimistic_Update setting all listed items to read and SHALL revalidate the notification summary cache.
8. WHEN a user activates a notification item inside the Notification_Dropdown, THE Horizon product SHALL mark that item as read, navigate to `item.href` via SPA_Navigation, and close the Notification_Dropdown.
9. WHEN a user clicks outside the Notification_Dropdown or presses `Escape`, THE Horizon product SHALL close the Notification_Dropdown.
10. THE Horizon product SHALL keep the Notification_Page (`/hertz/notifications`) available as the full archive, and the Notification_Dropdown SHALL NOT replace it.
11. WHILE the Notification_Dropdown is open and the document is visible, THE Horizon product SHALL revalidate the dropdown's notification list at an interval between 20 and 30 seconds inclusive.
12. WHILE the document is hidden, THE Horizon product SHALL apply Visibility_Pause to the dropdown's notification list polling.

### Requirement 13: Centralized Notification Summary

**User Story:** As a Horizon operator, I want the notification badge endpoint to be hit once per polling interval no matter how many components display the badge, so that we do not waste requests on the same data.

#### Acceptance Criteria

1. THE Horizon product SHALL fetch `/api/hertz/notifications/summary` through a single SWR cache key shared by `HertzLeftRail`, `HertzRightRail`, `MobileBottomNav`, and Notification_Bell.
2. WHILE two or more of those components are mounted concurrently, THE SWR_Layer SHALL produce no more than one in-flight request to `/api/hertz/notifications/summary` per polling interval.
3. WHEN any consumer of the summary triggers a revalidation (for example, after marking a notification as read), THE Horizon product SHALL update the badge in all consuming components without an additional fetch per consumer.
4. WHILE the document is hidden, THE Horizon product SHALL apply Visibility_Pause to summary polling.

### Requirement 14: Incremental DM Polling

**User Story:** As a HERTZ user with a long DM thread, I want polling to fetch only what is new, so that the chat stays responsive even when the conversation has thousands of messages.

#### Acceptance Criteria

1. THE DM thread API SHALL accept an `?after=<lastMessageId>` query parameter and SHALL return only messages with an id strictly greater than `<lastMessageId>` in their canonical ordering.
2. WHEN the DM thread API is called without `after`, THE DM thread API SHALL return the initial page in its existing canonical ordering.
3. WHEN the DM thread polling loop has at least one message in the local cache, THE Horizon product SHALL pass `?after=<lastMessageId>` on each subsequent poll for that conversation.
4. WHEN an incremental poll returns new messages, THE Horizon product SHALL append the messages to the local cache in canonical order without removing or reordering existing messages.
5. WHEN an incremental poll returns no new messages, THE Horizon product SHALL leave the local cache unchanged.
6. WHILE the document is hidden, THE Horizon product SHALL apply Visibility_Pause to DM thread polling.

### Requirement 15: Visibility-Pause for Polling Loops

**User Story:** As a HERTZ user on mobile, I want background tabs to stop hammering the network, so that battery and data are not wasted on tabs I am not looking at.

#### Acceptance Criteria

1. WHILE `document.visibilityState === 'hidden'`, THE Horizon product SHALL suspend the next scheduled fetch for comment polling, DM thread polling, typing polling, notification summary polling, and notification dropdown list polling.
2. WHEN `document.visibilityState` transitions from `hidden` to `visible`, THE Horizon product SHALL revalidate each previously suspended polling cache key once, then resume its normal polling interval.
3. WHILE the document is hidden, THE Horizon product SHALL NOT emit typing events from the DM composer.
4. THE Visibility_Pause behavior SHALL be implemented in the SWR_Layer (or equivalent shared layer) so that individual components do not each re-implement it.

### Requirement 16: Counter Cache for Feed Posts

**User Story:** As a HERTZ user browsing the feed, I want post counters to load with the post itself instead of after a delay, so that the feed never shows zeroed counters that suddenly jump.

#### Acceptance Criteria

1. THE Horizon backend SHALL maintain a Counter_Cache table `hertz_post_stats` keyed by `post_id` with at least the columns `comment_count`, `pulse_count`, `repost_count`, and `view_count`.
2. WHEN a comment, pulse, repost, or view event mutates a post's counters, THE Horizon backend SHALL update the corresponding Counter_Cache row so that the cached value reflects the mutation.
3. WHEN the HERTZ feed API returns a post, THE Horizon backend SHALL include the Counter_Cache values for that post in the response payload.
4. THE Counter_Cache SHALL be eventually consistent with the canonical events such that, in the absence of new events, the cached counts equal the count derived from the canonical event records.
5. IF the Counter_Cache row for a post is missing when the feed API serves it, THEN THE Horizon backend SHALL fall back to the canonical count and SHALL repopulate the Counter_Cache row.

### Requirement 17: Reduce `force-dynamic` on Public Pages

**User Story:** As a Horizon visitor, I want public pages like landing, blog, outlook, and gallery to load fast with cached HTML, so that first paint does not wait on a per-request render.

#### Acceptance Criteria

1. THE Horizon product SHALL NOT export `dynamic = 'force-dynamic'` from the landing page (`/`), blog index, blog detail, outlook index, outlook detail, or gallery index.
2. THE Horizon product SHALL configure those public pages with an ISR `revalidate` value or static rendering appropriate to their content cadence.
3. WHERE a public page must show viewer-specific data, THE Horizon product SHALL fetch that viewer-specific data on the client after initial render rather than forcing the whole page to render dynamically.
4. THE Horizon product SHALL retain `dynamic = 'force-dynamic'` (or equivalent dynamic behavior) on session-bound surfaces including profile, messages, notifications, and admin.
5. WHEN a public page is served from the ISR cache, THE Horizon product SHALL NOT include private session data in the cached response.

### Requirement 18: Image Optimization Discipline

**User Story:** As a HERTZ user on mobile data, I want images to load lazily and at sensible sizes, so that scrolling does not download a full-resolution photo I am about to skip.

#### Acceptance Criteria

1. WHERE an image source is from a domain configured in Next.js `images.remotePatterns`, THE Horizon product SHALL render that image with `next/image`.
2. WHERE an image source is not safely usable with `next/image`, THE Horizon product SHALL render that image with a raw `<img>` element that has `loading="lazy"`, `decoding="async"`, and explicit `width`/`height` (or aspect-ratio) attributes.
3. THE Horizon product SHALL NOT render any image without either `next/image` semantics or the lazy/async attributes specified in criterion 2.
4. THE Horizon product SHALL preserve image accessibility by always rendering meaningful `alt` text or `alt=""` for decorative images.

### Requirement 19: Client Component Audit and Lazy Loading of Heavy Components

**User Story:** As a HERTZ user on mobile, I want the initial bundle to stay small even as the product gains tools and admin features, so that first interaction stays snappy.

#### Acceptance Criteria

1. THE Horizon product SHALL inventory existing `'use client'` files (currently 110) and SHALL identify components above 400 lines that contain mostly layout/data with a small interactive surface as candidates for splitting into a server wrapper plus a client island.
2. WHERE a component is on the candidate list from criterion 1, THE Horizon product SHALL split it into a server wrapper that renders static structure and a client island that handles interactive state, unless the component is documented as exempt with a written reason.
3. WHERE a heavy component (tools such as Profitability, Challenge Tracker, Elliott Wave, Order Book; admin editors and charts; large composers, modals, share sheets, report dialogs) is not visible above the fold, THE Horizon product SHALL load it via `next/dynamic` so that its JavaScript is fetched only when needed.
4. WHILE a `next/dynamic` component is loading, THE Horizon product SHALL render a lightweight placeholder consistent with skeleton loaders defined in Requirement 6.
5. THE Horizon product SHALL include a bundle-analyzer build script (for example `analyze`) so that the size impact of these splits can be measured.

### Requirement 20: Out of Scope

**User Story:** As a Horizon operator, I want the boundaries of this feature to be explicit, so that infrastructure noise and deferred decisions do not leak into the implementation plan.

#### Acceptance Criteria

1. THE Horizon Social UX Uplift feature SHALL NOT modify aaPanel WAF code or aaPanel WAF configuration.
2. THE Horizon Social UX Uplift feature SHALL NOT modify Cloudflare/WAF rules to address the public curl 502/444 symptom.
3. THE Horizon Social UX Uplift feature SHALL NOT introduce WebSocket or SSE transport for DM, comments, or typing within this spec.
4. WHERE a future spec adds WebSocket or SSE transport, THE Horizon product SHALL be allowed to replace polling-based behaviors specified here without breaking the contracts on `/@username`, the DM action, the Notification_Dropdown, the Counter_Cache, and the Design_Tokens.

## Phased Rollout (Non-Normative)

The following batches reflect the locked product direction from the review snapshot. They guide ordering during design and task creation, and are not themselves acceptance criteria.

- **Phase 1 — Foundations & visible UX**: Design_Tokens (Requirement 1), SPA_Navigation (Requirement 2), SWR_Layer for notifications and comments (Requirements 3, 5, 13), Optimistic UI for comments/pulse/bookmark (Requirement 4), DM fixed-height layout (Requirement 11).
- **Phase 2 — Social primitives**: Public_Profile at `/@username` (Requirement 7), DM-from-profile (Requirement 8), typing indicator (Requirement 9), Notification_Bell dropdown (Requirement 12), comments auto-refresh (Requirement 5).
- **Phase 3 — Backend efficiency**: Incremental DM polling (Requirement 14), Notification_Dropdown limit (Requirement 12), Counter_Cache (Requirement 16), Visibility_Pause across loops (Requirement 15).
- **Phase 4 — Bundle and public-page performance**: Bundle analyzer, lazy-load heavy components (Requirement 19), image optimization (Requirement 18), reduce `force-dynamic` on public pages (Requirement 17).
