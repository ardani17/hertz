# PRD 1 — Backend Mobile API Patch

Status: **Draft v1** — siap review · 27 Mei 2026
Owner: Backend Engineering
Dependensi: [`architecture-decisions.md`](./architecture-decisions.md), [`audit-backend-readiness.md`](./audit-backend-readiness.md)
Mendahului: [`prd-expo-app.md`](./prd-expo-app.md)

---

## 1. Tujuan & Non-Tujuan

### 1.1 Tujuan

Bangun **kontrak mobile API yang lengkap, konsisten, dan scalable** di prefix `/api/mobile/v1/*` sehingga aplikasi Expo bisa menghadirkan fitur sosial MVP (auth, feed, compose, DM, notifikasi, profil, search, outlook reader, gallery, market rail) **tanpa workaround** terhadap web routes cookie-only.

### 1.2 Non-Tujuan

- **Tidak** mengubah perilaku route web `/api/hertz/*` yang sudah dipakai web client.
- **Tidak** merancang UI/UX mobile (di PRD Expo).
- **Tidak** mengganti web client behavior atau migrasi auth web.
- **Tidak** include Tools (challenge tracker, profitability, dst.) — lihat scope MVP ADR-012.
- **Tidak** introduce GraphQL atau tRPC.

### 1.3 Indikator Sukses

| Metrik | Target |
|--------|--------|
| Endpoint mobile v1 ter-implementasi | 100% dari daftar §4 (P0) + §5 (P1) |
| Test coverage per endpoint baru | ≥ 90% (unit + contract) |
| Response time p95 (Bearer + DB hit) | ≤ 250 ms |
| Error envelope konsistensi | 100% via `apiResponse.ts` |
| Shared types coverage | 100% endpoint dideklarasikan di `shared/types/mobile.ts` |
| Zero regression web routes | All existing E2E + integration tests pass |
| Documentation per endpoint | Tersedia di `docs/mobile/api-reference.md` (generated atau hand-written) |

---

## 2. Stakeholder & Audience

| Peran | Tanggung jawab |
|-------|---------------|
| Backend Engineer | Implementasi |
| Mobile Engineer | Consumer; validasi kontrak di review |
| QA | Contract test + regression web |
| Product | Approve scope per epic |
| DevOps | Migrate Redis rate limit, ENV update |

---

## 3. Prinsip Arsitektur

### 3.1 Clean Architecture (per domain)

```
┌──────────────────────────────────────┐
│ HTTP Layer (route.ts)                │  ← parsing, auth gating, response envelope
│   /api/mobile/v1/<domain>/...        │
└──────────────────┬───────────────────┘
                   │ delegates to
┌──────────────────▼───────────────────┐
│ Service Layer                        │  ← business rules, validation, orchestration
│   server/services/<domain>/...       │
└──────────────────┬───────────────────┘
                   │ uses
┌──────────────────▼───────────────────┐
│ Repository Layer                     │  ← SQL queries (parameterized)
│   server/db/<domain>Repository.ts    │
└──────────────────┬───────────────────┘
                   │
┌──────────────────▼───────────────────┐
│ Database (Postgres) / Redis / R2     │
└──────────────────────────────────────┘
```

Aturan:
- Handler **dilarang** mengakses DB langsung.
- Service **dilarang** import `next/server`.
- Repository **dilarang** punya logic conditional non-data (mis. fee calculation).
- Error dari repository → service → handler dipetakan ke `ErrorCode` standar.

### 3.2 Scalability targets

- Horizontal scale: stateless container; semua state di Postgres/Redis/R2.
- Rate limit shared via Redis (ADR-009).
- Long-running ops (push fanout, thumbnail generation) → background queue (post-MVP; MVP cukup sync).
- Read-heavy endpoints (feed, profile public) cache di Redis 60 s dengan invalidation via service trigger.

### 3.3 Versioning

- Semua endpoint MVP di `v1`.
- Breaking change → `v2` paralel, `v1` tetap aktif minimal 6 bulan.
- Tambah field optional non-breaking → tetap `v1`.
- Header `App-Version: x.y.z` dari client, server cek minimum dari `MOBILE_MIN_APP_VERSION` env.

### 3.4 Security baseline

- Bearer token wajib HTTPS-only (force di reverse proxy).
- Token disimpan hashed (SHA-256 + secret) — sudah ada.
- Telegram HMAC verify wajib di handoff (ADR-003).
- Rate limit policy per kategori (auth/read/mutation/device) — wajib di setiap mutation endpoint.
- Body size limit: 5 MB JSON, 25 MB multipart media.
- SQL injection: hanya parameterized queries; lint rule `no-raw-sql`.
- PII di log: redact token, email, phone.

---

## 4. Scope — Epic Plan

| Epic | Tujuan | Output |
|------|--------|--------|
| **A. Auth Foundation** | Telegram handoff deep link, session management mobile, /me with summary | 5 endpoint + 1 web page handoff |
| **B. Social Core (P0)** | DM, notifications, post create, media upload, profile | 14 endpoint |
| **C. Interactions (P1)** | Bookmark, repost, view, report, comment reply, search, market rail | 8 endpoint |
| **D. Contracts & Infra** | shared types, rate limit Redis, observability, OpenAPI, docs | Tooling + types |
| **E. Push delivery** | Expo Push adapter, notification fanout | Service module |

Order eksekusi: A → B → (C, D, E paralel).

---

