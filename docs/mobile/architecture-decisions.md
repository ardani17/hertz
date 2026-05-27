# Architecture Decision Record — Hertz Mobile (Expo)

Status: **Draft v1** · 27 Mei 2026
Owner: Engineering
Scope: Backend mobile patch + Expo client app

Dokumen ini mencatat keputusan arsitektur yang dipakai oleh dua PRD:
- [`prd-backend-mobile-api.md`](./prd-backend-mobile-api.md)
- [`prd-expo-app.md`](./prd-expo-app.md)

Setiap keputusan disertai alternatif yang ditolak, konsekuensi, dan trigger untuk revisi. Tandai status di header sebelum implementasi besar dimulai. ADR ini sengaja dibuat ringkas; rincian implementasi ada di masing-masing PRD.

---

## ADR-001 — Mirror endpoint mobile di `/api/mobile/v1/*`

**Status:** Accepted
**Konteks:** Semua route `/api/hertz/*` di web saat ini hanya menerima cookie session (`getCurrentMember()`). Mobile client tidak bisa pakai karena Expo tidak mengirim cookie cross-origin secure ke domain web tanpa workaround.

**Keputusan:** Tambah/mirror seluruh endpoint yang dibutuhkan mobile di prefix `/api/mobile/v1/*` dengan auth `Authorization: Bearer <token>` (menggunakan helper `requireMobileMember`).

**Alternatif yang ditolak:**
- **Dual-auth helper di web routes** (`getCurrentMemberFromRequest(cookie OR bearer)`).
  *Ditolak:* mencampur surface area, sulit men-deprecate route web bila kelak dipindah, ramping tetapi memperbesar blast radius untuk mobile-specific bug.
- **GraphQL gateway.** *Ditolak:* tambah satu layer baru, ekosistem RN client lebih kompleks, kontrak REST sudah lekat di codebase.
- **Reverse-proxy yang menerjemahkan Bearer → cookie.** *Ditolak:* operasi runtime tersembunyi, debugging payah.

**Konsekuensi:**
- Duplikasi tipis di handler (ditekan dengan **service layer extraction**, lihat ADR-002).
- Versioning eksplisit (`v1` → `v2` saat kontrak berubah breaking).
- Mobile client tidak perlu tahu apapun soal cookie.

**Revisi bila:** ≥ 80% endpoint web member juga butuh dipanggil dari konteks non-cookie (mis. integrasi pihak ketiga) → reconsider dual-auth helper.

---

## ADR-002 — Service layer wajib untuk semua handler mobile

**Status:** Accepted
**Konteks:** Mirror handler bisa menjadi copy-paste neraka kalau logic ditulis ulang di tiap route. Service web sudah ada untuk beberapa domain (`MembershipService`, `HertzPublicProfileService`, `HertzDirectMessagesService`, dll) tapi tidak konsisten.

**Keputusan:** Setiap handler `/api/mobile/v1/*` dan `/api/hertz/*` web wajib delegasi ke **service object** di `frontend/src/server/services/<domain>/`. Handler hanya bertanggung jawab: parsing input, auth gating, memanggil service, envelope response.

**Struktur target:**

```
frontend/src/server/services/
├── dm/
│   ├── DirectMessagesService.ts        # business logic
│   ├── dm.types.ts                     # internal types
│   └── dm.errors.ts
├── notifications/
│   ├── InAppNotificationService.ts
│   └── PushDeliveryService.ts          # abstraction (Expo/FCM/APNs)
├── posts/
│   ├── HertzPostService.ts
│   ├── HertzInteractionsService.ts
│   └── HertzMediaService.ts
└── profile/
    └── HertzProfileService.ts
```

**Konsekuensi:**
- Route file ≤ 80 baris (parsing, auth, delegasi, response).
- Service bisa dipakai juga dari bot atau script tanpa HTTP overhead.
- Lebih mudah unit-test service tanpa Next.js request mocks.

**Revisi bila:** Tim memutuskan migrasi ke arsitektur tRPC/RPC; service layer tetap relevan tapi handler diganti generator.

---

## ADR-003 — Telegram login via in-app browser + deep-link callback

