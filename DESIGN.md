# Horizon — Design System

## Meta

- **Product**: Horizon Trader Platform
- **Register default**: product (HERTZ, admin, tools); landing `/` treated as **brand** surface
- **Theme**: dark-first
- **Locale**: `id` UI copy

## Color strategy

**Restrained** — tinted neutrals + emerald accent ≤12% surface area on product screens; landing may use slightly richer emerald glow.

| Role | Value | Usage |
|------|-------|--------|
| Background | `#0a0a0f` | Page base (`--horizon-bg-base`) |
| Surface | `rgba(15, 19, 18, 0.78)` | Panels, cards |
| Surface strong | `rgba(20, 28, 24, 0.94)` | Modals, dropdowns |
| Text | `#f3fff8` | Primary copy |
| Text muted | `#91a79a` | Meta, captions |
| Accent | `#13d27b` | CTA, active nav, links |
| Accent soft | `rgba(19, 210, 123, 0.14)` | Hover, selected rows (no side-tab borders) |
| Border | `rgba(19, 210, 123, 0.24)` | Dividers |
| Danger | token `--color-danger` | Errors, destructive |

Avoid pure `#000` / `#fff`. Tint blacks toward `#050a07`, whites toward `#f3fff8`.

## Typography

| Role | Family | Notes |
|------|--------|--------|
| Body | **DM Sans** | Via `next/font`; variable `--font-dm-sans` |
| Heading | **DM Sans** | Weight 600–700 for titles |
| Mono | ui-monospace stack | IDs, code snippets |

Scale: modular from `--text-xs` … `--text-4xl`. Body line length cap ~70ch in articles.

## Spacing & layout

- Base unit 4px; shell padding `--horizon-shell-offset` (2rem desktop).
- Breakpoints: `frontend/src/lib/breakpoints.ts` only — no ad-hoc px.
- HERTZ: 3-column shell (rail | feed | market) ≥1024px; single column + bottom nav on mobile.

## Components

- **Button / Input / Card**: `components/ui/*` — shadcn-aligned tokens
- **HertzLayout**: feed shell, notification bell header
- **TabBar**: underline indicator (no thick side border on rounded chips)
- **Toast**: full border + shadow (no left accent stripe)
- **DM / Notifications list**: selected state = `background` + `accent-soft` gradient, not `border-left`

## Motion

- Prefer `transform` and `opacity`; avoid animating `height`, `width`, `padding`.
- Easing: ease-out; no bounce/elastic.
- Respect `prefers-reduced-motion`.

## Anti-patterns (do not ship)

- `border-left: 3px solid` accent on list rows (AI side-tab tell)
- Inter / Space Grotesk as default UI font
- Purple–blue marketing gradients on product surfaces
- Gray text on colored buttons without contrast check

## Implementation map

- Tokens: `frontend/src/app/globals.css`
- Extended notes: `frontend/DESIGN.md`
- Strategic context: `PRODUCT.md`