## 5. Epic A — Auth Foundation

### A1 — Service `MobileAuthService` (refactor)

**Goal:** Pisahkan logic auth dari handler. Service handle: verifyTelegram, createSession, refreshSession, listSessions, revokeSession, exchangeHandoffNonce.

**Files:**
- `frontend/src/server/services/auth/MobileAuthService.ts` (new)
- `frontend/src/server/services/auth/auth.types.ts` (new)
- `frontend/src/server/services/auth/auth.errors.ts` (new)
- Refactor `frontend/src/lib/memberAuth.ts` → import service.

### A2 — `POST /api/mobile/v1/auth/handoff/init`

**Goal:** Membuat one-time nonce yang akan ditukar setelah login Telegram berhasil di web bridge page. Mengganti flow lama yang membuat client mobile kirim TelegramAuthData mentah (rentan).

**Request:**
```http
POST /api/mobile/v1/auth/handoff/init
Content-Type: application/json

{
  "deviceId": "string (UUID, dari expo-application)",
  "platform": "ios" | "android",
  "appVersion": "1.0.0"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "nonce": "string (32-char URL-safe)",
    "expiresAt": "ISO timestamp (5 min)",
    "handoffUrl": "https://hertz.cloudnexify.com/auth/mobile-handoff?nonce=..."
  }
}
```

**Storage:** Table baru `auth_handoff_nonces`:
```sql
CREATE TABLE auth_handoff_nonces (
  nonce TEXT PRIMARY KEY,
  device_id TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('ios','android')),
  app_version TEXT,
  consumed_at TIMESTAMPTZ,
  user_id INTEGER REFERENCES users(id),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_auth_handoff_nonces_expires_at ON auth_handoff_nonces(expires_at);
```

**Rate limit:** `device` policy (20 / hr per IP).

### A3 — `GET /auth/mobile-handoff` (web page, bukan API)

**Goal:** Halaman bridge yang membungkus Telegram Login Widget. Setelah user authorize Telegram, page memanggil `POST /api/mobile/v1/auth/handoff/exchange` dengan nonce + telegram payload, lalu redirect `hertz://auth/callback?token=...` (deep link).

**Files:**
- `frontend/src/app/auth/mobile-handoff/page.tsx` (new SSR page)
- Reuse `<TelegramLoginButton>` existing.

### A4 — `POST /api/mobile/v1/auth/handoff/exchange`

**Request:**
```json
{
  "nonce": "string",
  "telegramAuth": { "id": 12345, "first_name": "...", "hash": "...", "auth_date": ... }
}
```

**Behavior:**
1. Validate nonce (exists, not consumed, not expired).
2. Verify Telegram HMAC + group membership.
3. Mark nonce consumed.
4. `MobileAuthService.createSession(userId, deviceId, platform, appVersion)`.
5. Return `MobileAuthResponse`.

**Response (200):** sama dengan response existing `/auth/telegram` POST.

### A5 — `POST /api/mobile/v1/auth/refresh` (tidak berubah signature, internal cleanup)

Refactor implementasi pindah ke service. Tambah: bila session terdeteksi dari device yang berbeda (`deviceId` di payload != row), return `401 SESSION_DEVICE_MISMATCH` (audit trail; saat ini diam-diam berhasil).

### A6 — `GET /api/mobile/v1/me`

Extend response dengan `notifications` summary:
```json
{
  "success": true,
  "data": {
    "user": { ... MemberSessionUser ... },
    "notifications": {
      "unreadCount": 12,
      "unreadDmCount": 3
    },
    "session": {
      "id": "uuid",
      "deviceId": "...",
      "platform": "ios",
      "createdAt": "...",
      "lastUsedAt": "..."
    }
  }
}
```

### A7 — `GET /api/mobile/v1/me/sessions`

List semua sesi aktif user.

**Response:**
```json
{
  "success": true,
  "data": {
    "sessions": [
      { "id": "uuid", "deviceId": "...", "platform": "ios", "appVersion": "1.0.0", "createdAt": "...", "lastUsedAt": "...", "current": true }
    ]
  }
}
```

### A8 — `DELETE /api/mobile/v1/me/sessions/:id`

Revoke specific session. Cannot revoke `current` (return `409 CANNOT_REVOKE_CURRENT`; pakai `/logout` untuk current).

### A9 — Migration cleanup

- Migrasi `017`, `019` yang gagal di deploy log (ownership table) — bukan blocker mobile, tapi sekalian dibetulkan supaya idempotent (catat di runbook).

### Deliverables Epic A

| Endpoint / Item | Path |
|----------------|------|
| Service | `server/services/auth/MobileAuthService.ts` |
| New endpoint | `POST /mobile/v1/auth/handoff/init` |
| New endpoint | `POST /mobile/v1/auth/handoff/exchange` |
| Updated endpoint | `GET /mobile/v1/me` |
| New endpoint | `GET /mobile/v1/me/sessions` |
| New endpoint | `DELETE /mobile/v1/me/sessions/:id` |
| Web bridge page | `/auth/mobile-handoff` |
| Migration | `db/migrations/021_auth_handoff_nonces.sql` |
| Types | `shared/types/mobile.ts` (auth section) |
| Unit tests | `tests/unit/frontend/mobileAuth.test.ts` |
| Contract tests | `tests/contract/mobile/auth.spec.ts` |

---

## 6. Epic B — Social Core (P0)

### B1 — DM Inbox

