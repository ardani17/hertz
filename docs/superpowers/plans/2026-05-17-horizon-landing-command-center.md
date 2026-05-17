# Horizon Landing Command Center Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the root `/` landing page into the approved Horizon Command Center design.

**Architecture:** Keep `frontend/src/app/page.tsx` as a dynamic server component that fetches the latest HERTZ post and market rail groups. Implement the visual refresh with focused JSX restructuring plus `HorizonLanding.module.css`; add a source/CSS contract test matching the existing frontend unit-test style.

**Tech Stack:** Next.js App Router, React server components, CSS Modules, Vitest source contract tests, Docker Compose frontend rebuild.

---

## File Map

- Modify `frontend/src/app/page.tsx`: restructure the landing content into header, hero copy, command panel, market preview, ecosystem modules, and mobile nav/footer hooks.
- Modify `frontend/src/app/HorizonLanding.module.css`: replace the current portal styling with the Command Center layout, responsive desktop/mobile rules, HERTZ-like visual language, and stable card dimensions.
- Create `tests/unit/frontend/horizonLanding.test.ts`: lock the landing contract so future edits keep the Command Center direction, live data sources, HERTZ CTA, and mobile consistency hooks.
- Read before coding: `node_modules/next/dist/docs/01-app/index.md` to respect the installed Next.js version.

## Task 1: Add Landing Contract Test

**Files:**
- Create: `tests/unit/frontend/horizonLanding.test.ts`
- Read: `frontend/src/app/page.tsx`
- Read: `frontend/src/app/HorizonLanding.module.css`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/frontend/horizonLanding.test.ts` with:

```ts
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const rootDir = resolve(__dirname, '../../..');

function read(relativePath: string) {
  return readFileSync(resolve(rootDir, relativePath), 'utf8');
}

