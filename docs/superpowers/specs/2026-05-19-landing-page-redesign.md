# Horizon Landing Page Redesign Spec

**Date:** 2026-05-19
**Scope:** `frontend/src/app/page.tsx` + `frontend/src/app/HorizonLanding.module.css`
**Constraint:** CSS Modules only, server component, keep all data function signatures unchanged

---

## 1. Design Audit Summary

### Problems Found

| Category | Issue | Severity |
|----------|-------|----------|
| Color | `#00dc82` accent oversaturated — screams, does not whisper | High |
| Color | All colors hardcoded hex — light theme impossible | High |
| Color | Grid pattern at 96px too dense — looks like graph paper | Medium |
| Typography | `text-transform: uppercase` on h1 + eyebrow feels generic | Medium |
| Typography | Only weight 800/900 used — no subtle hierarchy | Medium |
| Layout | Everything symmetrical — 3 equal market cards, 4 equal product cards | High |
| Layout | Uniform 8px border-radius everywhere | Low |
| Layout | Section spacing too tight — sections blur together | Medium |
| Surface | Cards are flat border + transparent bg — no depth or glass effect | Medium |
| Interactivity | No hover transitions on cards or buttons | Medium |
| Interactivity | No active/pressed feedback on CTAs | Low |
| Content | All-caps labels everywhere — cliché AI pattern | Medium |
| Content | Footer is a single text line — no structure or legal links | Low |
| Code | `min-height: 680px` instead of `100dvh` for hero | Low |

---

## 2. Color Palette — CSS Custom Properties

All landing page colors will use custom properties. These resolve from the existing theme system but are scoped to the landing page via `.main`.

```css
.main {
  /* Surface hierarchy */
  --lp-bg: #050a07;
  --lp-bg-deep: #020503;
  --lp-surface: rgba(10, 22, 14, 0.82);
  --lp-surface-hover: rgba(14, 30, 18, 0.9);
  --lp-surface-elevated: rgba(16, 34, 22, 0.92);

  /* Border */
  --lp-border: rgba(46, 82, 58, 0.22);
  --lp-border-hover: rgba(46, 82, 58, 0.45);
  --lp-border-glow: rgba(16, 185, 129, 0.18);

  /* Text */
  --lp-text: #dfeee5;
  --lp-text-heading: #f3fff8;
  --lp-text-muted: #8ea897;
  --lp-text-label: #6b8575;

  /* Accent — desaturated emerald, ~65% saturation */
  --lp-accent: #22c78a;
  --lp-accent-hover: #1aad78;
  --lp-accent-muted: rgba(34, 199, 138, 0.12);
  --lp-accent-glow: rgba(34, 199, 138, 0.08);

  /* Sentiment */
  --lp-up: #2dd4a0;
  --lp-down: #f07068;

  /* Shadows — tinted, not black */
  --lp-shadow-sm: 0 2px 8px rgba(5, 18, 10, 0.4);
  --lp-shadow-md: 0 8px 32px rgba(5, 18, 10, 0.5);
  --lp-shadow-lg: 0 24px 80px rgba(5, 18, 10, 0.6);
  --lp-shadow-glow: 0 0 48px rgba(34, 199, 138, 0.06);
}
```

---

## 3. Typography Scale

| Role | Size | Weight | Tracking | Line-height |
|------|------|--------|----------|-------------|
| h1 — display | `clamp(3.5rem, 6.5vw, 5.5rem)` | 700 | -0.03em | 0.95 |
| h2 — section title | `clamp(1.75rem, 3vw, 2.5rem)` | 600 | -0.02em | 1.1 |
| Eyebrow / label | 0.76rem | 600 | 0.08em | 1.4 |
| Lead paragraph | `clamp(1.15rem, 1.6vw, 1.5rem)` | 400 | 0 | 1.5 |
| Body | 1rem | 400 | 0 | 1.65 |
| Small / caption | 0.84rem | 500 | 0.01em | 1.5 |
| Price — hero | `clamp(2rem, 3.5vw, 3.2rem)` | 600 | -0.02em | 1 |
| Price — tile | 1.12rem | 600 | -0.01em | 1.2 |
| Button | 0.9rem | 600 | 0.01em | 1 |

