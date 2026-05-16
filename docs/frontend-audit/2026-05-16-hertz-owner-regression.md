# HERTZ Owner Action Regression

Date: 2026-05-16

## Scope

- Create a HERTZ post with a Telegram member session.
- Confirm owner menu exposes `Edit postingan` and `Hapus postingan`.
- Edit the post and confirm the content changes.
- Delete the post and confirm it disappears from feed/detail.
- Confirm guest/non-owner view only sees allowed actions such as `Salin link`, `Laporkan`, and public action buttons.

## Current Result

Blocked for manual browser verification because this agent session does not have an authenticated Telegram member cookie/session to create and own a post.

## Verified By Build

The frontend build passes after the owner action UI work:

```bash
npm --prefix frontend run build
```

Relevant frontend changes now present:

- Owner/admin menu uses `viewer.canEdit`, `viewer.canDelete`, and author/admin fallback checks.
- Owner menu labels are Indonesian: `Edit postingan`, `Hapus postingan`.
- Edit and delete still call the existing post detail API:
  - `PATCH /api/hertz/posts/[shortId]`
  - `DELETE /api/hertz/posts/[shortId]`
- Visible post actions now include `Suka`, `Repost`, `Simpan`, and `Bagikan`.

## Manual Prerequisite

To complete this regression manually, open the deployed site with a valid Telegram member login session, then run the flow above on `/hertz`.
