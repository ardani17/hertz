# Simple DM Backend Spec Audit

Tanggal: 2026-05-09
Status: sesuai diskusi setelah revisi audit

## Keputusan Diskusi

- Season ini fokus chat/DM backend, bukan Figma.
- Bentuk DM sederhana seperti X.
- Scope awal adalah direct one-on-one chat.
- Backend dibuat sebelum implementasi UI.
- Tidak memakai message request approval.
- Tidak membuat group chat pada phase awal.
- Tidak membuat realtime websocket pada phase awal.
- Tetap memakai member auth yang sudah ada di Signal Ledger.

## Hasil Audit

| Area | Status | Catatan |
| --- | --- | --- |
| Backend-only scope | Sesuai | Spec tidak membuat UI dan hanya menyiapkan API, service, repository, schema. |
| X-style inbox | Sesuai | Conversation list berisi peer, preview, unread, timestamp, dan filter `all/unread/archived`. |
| New message modal | Sesuai | User search mendukung query dan suggested verified members saat query kosong. |
| Active thread | Sesuai | Ditambahkan conversation detail endpoint untuk header thread dan peer profile. |
| One-on-one DM | Sesuai | Direct conversation memakai deterministic `direct_key`. |
| Group chat | Sesuai | Dinyatakan out of scope dan schema phase awal hanya `direct`. |
| Message request | Sesuai | Dinyatakan out of scope sesuai diskusi simple X. |
| Auth | Sesuai | Semua endpoint wajib member session dan verified/admin identity. |
| Block/report | Sesuai | Block menghentikan kirim/buat chat; report tersedia tanpa membuka admin inbox umum. |
| Realtime | Sesuai | Websocket ditunda; REST endpoint cukup untuk polling ringan. |
| Safety | Sesuai | Ada rate limit, audit log tanpa body pesan, soft delete, dan additive migration. |

## Revisi Audit Yang Sudah Dilakukan

- Menambahkan `GET /api/dm/conversations/[conversationId]` untuk kebutuhan header thread seperti X.
- Menambahkan filter inbox `all`, `unread`, dan `archived`.
- Mengubah blank search agar boleh mengembalikan suggested verified members.
- Mengunci group chat sebagai out of scope dan memastikan phase awal hanya direct.
- Menambahkan validasi media reference.
- Menambahkan catatan bahwa spec ini tidak membuat UI.

## Kesimpulan

Spec `simple-dm-backend` sudah sesuai dengan diskusi saat ini dan siap menjadi acuan implementasi backend bertahap. Jika nanti arah berubah, perubahan paling mungkin adalah menambah group chat atau realtime websocket sebagai spec phase lanjutan, bukan mengubah MVP ini.
