# Frontend Review Tooling

Tanggal: 16 Mei 2026  
Status: installed untuk audit frontend Horizon/HERTZ di VPS.

## Installed Stack

- Playwright: browser automation, screenshots, visual regression, trace, video.
- Playwright MCP: browser agent/computer-use lewat MCP client.
- Axe + Playwright: accessibility audit.
- DOM snapshot script: structural snapshot dan DOM diff.
- rrweb replay script: session replay saat audit, tanpa memasang recorder permanen ke UI produksi.

## Base URL

Semua command review memakai `REVIEW_BASE_URL`.

Default fallback saat env tidak diisi:

```bash
https://horizon.cloudnexify.com
```

Contoh override:

```bash
REVIEW_BASE_URL=https://horizon.cloudnexify.com npm run review:a11y
```

Jangan menjalankan dev server di VPS untuk review ini. Pakai web live setelah build/deploy.

## Playwright Browser Install

```bash
npm run review:install-browsers
```

## Visual Regression

Generate atau update baseline screenshot:

```bash
REVIEW_BASE_URL=https://horizon.cloudnexify.com npm run review:visual:update
```

Bandingkan UI saat ini dengan baseline:

```bash
REVIEW_BASE_URL=https://horizon.cloudnexify.com npm run review:visual
```

Artifacts:

- `playwright-report/`
- `test-results/`
- screenshot baseline di folder snapshot Playwright dekat test.

## Accessibility Audit

```bash
REVIEW_BASE_URL=https://horizon.cloudnexify.com npm run review:a11y
```

Default audit memakai tag:

- `wcag2a`
- `wcag2aa`
- `wcag21a`
- `wcag21aa`

Default failure impact:

- `critical`
- `serious`

Override jika perlu audit yang lebih longgar/ketat:

```bash
REVIEW_A11Y_FAIL_IMPACTS=critical REVIEW_BASE_URL=https://horizon.cloudnexify.com npm run review:a11y
```

## Snapshot + DOM Diff

Update baseline DOM outline:

```bash
REVIEW_BASE_URL=https://horizon.cloudnexify.com npm run review:dom:update
```

Bandingkan DOM sekarang dengan baseline:

```bash
REVIEW_BASE_URL=https://horizon.cloudnexify.com npm run review:dom
```

Artifacts:

- baseline: `docs/review-snapshots/baseline/`
- latest run: `docs/review-snapshots/latest/`
- diff report: `docs/review-snapshots/latest/dom-diff.md`

Custom route:

```bash
node scripts/review-dom-snapshot.mjs --routes=/hertz,/hertz/messages
```

Custom viewport:

```bash
node scripts/review-dom-snapshot.mjs --viewports=desktop:1440x950,mobile:390x844
```

## Browser Agent / Computer-Use via MCP

Start Playwright MCP server:

```bash
npm run review:mcp
```

Codex MCP config snippet:

```toml
[mcp_servers.playwright]
command = "npx"
args = ["@playwright/mcp@0.0.75", "--browser", "chromium", "--headless", "--isolated"]
```

MCP menyediakan browser actions seperti navigate, click, form fill, accessibility snapshot, network requests, dan screenshot. Server ini berjalan sampai dihentikan manual.

## Session Replay

Record audit session dengan rrweb injection sementara:

```bash
REVIEW_BASE_URL=https://horizon.cloudnexify.com REVIEW_REPLAY_ROUTE=/hertz REVIEW_REPLAY_SECONDS=30 npm run review:replay
```

Untuk manual headed review, jika environment punya display:

```bash
REVIEW_REPLAY_HEADED=1 REVIEW_REPLAY_SECONDS=120 npm run review:replay
```

Artifacts:

- rrweb event JSON: `docs/review-replays/*-events.json`
- HTML player: `docs/review-replays/*-player.html`
- Playwright trace: `docs/review-replays/*-trace.zip`
- Playwright video: `docs/review-replays/`

Catatan privasi: script ini mem-mask input (`maskAllInputs: true`) dan tidak aktif di runtime produksi. Jalankan hanya untuk audit.

## Route dan Viewport Default

Route:

- `/`
- `/hertz`
- `/hertz/profile`
- `/hertz/messages`
- `/outlook`
- `/blog`
- `/tools`

Viewport:

- 1440x950
- 1365x768
- 768x1024
- 390x844
- 320x740

## Workflow Review yang Disarankan

1. Build/deploy produksi seperti biasa.
2. Jalankan `npm run review:a11y`.
3. Jalankan `npm run review:dom` untuk mengecek struktur berubah dari baseline.
4. Jalankan `npm run review:visual` untuk visual regression.
5. Jika perlu investigasi interaktif, pakai `npm run review:mcp`.
6. Jika perlu bukti alur, jalankan `npm run review:replay`.