**Status:** Accepted (dengan asumsi untuk diverifikasi)
**Konteks:** Web menggunakan Telegram Login Widget yang men-set cookie. Di Expo, opsi:
1. **In-app browser** (`expo-web-browser`) buka `https://hertz.cloudnexify.com/auth/mobile-handoff?nonce=...`, server redirect ke Telegram OAuth, callback ke deep link `hertz://auth?token=...`.
2. **Native Telegram SDK** (third-party, butuh bot domain config).
3. **WebView embedded** — di-deprecate Telegram untuk auth (security).

**Keputusan:** Pakai (1) — in-app browser + universal/deep link callback.

**Konsekuensi:**
- Endpoint baru: `POST /api/mobile/v1/auth/handoff/init` (membuat nonce) dan `GET /auth/mobile-handoff` (web page yang membungkus Telegram Widget + redirect deep link saat sukses).
- Backend menukar `nonce + telegram payload` jadi `Bearer token` via `POST /api/mobile/v1/auth/handoff/exchange`.
- iOS App Universal Link + Android App Link harus dikonfigurasi (lihat PRD Expo, Epic A).
- Field `loginMechanism: 'telegram_external_browser_callback'` yang sudah ada di response cocok dipakai.

**Revisi bila:** Telegram menerbitkan SDK native resmi untuk RN.

---

## ADR-004 — Push notifications via Expo Push Service (managed) dengan adapter

**Status:** Accepted
**Konteks:** Backend saat ini hanya pakai **FCM HTTP legacy** (`FCM_SERVER_KEY`). FCM legacy sudah deprecated, dan iOS tidak ada path. Expo Push Service:
- Satu HTTP API (`https://exp.host/--/api/v2/push/send`) untuk Android (FCM) dan iOS (APNs).
- Token format `ExponentPushToken[xxxxx]`.
- Free tier cukup untuk MVP.
- Bekerja di Expo managed workflow tanpa konfigurasi APNs/FCM credentials langsung.

**Keputusan:** MVP pakai **Expo Push Service**. Backend wrap dengan adapter `PushDeliveryService` yang punya 2 implementasi:
- `ExpoPushAdapter` (default, MVP).
- `FcmHttpV1Adapter` (opt-in via env, untuk migrasi pasca-MVP bila perlu).

**Konsekuensi:**
- `device_tokens.platform` ditambah enum `expo` (selain `android`/`ios`).
- `device_tokens.token` menyimpan `ExponentPushToken[...]`.
- Endpoint register tetap `POST /api/mobile/v1/notifications/register`, tambah validator format Expo.
- Tidak butuh setup APNs key / Firebase service account di MVP.

**Revisi bila:** Volume push > 100k/hari (Expo throttling), atau butuh fitur APNs spesifik (rich notifications, critical alerts).

---

## ADR-005 — Polling untuk DM realtime (MVP), upgrade ke WebSocket di v2

**Status:** Accepted
**Konteks:** Web pakai polling 5s (`useDmThread`) dan 4s (typing). RN bisa adopt strategi sama. WebSocket butuh server `ws` di Next.js (rumit) atau service terpisah (operational cost).

**Keputusan:** MVP pakai polling identik web. Push notification jadi trigger awal supaya client refresh lebih cepat ketika app foreground.

**Konsekuensi:**
- Hemat infra; reuse polling logic.
- Battery hit terkendali karena polling dihentikan saat app background (lihat PRD Expo, Epic E).
- Endpoint mobile baru harus support cursor `?after=<messageId>` (sudah ada di web).

**Revisi bila:** Volume DM > 50 msg/menit/conversation aktif, atau user feedback latency mengganggu.

---

## ADR-006 — Shared types via `shared/types/mobile.ts`

**Status:** Accepted
**Konteks:** Web types di `shared/types/feed.ts`, `membership.ts`, `memberProfile.ts` cukup untuk feed/auth, tapi tidak ada DM, notifications, mobile-specific auth response, device token.

**Keputusan:** Tambah `shared/types/mobile.ts` yang berisi:
- `MobileAuthResponse`, `MobileMeResponse`
- `MobileDmThreadResponse`, `MobileDmInboxItem`, `MobileDmSendInput`
- `MobileNotificationSummary`, `MobileNotificationItem`
- `MobilePushRegisterInput`, `DevicePlatform`
- Re-export `HertzPost`, `HertzComment` dengan alias `MobileHertzPost` bila perlu trim field.

Client Expo (`apps/mobile/src/api/types.ts`) consume via path alias `@shared/types` (sama seperti `frontend/`).

