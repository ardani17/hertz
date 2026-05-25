# Implementation Plan: Mobile Readiness

## Overview

Prepare the existing Hertz backend for native mobile clients while preserving current web behavior. The implementation should be additive: bearer auth as a fallback to cookies, stable `/api/mobile/v1/*` endpoints, device token registration, and push notification infrastructure.

## Tasks

- [x] 1. Audit current auth/session implementation
  - [x] 1.1 Review member session creation and resolution
    - Inspect `shared/services/memberSessionService.ts`
    - Inspect `frontend/src/lib/memberAuth.ts`
    - Confirm raw session token is only available at creation time
    - Confirm database stores hashed token only
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 1.2 Review current Telegram auth route
    - Inspect `frontend/src/app/api/auth/telegram/route.ts`
    - Identify where session token is created
    - Identify cookie write behavior that must remain for web
    - _Requirements: 2.1, 3.7, 3.11_

- [x] 2. Add bearer auth support
  - [x] 2.1 Update member auth resolver
    - Read existing HttpOnly cookie first
    - Fall back to `Authorization: Bearer <token>`
    - Reject malformed Authorization headers
    - Resolve bearer token to the same `MemberSessionUser` shape
    - _Requirements: 2.4, 2.5, 2.7_

  - [x] 2.2 Add token revoke support for bearer logout
    - Add service method to revoke the current raw bearer token
    - Ensure logout does not require cookies
    - Add tests for revoke behavior
    - _Requirements: 2.6, 3.3_

- [x] 3. Add mobile auth endpoints
  - [x] 3.1 Create `POST /api/mobile/v1/auth/telegram`
    - Verify Telegram auth payload using existing logic
    - Choose and document the mobile Telegram login mechanism before implementation
    - Create member session
    - Return `{ token, user, expiresAt }`
    - Do not require browser cookies
    - _Requirements: 3.1, 3.4, 3.6, 3.11_

  - [x] 3.2 Create `GET /api/mobile/v1/me`
    - Require bearer auth
    - Return current member session user
    - Use standard response envelope
    - _Requirements: 3.2, 3.5, 10.1, 10.2_

  - [x] 3.3 Create `POST /api/mobile/v1/logout`
    - Require bearer auth
    - Revoke the bearer token used by the request
    - Return standard success envelope
    - _Requirements: 3.3, 2.6_

  - [x] 3.4 Define and implement mobile token refresh strategy
    - Decide between refresh endpoint or re-authentication after expiry
    - If refresh is selected, create `POST /api/mobile/v1/auth/refresh`
    - Rotate session token before expiry
    - Add mobile client contract notes
    - _Requirements: 3.8, 3.9, 3.10_

- [x] 4. Add mobile HERTZ endpoints
  - [x] 4.1 Create `GET /api/mobile/v1/hertz/posts`
    - Reuse `HertzPostService.listFeed`
    - Support `cursor`, `limit`, `category`, `q`, and `sort`
    - Return `{ items, nextCursor }`
    - Preserve `latest` and `trending`
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [x] 4.2 Create `GET /api/mobile/v1/hertz/posts/[shortId]`
    - Reuse `HertzPostService.getPostDetail`
    - Allow optional bearer auth for viewer state
    - Return standard response envelope
    - _Requirements: 4.6, 10.1, 10.2_

  - [x] 4.3 Create mobile HERTZ like/comment actions
    - Add `POST /api/mobile/v1/hertz/posts/[shortId]/like`
    - Reuse existing pulse backend for suka/like
    - Add `POST /api/mobile/v1/hertz/posts/[shortId]/comments`
    - Add `DELETE /api/mobile/v1/hertz/posts/comments/[commentId]`
    - Require bearer auth for mutations
    - _Requirements: 4.7, 4.8, 10.1, 10.2_

- [x] 5. Add mobile content endpoints
  - [x] 5.1 Create Blog mobile endpoints
    - `GET /api/mobile/v1/blog`
    - `GET /api/mobile/v1/blog/[slug]`
    - Reuse existing article query/service logic where possible
    - _Requirements: 5.1, 5.2, 5.7_

  - [x] 5.2 Create Outlook mobile endpoints
    - `GET /api/mobile/v1/outlook`
    - `GET /api/mobile/v1/outlook/[slug]`
    - Reuse existing article query/service logic where possible
    - _Requirements: 5.3, 5.4, 5.7_

  - [x] 5.3 Create Gallery mobile endpoint
    - `GET /api/mobile/v1/gallery`
    - Support pagination or cursor if media grows large
    - Return media item metadata and article references
    - Include `thumbnailUrl` and `fullUrl` fields when available
    - Document CDN resize query parameters if dynamic resizing is used
    - _Requirements: 5.5, 5.6, 5.7, 5.8, 5.9_

  - [x] 5.4 Add cache hints for public mobile content where safe
    - Evaluate Blog, Outlook, and Gallery `Cache-Control`
    - Consider `ETag` or `Last-Modified` support for detail endpoints
    - Keep HERTZ feed dynamic unless a short guest cache is explicitly safe
    - _Requirements: 4.9, 5.10_

- [x] 6. Add device token storage
  - [x] 6.1 Create migration for `device_tokens`
    - Add columns from the design document
    - Add platform check constraint
    - Add unique constraint for `(user_id, token)`
    - Add indexes for enabled user tokens
    - _Requirements: 6.1, 6.2, 6.7_

  - [x] 6.2 Add `DeviceTokenRepository`
    - Upsert token by authenticated user
    - Disable token
    - List enabled tokens for a user
    - Update `last_seen_at`
    - _Requirements: 6.3, 6.5, 6.6_

  - [x] 6.3 Create notification registration endpoints
    - `POST /api/mobile/v1/notifications/register`
    - `POST /api/mobile/v1/notifications/unregister`
    - Require bearer auth
    - Validate `platform`, `token`, `deviceId`, and `appVersion`
    - _Requirements: 6.3, 6.4, 6.5, 6.6, 6.7_

