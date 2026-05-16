# HERTZ User Testing Findings

Tanggal: 16 Mei 2026  
Sumber: testing langsung user pada web live `https://horizon.cloudnexify.com`

## Status Legend

- `Open`: belum diperbaiki.
- `Needs reproduction details`: butuh detail tambahan untuk reproduksi stabil.
- `Investigating`: sedang dicari root cause.
- `Fixed`: sudah diperbaiki dan diverifikasi.
- `Deferred`: sengaja ditunda.

## Findings

### UTF-001: Delete HERTZ post menampilkan error server

Status: Needs reproduction details  
Severity: High  
Area: HERTZ feed / post action menu / delete post  
Reported at: 2026-05-16

User report:

- Saat mencoba menghapus postingan HERTZ, UI menampilkan pesan `Terjadi kesalahan pada server`.

Expected:

- Jika user adalah pembuat postingan atau admin, delete berhasil setelah confirm dan feed refresh tanpa post tersebut.
- Jika user tidak punya akses, UI menampilkan pesan permission yang jelas seperti `Akses ditolak`, bukan generic server error.
- Jika session expired, UI menampilkan `Login member diperlukan`.

Actual:

- UI menampilkan `Terjadi kesalahan pada server`.

Initial evidence:

- Endpoint guest `DELETE /api/hertz/posts/hzx_live01` mengembalikan `401` dengan pesan `Login member diperlukan`, jadi path unauthenticated dasar tidak menghasilkan server error.
- Frontend delete memanggil `DELETE /api/hertz/posts/{shortId}` dari `HertzPostMenu`.
- Backend route meneruskan ke `HertzPostService.deletePost`, yang seharusnya mengubah status post menjadi `deleted`.
- Docker frontend log belum menunjukkan stack trace untuk laporan ini; perlu reproduksi dengan session user yang mengalami error.

Likely affected files:

- `frontend/src/components/feed/HertzPostMenu.tsx`
- `frontend/src/app/api/hertz/posts/[shortId]/route.ts`
- `shared/services/hertzPostService.ts`
- `shared/repositories/hertzPostRepository.ts`

Needed reproduction details:

- Akun yang dipakai saat menghapus: admin/member pembuat post/non-author member.
- `shortId` post yang dihapus, misalnya `hzx_live01`.
- Apakah error muncul setelah klik confirm di dialog `Hapus postingan`.
- Apakah post seed atau post baru buatan user.

Next investigation:

- Reproduce with authenticated member/admin session.
- Capture API response status/body for `DELETE /api/hertz/posts/{shortId}`.
- Check whether post is legacy `feed_posts` data, HERTZ `hertz_posts` data, plain repost item, or quoted post.
- Add/adjust automated test once root cause is known.
