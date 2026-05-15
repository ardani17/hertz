# Mobile API Contract

Base path: `/api/mobile/v1`

All endpoints return:

```json
{ "success": true, "data": {} }
```

or:

```json
{ "success": false, "error": { "code": "ERROR_CODE", "message": "Readable message" } }
```

## Auth

### `POST /auth/telegram`

Mobile login uses the Telegram external browser/WebView callback payload for this release. The endpoint accepts the same signed Telegram auth payload used by the web login widget and returns a raw member session token for secure native storage.

```json
{
  "id": 123456,
  "first_name": "Member",
  "username": "member",
  "photo_url": "https://t.me/i/userpic/...",
  "auth_date": 1778840000,
  "hash": "telegram-signature"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "token": "raw-session-token",
    "expiresAt": "2026-05-22T00:00:00.000Z",
    "user": {},
    "loginMechanism": "telegram_external_browser_callback"
  }
}
```

### `POST /auth/refresh`

Requires `Authorization: Bearer <token>`. Rotates the current member session token and returns a new token.

### `GET /me`

Requires bearer auth. Returns `{ user }`.

### `POST /logout`

Requires bearer auth. Revokes the bearer token used by the request.

## HERTZ

### `GET /hertz/posts`

Query params: `cursor`, `limit`, `category`, `q`, `sort`.

Response data:

```json
{
  "items": [],
  "nextCursor": null
}
```

### `GET /hertz/posts/:shortId`

Returns `{ post }` with comments, community notes, viewer state when bearer auth is present.

### `POST /hertz/posts/:shortId/like`

Requires bearer auth. Toggles the existing HERTZ pulse/like backend and returns `{ liked, active }`.

### `POST /hertz/posts/:shortId/comments`

Requires bearer auth. Body: `{ "content": "Comment text" }`.

### `DELETE /hertz/posts/comments/:commentId`

Requires bearer auth. Deletes own comment or admin-managed comment.

## Content

### `GET /blog`

Lists WordPress-imported blog articles. Query params: `limit`, `offset`, `q`.

### `GET /blog/:slug`

Returns a WordPress-imported blog article detail plus normalized media.

### `GET /outlook`

Lists Outlook articles. Query params: `limit`, `offset`, `q`.

### `GET /outlook/:slug`

Returns Outlook detail plus normalized media.

### `GET /gallery`

Lists media with normalized fields:

```json
{
  "id": "media-id",
  "type": "image",
  "thumbnailUrl": "https://image.example/file.jpg",
  "fullUrl": "https://image.example/file.jpg",
  "article": { "slug": "article-slug", "title": "Article title" }
}
```

## Notifications

### `POST /notifications/register`

Requires bearer auth.

```json
{
  "platform": "android",
  "token": "fcm-token",
  "deviceId": "device-installation-id",
  "appVersion": "1.0.0"
}
```

### `POST /notifications/unregister`

Requires bearer auth.

```json
{ "token": "fcm-token" }
```

## Push Provider

Set `FCM_SERVER_KEY` to enable FCM delivery. Without credentials, notification attempts are persisted with `status = skipped` so product flows keep working during prototype/mobile staging.
