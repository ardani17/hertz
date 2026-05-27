# Mobile API Reference

Status: v1 backend-ready draft · 27 Mei 2026

Base URL: `https://hertz.cloudnexify.com`

All endpoints return a stable envelope:

```json
{ "success": true, "data": {} }
```

```json
{ "success": false, "error": { "code": "UNAUTHENTICATED", "error_code": "AUTH_REQUIRED", "message": "...", "details": null, "timestamp": "..." } }
```

Required mobile headers unless the endpoint is public:

```http
Authorization: Bearer <token>
App-Version: 1.0.0
X-Request-ID: <uuid optional>
Content-Type: application/json
```

Common errors: `UNAUTHENTICATED`, `FORBIDDEN`, `VALIDATION_FAILED`, `RATE_LIMITED`, `UPGRADE_REQUIRED`, `INTERNAL_ERROR`. Every mobile response echoes `X-Request-ID`.

## 1. Auth & Session

### POST `/api/mobile/v1/auth/handoff/init`
Auth: public. Rate limit: auth.

Body:

```json
{ "deviceId": "ios-device-uuid", "platform": "ios", "appVersion": "1.0.0" }
```

Response `201`:

```json
{ "success": true, "data": { "nonce": "...", "expiresAt": "2026-05-27T05:02:54.418Z", "handoffUrl": "https://hertz.cloudnexify.com/auth/mobile-handoff?nonce=..." } }
```

Errors: `VALIDATION_FAILED`, `RATE_LIMITED`.

```bash
curl -X POST "$BASE/api/mobile/v1/auth/handoff/init" -H 'Content-Type: application/json' -d '{"deviceId":"device-1","platform":"ios","appVersion":"1.0.0"}'
```

### POST `/api/mobile/v1/auth/handoff/exchange`
Auth: public. Rate limit: auth.

Body: `{ "nonce": "...", "telegramAuth": { "id": 123, "first_name": "...", "auth_date": 1, "hash": "..." } }`

Response `201`: `MobileAuthResponse` with `token`, `expiresAt`, `user`, `session`, `loginMechanism`.

Errors: `UNAUTHENTICATED`, `VALIDATION_FAILED`, `RATE_LIMITED`.

### POST `/api/mobile/v1/auth/telegram`
Auth: public legacy fallback. Body combines Telegram auth payload with optional `deviceId`, `platform`, `appVersion`. Response matches handoff exchange.

### POST `/api/mobile/v1/auth/refresh`
Auth: bearer. Body: `{ "deviceId": "device-1" }`. Response returns refreshed `token`, `expiresAt`, `user`, `session`.

Errors: `UNAUTHENTICATED`, `SESSION_DEVICE_MISMATCH`, `UPGRADE_REQUIRED`.

```bash
curl -X POST "$BASE/api/mobile/v1/auth/refresh" -H "Authorization: Bearer $TOKEN" -H 'App-Version: 1.0.0' -d '{"deviceId":"device-1"}'
```

### POST `/api/mobile/v1/logout`
Auth: bearer. Response: `{ "loggedOut": true }`.

### GET `/api/mobile/v1/me`
Auth: bearer. Response includes `user`, `notifications`, and current `session`.

### GET `/api/mobile/v1/me/sessions`
Auth: bearer. Response: `{ "sessions": [MobileSessionInfo] }`.

### DELETE `/api/mobile/v1/me/sessions/:sessionId`
Auth: bearer. Response: `{ "revoked": true }`. Errors: `CANNOT_REVOKE_CURRENT`.

## 2. Feed, Posts & Comments

### GET `/api/mobile/v1/hertz/posts`
Auth: optional bearer. Query: `cursor`, `limit`, `category`, `search`, `sort`, `author`, `authorId`.

Response: `MobileHertzFeedResponse`.

### POST `/api/mobile/v1/hertz/posts`
Auth: bearer. Body: `{ "category": "general", "content": "hello", "mediaIds": [], "market": null }`. Response `201`: `{ "post": MobileHertzPost }`.

### GET `/api/mobile/v1/hertz/posts/:shortId`
Auth: optional bearer. Response: `{ "post": MobileHertzPostDetail }`.

### PATCH `/api/mobile/v1/hertz/posts/:shortId`
Auth: bearer. Body: `{ "content": "updated" }`. Response: `{ "updated": true }`.

### DELETE `/api/mobile/v1/hertz/posts/:shortId`
Auth: bearer. Response: `{ "deleted": true }`.

### GET `/api/mobile/v1/hertz/posts/:shortId/comments`
Auth: optional bearer. Response: `{ "comments": [HertzComment] }`.

### POST `/api/mobile/v1/hertz/posts/:shortId/comments`
Auth: bearer. Body: `{ "content": "reply", "parentCommentId": "optional" }`. Response `201`: `{ "comment": HertzComment }`.

### PATCH `/api/mobile/v1/hertz/posts/comments/:commentId`
Auth: bearer. Body: `{ "content": "updated" }`.

### DELETE `/api/mobile/v1/hertz/posts/comments/:commentId`
Auth: bearer. Response: `{ "deleted": true }`.

Errors: `POST_NOT_FOUND`, `FORBIDDEN`, `VALIDATION_FAILED`, `RATE_LIMITED`.

```bash
curl -H "Authorization: Bearer $TOKEN" -H 'App-Version: 1.0.0' "$BASE/api/mobile/v1/hertz/posts?limit=20"
```

## 3. Interactions

