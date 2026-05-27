# Hertz Mobile — Dokumentasi

Dokumentasi lengkap untuk pengembangan aplikasi mobile Hertz (Expo) dan patch backend yang dibutuhkan agar siap dipakai dari mobile.

---

## Urutan baca

1. **[`audit-backend-readiness.md`](./audit-backend-readiness.md)**
   Ringkasan eksekutif kondisi backend saat ini, gap per fitur, daftar prioritas P0/P1/P2.

2. **[`architecture-decisions.md`](./architecture-decisions.md)**
   15 ADR (Architecture Decision Records) yang dipakai oleh kedua PRD: mirror endpoint, service layer, Telegram handoff, Expo Push, scope MVP, dst. Berisi Open Questions yang harus dikonfirmasi sebelum implementasi besar.

3. **[`prd-backend-mobile-api.md`](./prd-backend-mobile-api.md)** — **PRD 1**
   Patch backend untuk siap-mobile. Clean architecture, 48 endpoint final (14 existing + 34 baru), 5 epic, contract test plan.

4. **[`prd-expo-app.md`](./prd-expo-app.md)** — **PRD 2**
   Aplikasi Expo end-to-end: setup repo → arsitektur → fitur → build → beta → submit App Store/Play Store → operasi pasca-launch. 11 epic.

---

## Struktur dokumen

```
docs/mobile/
├── README.md                          # file ini
├── audit-backend-readiness.md         # ringkasan audit
├── architecture-decisions.md          # ADR + Open Questions
├── prd-backend-mobile-api.md          # PRD 1 — backend patch
└── prd-expo-app.md                    # PRD 2 — Expo app end-to-end
```

---

## Status & versi

| Dokumen | Versi | Status |
|---------|-------|--------|
| audit-backend-readiness.md | v1 | Snapshot — fresh |
| architecture-decisions.md | v1 | Draft — perlu konfirmasi Open Questions |
| prd-backend-mobile-api.md | v1 | Draft — siap review |
| prd-expo-app.md | v1 | Draft — siap review |

---

## Sebelum kick-off

Pastikan poin berikut sudah dijawab/disepakati:

1. **Open Questions** di [`architecture-decisions.md`](./architecture-decisions.md#open-questions-perlu-konfirmasi-sebelum-implementasi-besar) (8 pertanyaan: push provider, scope MVP, branding, dll).
2. **Bundle ID & package name** final (`com.hertz.app` default).
3. **Akun Apple Developer** ($99/yr) + **Google Play Console** ($25 one-time) sudah dibeli.
4. **Sign-off** Backend PRD dan Mobile PRD oleh stakeholders.

---

## Path dependensi

```
PRD Backend Epic A (Auth Foundation)
    └─> PRD Backend Epic B (Social Core)
            └─> PRD Backend Epic C/D/E (paralel)

PRD Mobile Epic A/B (Foundation + Design)
    └─> PRD Mobile Epic C (Auth) — butuh Backend Epic A
            └─> PRD Mobile Epic D/E/F (paralel) — butuh Backend Epic B
                    └─> Mobile Epic G/H/I (paralel) — butuh Backend Epic C
                            └─> Mobile Epic J (QA + Beta + Submit)
                                    └─> Mobile Epic K (Operations)
```

---

## Tautan eksternal

- Repo: `https://github.com/ardani17/hertz`
- Production: `https://hertz.cloudnexify.com`
- Expo docs: https://docs.expo.dev
- EAS docs: https://docs.expo.dev/eas
- React Navigation / Expo Router: https://docs.expo.dev/router/introduction
- Sentry RN: https://docs.sentry.io/platforms/react-native

---

## Maintenance

Update dokumen ini ketika:
- ADR berubah → bump versi + tandai status `Superseded by ADR-XYZ`.
- Endpoint baru ditambahkan → update tabel di PRD Backend §18.1 dan `audit-backend-readiness.md`.
- Roadmap v2 berubah → update PRD Expo §19.

PR yang menyentuh `docs/mobile/**` wajib di-review Mobile Lead + Backend Lead.
