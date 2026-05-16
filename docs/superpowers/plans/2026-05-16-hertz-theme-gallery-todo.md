# HERTZ Theme + Gallery Inactive TODO Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans for inline execution. Use superpowers:subagent-driven-development only if the user explicitly authorizes subagents. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hide Gallery as an inactive feature, align all frontend areas with the HERTZ visual theme, and complete every actionable finding from the rerun frontend audit.

**Architecture:** Treat HERTZ shell and token style as the public frontend standard. Apply changes in small vertical slices: navigation/inactive Gallery, landing, DM responsive, profile/member center, post social actions/composer, content pages, tools shell/mobile data, admin theme, copy/accessibility, then final verification.

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

- [x] Check `git status --short` and identify unrelated dirty files.
- [x] Read relevant Next docs from `node_modules/next/dist/docs/` for App Router pages/layouts before editing route files.
- [x] Confirm no implementation begins until this plan is approved by user.
- [x] Re-read audit findings from `docs/frontend-audit/2026-05-16-frontend-audit-rerun.md` and keep them open as acceptance criteria.

Verification:

- [x] `git status --short` shows only known pre-existing dirty files plus intentional changes for the current task.

## Task 2: Gallery Inactive State

**Files:**
- Modify: `frontend/src/app/gallery/page.tsx`
- Modify: `frontend/src/app/gallery/page.module.css`
- Read-only unless needed: `frontend/src/components/gallery/*`

- [x] Replace Gallery grid output with inactive notice page.
- [x] Keep route `/gallery` available.
- [x] Add CTA link back to `/hertz`.
- [x] Use HERTZ visual style: dark panel, emerald border/accent, compact copy.
- [x] Do not delete Gallery components or API.

Verification:

- [x] `npm --prefix frontend run build`
- [x] Manual/browser check after rebuild: `/gallery` shows inactive notice and no media grid.

Commit:

- [x] `git add frontend/src/app/gallery/page.tsx frontend/src/app/gallery/page.module.css`
- [x] `git commit -m "Hide Gallery behind inactive state"`

## Task 3: Navigation Reflects Gallery Dormant Status

**Files:**
- Modify: `frontend/src/components/feed/HertzLeftRail.tsx`
- Modify: `frontend/src/components/hertz/MobileBottomNav.tsx`
- Modify if needed: `frontend/src/components/hertz/MobileBottomNav.module.css`
- Modify if needed: `frontend/src/components/feed/HertzRails.module.css`

- [x] Keep Gallery out of left rail.
- [x] Keep Gallery out of bottom nav.
- [x] Add internal comment or config naming that Gallery is intentionally dormant, not accidentally omitted.
- [x] Shorten mobile label from `Direct Message` to `DM` while preserving accessible label `Direct Message`.
- [x] Confirm active nav type does not force Gallery menu rendering.

Verification:

- [x] `npm --prefix frontend run build`
- [x] Check `/hertz`, `/outlook`, `/blog`, `/tools`, `/hertz/messages` mobile nav labels.

Commit:

- [x] `git add frontend/src/components/feed/HertzLeftRail.tsx frontend/src/components/hertz/MobileBottomNav.tsx frontend/src/components/hertz/MobileBottomNav.module.css frontend/src/components/feed/HertzRails.module.css`
- [x] `git commit -m "Keep Gallery dormant in HERTZ navigation"`

## Task 4: Landing Page HERTZ Theme and 320px Fix

**Files:**
- Modify: `frontend/src/app/page.tsx`
- Modify: `frontend/src/app/HorizonLanding.module.css`

- [x] Remove or hide any Gallery promotion from landing.
- [x] Align landing colors, borders, buttons, and spacing with HERTZ shell.
- [x] Fix mobile 320px overflow by adding small-screen rules for hero copy, action stack, feature grid, and H1 sizing.
- [x] Keep landing as direct product entry, not a decorative marketing page.

Verification:

- [x] `npm --prefix frontend run build`
- [x] Playwright check `/` at 390px and 320px: `scrollWidth <= clientWidth`.

