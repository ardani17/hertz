# Requirements Document: Mobile Readiness

## Introduction

Prepare the Horizon backend for native Android and iPhone applications while keeping the current web application on the same backend. The existing backend is already suitable for web and has strong foundations for mobile: RESTful JSON routes, cursor-based feed pagination, consistent response envelopes, repository/service layering, and shared TypeScript types. The main gaps are mobile-friendly authentication and push notification infrastructure.

This spec does not split the backend into a separate mobile service. Mobile apps will consume the same Horizon backend through a stable mobile API layer.

## Glossary

- **Mobile App**: Native Android and iPhone clients, including React Native if chosen later.
- **Web Client**: The existing Next.js frontend that authenticates primarily through HttpOnly cookies.
- **Mobile API Layer**: Stable versioned endpoints under `/api/mobile/v1/*` that reuse existing services but expose contracts designed for mobile.
- **Bearer Token**: A raw member session token sent through `Authorization: Bearer <token>`.
- **Member Session Token**: Existing session token created by member auth services and stored hashed in the database.
- **Device Token**: FCM/APNs-compatible token registered by a mobile device for push notifications.
- **Notification Event**: A persisted record describing a push notification attempt, status, and target user/device.
- **Response Envelope**: The existing API shape `{ success: true, data }` and `{ success: false, error }`.

## Current Audit

| Area | Current Status | Mobile Ready |
|---|---|---|
| Auth | Cookie-only for member/admin web flows | No |
| Feed pagination | Cursor-based `nextCursor` pattern | Yes |
| Admin pagination | Offset/page-based | Yes |
| Response format | Consistent success/error envelope | Yes |
| Push notification | No infrastructure yet | No |
| API structure | RESTful JSON, parameterized queries, shared services | Yes |

## Requirements

### Requirement 1: Preserve Single Backend Architecture

**User Story:** As a product owner, I want Android, iPhone, and web to use one backend, so that data, moderation, and business logic stay consistent.

#### Acceptance Criteria

1. THE Mobile API SHALL be implemented in the existing Horizon backend project.
2. THE Mobile API SHALL reuse existing service and repository layers where possible.
3. THE implementation SHALL NOT create a separate database for mobile.
4. THE implementation SHALL NOT fork HERTZ, Blog, Outlook, Gallery, or DM business logic for mobile.
5. IF mobile behavior needs a different response shape, THEN it SHALL be exposed through `/api/mobile/v1/*` while reusing the same service layer.

### Requirement 2: Add Bearer Token Authentication for Members

**User Story:** As a mobile app user, I want to authenticate with a token returned in the response body, so that the native app can store it securely and call APIs without relying on browser cookies.

#### Acceptance Criteria

1. THE member auth flow SHALL continue to support HttpOnly cookies for the web client.
2. THE member auth flow SHALL return a raw bearer token in the response body for mobile-specific login endpoints.
3. THE database SHALL store only a hashed session token, never the raw bearer token.
4. THE member auth middleware SHALL read the existing cookie first and SHALL fall back to `Authorization: Bearer <token>` when no valid cookie is present.
5. THE bearer token SHALL resolve to the same `MemberSessionUser` shape used by current web routes.
6. THE logout endpoint SHALL be able to revoke a bearer token.
7. IF a bearer token is expired, revoked, malformed, or unknown, THEN the API SHALL return the standard unauthorized error envelope.

### Requirement 3: Add Stable Mobile Auth Endpoints

**User Story:** As a mobile developer, I want stable mobile auth endpoints, so that the mobile app has a clear login, session, and logout contract.

#### Acceptance Criteria

1. THE backend SHALL expose `POST /api/mobile/v1/auth/telegram`.
2. THE backend SHALL expose `GET /api/mobile/v1/me`.
3. THE backend SHALL expose `POST /api/mobile/v1/logout`.
4. THE mobile login response SHALL include `token`, `user`, and session metadata.
5. THE `me` response SHALL return the current authenticated member using the standard response envelope.
6. THE mobile endpoints SHALL NOT require browser cookies.
7. THE web endpoint `/api/auth/telegram` MAY continue to return the existing response and set cookies.
8. THE backend SHALL define a token refresh strategy for mobile sessions.
9. IF refresh tokens are implemented, THEN the backend SHALL expose `POST /api/mobile/v1/auth/refresh` to rotate the session token before expiry.
10. IF refresh tokens are not implemented in the first release, THEN the spec SHALL document that mobile clients must re-authenticate after session expiry.
11. THE mobile auth design SHALL explicitly choose one Telegram login mechanism: Telegram OAuth, WebView widget callback, or Telegram bot one-time code.

### Requirement 4: Expose Mobile Feed Contracts

**User Story:** As a mobile app user, I want to browse HERTZ with infinite scroll, so that the mobile app can reuse the existing feed behavior.

#### Acceptance Criteria

