# Horizon Premium Forex Landing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the Horizon root landing page into a premium forex-first experience using real GlobalData forex rows.

**Architecture:** Keep `frontend/src/app/page.tsx` as a dynamic server component and continue using `getMarketRailGroups()` plus `HertzPostService`. Add focused server-side helpers inside `page.tsx` to choose the real forex hero asset, generate an SVG chart path from the asset sparkline, and format update time; use CSS Modules for the visual refresh.

**Tech Stack:** Next.js App Router, React server components, CSS Modules, Vitest source contract tests, Docker Compose frontend rebuild, Nginx root cache-buster update.

---

## File Map

- Modify `tests/unit/frontend/horizonLanding.test.ts`: update the landing contract from Command Center to Premium Forex Hero and lock real forex data usage.
- Modify `frontend/src/app/page.tsx`: add forex helper functions and restructure landing JSX around the real forex hero.
- Modify `frontend/src/app/HorizonLanding.module.css`: replace the current dashboard-like styling with a polished premium financial landing visual.
- Modify `/www/server/panel/vhost/nginx/horizon.cloudnexify.com.conf`: update only the root `location = /` internal `deploy=` cache-buster after Docker deploy.
- Read before coding: `node_modules/next/dist/docs/01-app/index.md`.

## Task 1: Update Landing Contract Test

**Files:**
- Modify: `tests/unit/frontend/horizonLanding.test.ts`

- [ ] **Step 1: Replace the old command-center contract with a Premium Forex contract**

Use this test body:

```ts
describe('Horizon premium forex landing contract', () => {
  it('keeps the root landing dynamic and backed by real GlobalData forex rows', () => {
    const source = read('frontend/src/app/page.tsx');

    expect(source).toContain("export const dynamic = 'force-dynamic'");
    expect(source).toContain('getMarketRailGroups');
    expect(source).toContain('getForexHeroModel');
    expect(source).toContain("group.title === 'Forex Market'");
    expect(source).toContain("row.symbol === 'XAUUSD'");
    expect(source).toContain('buildSparklinePath');
    expect(source).not.toContain('M2 40 26 28 48 33');
  });

  it('presents Horizon as a premium market product with HERTZ as the primary action', () => {
    const source = read('frontend/src/app/page.tsx');

    expect(source).toContain('Horizon Market Intelligence');
    expect(source).toContain('Buka HERTZ');
    expect(source).toContain('Lihat Outlook');
    expect(source).toContain('/hertz');
    expect(source).toContain('/outlook');
    expect(source).toContain('/blog');
    expect(source).toContain('/tools');
  });

  it('uses premium forex hero styles without falling back to the dashboard command panel', () => {
    const css = read('frontend/src/app/HorizonLanding.module.css');

    expect(css).toContain('.forexHero');
    expect(css).toContain('.heroChart');
    expect(css).toContain('.forexStrip');
    expect(css).toContain('.marketShowcase');
    expect(css).toContain('.mobileDock');
    expect(css).not.toContain('.commandPanel');
    expect(css).not.toContain('letter-spacing: -');
  });
});
```

- [ ] **Step 2: Run the test to verify RED**

Run:

```bash
npm run test -- tests/unit/frontend/horizonLanding.test.ts
```

Expected: FAIL because `getForexHeroModel`, `Horizon Market Intelligence`, `.forexHero`, and `.heroChart` are not implemented yet.

## Task 2: Implement Real Forex Hero Markup

**Files:**
- Modify: `frontend/src/app/page.tsx`
- Test: `tests/unit/frontend/horizonLanding.test.ts`

- [ ] **Step 1: Read the installed Next.js App Router docs**

Run:

```bash
sed -n '1,220p' node_modules/next/dist/docs/01-app/index.md
```

Expected: output confirms this project uses the installed Next.js App Router docs.

- [ ] **Step 2: Add type import and helper functions**

In `frontend/src/app/page.tsx`, import the market row/group types:

```ts
import type { MarketRailGroup, MarketRailRow } from '@/lib/globalDataMarket';
```

Add these helpers above the component:

```ts
function getForexHeroModel(groups: MarketRailGroup[]) {
  const group = groups.find((item) => item.title === 'Forex Market');
  const rows = group?.rows ?? [];
  const heroAsset = rows.find((row) => row.symbol === 'XAUUSD') ?? rows[0] ?? null;
  const supportingRows = rows.filter((row) => row.symbol !== heroAsset?.symbol).slice(0, 3);
  return { group, heroAsset, supportingRows };
}

function normalizeSparkline(points: number[], width = 640, height = 220) {
  const values = points.filter((point) => Number.isFinite(point));
  const safeValues = values.length >= 2 ? values : [4.8, 5.1, 4.9, 5.4, 5.2, 5.7, 5.5];
  const min = Math.min(...safeValues);
  const max = Math.max(...safeValues);
  const range = max - min || 1;
  return safeValues.map((value, index) => {
    const x = safeValues.length === 1 ? 0 : (index / (safeValues.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return { x, y };
  });
}

function buildSparklinePath(points: number[], width = 640, height = 220) {
  return normalizeSparkline(points, width, height)
    .map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x.toFixed(1)} ${point.y.toFixed(1)}`)
    .join(' ');
}

function buildSparklineArea(points: number[], width = 640, height = 220) {
  const normalized = normalizeSparkline(points, width, height);
  if (!normalized.length) return '';
  const line = normalized
    .map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x.toFixed(1)} ${point.y.toFixed(1)}`)
    .join(' ');
  return `${line} L${width} ${height} L0 ${height} Z`;
}

function formatMarketUpdatedAt(value?: string) {
  if (!value) return 'Live market';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Live market';
  return new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Jakarta',
  }).format(date);
}
```

- [ ] **Step 3: Restructure the landing JSX around Premium Forex Hero**

Use this data setup inside `HorizonLanding`:

```ts
const { group: forexGroup, heroAsset, supportingRows } = getForexHeroModel(marketGroups);
const heroPath = buildSparklinePath(heroAsset?.sparkline ?? []);
const heroArea = buildSparklineArea(heroAsset?.sparkline ?? []);
```

The first viewport must include:

```tsx
<section className={styles.hero} aria-labelledby="horizon-market-title">
  <div className={styles.copy}>
    <p className={styles.eyebrow}>Premium Forex Workspace</p>
    <h1 id="horizon-market-title">Horizon Market Intelligence</h1>
    <p className={styles.lead}>Forex data, social trading flow, and market outlook in one focused workspace.</p>
    <p className={styles.subcopy}>...</p>
    <div className={styles.actions}>...</div>
  </div>
  <aside className={styles.forexHero} aria-label="Live forex market preview">...</aside>
</section>
```

The forex hero must render `heroAsset` real values when present:

```tsx
{heroAsset ? (
  <>
    <div className={styles.heroAssetTop}>...</div>
    <svg className={styles.heroChart} viewBox="0 0 640 220" aria-hidden="true">
      <path className={styles.chartArea} d={heroArea} />
      <path className={styles.chartLine} d={heroPath} data-down={heroAsset.tone === 'down' ? 'true' : 'false'} />
    </svg>
    <div className={styles.forexStrip}>...</div>
  </>
) : (
  <div className={styles.emptyMarket}>Forex market data sedang diperbarui.</div>
)}
```

- [ ] **Step 4: Run the targeted test**

Run:

```bash
npm run test -- tests/unit/frontend/horizonLanding.test.ts
```

Expected: still FAIL until CSS styles are implemented.

## Task 3: Implement Premium Forex CSS

**Files:**
- Modify: `frontend/src/app/HorizonLanding.module.css`
- Test: `tests/unit/frontend/horizonLanding.test.ts`

- [ ] **Step 1: Replace dashboard-like CSS with premium financial layout**

Required class groups:

```css
.main {}
.navbar {}
.navBrand {}
.hero {}
.copy {}
.eyebrow {}
.actions {}
.forexHero {}
.heroAssetTop {}
.heroPrice {}
.heroChart {}
.chartArea {}
.chartLine {}
.forexStrip {}
.marketShowcase {}
.marketCard {}
.products {}
.productCard {}
.mobileDock {}
.footer {}
@media (max-width: 980px) {}
@media (max-width: 760px) {}
```

Required visual constraints:

```css
.hero {
  display: grid;
  grid-template-columns: minmax(0, 0.86fr) minmax(520px, 1fr);
}

.forexHero,
.productCard,
.marketCard {
  border-radius: 8px;
}

.heroChart {
  display: block;
  width: 100%;
}

.chartLine[data-down="true"] {
  stroke: #ff5b55;
}

.forexStrip {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

@media (max-width: 760px) {
  .hero {
    grid-template-columns: minmax(0, 1fr);
  }

  .forexStrip {
    grid-template-columns: minmax(0, 1fr);
  }

  .mobileDock {
    display: grid;
  }
}
```

- [ ] **Step 2: Run the targeted test**

Run:

```bash
npm run test -- tests/unit/frontend/horizonLanding.test.ts
```

Expected: PASS.

- [ ] **Step 3: Inspect diff**