### POST `/api/mobile/v1/hertz/posts/:shortId/like`
Auth: bearer. Response: `{ "active": true }`.

### POST `/api/mobile/v1/hertz/posts/:shortId/bookmark`
Auth: bearer. Response: `{ "bookmarked": true, "active": true }`.

### POST `/api/mobile/v1/hertz/posts/:shortId/repost`
Auth: bearer. Body: `{ "type": "repost" }` or `{ "type": "quote", "content": "...", "mediaIds": [] }`.

### POST `/api/mobile/v1/hertz/posts/:shortId/view`
Auth: optional bearer. Response: `{ "recorded": true }`.

### POST `/api/mobile/v1/hertz/posts/:shortId/report`
Auth: bearer. Body: `{ "reason": "spam", "details": "optional" }`.

## 4. Direct Messages

### GET `/api/mobile/v1/hertz/messages/inbox`
Auth: bearer. Response: `{ "items": [MobileDmInboxItem] }`.

### GET `/api/mobile/v1/hertz/messages/conversations?q=member`
Auth: bearer. Response: `{ "members": [MobileDmMemberSearchResult] }`.

### POST `/api/mobile/v1/hertz/messages/conversations`
Auth: bearer. Body: `{ "recipientId": "..." }` or `{ "recipientUsername": "member" }`. Response `201/200`: `{ "conversation": MobileDmConversation, "existing": false }`.

### GET `/api/mobile/v1/hertz/messages/conversations/:conversationId`
Auth: bearer. Query: `before`, `after`, `limit`. Response: `{ "messages": [MobileDmMessage], "hasMoreBefore": false }`.

### POST `/api/mobile/v1/hertz/messages/conversations/:conversationId`
Auth: bearer. Body: `{ "body": "hello", "mediaIds": [] }`. Response `201`: `{ "message": MobileDmMessage }`.

### PATCH `/api/mobile/v1/hertz/messages/conversations/:conversationId`
Auth: bearer. Body: `{ "archived": true }`.

### GET/POST `/api/mobile/v1/hertz/messages/conversations/:conversationId/typing`
Auth: bearer. POST body: `{ "typing": true }`. Response: `MobileDmTypingResponse`.

### DELETE `/api/mobile/v1/hertz/messages/messages/:messageId`
Auth: bearer. Response: `{ "deleted": true }`.

### POST `/api/mobile/v1/hertz/messages/messages/:messageId`
Auth: bearer. Body: `{ "reason": "abuse" }`.

### POST/DELETE `/api/mobile/v1/hertz/messages/blocks/:userId`
Auth: bearer. Response: `MobileDmBlockResponse`.

## 5. Notifications & Push

### GET `/api/mobile/v1/hertz/notifications`
Auth: bearer. Query: `limit`. Response: `{ "items": [MobileNotificationItem], "nextCursor": null, "summary": MobileNotificationSummary }`.

### GET `/api/mobile/v1/hertz/notifications/summary`
Auth: bearer. Response: `MobileNotificationSummary`.

### POST `/api/mobile/v1/hertz/notifications/read`
Auth: bearer. Body: `{ "ids": ["notif-id"] }` or `{ "all": true }`.

### POST `/api/mobile/v1/notifications/register`
Auth: bearer. Body: `{ "platform": "expo", "token": "ExponentPushToken[...]", "deviceId": "device-1", "appVersion": "1.0.0" }`.

### POST `/api/mobile/v1/notifications/unregister`
Auth: bearer. Body: `{ "token": "ExponentPushToken[...]" }`.

## 6. Profile

### GET/PATCH `/api/mobile/v1/profile/me`
Auth: bearer. PATCH body follows `MemberPublicProfileInput`.

### GET `/api/mobile/v1/profile/:username`
Auth: optional bearer. Response: public profile DTO.

### GET `/api/mobile/v1/hertz/profile/:username/activity`
Auth: optional bearer. Response: `MobileProfileActivityResponse`.

## 7. Media

### POST `/api/mobile/v1/media/upload`
Auth: bearer. Content-Type: `multipart/form-data`. Fields: `file`, `purpose=post|dm|profile_avatar|profile_cover`.

Response `201`: `{ "media": { "id": "...", "fileUrl": "...", "thumbnailUrl": "...", "mediaType": "image" } }`.

Errors: `VALIDATION_FAILED`, `RATE_LIMITED`.

```bash
curl -X POST "$BASE/api/mobile/v1/media/upload" -H "Authorization: Bearer $TOKEN" -H 'App-Version: 1.0.0' -F purpose=post -F file=@chart.png
```

## 8. Discovery, Market & Static Content

### GET `/api/mobile/v1/hertz/search?q=hertz&type=member`
Auth: public. Query: `q` required length >= 2, optional `type=post|member`. Response: `MobileSearchResponse`.

Errors: `VALIDATION_FAILED` for unsupported `type`.

```bash
curl "$BASE/api/mobile/v1/hertz/search?q=hertz&type=member" -H 'App-Version: 1.0.0'
```

### GET `/api/mobile/v1/market/rail`
Auth: public. Response: `MobileMarketRailResponse`; returns `503 POST_NOT_FOUND` while upstream market data is unavailable.

### GET `/api/mobile/v1/gallery`
Auth: public. Query: `limit`, `offset`. Response: gallery items and `nextOffset`.

### GET `/api/mobile/v1/outlook`
Auth: public. Query: `limit`, `offset`. Response: Outlook list.

### GET `/api/mobile/v1/outlook/:slug`
Auth: public. Response: Outlook detail.
