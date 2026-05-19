# Horizon Frontend Design System

Tema utama: **dark-first**, aksen **emerald** (`#10b981`), tipografi **Inter**.

## Token (globals.css)

| Token | Dark | Usage |
|-------|------|--------|
| `--color-bg` | `#0a0a0a` | Halaman |
| `--color-surface` | `#141414` | Kartu, panel |
| `--color-text` | `#f1f1f1` | Body |
| `--color-text-muted` | `#a1a1a1` | Meta, caption |
| `--color-border` | `#1f1f1f` | Garis pemisah |
| `--color-accent` | `#10b981` | CTA, link aktif |
| `--border-radius` | `10px` | Kartu, input |

HERTZ shell memakai surface `#0f0f14` di layout module (selaras dengan feed).

## Breakpoint

Gunakan [`src/lib/breakpoints.ts`](src/lib/breakpoints.ts) — jangan hardcode nilai baru.

| Nama | px |
|------|-----|
| mobileSm | 320 |
| mobile | 390 |
| tablet | 768 |
| desktop | 1024 |
| desktopLg | 1440 |

## Komponen wajib

- `components/ui/button`, `card`, `input`, `SkeletonLoader`, `ErrorPage`, `Toast`
- `components/layout/HertzLayout` — shell sosial 3-kolom
- `components/ui/TabBar` — navigasi tab dengan ARIA

## Copy

- UI user-facing: **Bahasa Indonesia**
- `aria-label` / error teknis: Indonesia, hindari campuran EN kecuali istilah produk (HERTZ, Outlook)

## File size

- TSX: target **≤200 baris**
- CSS module: **≤250 baris** per file; pecah per section jika lebih

## Impor

```
app/ → features/ → components/ui|layout → lib/
```

`features/` tidak boleh impor dari `app/`.