- [x] 7. Add notification event logging
  - [x] 7.1 Create migration for `notification_events`
    - Add columns from the design document
    - Add status/event type indexes
    - _Requirements: 7.1, 7.2_

  - [x] 7.2 Add notification event repository/service
    - Create pending event
    - Mark event sent
    - Mark event failed with provider error
    - Support retry lookup later
    - _Requirements: 7.3, 7.4, 7.5_

- [x] 8. Add FCM push service
  - [x] 8.1 Add FCM configuration
    - Define required env variables/secrets
    - Document local disabled mode
    - Ensure missing credentials do not break non-push flows
    - _Requirements: 8.1, 8.2_

  - [x] 8.2 Implement `PushNotificationService`
    - Send to enabled device tokens
    - Store provider response
    - Disable invalid tokens after provider rejection
    - Avoid logging raw tokens
    - _Requirements: 8.3, 8.4, 7.3, 7.4_

  - [x] 8.3 Add first notification triggers
    - DM message created
    - HERTZ comment created
    - Optional post announcement trigger
    - Optional credit transaction trigger
    - _Requirements: 8.5, 8.6, 8.7_

- [x] 9. Add mobile rate limiting
  - [x] 9.1 Define mobile rate limit policy
    - Auth login/refresh: strict burst-protected limits
    - Like/comment/register device: moderate per user/token limits
    - Feed/content reads: generous limits
    - Upload/media mutations: strict per user limits
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

  - [x] 9.2 Implement rate limit checks for mobile endpoints
    - Prefer user/session token identity for authenticated requests
    - Use IP/user agent fallback for guest reads
    - Return standard rate limit error envelope
    - _Requirements: 9.1, 9.5_

- [x] 10. Add tests
  - [x] 10.1 Add auth tests
    - Cookie auth still resolves
    - Bearer auth resolves
    - Invalid bearer token is rejected
    - Mobile login returns raw token once
    - Raw token is not stored in DB
    - Refresh behavior is covered if implemented
    - _Requirements: 11.1, 11.2, 11.3, 11.4_

  - [x] 10.2 Add mobile endpoint tests
    - `GET /api/mobile/v1/me`
    - `GET /api/mobile/v1/hertz/posts`
    - HERTZ like/comment mutation auth requirement
    - HERTZ delete comment authorization
    - Blog/Outlook/Gallery response envelopes
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 11.4, 11.6_

  - [x] 10.3 Add notification tests
    - Register device token
    - Reject unsupported platform
    - Disable/unregister token
    - Create notification event on send attempt
    - _Requirements: 11.5, 11.6_

  - [x] 10.4 Add rate limit tests
    - Auth endpoint rate limit
    - Mutation endpoint rate limit
    - Standard rate limit error envelope
    - _Requirements: 11.8, 9.5_

- [x] 11. Documentation and verification
  - [x] 11.1 Add mobile API contract examples
    - Auth request/response
    - Refresh request/response if implemented
    - Feed request/response
    - Device token registration
    - Error response examples
    - Telegram login mechanism decision
    - _Requirements: 10.1, 10.2, 10.3, 3.11_

  - [x] 11.2 Run verification
    - Run `npm run lint`
    - Run `POSTGRES_HOST=172.21.0.2 npm run build`
    - Run `npm run test -- --pool forks`
    - Confirm existing web auth still works
    - Confirm mobile bearer auth works
    - _Requirements: 11.7_

## Notes

- Do not replace web cookie auth.
- Do not introduce a separate mobile backend.
- Use bearer token support as an additive auth path.
- Use existing service/repository layers instead of duplicating logic.
- Push notification payloads should avoid sensitive private message body content until privacy rules are finalized.
- React Native can consume shared TypeScript contracts later, but app implementation is out of scope for this spec.

## Implementation Notes

- Mobile Telegram login currently uses the signed Telegram external browser/WebView callback payload and returns a raw member session token only in the mobile response body.
- Mobile refresh uses session-token rotation through `POST /api/mobile/v1/auth/refresh`; the old token is revoked after a valid refresh.
- FCM delivery is enabled by `FCM_SERVER_KEY`. If the key is absent, notification events are persisted with `skipped` status so comment/DM flows do not fail.
- Media responses expose `thumbnailUrl` and `fullUrl` using the current stored public URL. CDN resize query parameters can be added later when the image host contract is finalized.
- Per-event notification preferences remain a future phase; device-level enable/disable is implemented through `device_tokens.enabled`.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["2.1", "2.2"] },
    { "id": 2, "tasks": ["3.1", "3.2", "3.3", "3.4"] },
    { "id": 3, "tasks": ["4.1", "4.2", "4.3", "5.1", "5.2", "5.3", "5.4"] },
    { "id": 4, "tasks": ["6.1", "7.1"] },
    { "id": 5, "tasks": ["6.2", "6.3", "7.2"] },
    { "id": 6, "tasks": ["8.1", "8.2", "8.3"] },
    { "id": 7, "tasks": ["9.1", "9.2"] },
    { "id": 8, "tasks": ["10.1", "10.2", "10.3", "10.4", "11.1", "11.2"] }
  ]
}
```