`GET /api/mobile/v1/hertz/messages/inbox`

**Query:** `cursor?`, `limit? (default 20, max 50)`

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "conversationId": "uuid",
        "lastMessage": { "id": "uuid", "content": "...", "sentAt": "...", "fromMe": false },
        "unreadCount": 3,
        "participant": { "userId": 12, "username": "trader1", "displayName": "...", "avatarUrl": "..." },
        "muted": false,
        "blocked": false,
        "archivedAt": null
      }
    ],
    "nextCursor": "string|null"
  }
}
```

Service: `frontend/src/server/services/dm/DirectMessagesService.ts` (extract dari existing).

### B2 — Conversation thread

`GET /api/mobile/v1/hertz/messages/conversations/:conversationId`

**Query:** `after? (messageId)`, `limit? (default 50, max 100)`

**Response:**
```json
{
  "success": true,
  "data": {
    "conversation": {
      "id": "uuid",
      "participants": [{ "userId": 12, "username": "...", "displayName": "...", "avatarUrl": "..." }]
    },
    "messages": [
      {
        "id": "uuid",
        "fromUserId": 12,
        "content": "...",
        "attachments": [{ "id": "uuid", "fileUrl": "...", "thumbnailUrl": "...", "mediaType": "image" }],
        "sentAt": "...",
        "readBy": [{ "userId": 13, "readAt": "..." }]
      }
    ],
    "hasMoreBefore": true
  }
}
```

### B3 — Send message

`POST /api/mobile/v1/hertz/messages/conversations/:conversationId`

**Body:**
```json
{
  "content": "string (1..2000)",
  "attachmentIds": ["uuid", "..."] // optional, max 4
}
```

Pre-condition: attachment harus sudah ter-upload via B13 dan tipe `image`.

**Response (201):** `{ message: MessageObject }`

### B4 — Start conversation

`POST /api/mobile/v1/hertz/messages/conversations`

**Body:**
```json
{ "recipientUserId": 42, "initialMessage": "..." }
```

Behavior: bila conversation sudah ada untuk pair user → return existing.

### B5 — Typing indicator

`POST /api/mobile/v1/hertz/messages/conversations/:conversationId/typing` (set)
`GET  /api/mobile/v1/hertz/messages/conversations/:conversationId/typing` (read)

Read response:
```json
{ "success": true, "data": { "typingUserIds": [12], "lastUpdated": "..." } }
```

Set response: `204 No Content`.

Backend: Redis key `dm:typing:<conversationId>:<userId>` TTL 8 s.

### B6 — Block / unblock / delete / report

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/hertz/messages/blocks/:userId` | POST | Block user |
| `/hertz/messages/blocks/:userId` | DELETE | Unblock |
| `/hertz/messages/messages/:messageId` | DELETE | Delete own message |
| `/hertz/messages/messages/:messageId/report` | POST | Report message |
| `/hertz/messages/conversations/:id` | PATCH | Archive/unarchive (`{ "archived": true }`) |

### B7 — In-app notifications list

`GET /api/mobile/v1/hertz/notifications`

