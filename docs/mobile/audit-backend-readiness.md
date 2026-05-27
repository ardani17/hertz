# Audit Kesiapan Backend untuk Aplikasi Mobile (Expo)

Tanggal: 27 Mei 2026
Status: **Snapshot v1** — Dasar untuk PRD backend & PRD Expo

> Dokumen ini adalah ringkasan eksekutif. Detail teknis per endpoint dan diff yang dibutuhkan ada di [`prd-backend-mobile-api.md`](./prd-backend-mobile-api.md).

---

## Ringkasan

Backend Hertz sudah memiliki **fondasi mobile v1** di `/api/mobile/v1/*` (auth Bearer token, feed read, pulse, komentar dasar, push token registration, outlook, gallery). Namun **belum siap untuk MVP aplikasi sosial penuh** karena hampir semua route web yang dibutuhkan (DM, notifikasi in-app, profil, compose post, upload media, bookmark, repost) **masih cookie-only** dan tidak punya counterpart mobile.

| Kapabilitas | Score | Catatan |
|-------------|-------|---------|
| Auth mobile (Telegram → Bearer) | 🟢 85% | Solid; perlu finalize UX Telegram handoff |
| Feed read + detail | 🟢 75% | Read OK; missing create/edit, filter `author` |
| Interaksi post | 🟡 40% | Pulse only |
| DM | 🔴 0% | Full stack ada di web, nol mobile |
| Notifikasi in-app | 🔴 10% | Push register OK; daftar & summary belum |
| Profile | 🔴 0% | Service layer ready, nol mobile API |
| Media upload | 🔴 20% | R2 jalan; no Bearer path |
| Types/contracts | 🟡 50% | Feed types lengkap; DM/notif belum |
| Docs/spec | 🔴 15% | Test files de-facto contract |

**Verdict:** Backend **siap sebagai fondasi**, **belum siap ship Expo app** tanpa patch ~22 endpoint mobile baru + standardisasi auth, types, dan observability.

---

## Inventaris Endpoint Mobile Existing

Total: **14 route** di `/api/mobile/v1/*`.

| Path | Method | Auth |
|------|--------|------|
| `/auth/telegram` | POST | Public |
| `/auth/refresh` | POST | Bearer |
| `/me` | GET | Bearer |
| `/logout` | POST | Bearer |
| `/notifications/register` | POST | Bearer |
| `/notifications/unregister` | POST | Bearer |
| `/hertz/posts` | GET | Optional Bearer |
| `/hertz/posts/[shortId]` | GET | Optional Bearer |
| `/hertz/posts/[shortId]/like` | POST | Bearer |
| `/hertz/posts/[shortId]/comments` | POST | Bearer |
| `/hertz/posts/comments/[commentId]` | DELETE | Bearer |
| `/gallery` | GET | Public |
| `/outlook` | GET | Public |
| `/outlook/[slug]` | GET | Public |

**Envelope standar:** `{ success: bool, data?: T, error?: { code, message, ... } }`
**Helper auth:** `frontend/src/lib/mobileApi.ts` → `requireMobileMember()`
**Session storage:** `hertz_member_sessions` (UUID token, hashed) — same table sebagai web.

---

## Gap Endpoint per Prioritas

### P0 — Blocker MVP

| # | Domain | Aksi | Detail di PRD |
|---|--------|------|---------------|
| 1 | DM | Mirror 6 route DM + typing indicator | Epic B §B1–B6 |
| 2 | Notifications | List, summary, mark-as-read | Epic B §B7–B9 |
| 3 | Posts | Create + edit + delete | Epic B §B10–B12 |
| 4 | Media | Upload via Bearer | Epic B §B13 |
| 5 | Push | Klarifikasi format token (Expo vs native) + iOS path | ADR-004, Epic B §B14 |
| 6 | Profile | GET/PATCH `/me` profile + public profile by username | Epic B §B15–B16 |
| 7 | Auth | Telegram handoff flow (deep link), Sessions list/revoke | Epic A §A2–A4 |

### P1 — Wajib MVP setelah P0

| # | Aksi |
|---|------|
| 8 | Bookmark, repost, view, report (4 endpoint) |
| 9 | Comment reply thread (parentCommentId) + edit |
| 10 | Search global (`?q=`) |
| 11 | Author filter di feed |
| 12 | Market rail (`/market/rail`) |
| 13 | `shared/types/mobile.ts` lengkap |
| 14 | Notification summary digabung ke `/me` |

### P2 — Post-MVP

