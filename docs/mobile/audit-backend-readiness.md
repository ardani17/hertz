# Audit Kesiapan Backend untuk Aplikasi Mobile (Expo)

Tanggal: 27 Mei 2026  
Status: **Ready for Expo integration**

> Detail endpoint: [`api-reference.md`](./api-reference.md) · Operasional: [`runbook.md`](./runbook.md)

---

## Ringkasan

Backend mobile v1 di `/api/mobile/v1/*` **siap untuk integrasi Expo MVP**. Patch Pre-Expo Hardening menutup gap kontrak, pagination, push, media, infra, dan dokumentasi.

| Kapabilitas | Score | Catatan |
|-------------|-------|---------|
| Auth mobile (handoff + Bearer + rotation) | 95% | Deep link dari `MOBILE_DEEP_LINK_SCHEME` |
| Feed + interactions | 95% | Cursor pagination + optional read cache |
| DM | 95% | Inbox `fromMe`, typing contract, cursor pagination |
| Notifikasi in-app + push | 90% | Expo + FCM v1 adapter, native token validation |
| Profile + media | 90% | Thumbnail generation, presigned upload URL |
| Types/contracts | 95% | `shared/types/mobile.ts` + OpenAPI generator |
| Tests | 85% | Contract + integration wiring suites |
| Docs/ops | 90% | Runbook, audit refresh, api-reference |

**Verdict:** Backend **siap ship integrasi Expo**. Beta publik setelah smoke production + App Store config Universal Links.

---

## Inventaris Endpoint

Total: **38 route files**, **~50 HTTP handlers** di `/api/mobile/v1/*` (termasuk `POST /media/upload-url`).

Semua handler memakai `withMobileRoute()` (auth, rate limit Redis, app-version gate, structured logging).

Lihat daftar lengkap di [`api-reference.md`](./api-reference.md) dan [`openapi.yaml`](./openapi.yaml).

---

## Perbaikan Patch Pre-Expo (selesai)

| Area | Perbaikan |
|------|-----------|
| DM inbox | `fromMe` derived from `last_sender_id` |
| Typing | Response `{ typingUserIds, lastUpdated }`; POST `{ typing: true \| false }` |
| Auth handoff | Deep link scheme dari env |
| Pagination | Notifications, inbox, search cursor |
| Push | FCM HTTP v1 adapter, native token validation |
| Auth refresh | Token rotation (old token invalid after refresh) |
| Media | Sharp thumbnails, presigned R2 upload URL |
| Infra | `ErrorCode` enum, `MOBILE_READ_CACHE`, Universal Links routes |
| Tests | Expanded contract + integration wiring |
| Docs | Runbook, OpenAPI generator, audit refresh |

---

## Explicitly Deferred

| Item | ADR |
|------|-----|
| WebSocket DM | ADR-005 polling MVP |
| Challenge Tracker API | ADR-012 out of MVP |

---

## Rekomendasi Eksekusi Expo

1. Bootstrap `apps/mobile/` per [`prd-expo-app.md`](./prd-expo-app.md)
2. Gunakan [`api-reference.md`](./api-reference.md) sebagai kontrak
3. Implement auth handoff → deep link → `/me` → refresh (simpan token baru setelah refresh)
4. Register Expo push token setelah login
5. Polling DM/notifications sesuai ADR-005
