# Hertz — Dokumentasi

Folder ini berisi dokumentasi spec, PRD, dan referensi engineering untuk Hertz Trader Platform.

---

## Index

### Mobile (Expo)

- [`mobile/README.md`](./mobile/README.md) — Index dokumentasi mobile
- [`mobile/audit-backend-readiness.md`](./mobile/audit-backend-readiness.md) — Audit kesiapan backend untuk Expo
- [`mobile/architecture-decisions.md`](./mobile/architecture-decisions.md) — ADR + Open Questions
- [`mobile/prd-backend-mobile-api.md`](./mobile/prd-backend-mobile-api.md) — **PRD 1**: backend patch
- [`mobile/prd-expo-app.md`](./mobile/prd-expo-app.md) — **PRD 2**: Expo app end-to-end

---

## Konvensi

- Bahasa: Indonesia untuk PRD/spec produk; istilah teknis tetap bahasa Inggris bila standar industri.
- Setiap dokumen sertakan header dengan **Status**, **Owner**, **Tanggal**, **Dependensi**.
- Diagram pakai mermaid bila perlu (rendered di GitHub).
- ADR (Architecture Decision Record) ringkas: konteks, keputusan, alternatif ditolak, konsekuensi, trigger revisi.
- PRD harus memiliki: Tujuan, Non-tujuan, Scope, Acceptance Criteria, Risk Register.

---

## Konvensi commit untuk docs

- `docs(<area>): <ringkasan>` — mis. `docs(mobile): add backend mobile api prd`.
- Update minor (typo, format) boleh sat commit gabungan.
- Update substantif (ADR baru, scope berubah) wajib commit terpisah dengan body penjelasan.

---

## Maintenance

- Direview oleh Tech Lead per fase / minimal 1× per quarter.
- Dokumen yang sudah outdated tetap disimpan tapi tandai `Status: Archived` di header.