Key changes:
- Remove `text-transform: uppercase` from h1 — use normal case for premium feel
- Eyebrow uses `font-weight: 600` with `letter-spacing: 0.08em` instead of `900` with uppercase
- Introduce weight 400/500/600/700 hierarchy instead of 800/900 everywhere
- Use `font-variant-numeric: tabular-nums` for all price data

---

## 4. Section-by-Section Design

### 4.1 Navbar

**Changes from current:**
- Add `position: sticky; top: 0; z-index: 50` with `backdrop-filter: blur(20px)` glassmorphism
- Background: `rgba(5, 10, 7, 0.8)` — translucent, not opaque
- Reduce height from 76px to 60px — tighter, more refined
- Nav links: weight 500 instead of 800, color `--lp-text-muted`
- Login CTA: pill shape with subtle glow on hover, `transition: all 0.2s ease`
- Mobile: show logo only, hamburger icon for nav (or keep links hidden with mobile dock handling navigation)

```css
.navbar {
  position: sticky;
  top: 0;
  z-index: 50;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  background: rgba(5, 10, 7, 0.8);
  min-height: 60px;
  border-bottom: 1px solid var(--lp-border);
}
```

### 4.2 Hero Section

**Layout:** Two-column asymmetric grid — left column 55%, right column 45%

**Left column — Copy:**
- Eyebrow: "Premium forex workspace" in sentence case, weight 600, color `--lp-accent`
- h1: "Horizon Market Intelligence" — normal case, no uppercase, `clamp(3.5rem, 6.5vw, 5.5rem)`
- Lead: max-width 540px (not 720px — tighter for readability)
- Subcopy: removed — lead is enough, avoids repetition
- CTAs: primary green + secondary ghost with border
  - Primary: `background: var(--lp-accent)`, hover: scale(1.02), transition 200ms
  - Secondary: border only, hover: border-color lightens
  - Both: `border-radius: 10px` (not 8px uniform), `min-height: 48px`
- Trust row: keep but reduce visual weight — smaller pills, muted colors

**Right column — Chart Widget:**
- Glass card with `backdrop-filter: blur(12px)` and inner border glow
- Background: radial gradient glow behind chart area
- Box shadow: `var(--lp-shadow-lg)` + `var(--lp-shadow-glow)` — colored, deep shadow
- Chart SVG: reduce stroke-width from 5 to 3 for elegance
- Chart area fill: use gradient instead of flat color
- Forex strip tiles: remove borders, use subtle bg differentiation
- Add `font-variant-numeric: tabular-nums` to all prices

**Section spacing:** `padding: clamp(4rem, 8vw, 8rem) 0 clamp(3rem, 5vw, 5rem)`

### 4.3 Market Showcase — Removed

**Rationale:** The hero already shows live market data. Having a separate 3-card market showcase is redundant and creates visual noise. Instead, the market data will be integrated into a **live ticker strip** below the hero.

### 4.4 Live Ticker Strip (NEW)

A full-width horizontal scrolling strip showing all market groups.

```
┌─────────────────────────────────────────────────────┐
│ XAUUSD 2,648.30 +0.42% ▁▂▃▄▅▆  │  EURUSD ... │ ... │
└─────────────────────────────────────────────────────┘
```

- Single row, horizontally scrollable on mobile
- Each item: symbol + price + change + mini sparkline
- No card borders — just dividers between items
- Background: slightly darker than main, `--lp-bg-deep`
- `overflow-x: auto` with hidden scrollbar
- `font-variant-numeric: tabular-nums`

### 4.5 Product Modules — Zig-Zag Layout

