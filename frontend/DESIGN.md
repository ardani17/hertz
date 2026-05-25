# Hertz Frontend — Implementasi Design

Dokumen kanonik desain: **`/DESIGN.md`** (root) + **`/PRODUCT.md`**.

## Ringkasan cepat

- Tema: **dark-first**, aksen **emerald** `#13d27b`
- Font: **DM Sans** (`--font-dm-sans` di `layout.tsx`)
- Token utama di `src/app/globals.css` (`--hertz-*`)

## Token

| Token | Usage |
|-------|--------|
| `--hertz-bg-base` | Halaman |
| `--hertz-surface` | Kartu, panel |
| `--hertz-text` / `--hertz-text-muted` | Copy |
| `--hertz-accent` | CTA, aktif |
| `--hertz-accent-soft` | Row terpilih (DM, notifikasi) |

## Breakpoint

Gunakan [`src/lib/breakpoints.ts`](src/lib/breakpoints.ts).

## Copy

- UI: **Bahasa Indonesia**
- Nama produk: HERTZ dan Outlook (tidak diterjemahkan)

## Impor

```
app/ → features/ → components/ui|layout → lib/
```