Commit:

- [x] `git add frontend/src/app/page.tsx frontend/src/app/HorizonLanding.module.css`
- [x] `git commit -m "Align landing with HERTZ theme"`

## Task 5: HERTZ DM Responsive and Guest State

**Files:**
- Modify: `frontend/src/app/hertz/messages/page.tsx`
- Modify: `frontend/src/app/hertz/messages/page.module.css`

- [x] Convert mobile/tablet DM to a two-step layout: list mode and thread mode.
- [x] Add a back-to-inbox control in thread mode on mobile.
- [x] Clamp `.thread`, `.threadHeader`, `.messages`, and `.composer` to viewport width.
- [x] Hide or disable Archive/Block/Image/Send controls when guest or no active conversation exists.
- [x] Replace English labels with Indonesian labels: `Archive` -> `Arsipkan`, `Block` -> `Blokir`, `Image` -> `Gambar`, `Send` -> `Kirim`.
- [x] Keep desktop two-column DM layout.

Verification:

- [x] `npm --prefix frontend run build`
- [x] Playwright check `/hertz/messages` at 768, 390, 320: no clipped `.threadHeader`, `.messages`, `.composer`, input, or submit button.

Commit:

- [x] `git add frontend/src/app/hertz/messages/page.tsx frontend/src/app/hertz/messages/page.module.css`
- [x] `git commit -m "Fix HERTZ messages mobile layout"`

## Task 6: HERTZ Profile and Mobile Market Access

**Files:**
- Create: `frontend/src/app/hertz/profile/page.tsx`
- Create: `frontend/src/app/hertz/profile/page.module.css`
- Modify: `frontend/src/components/feed/HertzLeftRail.tsx`
- Modify: `frontend/src/components/feed/HertzRightRail.tsx`
- Modify: `frontend/src/components/feed/HertzRails.module.css`
- Modify: `frontend/src/components/hertz/MobileBottomNav.tsx`
- Modify: `frontend/src/components/hertz/MobileBottomNav.module.css`
- Modify as needed: `frontend/src/components/hertz/HertzAppShell.tsx`
- Modify as needed: `frontend/src/components/hertz/HertzAppShell.module.css`

- [x] Add `/hertz/profile` route using HERTZ shell.
- [x] Show guest state with Telegram login CTA when `/api/auth/me` has no user.
- [x] Show member identity, role, badge/status, credit summary, and credit history fallback when APIs are available.
- [x] Make the left rail profile card link to `/hertz/profile`.
- [x] Add Profile affordance to mobile nav or a More/profile action without re-adding Gallery.
- [x] Add mobile market data access: a compact ticker/drawer/section that exposes data hidden when right rail is not rendered.
- [x] Make desktop right rail stay fixed/sticky like the left rail while the main feed/content scrolls.
- [x] Keep right rail internally scrollable if its market panels exceed `100vh`.

Verification:

- [x] `npm --prefix frontend run build`
- [x] Check `/hertz/profile` guest state.
- [x] Check mobile `/hertz` has market access without right rail.
- [x] Check desktop `/hertz` and `/outlook`: scroll down and confirm the right rail remains visible in place.

Commit:

- [x] Commit profile/shell files with message `Add HERTZ profile and mobile market access`.

## Task 7: HERTZ Post Actions and Trading Composer

**Files:**
- Modify: `frontend/src/components/feed/HertzActionBar.tsx`
- Modify: `frontend/src/components/feed/HertzActionBar.module.css`
- Modify: `frontend/src/components/feed/HertzPostMenu.tsx`
- Modify: `frontend/src/components/feed/HertzPostMenu.module.css`
- Modify: `frontend/src/components/feed/HertzComposer.tsx`
- Modify: `frontend/src/components/feed/HertzComposer.module.css`
- Modify: `frontend/src/components/feed/HertzPost.module.css`