**Konsekuensi:**
- Single source of truth untuk kontrak.
- Type-check otomatis di CI menjamin tidak ada drift backend ↔ client.

**Revisi bila:** Mobile butuh field yang sama sekali tidak relevan untuk web; saat itu split jadi `mobile.contract.ts`.

---

## ADR-007 — Monorepo: `apps/mobile/` untuk Expo

**Status:** Accepted
**Konteks:** Repo saat ini sudah monorepo de-facto (`frontend/`, `bot/`, `shared/`). Menambah `apps/mobile/` (Expo workspace) menyatukan tooling, type sharing, CI.

**Keputusan:** Letakkan Expo project di `apps/mobile/`. `package.json` root memperlakukannya sebagai workspace npm.

**Struktur target:**

```
hertz/
├── frontend/                # Next.js (web + API)
├── bot/                     # Telegram bot
├── shared/
│   ├── constants.ts
│   ├── schemas/
│   └── types/
│       ├── feed.ts
│       ├── mobile.ts        # baru (ADR-006)
│       └── ...
└── apps/
    └── mobile/              # Expo app
        ├── app.json
        ├── eas.json
        ├── package.json
        ├── tsconfig.json
        └── src/
```

**Konsekuensi:**
- Satu `npm install` di root menyiapkan semua workspace.
- Shared types dipakai via `@shared/types` (tambahkan path mapping di `apps/mobile/tsconfig.json`).
- Dockerfile frontend/bot tidak berubah (mobile tidak ikut container; built via EAS).

**Revisi bila:** Mobile butuh native dependency yang membuat install web menjadi lambat secara signifikan; pisah ke repo terpisah.

---

## ADR-008 — Standard error envelope (tetap)

**Status:** Confirmed (existing)
**Konteks:** Mobile v1 sudah pakai envelope `{ success, data, error }` via `apiResponse.ts`. Lihat audit §7.

**Keputusan:** Pertahankan envelope. Standarisasi `error.code` jadi single canonical set (lihat PRD Backend, Epic D).

**Konsekuensi:** Mobile client `ApiClient` punya error mapping table → typed exceptions.

---

## ADR-009 — Rate limiting: Redis-backed untuk multi-instance

**Status:** Accepted
**Konteks:** Rate limiter di `frontend/src/lib/rateLimit.ts` in-memory per-process. Saat scale-out (atau saat ada SIGHUP container), counter reset → quota tidak konsisten.

**Keputusan:** Migrasi `mobileApi` rate limiter ke Redis (sudah tersedia via `REDIS_URL` untuk DM typing). Fallback in-memory bila Redis down.

**Konsekuensi:**
- 1 Redis key per (policy, identity) dengan TTL = window.
- Latency tambahan ~1–2 ms per request (acceptable).
- Konsisten saat horizontal scaling.

**Revisi bila:** Redis jadi single point of failure; pilih managed rate-limit service.

---

## ADR-010 — Versioning & deprecation

**Status:** Accepted

- Path prefix `v1` adalah kontrak stabil untuk MVP.
- Breaking change wajib `v2` paralel (minimal 6 bulan overlap).
- Non-breaking (tambahan field optional) tetap di `v1`.
- Endpoint deprecated mengembalikan header `Deprecation: true` + `Sunset: <ISO date>` 90 hari sebelum dihapus.

Client minimum supported version dikontrol via:
- `App-Version` header (dikirim Expo client).
- Server respond `426 Upgrade Required` bila < minimum.

---

## ADR-011 — Observability: structured logs + request ID

**Status:** Accepted

- Setiap mobile request memiliki `X-Request-ID` (generated client atau server).
- Log JSON line: `{ ts, level, route, method, status, requestId, userId?, latencyMs, errorCode? }`.
- Tidak introduce APM/tracing di MVP; cukup log aggregation via `docker logs` + rotation.

**Revisi bila:** Tim mengadopsi OpenTelemetry / Datadog.

---

## ADR-012 — Scope MVP Expo

**Status:** Accepted

**In scope (MVP):**
- Auth Telegram → app
- Feed read + compose (text, foto, multi-foto)
- Interaksi post: pulse, bookmark, repost, view, report
- Komentar (reply thread + edit + delete sendiri)
- DM: inbox, conversation thread, send text + image, typing indicator (read-only), block/unblock, delete pesan
- Notifikasi in-app + push
- Profil sendiri (view + edit) + profil publik member lain
- Search global (post + member)
- Outlook reader (read-only, list + detail)
- Gallery (read-only)
- Market rail (read-only widget di top of feed)

