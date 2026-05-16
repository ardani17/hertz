# HERTZ Theme + Gallery Inactive TODO Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans for inline execution. Use superpowers:subagent-driven-development only if the user explicitly authorizes subagents. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hide Gallery as an inactive feature and align public frontend, including Tools, with the HERTZ visual theme.

**Architecture:** Treat HERTZ shell and token style as the public frontend standard. Apply changes in small vertical slices: navigation/inactive Gallery, landing, content pages, tools shell, tools mobile data, then admin theme pass.

**Tech Stack:** Next.js 16 App Router, React 19, CSS Modules, existing HERTZ components, Playwright smoke checks, `npm --prefix frontend run build`.

---

## Execution Rules

- Do not start a dev server on the VPS.
- Before changing Next.js files, read the relevant docs under `node_modules/next/dist/docs/`.
- Keep unrelated dirty worktree changes out of commits.
- Commit after each completed task.
- Run `npm --prefix frontend run build` before final completion.
- Use Playwright against `http://127.0.0.1:3888` only after deployment/rebuild is available.

## Task 1: Confirm Baseline and Branch Hygiene

**Files:**
- Read: `AGENTS.md`
- Read: `docs/superpowers/specs/2026-05-16-hertz-theme-gallery-scope.md`
- Read: `docs/frontend-audit/2026-05-16-frontend-audit-rerun.md`

- [ ] Check `git status --short` and identify unrelated dirty files.
- [ ] Read relevant Next docs from `node_modules/next/dist/docs/` for App Router pages/layouts before editing route files.
- [ ] Confirm no implementation begins until this plan is approved by user.

Verification:

- [ ] `git status --short` shows only known pre-existing dirty files plus intentional changes for the current task.

## Task 2: Gallery Inactive State

**Files:**
- Modify: `frontend/src/app/gallery/page.tsx`
- Modify: `frontend/src/app/gallery/page.module.css`
- Read-only unless needed: `frontend/src/components/gallery/*`

- [ ] Replace Gallery grid output with inactive notice page.
- [ ] Keep route `/gallery` available.
- [ ] Add CTA link back to `/hertz`.
- [ ] Use HERTZ visual style: dark panel, emerald border/accent, compact copy.
- [ ] Do not delete Gallery components or API.

Verification:

- [ ] `npm --prefix frontend run build`
- [ ] Manual/browser check after rebuild: `/gallery` shows inactive notice and no media grid.

Commit:

- [ ] `git add frontend/src/app/gallery/page.tsx frontend/src/app/gallery/page.module.css`
- [ ] `git commit -m "Hide Gallery behind inactive state"`

## Task 3: Navigation Reflects Gallery Dormant Status

**Files:**
- Modify: `frontend/src/components/feed/HertzLeftRail.tsx`
- Modify: `frontend/src/components/hertz/MobileBottomNav.tsx`
- Modify if needed: `frontend/src/components/hertz/MobileBottomNav.module.css`
- Modify if needed: `frontend/src/components/feed/HertzRails.module.css`

- [ ] Keep Gallery out of left rail.
- [ ] Keep Gallery out of bottom nav.
- [ ] Add internal comment or config naming that Gallery is intentionally dormant, not accidentally omitted.
- [ ] Shorten mobile label from `Direct Message` to `DM` while preserving accessible label `Direct Message`.
- [ ] Confirm active nav type does not force Gallery menu rendering.

Verification:

- [ ] `npm --prefix frontend run build`
- [ ] Check `/hertz`, `/outlook`, `/blog`, `/tools`, `/hertz/messages` mobile nav labels.

Commit:

- [ ] `git add frontend/src/components/feed/HertzLeftRail.tsx frontend/src/components/hertz/MobileBottomNav.tsx frontend/src/components/hertz/MobileBottomNav.module.css frontend/src/components/feed/HertzRails.module.css`
- [ ] `git commit -m "Keep Gallery dormant in HERTZ navigation"`

## Task 4: Landing Page HERTZ Theme and 320px Fix

**Files:**
- Modify: `frontend/src/app/page.tsx`
- Modify: `frontend/src/app/HorizonLanding.module.css`

- [ ] Remove or hide any Gallery promotion from landing.
- [ ] Align landing colors, borders, buttons, and spacing with HERTZ shell.
- [ ] Fix mobile 320px overflow by adding small-screen rules for hero copy, action stack, feature grid, and H1 sizing.
- [ ] Keep landing as direct product entry, not a decorative marketing page.

Verification:

- [ ] `npm --prefix frontend run build`
- [ ] Playwright check `/` at 390px and 320px: `scrollWidth <= clientWidth`.

Commit:

- [ ] `git add frontend/src/app/page.tsx frontend/src/app/HorizonLanding.module.css`
- [ ] `git commit -m "Align landing with HERTZ theme"`

## Task 5: Public Content Pages Use HERTZ Theme