describe('Horizon landing command center contract', () => {
  it('keeps the root landing as a dynamic Horizon command center', () => {
    const source = read('frontend/src/app/page.tsx');

    expect(source).toContain("export const dynamic = 'force-dynamic'");
    expect(source).toContain('HertzPostService');
    expect(source).toContain('getMarketRailGroups');
    expect(source).toContain('commandPanel');
    expect(source).toContain('Buka HERTZ');
    expect(source).toContain('Horizon Command Center');
  });

  it('keeps the page connected to the full Horizon ecosystem', () => {
    const source = read('frontend/src/app/page.tsx');

    expect(source).toContain('/hertz');
    expect(source).toContain('/outlook');
    expect(source).toContain('/blog');
    expect(source).toContain('/tools');
    expect(source).toContain('Outlook');
    expect(source).toContain('Blog');
    expect(source).toContain('Tools');
  });

  it('uses HERTZ-like responsive landing styles', () => {
    const css = read('frontend/src/app/HorizonLanding.module.css');

    expect(css).toContain('.commandPanel');
    expect(css).toContain('.mobileDock');
    expect(css).toContain('border-radius: 8px');
    expect(css).toContain('grid-template-columns: minmax(0, 1fr)');
    expect(css).toContain('@media (max-width: 760px)');
    expect(css).not.toContain('letter-spacing: -');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
npm run test -- tests/unit/frontend/horizonLanding.test.ts
```

Expected: FAIL because `commandPanel`, `Horizon Command Center`, and `.mobileDock` are not implemented yet.

- [ ] **Step 3: Commit is not needed yet**

Do not commit the failing test alone; it is part of the next implementation commit.

## Task 2: Implement Command Center Markup

**Files:**
- Modify: `frontend/src/app/page.tsx`
- Test: `tests/unit/frontend/horizonLanding.test.ts`

- [ ] **Step 1: Read the installed Next.js App Router docs**

Run:

```bash
sed -n '1,220p' node_modules/next/dist/docs/01-app/index.md
```

Expected: output confirms the installed Next.js App Router docs are available. Use this as the reference for App Router conventions before editing.

- [ ] **Step 2: Replace the landing JSX structure**

In `frontend/src/app/page.tsx`, keep imports and data fetching, then restructure the returned JSX around these class hooks:

```tsx
<main className={styles.main}>
  <header className={styles.navbar}>...</header>
  <section className={styles.hero} aria-labelledby="horizon-command-center-title">
    <div className={styles.copy}>
      <p className={styles.eyebrow}>Horizon Command Center</p>
      <h1 id="horizon-command-center-title">Horizon</h1>
      <p className={styles.lead}>Market, social, insight dalam satu workspace trading.</p>
      <p className={styles.subcopy}>...</p>
      <div className={styles.actions}>...</div>
    </div>
    <aside className={styles.commandPanel} aria-label="Horizon command center preview">...</aside>
  </section>
  <section className={styles.marketStrip} aria-label="Market preview">...</section>
  <section className={styles.products} aria-label="Horizon ecosystem">...</section>
  <nav className={styles.mobileDock} aria-label="Horizon mobile navigation">...</nav>
  <footer className={styles.footer}>...</footer>
</main>
```

Keep these behaviors:

```tsx
const [previewPost, marketGroups] = await Promise.all([
  getLandingPreviewPost(),
  getLandingMarketGroups(),
]);
```

Use clean fallbacks:

```tsx
{previewPost ? (
  <article className={styles.activityCard}>...</article>
) : (
  <div className={styles.emptyCard}>Aktivitas HERTZ terbaru akan muncul di sini.</div>
)}
```

```tsx
{marketGroups.length > 0 ? (
  ...
) : (
  <div className={styles.emptyCard}>Market rail sedang disiapkan.</div>
)}
```

- [ ] **Step 3: Run the targeted test**

Run:

```bash
npm run test -- tests/unit/frontend/horizonLanding.test.ts
```

Expected: still FAIL until CSS task adds required style hooks.

## Task 3: Implement Command Center Styling

**Files:**
- Modify: `frontend/src/app/HorizonLanding.module.css`
- Test: `tests/unit/frontend/horizonLanding.test.ts`

- [ ] **Step 1: Replace the landing CSS with responsive Command Center styles**

Implement these required class groups:

```css
.main {}
.navbar {}
.navBrand {}
.hero {}
.copy {}
.eyebrow {}
.actions {}
.commandPanel {}
.panelHeader {}
.activityCard {}
.marketPreview {}
.products {}
.productCard {}
.mobileDock {}
.footer {}
@media (max-width: 980px) {}
@media (max-width: 760px) {}
```

Required style constraints:

```css
.hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(420px, 0.78fr);
}

.commandPanel,
.activityCard,
.marketPreview,
.productCard {
  border-radius: 8px;
}

@media (max-width: 760px) {
  .hero {
    grid-template-columns: minmax(0, 1fr);
  }

  .mobileDock {
    display: grid;
  }
}
```

Avoid negative letter spacing and avoid one-note styling that makes the page only a flat green grid. Use green as the accent, with neutral dark surfaces and small red/amber/blue indicators where useful.

- [ ] **Step 2: Run the targeted test**

Run:

```bash
npm run test -- tests/unit/frontend/horizonLanding.test.ts
```

Expected: PASS.

- [ ] **Step 3: Inspect source diff**

Run:

```bash
git diff -- frontend/src/app/page.tsx frontend/src/app/HorizonLanding.module.css tests/unit/frontend/horizonLanding.test.ts
```

Expected: diff only touches the root landing and the new test.

## Task 4: Full Verification And Deploy

**Files:**
- Verify: `frontend/src/app/page.tsx`
- Verify: `frontend/src/app/HorizonLanding.module.css`
- Verify: `tests/unit/frontend/horizonLanding.test.ts`

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

Expected: PASS with no new lint errors.

- [ ] **Step 3: Run frontend build**

Run:

```bash
npm run build:frontend
```

Expected: PASS.

- [ ] **Step 4: Rebuild the frontend container**

Run:

```bash
docker compose up -d --build frontend
```

Expected: `horizon-frontend` rebuilds and starts.

- [ ] **Step 5: Check container health**

Run:

```bash
docker compose ps frontend
```

Expected: frontend service is running or healthy.

- [ ] **Step 6: Verify live root endpoint**

Run:

```bash
curl -I --max-time 10 http://127.0.0.1:3888/
```

Expected: HTTP `200 OK`.

- [ ] **Step 7: Take desktop and mobile screenshots**

Run:

```bash
mkdir -p /tmp/horizon-review
npm exec -- playwright screenshot --viewport-size=1440,1000 http://127.0.0.1:3888/ /tmp/horizon-review/landing-command-desktop.png
npm exec -- playwright screenshot --viewport-size=390,844 http://127.0.0.1:3888/ /tmp/horizon-review/landing-command-mobile.png
```

Expected: screenshots show the new Command Center landing with no obvious overflow or blank hero sections.

## Task 5: Commit Implementation

**Files:**
- Stage: `frontend/src/app/page.tsx`
- Stage: `frontend/src/app/HorizonLanding.module.css`
- Stage: `tests/unit/frontend/horizonLanding.test.ts`

- [ ] **Step 1: Confirm unrelated changes remain unstaged**

Run:

```bash
git status --short
```

Expected: unrelated pre-existing files such as `.env.example`, `docker-compose.yml`, `.superpowers/`, and `docs/teswebimg/*` are not staged.

- [ ] **Step 2: Stage only landing files**

Run:

```bash
git add frontend/src/app/page.tsx frontend/src/app/HorizonLanding.module.css tests/unit/frontend/horizonLanding.test.ts
```

Expected: only the landing implementation files are staged.

- [ ] **Step 3: Commit**

Run:

```bash
git commit -m "Refresh Horizon landing command center"
```

Expected: commit succeeds with only the root landing changes.

## Self-Review

- Spec coverage: Tasks cover root landing identity, HERTZ primary CTA, ecosystem modules, existing data sources, fallbacks, mobile consistency, tests, build, Docker rebuild, and live endpoint verification.
- Placeholder scan: no unresolved placeholder or deferred implementation language is used.
- Type consistency: plan keeps existing `HertzPostService`, `HertzPost`, and `getMarketRailGroups` names; new class names are consistent across JSX, CSS, and test contract.