Replace the current 4 equal cards + social proof with a **2-column zig-zag** pattern.

```
┌──────────────────────────────────────┐
│  SOCIAL PROOF BAR                    │  ← full-width, subtle
│  Latest from HERTZ: @user: post...   │
└──────────────────────────────────────┘

┌─────────────────┐ ┌─────────────────┐
│ HERTZ            │ │                 │
│ Social trading   │ │   CHART IMAGE   │
│ feed untuk...    │ │   or icon       │
│ [Buka HERTZ →]   │ │                 │
└─────────────────┘ └─────────────────┘

┌─────────────────┐ ┌─────────────────┐
│                 │ │ Outlook          │
│   CHART IMAGE   │ │ Arah market...   │
│                 │ │ [Lihat Outlook →]│
└─────────────────┘ └─────────────────┘

┌─────────────────┐ ┌─────────────────┐
│ Blog             │ │                 │
│ Artikel panjang  │ │   ICON          │
│ [Baca Blog →]    │ │                 │
└─────────────────┘ └─────────────────┘

┌─────────────────┐ ┌─────────────────┐
│                 │ │ Tools            │
│   ICON          │ │ Utility trading  │
│                 │ │ [Buka Tools →]   │
└─────────────────┘ └─────────────────┘
```

- Each row: text on one side, visual on the other — alternating
- Text side has: label + title + description + CTA link with arrow
- Visual side: uses market SVG icons from `/images/hertz-seed/` or placeholder
- Cards have NO border — only subtle background differentiation
- Hover on CTA: arrow slides right 4px with transition
- Max-width 1120px container with auto margins
- Section padding: `clamp(4rem, 8vw, 8rem) 0`

### 4.6 Final CTA Section (NEW)

A dramatic conversion section before the footer.

```
┌──────────────────────────────────────┐
│                                      │
│    Mulai trading dengan Horizon      │
│    Data live, komunitas aktif,       │
│    dan tools riset dalam satu tempat.│
│                                      │
│    [Buka HERTZ]    [Lihat Outlook]   │
│                                      │
└──────────────────────────────────────┘
```

- Centered text, large section padding `clamp(5rem, 10vw, 10rem) 0`
- h2: `clamp(1.75rem, 3vw, 2.5rem)`
- Subtle radial gradient glow behind text
- Same CTA buttons as hero

### 4.7 Footer

**Upgrade from single text line to structured footer:**

```
┌──────────────────────────────────────────────────────┐
│  HORIZON logo  │  HERTZ │ Outlook │ Blog │ Tools     │
│                │                                      │
│  © 2026 Horizon│  Privacy │ Terms                     │
└──────────────────────────────────────────────────────┘
```

- Top row: logo + nav links (horizontal)
- Bottom row: copyright + legal links
- Border-top: `1px solid var(--lp-border)`
- Text: `--lp-text-muted`, links hover to `--lp-accent`
- Max-width 1440px, padding `2rem 6vw`

### 4.8 Mobile Dock

**Changes from current:**
- Background: more translucent `rgba(5, 10, 7, 0.92)` with stronger blur
- Active item: subtle pill background instead of just color change
- Add transition on tap: `scale(0.96)` active state
- Add `text-transform: none` — keep labels clean
- Safe-area-inset-bottom maintained

---

## 5. Background Treatment

Replace the current 96px grid pattern with:

```css
.main {
  background:
    radial-gradient(ellipse 80% 50% at 50% 0%, rgba(34, 199, 138, 0.04) 0%, transparent 60%),
    radial-gradient(ellipse 60% 40% at 80% 80%, rgba(34, 199, 138, 0.02) 0%, transparent 50%),
    linear-gradient(180deg, #050a07 0%, #030704 40%, #020503 100%);
}
```

- Subtle radial gradient glows instead of grid lines
- Much more atmospheric and premium
- No grid pattern — cleaner look

---

## 6. Animation Specifications

All animations respect `prefers-reduced-motion`.