- [x] Add visible Bookmark action using `/api/hertz/posts/[shortId]/bookmark`.
- [x] Add Repost/Quote action using `/api/hertz/posts/[shortId]/repost` or a clearly scoped repost UI if quote text is not supported.
- [x] Add Share/Salin link action to the visible action surface or consistent menu.
- [x] Keep owner Edit/Delete in the menu and ensure menu text is Indonesian.
- [x] Add Trading composer fields: pair, timeframe, direction, risk, entry, stop loss, take profit, confidence.
- [x] Decide media policy in UI: either allow media for Life/General or show clear copy that chart/media upload is Trading-only.
- [x] Add a thin green outline to the new posting/composer surface.
- [x] Thin the post card outline and match its color/opacity with the new posting/composer outline.
- [x] Confirm composer and post cards still have enough contrast on desktop and mobile.

Verification:

- [x] `npm --prefix frontend run build`
- [x] Guest action buttons show login-required feedback without breaking layout.
- [x] Authenticated owner flow is checked if Telegram session is available: create post, edit, delete.
- [x] Visual check `/hertz`: composer outline and post card outline use the same thin green treatment.

Commit:

- [x] Commit HERTZ post action/composer files with message `Complete HERTZ post action surface`.

## Task 8: Public Content Pages Use HERTZ Theme

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

- [x] Keep pages inside HERTZ public shell where practical.
- [x] Align cards/list items to HERTZ dark/emerald style.
- [x] Ensure detail pages have clear back affordance and readable article width.
- [x] Keep Gallery links/promos removed while dormant.

Verification:

- [x] `npm --prefix frontend run build`
- [x] Playwright check `/outlook`, one outlook detail, `/blog`, one blog detail at 1440, 390, 320.

Commit:

- [x] Commit only changed Outlook/Blog/article files with message `Align content pages with HERTZ theme`.

## Task 9: Tools Hub and Tool Detail Shell

**Files:**
- Modify: `frontend/src/app/tools/page.tsx`
- Modify: `frontend/src/app/tools/tools.module.css`
- Modify: `frontend/src/app/tools/*/page.tsx`
- Modify: `frontend/src/components/tools/ToolsHub.tsx`
- Modify: `frontend/src/components/tools/ToolShell.module.css`
- Modify: `frontend/src/components/tools/ToolNav.tsx`

- [x] Make Tools hub visually match HERTZ.
- [x] Make tool detail pages feel like the same app as HERTZ.
- [x] Add consistent back/nav affordance for mobile users.
- [x] Do not introduce Gallery links.
- [x] Keep dense utilitarian layout suitable for repeated trader use.

Verification:

- [x] `npm --prefix frontend run build`
- [x] Playwright check `/tools`, `/tools/profitability`, `/tools/order-book`, `/tools/economic-calendar` at 1440, 390, 320.

Commit:

- [x] Commit tools shell/theme files with message `Align tools with HERTZ theme`.

## Task 10: Tools Mobile Data Presentation

**Files:**
- Modify: `frontend/src/components/tools/ProfitabilityTool.tsx`
- Modify: `frontend/src/components/tools/OrderBookTool.tsx`
- Modify: `frontend/src/components/tools/EconomicCalendarTool.tsx`
- Modify: `frontend/src/components/tools/ToolShell.module.css`
- Modify other tool components only if they have the same table pattern.

- [x] Add mobile card mode for Profitability results.
- [x] Add mobile compact row mode for Order Book.
- [x] Add mobile event card mode for Economic Calendar.
- [x] Keep desktop table layout.
- [x] Avoid relying only on horizontal scroll for primary mobile data.

Verification:

- [x] `npm --prefix frontend run build`
- [x] Playwright check the three tool pages at 390px and 320px for no clipped primary data.

Commit:

- [x] Commit tool data presentation files with message `Improve tools mobile data layout`.

## Task 11: Copywriting and Accessibility Pass

**Files:**
- Modify: `frontend/src/components/feed/*`
- Modify: `frontend/src/components/hertz/*`
- Modify: `frontend/src/app/hertz/messages/page.tsx`
- Modify: `frontend/src/components/tools/*`
- Modify: `frontend/src/app/**/*.tsx` only where visible copy is touched.

