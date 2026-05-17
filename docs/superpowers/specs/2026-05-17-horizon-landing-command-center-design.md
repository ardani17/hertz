# Horizon Landing Command Center Design

## Context

The root domain `/` is the public face of Horizon. The current page already links HERTZ, Outlook, Blog, and Tools, but it reads more like a technical portal than a polished main-domain landing page. The approved visual direction is **A. Horizon Command Center**.

## Goals

- Make `/` feel like the main Horizon product entry point, not only a HERTZ teaser.
- Keep HERTZ as the strongest call to action while showing Outlook, Blog, Tools, and market data as one connected ecosystem.
- Use the existing Horizon atom/logo assets and the HERTZ visual language: dark surface, green accent, compact social/market panels, and practical trading-oriented UI.
- Keep existing data sources and backend behavior unchanged for this pass.
- Make desktop and mobile feel intentionally designed, with mobile navigation/footer consistency aligned with HERTZ.

## Non-Goals

- No backend schema changes.
- No changes to HERTZ posting, Outlook, Blog import, Tools functionality, auth, comments, likes, or shares.
- No new market-data provider integration.
- No redirect from `/` to `/hertz`; the root remains a landing page.

## Approved Direction

Use a **Command Center** landing page:

- First viewport is brand-first: Horizon logo, strong headline, concise value copy, and direct actions.
- CTA priority:
  - Primary: `Buka HERTZ`
  - Secondary: `Lihat Outlook` or `Buka Tools`, depending on final layout fit.
- The right/visual area becomes a live-style command panel that combines:
  - Latest HERTZ post preview from `HertzPostService`.
  - Market rail preview from `getMarketRailGroups`.
  - Short entry points for Outlook, Blog, and Tools.
- Product cards below the hero remain, but should look less like disconnected links and more like modules inside the Horizon ecosystem.

## Page Structure

### Header

- Keep the Horizon atom logo visible at top left.
- Navigation links: `HERTZ`, `Outlook`, `Blog`, `Tools`.
- Keep `Masuk HERTZ` as the main header action.
- On mobile, avoid a tall stacked header. The top area should stay compact and readable.

### Hero

- Use `Horizon` or a short Horizon-led headline as the dominant first-viewport signal.
- Supporting copy should explain the platform as a trading command center for social feed, market outlook, long-form blog articles, and research tools.
- CTAs must be visually clear and match the HERTZ button language.

### Command Panel

- Replace the current generic preview with a more composed panel:
  - A HERTZ activity card showing the latest post, author, username-style metadata where available, short text, and engagement counts.
  - A market rail card showing a few symbols and direction indicators from existing market groups.
  - A compact product/status strip for Outlook, Blog, and Tools.
- If latest post or market data fails, show clean fallback copy instead of leaving awkward empty space.

### Product Modules

- Keep four modules: HERTZ, Outlook, Blog, Tools.
- Each module should state the user benefit in one short line.
- Visual hierarchy should make HERTZ primary but not make the other products feel secondary leftovers.

### Mobile

- The first screen should show logo, headline, primary CTA, and enough content to make the page purpose clear.
- Avoid horizontal overflow from large text or panels.
- Use the same bottom-mobile navigation concept as HERTZ where appropriate for consistency.
- Cards and command panels collapse into a single-column flow with stable spacing.

## Data Flow

- `frontend/src/app/page.tsx` remains a server component.
- Continue using:
  - `HertzPostService().listFeed({ limit: 1, sort: 'latest' })`
  - `getMarketRailGroups()`
- Fetch failures remain non-fatal and produce fallbacks.
- No client-side interactivity is required for this pass.

## Files Expected To Change

- `frontend/src/app/page.tsx`
- `frontend/src/app/HorizonLanding.module.css`
- A focused unit/contract test under `tests/unit/frontend/` if there is an existing pattern suitable for landing-page contracts.

## Verification

- Run the relevant frontend unit test or contract test.
- Run `npm run lint`.
- Run `npm run build:frontend`.
- Do not start a dev server on the VPS.
- After successful build, rebuild the frontend container with Docker and verify `/` responds with HTTP 200.

## Open Decisions

- Secondary hero CTA should be selected during implementation based on layout fit: either `Lihat Outlook` for content discovery or `Buka Tools` for utility-driven users.
- If HERTZ bottom mobile navigation is tightly coupled to the HERTZ route, implement a landing-specific mobile footer that visually matches it without reusing incompatible route state.