**Query:** `cursor?`, `limit?`

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "type": "pulse|comment|reply|repost|quote|dm|mention",
        "actor": { "userId": 12, "username": "...", "displayName": "...", "avatarUrl": "..." },
        "target": { "postShortId": "hz_xxx" } | { "conversationId": "uuid" },
        "preview": "...",
        "createdAt": "...",
        "readAt": "..." | null
      }
    ],
    "nextCursor": "string|null"
  }
}
```

### B8 — Notification summary

`GET /api/mobile/v1/hertz/notifications/summary`

**Response:**
```json
{ "success": true, "data": { "unreadCount": 12, "unreadDmCount": 3 } }
```

Note: summary juga di-embed di `GET /me` (Epic A) untuk request hemat.

### B9 — Mark as read

`POST /api/mobile/v1/hertz/notifications/read`

**Body:**
```json
{ "ids": ["uuid", "..."] }   // empty = mark all
```

Response: `{ "marked": 3 }`.

### B10 — Create post

`POST /api/mobile/v1/hertz/posts`

**Body:**
```json
{
  "category": "free_post|trade_idea|journal|story|analysis",
  "content": "string (1..4000)",
  "marketContext": {
    "pair": "XAUUSD",
    "side": "buy|sell",
    "entry": 2300.5,
    "stopLoss": 2280,
    "takeProfit": 2350,
    "riskPercent": 1.0
  },
  "mediaIds": ["uuid", "..."]    // optional, max 4
}
```

**Response (201):** `{ post: HertzPost }`

Validation aligned with web: bot publishes set `source: telegram`; this endpoint set `source: web` (rename to `web` since `dashboard`/`web` enum — see audit). Telegram bot tetap pakai jalur sendiri.

### B11 — Update / delete own post

| Method | Path | Body |
|--------|------|------|
| PATCH | `/mobile/v1/hertz/posts/:shortId` | Subset fields dari create |
| DELETE | `/mobile/v1/hertz/posts/:shortId` | — |

### B12 — Comments

| Method | Path | Body |
|--------|------|------|
| GET | `/mobile/v1/hertz/posts/:shortId/comments` | `?cursor&limit` |
| POST | `/mobile/v1/hertz/posts/:shortId/comments` | `{ content, parentCommentId? }` |
| PATCH | `/mobile/v1/hertz/posts/comments/:commentId` | `{ content }` |
| DELETE | `/mobile/v1/hertz/posts/comments/:commentId` | — |

### B13 — Media upload

`POST /api/mobile/v1/media/upload`

**Body:** `multipart/form-data`
- `file`: required
- `purpose`: `"post" | "dm" | "profile_avatar" | "profile_cover"`

**Response (201):**
```json
{
  "success": true,
  "data": {
    "media": {
      "id": "uuid",
      "fileUrl": "https://...",
      "thumbnailUrl": "https://...",
      "mediaType": "image|video",
      "width": 1920,
      "height": 1080,
      "sizeBytes": 1234567
    }
  }
}
```

Validation per purpose:
- `post`: jpg/png/webp/mp4/webm/mov, max 25 MB
- `dm`: jpg/png/webp, max 5 MB (sesuai `DM_MAX_IMAGE_SIZE_MB`)
- `profile_*`: jpg/png/webp, max 5 MB, server-side resize ke 512x512 (post-MVP)

Rate limit: `mutation` policy.

### B14 — Push token register (existing — minor patch)

`POST /api/mobile/v1/notifications/register`

Tambah field `platform: "expo"` (ADR-004). Backward compatible dengan `android`/`ios` lama.

Validator format token Expo: `^ExponentPushToken\[[A-Za-z0-9_-]+\]$`. Validator FCM/APNs tetap.

### B15 — Profile me

| Method | Path | Body |
|--------|------|------|
| GET | `/mobile/v1/profile/me` | — |
| PATCH | `/mobile/v1/profile/me` | `MemberProfileInput` (existing type) |

PATCH body whitelist: `bio`, `location`, `hobbies[]`, `socialLinks{}`, `trading{}`, `displayName`, `avatarMediaId?`, `coverMediaId?`.

### B16 — Public profile by username

`GET /api/mobile/v1/profile/:username`

**Response:**
```json
{
  "success": true,
  "data": {
    "profile": { /* PublicProfileDto */ },
    "stats": { "postCount": 42, "followerCount": 0, "followingCount": 0 },
    "isBlockedByMe": false,
    "isBlockingMe": false
  }
}
```

(Note: follow system tidak ada di MVP — return 0 untuk forward compat.)

### Deliverables Epic B

- 14 endpoint baru/refactor
- Service: `DirectMessagesService`, `InAppNotificationService`, `HertzPostService` (extend), `HertzMediaService`, `HertzProfileService`
- Types: extend `shared/types/mobile.ts` dengan DM/notification/profile/media DTO
- Migration: opsional kolom `device_tokens.platform` extend enum (`ALTER TYPE`)
- Contract tests per endpoint

---

## 7. Epic C — Interactions (P1)

| Endpoint | Notes |
|----------|-------|
| `POST /mobile/v1/hertz/posts/:shortId/bookmark` | Toggle (`{ bookmarked }` response) |
| `POST /mobile/v1/hertz/posts/:shortId/repost` | Body `{ kind: "plain" \| "quote", quoteContent? }` |
| `POST /mobile/v1/hertz/posts/:shortId/view` | Body none; rate limit aware |
| `POST /mobile/v1/hertz/posts/:shortId/report` | Body `{ reason, details? }` |
| `GET  /mobile/v1/hertz/search?q=&type=post\|member` | Aggregate search |
| `GET  /mobile/v1/hertz/posts?author=<userId>` | Add filter to existing endpoint |
| `GET  /mobile/v1/market/rail` | Mirror existing public endpoint |
| `GET  /mobile/v1/hertz/profile/:username/activity` | Activity timeline (P1, optional) |

Rename `POST /like` → tetap `like` (alias `pulse` di service untuk backward compat web wording).

### Deliverables Epic C

- 8 endpoint
- Service `HertzInteractionsService` (extend) untuk bookmark/repost/view/report
- Service `HertzSearchService` (new)
- Service `MarketRailService` (extract)

---

## 8. Epic D — Contracts & Infrastructure

### D1 — `shared/types/mobile.ts`

Single source untuk semua DTO mobile. Struktur:

```ts
// shared/types/mobile.ts
export interface ApiEnvelope<T> { success: true; data: T; }
export interface ApiErrorEnvelope {
  success: false;
  error: { code: ErrorCode; message: string; details?: unknown; timestamp: string; };
}

export interface MobileAuthResponse {
  token: string;
  expiresAt: string;
  user: MemberSessionUser;
  session: MobileSessionInfo;
  loginMechanism: 'telegram_external_browser_callback';
}

export interface MobileSessionInfo {
  id: string;
  deviceId: string;
  platform: 'ios' | 'android';
  appVersion: string;
  createdAt: string;
  lastUsedAt: string;
}