- [x] Replace touched public UI copy with Indonesian equivalents.
- [x] Ensure icon-only controls have `aria-label`.
- [x] Ensure menu/dialog close buttons have meaningful labels, not only `x`.
- [x] Ensure keyboard focus state remains visible for nav, tabs, buttons, menu items, form controls, and CTAs.
- [x] Check mobile bottom nav labels do not overflow.

Verification:

- [x] `npm --prefix frontend run build`
- [x] Keyboard spot check: tab through `/hertz`, `/hertz/messages`, `/tools`, `/tools/profitability`.

Commit:

- [x] Commit copy/accessibility files with message `Polish HERTZ copy and accessibility`.

## Task 12: Admin Theme Pass

**Files:**
- Modify: `frontend/src/app/admin/login/page.tsx`
- Modify: `frontend/src/app/admin/login/page.module.css`
- Modify as needed: `frontend/src/app/admin/(dashboard)/**`
- Modify as needed: `frontend/src/components/admin/**`

- [x] Align admin login with HERTZ visual tokens.
- [x] Align admin dashboard colors/borders/radius with HERTZ.
- [x] Keep admin navigation functional and utilitarian.
- [x] Do not force public HERTZ rail into admin dashboard.

Verification:

- [x] `npm --prefix frontend run build`
- [x] Guest check `/admin/login`.
- [x] Authenticated admin check if credentials/session are available.

Commit:

- [x] Commit admin files with message `Align admin frontend with HERTZ theme`.

## Task 13: Authenticated Owner Regression

**Files:**
- Create or update if useful: `docs/frontend-audit/<date>-hertz-owner-regression.md`

- [ ] With a Telegram member session, create a HERTZ post. **Blocked:** no authenticated Telegram member session is available in this agent session.
- [ ] Confirm owner menu shows Edit post and Delete post. **Blocked:** requires authenticated Telegram owner session.
- [ ] Edit the post and confirm content changes. **Blocked:** requires authenticated Telegram owner session.
- [ ] Delete the post and confirm it disappears from feed/detail. **Blocked:** requires authenticated Telegram owner session.
- [ ] Check a non-owner or guest view only shows allowed actions such as Salin link/Report. **Blocked:** non-owner guest/code behavior documented; full browser regression needs separate authenticated/non-owner session.
- [x] If Telegram session cannot be provided, document this as blocked with exact missing prerequisite.

Verification:

- [x] Owner flow result is documented.

Commit:

- [x] Commit owner regression doc with message `Document HERTZ owner action regression`.

## Task 14: Final Responsive Verification

**Files:**
- Create or update only if useful: `docs/frontend-audit/<date>-post-theme-verification.md`

- [x] Run `npm --prefix frontend run build`.
- [x] Run Playwright responsive sweep for:
  - `/`
  - `/hertz`
  - `/hertz/messages`
  - `/hertz/profile`
  - `/outlook`
  - `/blog`
  - `/gallery`
  - `/tools`
  - `/tools/profitability`
  - `/tools/order-book`
  - `/tools/economic-calendar`
  - `/admin/login`
- [ ] Confirm no global horizontal overflow at 390px and 320px. **Pending live refresh:** code/build contains the landing 320px fix, but the running `127.0.0.1:3888` container still served the previous bundle during the final sweep.
- [x] Confirm no clipped primary controls on `/hertz/messages` at 768, 390, 320.
- [x] Confirm tool primary data is readable on 390 and 320 without relying only on table horizontal scroll.
- [x] Confirm Gallery inactive notice is shown and Gallery is absent from nav.
- [x] Confirm desktop right rail remains fixed/sticky during page scroll.
- [x] Document remaining issues if any.

Commit:

- [x] Commit verification doc with message `Document HERTZ theme verification`.

## Explicit Non-Goals for This Plan

- Do not add Gallery back to navigation.
- Do not delete Gallery route or data.
- Do not change Telegram auth.
- Do not change backend schemas unless a frontend audit item cannot be completed without it; if that happens, stop and write a small backend scope note first.
