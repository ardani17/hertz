# Horizon Premium Forex Landing Design

## Context

The current Horizon root landing page already uses the HERTZ dark theme and links the ecosystem, but it still feels like an internal dashboard. The next revision should make `/` feel modern, elegant, professional, and attractive for first-time visitors. The user selected direction **A. Premium Forex Hero**.

## Goals

- Make the first viewport feel like a premium market product, not a menu page.
- Use real forex market data from GlobalData, not mock data or decorative fake charts.
- Put forex data in the hero experience so visitors immediately see market relevance.
- Keep HERTZ as the primary action, with Outlook as the secondary market-intelligence action.
- Preserve the Horizon/HERTZ visual identity while reducing the heavy grid/dashboard feel.
- Keep the page fast, server-rendered where practical, and resilient when market data is temporarily unavailable.

## Non-Goals

- No new data provider integration.
- No backend schema changes.
- No changes to HERTZ feed, Outlook, Blog, Tools, auth, comments, likes, shares, or DM behavior.
- No mock visual data in production.
- No marketing-only landing page that hides the real product and market data.

## Data Source

Use the existing `getMarketRailGroups()` / GlobalData flow already used by landing and HERTZ:

- Forex group title: `Forex Market`
- Source: `GlobalData: Yahoo Finance`
- Expected forex symbols:
  - `XAUUSD`
  - `EURUSD`
  - `GBPUSD`
  - `USDJPY`
- Each row may provide:
  - `symbol`
  - `price`
  - `change`
  - `tone`
  - `sparkline`
  - `updatedAt`

The hero should prefer `XAUUSD` as the main asset when available. If `XAUUSD` is missing, use the first available forex row. If the whole forex group is missing, show a clean fallback that states market data is being refreshed.

## Approved Direction

Build a **Premium Forex Hero**:

- First viewport uses a large, elegant forex visual built from real sparkline data.
- The main market feature highlights live forex, especially XAUUSD.
- Supporting forex tiles show EURUSD, GBPUSD, and USDJPY when available.
- The page should feel closer to a polished financial platform than a card-heavy dashboard.
- HERTZ appears as the primary social trading action, not as the only product.

## Page Structure

### Header

- Keep Horizon atom logo and compact top navigation.
- Links remain: `HERTZ`, `Outlook`, `Blog`, `Tools`.
- Main header action remains `Masuk HERTZ`.
- Header should feel lighter and more premium than the current blocky style.

### Hero

- Use a Horizon-led market headline, for example:
  - `Horizon Market Intelligence`
  - Supporting copy: `Forex market data, social trading flow, and market outlook in one focused workspace.`
- Primary CTA: `Buka HERTZ`
- Secondary CTA: `Lihat Outlook`
- Main visual uses real forex data:
  - Main asset: XAUUSD or first forex row.
  - Show price, change, tone, source, updated time.
  - Render a large, smooth chart from the row sparkline.
  - No fake decorative chart paths.
- Add a compact forex strip for the remaining forex rows.

### Ecosystem Section

- Below the hero, keep the Horizon ecosystem entry points:
  - HERTZ
  - Outlook
  - Blog
  - Tools
- The modules should look like premium product lanes, not disconnected cards.
- HERTZ gets priority, but every product should have a clear role.

### Market Section

- Keep a broader market preview below the hero.
- Forex should lead.
- Crypto and stock may appear after forex if data is available.
- Use real rows only. If a group is missing, omit it or show a restrained fallback.

### Mobile

- Mobile first viewport should show:
  - Logo
  - Headline
  - Main forex asset price/change
  - Primary CTA
  - One compact forex strip
- Avoid long card stacks before the user understands the value.
- Keep the HERTZ-style bottom dock or a visually consistent landing-specific dock.

## UI Principles

- Reduce the current technical grid feel.
- Use fewer borders and more controlled spacing.
- Keep green as the primary accent, but add restrained financial colors:
  - green for positive/up
  - red for negative/down
  - soft neutral surfaces for premium contrast
- Avoid fake mock panels.
- Avoid decorative gradients/orbs as the main visual.
- Use real market values as the visual anchor.
- Text must fit cleanly on mobile and desktop.

## Implementation Notes

- `frontend/src/app/page.tsx` may keep server-side data fetching.
- Add small helper functions if needed:
  - find forex group
  - choose hero asset
  - build SVG chart path from real sparkline values
  - format updated time
- Prefer inline SVG generated from real sparkline data for the hero chart so the server-rendered landing does not need a new client chart dependency.
- Existing client chart components may remain untouched unless reuse is cleaner and low-risk.
- Update `frontend/src/app/HorizonLanding.module.css` for the new premium visual direction.
- Update the landing contract test to lock real forex data usage and prevent fake chart-only regression.

## Verification

- Run the landing contract test.
- Run `npm run lint`.
- Run `npm run build:frontend`.
- Rebuild frontend Docker.
- Verify:
  - `http://127.0.0.1:3888/`
  - `https://horizon.cloudnexify.com/`
- Take desktop and mobile screenshots from the public HTTPS domain.

## Open Decisions

- Final headline copy can be adjusted during implementation as long as the first viewport remains premium, market-first, and Horizon-led.
- If Cloudflare or proxy cache keeps old HTML, preserve the current root no-cache behavior and update the internal deploy cache-buster value after rebuild.