**Out of scope MVP (v2):**
- Tools (challenge tracker, profitability, elliott wave, pivot point)
- Quote repost composer rich preview
- Voice message DM
- Video upload (foto + mp4 dasar bisa MVP via re-encode di client; lihat PRD Expo Epic D)
- Live streaming
- Web push (browser)
- Admin moderation in mobile

---

## ADR-013 — Single environment (production-only) untuk MVP

**Status:** Accepted
**Konteks:** VPS hanya satu (`hertz.cloudnexify.com`). Tidak ada staging.

**Keputusan:** Selama MVP, Expo development memakai:
- **Development:** API base URL = `https://hertz.cloudnexify.com` (production), dengan flag `ENV=dev` di client untuk verbose logging.
- **Production app:** sama.

Trigger membuat staging: bila ada > 2 release / minggu yang memerlukan QA terisolasi.

**Konsekuensi:**
- Tidak ada feature branch deployment.
- Test mutation di production memakai akun test (`TELEGRAM_TEST_USER_ID`).
- Bug fix produksi punya prioritas tinggi karena tidak ada buffer.

---

## ADR-014 — Multi-device login allowed

**Status:** Confirmed (existing behavior)
- Satu user boleh login banyak device; tiap device = row di `hertz_member_sessions` + `device_tokens`.
- Logout hanya invalidate token aktif (per-device).
- Endpoint baru: `GET /api/mobile/v1/me/sessions` (list) + `DELETE /api/mobile/v1/me/sessions/:id` (revoke). Detail di PRD Backend.

---

## ADR-015 — Distribusi app: TestFlight + Internal App Sharing untuk MVP

**Status:** Accepted

- **iOS:** TestFlight (Apple Developer Program $99/yr).
- **Android:** Google Play Internal Testing Track (Google Play Console $25 one-time).
- **Distribusi internal pre-store:** EAS Update + `expo-dev-client` untuk QA.
- **Public release:** App Store + Play Store (post-MVP, setelah 2 minggu beta minimal 20 tester).

---

## Open Questions (perlu konfirmasi sebelum implementasi besar)

| # | Topik | Pertanyaan | Default bila tidak dijawab |
|---|-------|------------|----------------------------|
| Q1 | Telegram login | Setuju in-app browser + deep link (ADR-003)? Atau prefer SDK native? | ADR-003 |
| Q2 | Push provider | Setuju Expo Push (ADR-004)? Atau wajib native FCM/APNs sejak awal? | ADR-004 |
| Q3 | Scope MVP | Setuju exclude Tools (ADR-012)? | ADR-012 |
| Q4 | Staging | Tetap production-only (ADR-013)? Atau allocate staging subdomain? | ADR-013 |
| Q5 | App nama | Bundle ID iOS, package name Android (mis. `com.hertz.app`)? | `com.hertz.app` |
| Q6 | Branding | Pakai logo Horizon sementara (sesuai web) hingga logo Hertz selesai? | Ya |
| Q7 | Bot domain Telegram | Domain bot di-config untuk web sekarang; perlu tambah `/auth/mobile-handoff`? | Ya, akan diatur di PRD Backend Epic A |
| Q8 | Konten dewasa | App Store policy: Hertz tidak menampilkan konten dewasa, age rating 12+? | 12+ |

Putuskan ini sebelum kick-off PRD Backend Epic A.

---

## Glosarium

- **Bearer token** — token sesi mobile, dikirim via header `Authorization: Bearer <token>`.
- **Deep link** — URL custom scheme (`hertz://...`) yang membuka app spesifik.
- **Universal Link (iOS) / App Link (Android)** — URL `https://` yang membuka app native bila terinstall, fallback ke web.
- **EAS** — Expo Application Services (build, update, submit).
- **Expo Push Token** — token format `ExponentPushToken[xxx]` dari Expo Push Service.
- **OTA Update** — Over-the-air update via `expo-updates`/EAS Update; ganti JS bundle tanpa rebuild native.

---

Berikutnya: baca [`prd-backend-mobile-api.md`](./prd-backend-mobile-api.md) dan [`prd-expo-app.md`](./prd-expo-app.md).
