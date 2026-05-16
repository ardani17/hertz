# HERTZ Owner Action Regression

Date: 2026-05-16

## Scope

- Create a HERTZ post with a Telegram member session.
- Confirm owner menu exposes `Edit postingan` and `Hapus postingan`.
- Edit the post and confirm the content changes.
- Delete the post and confirm it disappears from feed/detail.
- Confirm guest/non-owner view only sees allowed actions such as `Salin link`, `Laporkan`, and public action buttons.

## Current Result

Partially verified with a temporary Playwright session for the confirmed owner account.

Confirmed owner account:

- Display name: `ARDANI | vastara.id`
- Username: `yaelahdan`
- User id: `8a556956-edf1-4da0-9aab-4346b344e93c`

Database check confirms the latest web posts with content `tes` are authored by that same user id.

API check with a temporary session for that user confirms `/api/hertz/posts` returns:

- `viewer.canEdit: true`
- `viewer.canDelete: true`

After rebuilding/restarting the frontend container, a Playwright check with a temporary session for `ARDANI | vastara.id` confirmed the owner menu exposes `Edit postingan` and `Hapus postingan`.

## Verified By Build

The frontend build passes after the owner action UI work:

```bash
npm --prefix frontend run build
```

Relevant frontend changes now present:

- Owner/admin menu uses `viewer.canEdit`, `viewer.canDelete`, and author/admin fallback checks.
- Owner/admin menu also falls back to matching username/displayName so the owner action affordance is not hidden when hydrated identity metadata is stale; the API still enforces real ownership.
- Owner menu labels are Indonesian: `Edit postingan`, `Hapus postingan`.
- Edit and delete still call the existing post detail API:
  - `PATCH /api/hertz/posts/[shortId]`
  - `DELETE /api/hertz/posts/[shortId]`
- Visible post actions now include `Suka`, `Repost`, `Simpan`, and `Bagikan`.

## Remaining Manual Prerequisite

Open the deployed site with the `ARDANI | vastara.id` Telegram member session and run the full create/edit/delete flow on `/hertz`.