### Card Hover
```css
.productCard {
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}
.productCard:hover {
  transform: translateY(-2px);
  box-shadow: var(--lp-shadow-md);
  border-color: var(--lp-border-hover);
}
```

### Button Interactions
```css
.primary:active,
.secondary:active {
  transform: scale(0.98);
}
.primary,
.secondary {
  transition: transform 0.15s ease, background-color 0.15s ease, border-color 0.15s ease;
}
```

### CTA Link Arrow Slide
```css
.ctaLink::after {
  content: '→';
  display: inline-block;
  transition: transform 0.2s ease;
}
.ctaLink:hover::after {
  transform: translateX(4px);
}
```

### Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
  .productCard,
  .primary,
  .secondary,
  .ctaLink::after {
    transition: none;
  }
  .productCard:hover {
    transform: none;
  }
}
```

---

## 7. Responsive Breakpoints

| Breakpoint | Key Changes |
|-----------|-------------|
| **> 1440px** | Max-width container, content centered |
| **1024–1440px** | Hero grid collapses to single column, ticker strip full-width |
| **768–1024px** | Zig-zag products become single column stacked, navbar shows only logo |
| **480–768px** | Mobile dock appears, footer simplifies, hero h1 shrinks to 2.5rem |
| **360–480px** | Tighter padding, smaller fonts, ticker items compress |
| **< 360px** | Minimal padding, h1 at 2rem, single CTA |

### Hero Responsive
```css
/* Desktop */
.hero { grid-template-columns: 1.1fr minmax(400px, 0.9fr); }
/* Tablet */
@media (max-width: 1024px) { .hero { grid-template-columns: 1fr; } }
/* Mobile */
@media (max-width: 768px) { .hero { padding: 2rem 1rem; } .copy h1 { font-size: 2.5rem; } }
```

### Product Zig-Zag Responsive
```css
/* Desktop: alternating 2-column */
.productRow { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }
.productRow:nth-child(even) .productVisual { order: -1; }
/* Tablet/Mobile: single column */
@media (max-width: 768px) { .productRow { grid-template-columns: 1fr; } }
```

---

## 8. Files to Modify

| File | Action |
|------|--------|
| `frontend/src/app/page.tsx` | Restructure JSX — add ticker strip, zig-zag products, CTA section, upgrade footer |
| `frontend/src/app/HorizonLanding.module.css` | Full rewrite of styles following new design system |

### Files NOT Modified
- `frontend/src/app/layout.tsx` — no changes needed
- `frontend/src/app/globals.css` — no changes needed (landing has its own CSS module)
- `frontend/src/lib/globalDataMarket.ts` — data functions unchanged
- `frontend/src/lib/hertzPostDisplay.ts` — helper functions unchanged

---

## 9. Implementation Order

1. Rewrite `HorizonLanding.module.css` — new color tokens, background, typography
2. Update `.main` background treatment
3. Update `.navbar` with sticky glassmorphism
4. Rewrite `.hero` section styles — asymmetric grid, refined typography
5. Add `.tickerStrip` section (replacing market showcase)
6. Rewrite `.products` section — zig-zag layout with `.productRow` items
7. Add `.ctaSection` — final conversion push
8. Upgrade `.footer` — structured layout
9. Update `.mobileDock` — refined interactions
10. Add all responsive breakpoints
11. Update `page.tsx` JSX to match new CSS class structure
12. Run `cd frontend && npx next build` to verify

---

## 10. Visual Reference Notes

- **Hero chart widget**: Think Bloomberg Terminal widget with glass effect — deep shadow, subtle inner glow, clean typography
- **Ticker strip**: Think crypto exchange ticker — horizontal scroll, compact, data-dense
- **Product zig-zag**: Think Stripe or Linear product page — alternating text/visual, generous whitespace
- **Overall feel**: Dark, atmospheric, data-rich but with breathing room. NOT colorful or playful. Serious financial tool aesthetic.