// ... DM, notifications, profile, media, search, market — semua DTO mobile
```

Generated dengan tsc check sebelum commit.

### D2 — Standardisasi `ErrorCode`

Hapus alias (`AUTH_REQUIRED` vs `UNAUTHENTICATED`). Single enum di `shared/types/errors.ts`:

```ts
export enum ErrorCode {
  // Auth
  UNAUTHENTICATED = 'UNAUTHENTICATED',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  SESSION_DEVICE_MISMATCH = 'SESSION_DEVICE_MISMATCH',
  FORBIDDEN = 'FORBIDDEN',
  MEMBERSHIP_INACTIVE = 'MEMBERSHIP_INACTIVE',
  MEMBERSHIP_UNAVAILABLE = 'MEMBERSHIP_UNAVAILABLE',
  // Validation
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  PAYLOAD_TOO_LARGE = 'PAYLOAD_TOO_LARGE',
  UNSUPPORTED_MEDIA_TYPE = 'UNSUPPORTED_MEDIA_TYPE',
  // Resource
  NOT_FOUND = 'NOT_FOUND',
  POST_NOT_FOUND = 'POST_NOT_FOUND',
  CONVERSATION_NOT_FOUND = 'CONVERSATION_NOT_FOUND',
  // Conflict
  CONFLICT = 'CONFLICT',
  CANNOT_REVOKE_CURRENT = 'CANNOT_REVOKE_CURRENT',
  // Rate
  RATE_LIMITED = 'RATE_LIMITED',
  // Upstream
  UPSTREAM_UNAVAILABLE = 'UPSTREAM_UNAVAILABLE',
  // Versioning
  UPGRADE_REQUIRED = 'UPGRADE_REQUIRED',
  // Internal
  INTERNAL = 'INTERNAL',
}
```

Mapping ke HTTP status di `apiResponse.ts`. Backward compat: handler lama yang return `AUTH_REQUIRED` → silent translate ke `UNAUTHENTICATED` 1 release, lalu warn → remove.

### D3 — Rate limiter Redis-backed

File baru: `frontend/src/server/infra/RedisRateLimiter.ts`.

API:
```ts
interface RateLimiter {
  consume(key: string, policy: RatePolicy): Promise<RateResult>;
}
type RateResult =
  | { ok: true; remaining: number; resetAt: Date }
  | { ok: false; retryAfter: number; resetAt: Date };
```

Backend Redis dengan `INCR` + `EXPIRE` first request. Fallback in-memory bila Redis disconnect (warn log, hint counter inaccurate).

Policy table (sama seperti existing):

| Policy | Limit | Window |
|--------|-------|--------|
| auth | 12 | 10 min |
| read | 240 | 10 min |
| mutation | 60 | 10 min |
| device | 20 | 1 hr |
| upload | 30 | 10 min |

Key format: `rl:<policy>:<identity>` (identity = userId bila auth, IP bila guest).

### D4 — Middleware logging + Request ID

File baru: `frontend/src/server/middleware/withRequestId.ts`.

Setiap request mobile:
- Baca `X-Request-ID` dari header; generate UUID v4 bila tidak ada.
- Inject ke context (passed ke service via `ServiceContext`).
- Append ke response header.
- Log JSON line di `console.log` (di-tangkap docker logging driver).

Format log:
```json
{ "ts": "2026-05-27T03:00:00.000Z", "level": "info", "route": "POST /mobile/v1/hertz/posts", "status": 201, "requestId": "uuid", "userId": 12, "latencyMs": 45 }
```

### D5 — App-Version gating

Helper: `requireSupportedAppVersion(request)`. Bila header `App-Version` < `MOBILE_MIN_APP_VERSION` env → return 426 `UPGRADE_REQUIRED` dengan body:
```json
{
  "success": false,
  "error": {
    "code": "UPGRADE_REQUIRED",
    "message": "Versi aplikasi Anda tidak lagi didukung. Update ke versi terbaru.",
    "details": { "minVersion": "1.0.0", "currentVersion": "0.9.0" }
  }
}
```

### D6 — OpenAPI generation (P2, masuk D karena tooling)

Generator manual: `scripts/generate-openapi.ts` baca semua `route.ts` mobile v1 + types → emit `docs/mobile/openapi.json`. Dipakai untuk:
- Reference doc (`docs/mobile/api-reference.md`)
- Mobile client kalau ingin generate types

MVP: cukup hand-written `api-reference.md` per endpoint. OpenAPI optional kalau ada budget.

### D7 — Contract test harness

File: `tests/contract/mobile/<domain>.spec.ts`.

Per endpoint test:
- Schema response (zod check terhadap `shared/types`)
- Status code matrix (200/201/400/401/403/404/429)
- Idempotency (DELETE → 404 idempotent)
- Cursor pagination consistency

Run via `npm run test:contract`. CI gate.

### Deliverables Epic D

- `shared/types/mobile.ts`
- `shared/types/errors.ts` (canonical)
- `RedisRateLimiter`
- `withRequestId` middleware + structured log
- App-Version gating helper
- `api-reference.md` (markdown)
- Contract test infra

---

## 9. Epic E — Push Delivery

### E1 — Adapter pattern

```ts
// server/services/notifications/PushDeliveryService.ts
interface PushAdapter {
  send(input: PushSendInput): Promise<PushSendResult>;
  validateToken(token: string, platform: DevicePlatform): boolean;
}

interface PushSendInput {
  tokens: string[];          // batched
  title: string;
  body: string;
  data: Record<string, string>;
  badgeCount?: number;
  sound?: 'default' | null;
  ttlSeconds?: number;
}

class ExpoPushAdapter implements PushAdapter { ... }
class FcmHttpV1Adapter implements PushAdapter { ... } // post-MVP

