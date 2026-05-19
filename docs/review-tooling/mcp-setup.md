# MCP Browser & Design Review Setup

## Playwright MCP (browser agent)

```bash
npm run review:mcp
```

**Cursor** — tambahkan di MCP settings:

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@0.0.75", "--browser", "chromium", "--headless", "--isolated"]
    }
  }
}
```

Gunakan untuk: navigasi live site, screenshot, a11y snapshot, debug form.

## Figma MCP

Plugin `plugin-figma-figma` — untuk audit token, Code Connect, dan generate diagram.

Workflow: bandingkan komponen Storybook dengan Figma variables sebelum implementasi halaman baru.

## Kapan pakai apa

| Kebutuhan | Tool |
|-----------|------|
| Regression halaman | Playwright + `review:visual` |
| Regression komponen | Storybook + Chromatic |
| Cloud visual halaman | Percy (`review:percy`) |
| A11y WCAG | `review:a11y` + Storybook addon-a11y |
| Eksplorasi bebas | Playwright MCP atau `review:stagehand` |