**Files:**
- Modify: `frontend/src/app/outlook/page.tsx`
- Modify: `frontend/src/app/outlook/page.module.css`
- Modify: `frontend/src/app/outlook/[slug]/page.tsx`
- Modify: `frontend/src/app/outlook/[slug]/page.module.css`
- Modify: `frontend/src/app/blog/page.tsx`
- Modify: `frontend/src/app/blog/page.module.css`
- Modify: `frontend/src/app/blog/[slug]/page.tsx`
- Modify: `frontend/src/app/blog/[slug]/page.module.css`
- Modify as needed: `frontend/src/components/outlook/*`
- Modify as needed: `frontend/src/components/blog/*`
- Modify as needed: `frontend/src/components/article/*`

- [ ] Keep pages inside HERTZ public shell where practical.
- [ ] Align cards/list items to HERTZ dark/emerald style.
- [ ] Ensure detail pages have clear back affordance and readable article width.
- [ ] Keep Gallery links/promos removed while dormant.

Verification:

- [ ] `npm --prefix frontend run build`
- [ ] Playwright check `/outlook`, one outlook detail, `/blog`, one blog detail at 1440, 390, 320.

Commit:

- [ ] Commit only changed Outlook/Blog/article files with message `Align content pages with HERTZ theme`.

## Task 6: Tools Hub and Tool Detail Shell

**Files:**
- Modify: `frontend/src/app/tools/page.tsx`
- Modify: `frontend/src/app/tools/tools.module.css`
- Modify: `frontend/src/app/tools/*/page.tsx`
- Modify: `frontend/src/components/tools/ToolsHub.tsx`
- Modify: `frontend/src/components/tools/ToolShell.module.css`
- Modify: `frontend/src/components/tools/ToolNav.tsx`

- [ ] Make Tools hub visually match HERTZ.
- [ ] Make tool detail pages feel like the same app as HERTZ.
- [ ] Add consistent back/nav affordance for mobile users.
- [ ] Do not introduce Gallery links.
- [ ] Keep dense utilitarian layout suitable for repeated trader use.

Verification:

- [ ] `npm --prefix frontend run build`
- [ ] Playwright check `/tools`, `/tools/profitability`, `/tools/order-book`, `/tools/economic-calendar` at 1440, 390, 320.

Commit:

- [ ] Commit tools shell/theme files with message `Align tools with HERTZ theme`.

## Task 7: Tools Mobile Data Presentation

**Files:**
- Modify: `frontend/src/components/tools/ProfitabilityTool.tsx`
- Modify: `frontend/src/components/tools/OrderBookTool.tsx`
- Modify: `frontend/src/components/tools/EconomicCalendarTool.tsx`
- Modify: `frontend/src/components/tools/ToolShell.module.css`
- Modify other tool components only if they have the same table pattern.

- [ ] Add mobile card mode for Profitability results.
- [ ] Add mobile compact row mode for Order Book.
- [ ] Add mobile event card mode for Economic Calendar.
- [ ] Keep desktop table layout.
- [ ] Avoid relying only on horizontal scroll for primary mobile data.

Verification:

- [ ] `npm --prefix frontend run build`
- [ ] Playwright check the three tool pages at 390px and 320px for no clipped primary data.

Commit:

- [ ] Commit tool data presentation files with message `Improve tools mobile data layout`.

## Task 8: Admin Theme Pass

**Files:**
- Modify: `frontend/src/app/admin/login/page.tsx`
- Modify: `frontend/src/app/admin/login/page.module.css`
- Modify as needed: `frontend/src/app/admin/(dashboard)/**`
- Modify as needed: `frontend/src/components/admin/**`

- [ ] Align admin login with HERTZ visual tokens.
- [ ] Align admin dashboard colors/borders/radius with HERTZ.
- [ ] Keep admin navigation functional and utilitarian.
- [ ] Do not force public HERTZ rail into admin dashboard.

Verification:

- [ ] `npm --prefix frontend run build`
- [ ] Guest check `/admin/login`.
- [ ] Authenticated admin check if credentials/session are available.

Commit:

- [ ] Commit admin files with message `Align admin frontend with HERTZ theme`.

## Task 9: Final Responsive Verification

**Files:**
- Create or update only if useful: `docs/frontend-audit/<date>-post-theme-verification.md`

- [ ] Run `npm --prefix frontend run build`.
- [ ] Run Playwright responsive sweep for:
  - `/`
  - `/hertz`
  - `/hertz/messages`
  - `/outlook`
  - `/blog`
  - `/gallery`
  - `/tools`
  - `/tools/profitability`
  - `/tools/order-book`
  - `/tools/economic-calendar`
  - `/admin/login`
- [ ] Confirm no global horizontal overflow at 390px and 320px.
- [ ] Document remaining issues if any.

Commit:

- [ ] Commit verification doc with message `Document HERTZ theme verification`.

## Explicit Non-Goals for This Plan

- Do not add Gallery back to navigation.
- Do not delete Gallery route or data.
- Do not implement Profile Center in this batch.
- Do not implement Bookmark/Repost action bar in this batch.
- Do not redesign DM beyond theme/navigation unless separately approved.
- Do not change Telegram auth.
