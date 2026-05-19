# Design-to-Code Pipeline

## Alur

1. **Referensi** — Figma (MCP) atau skill `imagegen-frontend-web` (satu gambar per section).
2. **Token** — `frontend/DESIGN.md` + `globals.css` (warna, spacing, radius).
3. **Storybook** — story komponen dengan state loading/empty/error.
4. **Implementasi** — Next.js page di `frontend/src/app/`.
5. **Verifikasi** — Chromatic (komponen) + Playwright/Percy (halaman) + axe.

## Perintah

```bash
npm run storybook              # dev komponen (lokal)
npm run build-storybook        # static build
npm run review:chromatic       # butuh CHROMATIC_PROJECT_TOKEN
REVIEW_BASE_URL=... npm run review:visual
REVIEW_BASE_URL=... npm run review:percy   # butuh PERCY_TOKEN
```

## Skills repo

- `.agents/skills/image-to-code/SKILL.md`
- `.agents/skills/design-taste-frontend/SKILL.md`
- `.agents/skills/stitch-design-taste/SKILL.md`
