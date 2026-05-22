# Horizon Frontend — Implementasi Design

Dokumen kanonik desain: **`/DESIGN.md`** (root) + **`/PRODUCT.md`**.

## Ringkasan cepat

- Tema: **dark-first**, aksen **emerald** `#13d27b`
- Font: **DM Sans** (`--font-dm-sans` di `layout.tsx`)
- Token utama di `src/app/globals.css` (`--horizon-*`)

## Token

| Token | Usage |
|-------|--------|
| `--horizon-bg-base` | Halaman |
| `--horizon-surface` | Kartu, panel |
| `--horizon-text` / `--horizon-text-muted` | Copy |
| `--horizon-accent` | CTA, aktif |
| `--horizon-accent-soft` | Row terpilih (DM, notifikasi) |

## Breakpoint

Gunakan [`src/lib/breakpoints.ts`](src/lib/breakpoints.ts).

## Copy

- UI: **Bahasa Indonesia**
- Nama produk: HERTZ, Outlook, Horizon (tidak diterjemahkan)

## Impor

```
app/ → features/ → components/ui|layout → lib/
```