| # | Aksi |
|---|------|
| 15 | Challenge tracker API |
| 16 | OpenAPI/Swagger schema |
| 17 | Token rotation |
| 18 | Signed upload URL direct-to-R2 |
| 19 | WebSocket DM (ganti polling) |
| 20 | Redis rate limit (sebagian sudah masuk PRD Backend Epic D) |
| 21 | Thumbnail generation |
| 22 | FCM HTTP v1 migration (opsional bila keep native push) |

---

## Asumsi yang Dipakai PRD

Lihat [`architecture-decisions.md`](./architecture-decisions.md) untuk justifikasi lengkap.

| # | Asumsi | ADR |
|---|--------|-----|
| 1 | Mirror endpoint di `/api/mobile/v1/*` (bukan dual-auth web routes) | ADR-001 |
| 2 | Service layer wajib untuk semua handler mobile + web | ADR-002 |
| 3 | Telegram login pakai in-app browser + deep link callback | ADR-003 |
| 4 | Push notification via Expo Push Service (adapter dengan FCM v1 fallback) | ADR-004 |
| 5 | DM realtime: polling 5s di MVP | ADR-005 |
| 6 | Shared types di `shared/types/mobile.ts` | ADR-006 |
| 7 | Expo project di `apps/mobile/` (workspace npm) | ADR-007 |
| 8 | Standard error envelope (existing) | ADR-008 |
| 9 | Rate limiter pindah ke Redis | ADR-009 |
| 10 | Versioning `v1`, breaking → `v2` paralel ≥ 6 bulan | ADR-010 |
| 11 | Structured JSON logs + X-Request-ID | ADR-011 |
| 12 | Scope MVP exclude Tools | ADR-012 |
| 13 | Production-only (no staging) | ADR-013 |
| 14 | Multi-device login | ADR-014 |
| 15 | Distribusi MVP: TestFlight + Play Internal Testing | ADR-015 |

---

## Dampak Infrastruktur

Patch backend membutuhkan:

| Komponen | Perubahan |
|----------|-----------|
| Database | Tambah migration untuk `device_tokens.platform = 'expo'`, optional `auth_handoff_nonces` table |
| Env | Tambah `EXPO_ACCESS_TOKEN` (untuk Expo Push), `MOBILE_DEEP_LINK_SCHEME=hertz`, `MOBILE_APP_BUNDLE_ID_IOS`, `MOBILE_APP_PACKAGE_ANDROID` |
| Redis | Wajib untuk rate limit + typing indicator (sudah ada) |
| R2 | Tidak ada perubahan; mobile reuse bucket existing |
| CORS | Tidak relevan untuk RN native (no browser); tetap `same-origin` |
| Reverse proxy | Tidak ada perubahan |
| Bot service | Tidak ada perubahan |

Estimasi disk migration: ~10 KB SQL.
Estimasi runtime impact: negligible (Bearer parsing < 1 ms, Redis rate limit 1–2 ms).

---

## Dampak Tim & Timeline

Tidak ada estimasi waktu/effort di dokumen ini (di luar scope). Lihat PRD masing-masing untuk breakdown task per epic.

Path dependensi:

```
PRD Backend Epic A (Auth foundation)
    └─> PRD Backend Epic B (Social mirror)
            └─> PRD Backend Epic C (Interactions P1)
                    └─> PRD Backend Epic D (Contracts & infra)
                            └─> PRD Expo Epic A–H
```

Mobile app **boleh** mulai mocking client paralel dengan Epic A backend, tapi integrasi penuh menunggu Epic B selesai (semua P0 endpoint live).

---

## Rekomendasi Eksekusi

1. **Konfirmasi Open Questions di `architecture-decisions.md`** sebelum coding.
2. **Setup `apps/mobile/`** segera (Expo skeleton + EAS) — proses approval Apple Developer + Google Play setup butuh waktu, jalankan paralel dengan backend.
3. **Backend Epic A → B → C → D** sequencing wajib (B bergantung pada service layer & auth helper dari A).
4. **Contract test** wajib per endpoint baru sebelum mobile mulai integrasi.
5. **Beta TestFlight + Play Internal** sebelum public release — minimal 2 minggu, 20 tester.

---

Baca berikutnya:
- [`architecture-decisions.md`](./architecture-decisions.md) — ADR lengkap
- [`prd-backend-mobile-api.md`](./prd-backend-mobile-api.md) — PRD 1
- [`prd-expo-app.md`](./prd-expo-app.md) — PRD 2
