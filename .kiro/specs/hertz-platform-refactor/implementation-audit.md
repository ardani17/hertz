# Implementation Audit Notes

Tanggal mulai: 2026-05-09
Status: Implemented and verified

## Task 1 Findings

- Active app for Docker/workspace is `frontend/src/app`.
- Root `app/` folder exists but is not the active frontend workspace target.
- Current social feed implementation is the old Signal Ledger domain:
  - UI: `frontend/src/components/feed/*`
  - routes: `frontend/src/app/api/feed/*`
  - post detail: `frontend/src/app/post/[id]/page.tsx`
  - admin: `frontend/src/app/admin/(dashboard)/signal-ledger/*`
  - admin API: `frontend/src/app/api/admin/signal-ledger/*`
  - shared services/repositories: `shared/services/*`, `shared/repositories/*`
  - migration: `db/migrations/008_create_signal_ledger.sql`
  - seed: `db/seeds/001_signal_ledger_demo.sql`
- Current code still uses:
  - `SIGNAL_LEDGER_ENABLED`
  - `/post/[id]`
  - `Signal Ledger`
  - `signal-ledger`
  - `signal` reaction type
  - `feed_posts`/`post_*` tables
- Next.js docs checked before route edits:
  - `layouts-and-pages.md`
  - `route-handlers.md`
  - `metadata-and-og-images.md`
  - `server-and-client-components.md`
- Implementation approach:
  - Refactor existing Signal Ledger implementation into HERTZ instead of duplicating a second social domain.
  - Add HERTZ routes/API aliases and migrate names toward `hertz_*`.
  - Keep services thinly layered and update tasks as each verified unit completes.

## Final Implementation Notes

- Horizon landing is active at `/`; HERTZ feed is active at `/hertz`.
- Public HERTZ post detail is `/hertz/post/[shortId]`; old `/post/[id]` returns not found.
- HERTZ APIs are under `/api/hertz/posts`, `/api/hertz/messages`, and `/api/admin/hertz`.
- Telegram membership sessions/checks now use HERTZ tables.
- Telegram bot creates feed posts with `hz_` short IDs and keeps `/publish`.
- Blog has verified-member direct publish API and UI entry.
- WordPress import now targets Outlook category.
- DM has conversation/message APIs and polling UI.
- Seed data now includes HERTZ short IDs and Pulse reactions.

## Verification

- `npm.cmd --workspace frontend run build`: passed.
- `npm.cmd --workspace bot run build`: passed.
- `npm.cmd --workspaces=false run test`: 638 tests passed.
- `docker compose config`: passed; warned only because local `.env` values are blank.
- Local production route smoke test returned 200 for `/`, `/hertz`, `/blog`, `/outlook`, `/tools`, and `/hertz/messages`.
- Text/route scan for stale `Signal Ledger`, `signal-ledger`, `SIGNAL_LEDGER`, `signal_ledger`, `/api/feed`, `HERTS`: clean for active source paths.
