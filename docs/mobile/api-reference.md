# Mobile API Reference

Status: Draft v1 · 27 Mei 2026

Semua response memakai envelope:

```json
{ "success": true, "data": {} }
```

atau:

```json
{ "success": false, "error": { "code": "UNAUTHENTICATED", "error_code": "AUTH_REQUIRED", "message": "...", "details": null, "timestamp": "..." } }
```

Auth mobile memakai header:

```http
Authorization: Bearer <token>
App-Version: 1.0.0
X-Request-ID: <uuid optional>
```

## Auth

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/mobile/v1/auth/handoff/init` | Public | Buat nonce + `handoffUrl` untuk Telegram in-app browser |
| POST | `/api/mobile/v1/auth/handoff/exchange` | Public | Tukar nonce + Telegram payload menjadi Bearer token |
| POST | `/api/mobile/v1/auth/telegram` | Public | Legacy direct Telegram payload login |
| POST | `/api/mobile/v1/auth/refresh` | Bearer | Extend sliding session |
| POST | `/api/mobile/v1/logout` | Bearer | Revoke token aktif |
| GET | `/api/mobile/v1/me` | Bearer | User + notification summary + current session |
| GET | `/api/mobile/v1/me/sessions` | Bearer | List active sessions |
| DELETE | `/api/mobile/v1/me/sessions/:sessionId` | Bearer | Revoke session lain |

## Feed & Posts

| Method | Path | Auth |
|--------|------|------|
| GET | `/api/mobile/v1/hertz/posts` | Optional Bearer |
| POST | `/api/mobile/v1/hertz/posts` | Bearer |
| GET | `/api/mobile/v1/hertz/posts/:shortId` | Optional Bearer |
| PATCH | `/api/mobile/v1/hertz/posts/:shortId` | Bearer |
| DELETE | `/api/mobile/v1/hertz/posts/:shortId` | Bearer |
| POST | `/api/mobile/v1/hertz/posts/:shortId/like` | Bearer |
| POST | `/api/mobile/v1/hertz/posts/:shortId/bookmark` | Bearer |
| POST | `/api/mobile/v1/hertz/posts/:shortId/repost` | Bearer |
| POST | `/api/mobile/v1/hertz/posts/:shortId/view` | Optional Bearer |
| POST | `/api/mobile/v1/hertz/posts/:shortId/report` | Bearer |
| GET | `/api/mobile/v1/hertz/posts/:shortId/comments` | Optional Bearer |
| POST | `/api/mobile/v1/hertz/posts/:shortId/comments` | Bearer |
| PATCH | `/api/mobile/v1/hertz/posts/comments/:commentId` | Bearer |
| DELETE | `/api/mobile/v1/hertz/posts/comments/:commentId` | Bearer |

## Direct Messages

| Method | Path | Auth |
|--------|------|------|
| GET | `/api/mobile/v1/hertz/messages/inbox` | Bearer |
| GET | `/api/mobile/v1/hertz/messages/conversations?q=` | Bearer |
| POST | `/api/mobile/v1/hertz/messages/conversations` | Bearer |
| GET | `/api/mobile/v1/hertz/messages/conversations/:conversationId?after=` | Bearer |
| POST | `/api/mobile/v1/hertz/messages/conversations/:conversationId` | Bearer |
| PATCH | `/api/mobile/v1/hertz/messages/conversations/:conversationId` | Bearer |
| GET | `/api/mobile/v1/hertz/messages/conversations/:conversationId/typing` | Bearer |
| POST | `/api/mobile/v1/hertz/messages/conversations/:conversationId/typing` | Bearer |
| DELETE | `/api/mobile/v1/hertz/messages/messages/:messageId` | Bearer |
| POST | `/api/mobile/v1/hertz/messages/messages/:messageId` | Bearer |
| POST | `/api/mobile/v1/hertz/messages/blocks/:userId` | Bearer |
| DELETE | `/api/mobile/v1/hertz/messages/blocks/:userId` | Bearer |

## Notifications & Push

| Method | Path | Auth |
|--------|------|------|
| GET | `/api/mobile/v1/hertz/notifications` | Bearer |
| GET | `/api/mobile/v1/hertz/notifications/summary` | Bearer |
| POST | `/api/mobile/v1/hertz/notifications/read` | Bearer |
| POST | `/api/mobile/v1/notifications/register` | Bearer |
| POST | `/api/mobile/v1/notifications/unregister` | Bearer |

`/notifications/register` menerima `platform: "expo"` dengan token `ExponentPushToken[...]`.

## Profile, Media, Search

| Method | Path | Auth |
|--------|------|------|
| GET | `/api/mobile/v1/profile/me` | Bearer |
| PATCH | `/api/mobile/v1/profile/me` | Bearer |
| GET | `/api/mobile/v1/profile/:username` | Optional Bearer |
| GET | `/api/mobile/v1/hertz/profile/:username/activity` | Optional Bearer |
| POST | `/api/mobile/v1/media/upload` | Bearer |
| GET | `/api/mobile/v1/hertz/search?q=` | Optional Bearer |
| GET | `/api/mobile/v1/market/rail` | Public |

## Read-only Content

| Method | Path | Auth |
|--------|------|------|
| GET | `/api/mobile/v1/outlook` | Public |
| GET | `/api/mobile/v1/outlook/:slug` | Public |
| GET | `/api/mobile/v1/gallery` | Public |