1. THE Mobile API SHALL expose a HERTZ feed endpoint using cursor pagination.
2. THE feed endpoint SHALL support `cursor`, `limit`, `category`, `q`, and `sort`.
3. THE feed endpoint SHALL preserve `latest` and `trending` sorting semantics from the web backend.
4. THE feed endpoint SHALL return `items` and `nextCursor`.
5. THE feed endpoint SHALL reuse `HertzPostService.listFeed`.
6. THE Mobile API SHALL expose a post detail endpoint for reading a single HERTZ post.
7. THE Mobile API SHALL expose comment and like/suka actions for HERTZ posts.
8. THE Mobile API SHALL expose a delete comment endpoint for comments the current user can delete.
9. HERTZ read endpoints SHOULD include cache hints or validators where safe for mobile clients.

### Requirement 5: Expose Mobile Content Endpoints

**User Story:** As a mobile app user, I want to read Blog, Outlook, and Gallery content, so that the app covers the same public content as the web.

#### Acceptance Criteria

1. THE Mobile API SHALL expose a Blog list endpoint.
2. THE Mobile API SHALL expose a Blog detail endpoint.
3. THE Mobile API SHALL expose an Outlook list endpoint.
4. THE Mobile API SHALL expose an Outlook detail endpoint.
5. THE Mobile API SHALL expose a Gallery list endpoint.
6. Public read endpoints MAY allow guest access unless the product later requires auth.
7. Response payloads SHALL use the standard response envelope.
8. Media objects returned to mobile SHALL include `thumbnailUrl` and `fullUrl` when available.
9. IF dynamic image resizing is available through the image host/CDN, THEN mobile responses MAY include resize-ready URLs or documented query parameters.
10. Public content endpoints SHOULD include safe `Cache-Control`, `ETag`, or `Last-Modified` behavior when practical.

### Requirement 6: Register Mobile Device Tokens

**User Story:** As a mobile app user, I want my device to receive notifications, so that I can be notified about important account and community events.

#### Acceptance Criteria

1. THE backend SHALL create a `device_tokens` table.
2. THE table SHALL store `user_id`, `platform`, `token`, `device_id`, `app_version`, `enabled`, `created_at`, `updated_at`, and `last_seen_at`.
3. THE backend SHALL expose `POST /api/mobile/v1/notifications/register`.
4. THE endpoint SHALL require member authentication.
5. THE endpoint SHALL upsert the token for the authenticated user.
6. THE backend SHALL expose an endpoint or action to disable/unregister a device token.
7. Device token registration SHALL validate supported platforms: `android` and `ios`.

### Requirement 7: Add Push Notification Event Logging

**User Story:** As an admin/developer, I want notification attempts to be logged, so that failed delivery can be audited and retried.

#### Acceptance Criteria

1. THE backend SHALL create a `notification_events` table.
2. THE table SHALL store recipient user, event type, title, body, payload JSON, provider status, error message, and timestamps.
3. Every push notification send attempt SHALL create or update a notification event.
4. Failed sends SHALL store the provider error message.
5. The event log SHALL support future retry processing.

### Requirement 8: Integrate Firebase Cloud Messaging

**User Story:** As a mobile app user, I want push notifications delivered to Android and iOS, so that I receive important events outside the app.

#### Acceptance Criteria

1. THE backend SHALL support Firebase Cloud Messaging for Android and iOS delivery.
2. FCM credentials SHALL be configured through environment variables or mounted secrets.
3. THE push service SHALL send notifications only to enabled device tokens.
4. Invalid or expired device tokens SHALL be disabled after provider rejection.
5. The first notification triggers SHALL include at minimum DM message and comment events.
6. Additional triggers MAY include new post announcements and credit events.
7. Notification preferences SHALL be considered as a later phase so users can opt in/out by notification type.

### Requirement 9: Add Mobile Rate Limiting

**User Story:** As a backend operator, I want mobile API traffic rate-limited by token/device where possible, so that mobile retries and background traffic do not overload the system.

#### Acceptance Criteria

1. Mobile endpoints SHALL use rate limiting appropriate for native app traffic.
2. Mutation endpoints SHALL have stricter limits than read endpoints.
3. Auth endpoints SHALL have brute-force and replay protection.
4. Device token registration SHALL be rate-limited per authenticated user and device/token where possible.
5. Rate limit errors SHALL use the standard error envelope.

### Requirement 10: Maintain API Response Consistency

**User Story:** As a mobile developer, I want every mobile endpoint to return consistent JSON, so that mobile parsing is simple and predictable.

#### Acceptance Criteria

1. Mobile endpoints SHALL return `{ success: true, data }` on success.
2. Mobile endpoints SHALL return `{ success: false, error }` on failure.
3. Error objects SHALL include stable code and message fields.
4. Validation errors SHALL use existing error helpers where possible.
5. Auth failures SHALL use the same unauthorized response shape across all mobile endpoints.

### Requirement 11: Verify Mobile Readiness

**User Story:** As a developer, I want automated checks for mobile-ready behavior, so that auth and notification regressions are caught before release.

#### Acceptance Criteria

1. Unit tests SHALL cover cookie auth and bearer auth resolution.
2. Unit tests SHALL cover mobile login returning a token.
3. Unit tests SHALL verify raw session tokens are not stored in the database.
4. API tests SHALL cover `GET /api/mobile/v1/me` with bearer auth.
5. API tests SHALL cover device token registration.
6. Tests SHALL verify standard response envelopes.
7. Build and lint SHALL pass after the mobile readiness implementation.
8. Tests SHALL cover mobile rate limiting behavior for at least auth and one mutation endpoint.