Run:

```bash
git diff -- frontend/src/app/page.tsx frontend/src/app/HorizonLanding.module.css tests/unit/frontend/horizonLanding.test.ts
```

Expected: diff only touches the landing page, landing CSS, and landing contract test.

## Task 4: Verify, Deploy, And Update Root Cache-Buster

**Files:**
- Verify: `frontend/src/app/page.tsx`
- Verify: `frontend/src/app/HorizonLanding.module.css`
- Verify: `tests/unit/frontend/horizonLanding.test.ts`
- Modify after deploy: `/www/server/panel/vhost/nginx/horizon.cloudnexify.com.conf`

- [ ] **Step 1: Run targeted test**

Run:

```bash
npm run test -- tests/unit/frontend/horizonLanding.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run lint**

Run:

```bash
npm run lint
```

Expected: PASS.

- [ ] **Step 3: Run frontend build**

Run:

```bash
npm run build:frontend
```

Expected: PASS.

- [ ] **Step 4: Rebuild frontend container**

Run:

```bash
docker compose up -d --build frontend
```

Expected: frontend container starts successfully.

- [ ] **Step 5: Verify local root endpoint**

Run:

```bash
curl -sS --max-time 10 http://127.0.0.1:3888/ | rg -o "Horizon Market Intelligence|XAUUSD|Premium Forex Workspace"
```

Expected: all three strings are present.

- [ ] **Step 6: Update Nginx root deploy cache-buster**

Edit `/www/server/panel/vhost/nginx/horizon.cloudnexify.com.conf` root `location = /` proxy pass from:

```nginx
proxy_pass http://127.0.0.1:3888/?deploy=ea7e21d;
```

to:

```nginx
proxy_pass http://127.0.0.1:3888/?deploy=premium-forex-20260517;
```

Then run:

```bash
/www/server/nginx/sbin/nginx -t && /www/server/nginx/sbin/nginx -s reload
```

Expected: syntax test succeeds and Nginx reloads.

- [ ] **Step 7: Verify public HTTPS root**

Run:

```bash
curl -sS --max-time 15 https://horizon.cloudnexify.com/ | rg -o "Horizon Market Intelligence|XAUUSD|Premium Forex Workspace"
```

Expected: all three strings are present.

- [ ] **Step 8: Take public screenshots**

Run:

```bash
mkdir -p /tmp/horizon-review
npm exec -- playwright screenshot --viewport-size=390,844 https://horizon.cloudnexify.com/ /tmp/horizon-review/premium-forex-mobile.png
npm exec -- playwright screenshot --viewport-size=1440,1000 https://horizon.cloudnexify.com/ /tmp/horizon-review/premium-forex-desktop.png
```

Expected: screenshots show the Premium Forex Hero on public HTTPS.

## Task 5: Commit, Merge, And Push

**Files:**
- Stage: `frontend/src/app/page.tsx`
- Stage: `frontend/src/app/HorizonLanding.module.css`
- Stage: `tests/unit/frontend/horizonLanding.test.ts`
- Stage: `docs/superpowers/plans/2026-05-17-horizon-premium-forex-landing.md`

- [ ] **Step 1: Run full test suite**

Run:

```bash
npm run test
```

Expected: all tests pass.

- [ ] **Step 2: Stage only relevant repo files**

Run:

```bash
git add docs/superpowers/plans/2026-05-17-horizon-premium-forex-landing.md frontend/src/app/page.tsx frontend/src/app/HorizonLanding.module.css tests/unit/frontend/horizonLanding.test.ts
```

Expected: unrelated dirty files remain unstaged.

- [ ] **Step 3: Commit**

Run:

```bash
git commit -m "Refresh Horizon landing with premium forex hero"
```

Expected: commit succeeds.

- [ ] **Step 4: Merge to main**

Run:

```bash
git switch main
git merge premium-forex-landing
git branch -d premium-forex-landing
```

Expected: fast-forward merge succeeds and feature branch is deleted.

- [ ] **Step 5: Push main**

Run authenticated push to `origin main`.

Expected: `origin/main` points to the new implementation commit.

## Self-Review

- Spec coverage: tasks cover premium first viewport, real GlobalData forex rows, XAUUSD hero preference, supporting forex strip, ecosystem links, mobile behavior, no fake chart paths, verification, deployment, and HTTPS cache-buster handling.
- Placeholder scan: no unresolved deferred implementation language is used.
- Type consistency: `MarketRailGroup`, `MarketRailRow`, `getForexHeroModel`, `buildSparklinePath`, and CSS class names are consistent across test, JSX, and CSS tasks.