class PushDeliveryService {
  constructor(private adapter: PushAdapter) {}
  async fanOut(userId: number, payload: PushPayload): Promise<void>;
  async fanOutMany(userIds: number[], payload: PushPayload): Promise<void>;
}
```

ENV switch: `PUSH_PROVIDER=expo|fcm_http_v1` (default `expo`).

### E2 — Event triggers

| Trigger | Source | Payload |
|---------|--------|---------|
| `dm.message.created` | After insert hertz_messages | `{ title: "Pesan baru dari @user", body: "<preview>", data: { type: "dm", conversationId } }` |
| `hertz.comment.created` | After insert hertz_comments | `{ title: "@user mengomentari post Anda", body: "<preview>", data: { type: "comment", postShortId } }` |
| `hertz.pulse.created` | After insert hertz_reactions (debounce 1/menit/per post) | `{ title: "@user memberikan pulse", body: "...", data: { type: "pulse", postShortId } }` |
| `hertz.repost.created` | After insert hertz_reposts | `{ title: "@user me-repost Anda", body: "...", data: { type: "repost", postShortId } }` |
| `hertz.mention` | After post/comment dengan @username | `{ title: "@user menyebut Anda", body: "<preview>", data: { type: "mention", postShortId } }` |

Service trigger: dipanggil dari `DirectMessagesService`, `HertzPostService`, `HertzInteractionsService` setelah commit DB.

### E3 — Delivery logging

Setiap fanout → row di `notification_events`:
- `status`: `queued | sent | failed | invalid_token`
- `provider`: `expo | fcm | apns`
- `attempt_count`
- `last_error?`

Token yang invalid (`DeviceNotRegistered` dari Expo) → mark `device_tokens.enabled = false`.

### E4 — Rate limit per user push

Max 30 push/jam/user (drop excess, debounce). Implemented di service.

### Deliverables Epic E

- `PushDeliveryService` + 2 adapter
- Service triggers di DM, post, comment, repost
- Migration `device_tokens.platform` enum extend (Epic B)
- Unit test adapter
- Integration test happy path

---

## 10. Data Model Changes

### 10.1 Migrasi baru

| File | Isi |
|------|-----|
| `db/migrations/021_auth_handoff_nonces.sql` | Table `auth_handoff_nonces` |
| `db/migrations/022_device_tokens_expo.sql` | `ALTER TYPE device_platform ADD VALUE 'expo'` |

### 10.2 Index review

Verifikasi index existing cukup untuk query mobile:

| Table | Index dibutuhkan | Status |
|-------|------------------|--------|
| `hertz_messages` | `(conversation_id, sent_at DESC)` | ✅ |
| `hertz_notifications` | `(user_id, read_at, created_at DESC)` | ✅ |
| `hertz_member_sessions` | `(user_id, expires_at)` | ✅ |
| `device_tokens` | `(user_id, enabled)` | ✅ |
| `auth_handoff_nonces` | `(expires_at)` partial unconsumed | Add in 021 |

### 10.3 Cleanup job (cron container, optional)

- `auth_handoff_nonces` expired > 1 hari → delete
- `hertz_member_sessions` expired > 30 hari → delete
- `notification_events` > 90 hari → delete

MVP: manual SQL via runbook. Cron post-MVP.

---

## 11. Environment Variables (delta)

| Var | Default | Purpose |
|-----|---------|---------|
| `EXPO_ACCESS_TOKEN` | — | Expo Push Service (optional, untuk receipt query) |
| `PUSH_PROVIDER` | `expo` | `expo \| fcm_http_v1` |
| `MOBILE_DEEP_LINK_SCHEME` | `hertz` | Custom URL scheme |
| `MOBILE_APP_BUNDLE_ID_IOS` | `com.hertz.app` | Universal Link AASA |
| `MOBILE_APP_PACKAGE_ANDROID` | `com.hertz.app` | App Link assetlinks |
| `MOBILE_MIN_APP_VERSION` | `1.0.0` | Gating |
| `MOBILE_HANDOFF_NONCE_TTL_SECONDS` | `300` | 5 min |
| `RATE_LIMITER_BACKEND` | `redis` | `redis \| memory` (fallback) |

Update `.env.example`. Tambah validator di `deploy-docker.sh` untuk warn bila `EXPO_ACCESS_TOKEN` kosong & `PUSH_PROVIDER=expo`.

---

## 12. Observability & SLO

### 12.1 Metrik

Logged structured (Epic D4); aggregation manual via `docker logs | jq`. Post-MVP: ship ke Loki/Grafana.

Per endpoint:
- Request count
- Latency p50/p95/p99
- Error rate per ErrorCode

### 12.2 SLO target MVP

| Endpoint kategori | Latency p95 | Availability |
|-------------------|-------------|--------------|
| Auth (`/auth/*`, `/me`) | 200 ms | 99.5% |
| Read (`GET *`) | 250 ms | 99.5% |
| Mutation (`POST/PATCH/DELETE *`) | 400 ms | 99% |
| Upload | 2 s | 99% |

### 12.3 Alert (post-MVP)

- Error rate > 5% in 5 min window → page on-call
- p95 latency > 2x target in 10 min → warn
- Push delivery success < 90% in 1 hr → warn

---

## 13. Rollout & Migration Plan

### 13.1 Backend deploy order

1. Migration `021` + `022` (additive, safe).
2. Epic D infra (logging, rate limit, types) — no behavior change for existing endpoints.
3. Epic A (auth handoff) — new endpoints, no impact lama.
4. Epic B (social P0) — new endpoints, web tidak terpengaruh.
5. Epic E (push adapter switch) — gated via `PUSH_PROVIDER` env.
6. Epic C (P1) — additive.

Setiap step deploy via `bash deploy-docker.sh`. Validasi via health check + smoke test contract.

### 13.2 Backward compat web

- Web routes `/api/hertz/*`, `/api/auth/*`, `/api/media/upload` **tidak berubah**.
- Bot service tidak berubah.

### 13.3 Rollback strategy

Semua perubahan additive. Bila ada bug di Epic B endpoint mobile:
- Restore image previous (`docker tag hertz-frontend:previous hertz-frontend:latest`).
- Migration `021/022` aman rollback manual (`DROP TABLE auth_handoff_nonces`, `ALTER TYPE` lebih sulit — leave value, no-op).

---

## 14. Test Strategy

### 14.1 Unit test

- Setiap service ≥ 90% branch coverage.
- Mock DB & Redis via test fixtures.

### 14.2 Contract test

- Per endpoint baru: schema validation, status code matrix, auth gating, rate limit boundary.
- Run di CI.

### 14.3 Integration test

- DM full flow: register push → start conversation → send message → trigger push event (mock provider).
- Auth handoff flow: init → manual nonce → exchange → me.
- Post create + upload: upload media → create post with `mediaIds` → fetch post → assert media attached.

### 14.4 Load test (P1)

- k6 script untuk feed GET dan DM thread GET (target 50 concurrent users, p95 < SLO).
- Baseline sebelum public launch.

### 14.5 Regression web

- Existing E2E (Playwright) wajib pass setelah deploy backend.
- Smoke test pre-deploy.

---

## 15. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Telegram handoff UX dirasa awkward (in-app browser bounce) | Medium | High | UX test dengan 5 user; alternative: pakai bot deep link Telegram |
| Expo Push throttling saat viral notification | Low | Medium | Adapter siap migrate ke FCM v1; debounce di service |
| Redis down → rate limit drop | Low | Low | Fallback in-memory + warn log; tidak bocor security |
| Migration `017/019` legacy fail menghalangi `021/022` | Medium | Medium | Patch ownership di runbook sebelum deploy 021 |
| Image upload payload kelebihan 25 MB | Medium | Low | Client-side compress di Expo (PRD Expo Epic D) |
| Multiple device push spam (notif sama 3x bila 3 device) | High | Low | Acceptable for MVP; v2 dedupe by event |

---

## 16. Acceptance Criteria

### 16.1 Per Epic

**Epic A — Auth Foundation**

- [ ] Handoff init → exchange → me flow lulus integration test.
- [ ] `GET /me` mengembalikan notifications summary + session info.
- [ ] `GET /me/sessions` + `DELETE /me/sessions/:id` lulus contract test.
- [ ] Bridge page `/auth/mobile-handoff` redirect deep link `hertz://auth/callback?token=...`.

**Epic B — Social Core**

- [ ] 14 endpoint lulus contract test.
- [ ] DM full flow: inbox → conversation → send → typing → block lulus integration test.
- [ ] Create post dengan media + market context lulus E2E (via test akun).
- [ ] Push register Expo token & native FCM token sama-sama valid.

**Epic C — Interactions**

- [ ] Bookmark/repost/view/report toggle lulus.
- [ ] Search return ≤ 50 hasil dengan cursor pagination.
- [ ] Market rail return data fresh ≤ 60 s old.

**Epic D — Contracts & Infra**

- [ ] `shared/types/mobile.ts` cover 100% endpoint.
- [ ] Redis rate limiter lulus load test (boundary tested).
- [ ] Structured log muncul di `docker logs hertz-frontend | jq`.
- [ ] `app-version` < min → 426 dengan body informatif.
- [ ] `api-reference.md` lengkap.

**Epic E — Push**

- [ ] `ExpoPushAdapter.send` happy path delivery ≥ 95% di test.
- [ ] Invalid token disable `device_tokens.enabled = false`.
- [ ] Trigger DM message → push delivered (mock).

### 16.2 Definition of Done (overall)

- [ ] Semua P0 & P1 endpoint live di prod.
- [ ] `npm test` + `npm run test:contract` hijau di CI.
- [ ] Web regression hijau.
- [ ] Runbook deploy ada di `docs/mobile/runbook.md`.
- [ ] Mobile engineer sign-off bahwa kontrak cukup untuk PRD Expo.

---

## 17. Out of Scope / Future Work

- Follow system (followers/following)
- Quote repost dengan rich card preview
- Voice message DM
- Video upload + transcoding pipeline
- Federation / public API for third parties
- Web push (browser)
- WebSocket DM realtime
- Admin moderation API
- OAuth third-party (Google, Apple) login

---

## 18. Lampiran

### 18.1 Endpoint summary table (final)

| # | Method | Path | Auth | Epic |
|---|--------|------|------|------|
| 1 | POST | `/api/mobile/v1/auth/handoff/init` | Public | A |
| 2 | POST | `/api/mobile/v1/auth/handoff/exchange` | Public | A |
| 3 | POST | `/api/mobile/v1/auth/refresh` | Bearer | A (existing patch) |
| 4 | POST | `/api/mobile/v1/auth/telegram` | Public | A (kept, deprecated) |
| 5 | POST | `/api/mobile/v1/logout` | Bearer | A (existing) |
| 6 | GET | `/api/mobile/v1/me` | Bearer | A (patch) |
| 7 | GET | `/api/mobile/v1/me/sessions` | Bearer | A |
| 8 | DELETE | `/api/mobile/v1/me/sessions/:id` | Bearer | A |
| 9 | POST | `/api/mobile/v1/notifications/register` | Bearer | A (existing patch Epic B14) |
| 10 | POST | `/api/mobile/v1/notifications/unregister` | Bearer | A (existing) |
| 11 | GET | `/api/mobile/v1/hertz/posts` | Opt Bearer | B (patch filter) |
| 12 | POST | `/api/mobile/v1/hertz/posts` | Bearer | B |
| 13 | GET | `/api/mobile/v1/hertz/posts/:shortId` | Opt Bearer | B (existing) |
| 14 | PATCH | `/api/mobile/v1/hertz/posts/:shortId` | Bearer | B |
| 15 | DELETE | `/api/mobile/v1/hertz/posts/:shortId` | Bearer | B |
| 16 | POST | `/api/mobile/v1/hertz/posts/:shortId/like` | Bearer | B (existing) |
| 17 | POST | `/api/mobile/v1/hertz/posts/:shortId/bookmark` | Bearer | C |
| 18 | POST | `/api/mobile/v1/hertz/posts/:shortId/repost` | Bearer | C |
| 19 | POST | `/api/mobile/v1/hertz/posts/:shortId/view` | Opt Bearer | C |
| 20 | POST | `/api/mobile/v1/hertz/posts/:shortId/report` | Bearer | C |
| 21 | GET | `/api/mobile/v1/hertz/posts/:shortId/comments` | Opt Bearer | B |
| 22 | POST | `/api/mobile/v1/hertz/posts/:shortId/comments` | Bearer | B (patch reply) |
| 23 | PATCH | `/api/mobile/v1/hertz/posts/comments/:commentId` | Bearer | B |
| 24 | DELETE | `/api/mobile/v1/hertz/posts/comments/:commentId` | Bearer | B (existing) |
| 25 | GET | `/api/mobile/v1/hertz/messages/inbox` | Bearer | B |
| 26 | POST | `/api/mobile/v1/hertz/messages/conversations` | Bearer | B |
| 27 | GET | `/api/mobile/v1/hertz/messages/conversations/:id` | Bearer | B |
| 28 | POST | `/api/mobile/v1/hertz/messages/conversations/:id` | Bearer | B |
| 29 | PATCH | `/api/mobile/v1/hertz/messages/conversations/:id` | Bearer | B (archive) |
| 30 | GET | `/api/mobile/v1/hertz/messages/conversations/:id/typing` | Bearer | B |
| 31 | POST | `/api/mobile/v1/hertz/messages/conversations/:id/typing` | Bearer | B |
| 32 | DELETE | `/api/mobile/v1/hertz/messages/messages/:id` | Bearer | B |
| 33 | POST | `/api/mobile/v1/hertz/messages/messages/:id/report` | Bearer | B |
| 34 | POST | `/api/mobile/v1/hertz/messages/blocks/:userId` | Bearer | B |
| 35 | DELETE | `/api/mobile/v1/hertz/messages/blocks/:userId` | Bearer | B |
| 36 | GET | `/api/mobile/v1/hertz/notifications` | Bearer | B |
| 37 | GET | `/api/mobile/v1/hertz/notifications/summary` | Bearer | B |
| 38 | POST | `/api/mobile/v1/hertz/notifications/read` | Bearer | B |
| 39 | GET | `/api/mobile/v1/profile/me` | Bearer | B |
| 40 | PATCH | `/api/mobile/v1/profile/me` | Bearer | B |
| 41 | GET | `/api/mobile/v1/profile/:username` | Opt Bearer | B |
| 42 | GET | `/api/mobile/v1/hertz/profile/:username/activity` | Opt Bearer | C |
| 43 | POST | `/api/mobile/v1/media/upload` | Bearer | B |
| 44 | GET | `/api/mobile/v1/gallery` | Public | (existing) |
| 45 | GET | `/api/mobile/v1/outlook` | Public | (existing) |
| 46 | GET | `/api/mobile/v1/outlook/:slug` | Public | (existing) |
| 47 | GET | `/api/mobile/v1/hertz/search` | Opt Bearer | C |
| 48 | GET | `/api/mobile/v1/market/rail` | Public | C |

**Total:** 48 endpoint (14 existing + 34 baru).

### 18.2 Runbook ringkas (di-detail di file terpisah saat deploy)

1. Backup DB pre-migration.
2. Run migrations 021, 022 via `deploy-docker.sh` (auto).
3. Verify health check.
4. Run contract test suite (CI / `npm run test:contract`).
5. Smoke: `curl https://hertz.cloudnexify.com/api/mobile/v1/me` (without token → expect 401).
6. Rotate `EXPO_ACCESS_TOKEN` saat needed.

### 18.3 Naming convention

- Resource collection: `/<resource>` (plural).
- Action on resource: `/<resource>/<id>/<action>` (verb di akhir, mis. `bookmark`, `report`).
- Sub-resource: `/<resource>/<id>/<sub-resource>`.

---

## 19. Sign-off

| Reviewer | Role | Status |
|----------|------|--------|
| _____ | Tech Lead | [ ] |
| _____ | Backend Eng | [ ] |
| _____ | Mobile Eng (consumer) | [ ] |
| _____ | DevOps | [ ] |
| _____ | Product | [ ] |

Setelah sign-off Epic A boleh dimulai.

---

Lihat juga: [`prd-expo-app.md`](./prd-expo-app.md) untuk PRD aplikasi mobile yang mengonsumsi API ini.
