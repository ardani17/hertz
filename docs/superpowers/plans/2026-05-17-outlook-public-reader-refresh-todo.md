# Outlook Public Reader Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mengubah Outlook publik menjadi mixed content insight feed yang mendukung video outlook, long read, dan chart note, dengan detail adaptif serta metadata optional agar publisher tidak terbebani.

**Architecture:** Tambahkan kontrak data optional `outlook_metadata` di tabel `articles`, lalu pusatkan mapping/fallback Outlook di helper pure TypeScript. Public listing dan detail memakai helper itu agar UI konsisten, sementara admin editor hanya menambah input optional dan tetap bisa menyimpan konten minimal. Mobile tetap memakai `HertzAppShell` dan bottom nav HERTZ yang sudah ada.

**Tech Stack:** Next.js 16 app router, React 19, TypeScript, CSS modules, PostgreSQL JSONB migration, Vitest, existing review scripts, `HertzAppShell`.

---

## Aturan Checklist

- Checkbox hanya boleh dicentang setelah pekerjaan pada baris itu benar-benar selesai.
- Checkbox task utama hanya boleh dicentang setelah semua step task, verifikasi, dan commit task selesai.
- Jika verifikasi gagal, jangan centang. Perbaiki dulu atau catat blocker.
- Setelah task selesai dan terverifikasi, langsung commit file relevan saja.
- Jangan stage perubahan lama yang bukan bagian task, terutama `.env.example`, `docker-compose.yml`, `.superpowers/`, dan screenshot di `docs/teswebimg/` kecuali user meminta.
- Jangan menjalankan dev server di VPS. Gunakan test/build/check dan review terhadap web live.
- Sebelum edit kode Next.js, baca guide relevan di `node_modules/next/dist/docs/`.

## Source Of Truth

**Spec:**
- `docs/superpowers/specs/2026-05-17-outlook-public-reader-refresh-design.md`

**Approved product contract:**
- Public reader first.
- `/outlook` memakai mixed content Insight Feed.
- `/outlook/[slug]` adaptif untuk Video Outlook, Long Read, dan Chart Note.
- Desktop mock mixed content disetujui.
- Mobile mock mixed content disetujui.
- Mobile footer/bottom nav harus sama dengan HERTZ.
- Semua input metadata tambahan optional, bukan required.

## File Map

**Create:**
- `db/migrations/012_add_outlook_metadata.sql` — JSONB optional metadata for Outlook.
- `frontend/src/lib/outlookContent.ts` — pure mapping, inference, fallback, excerpt, snapshot helpers.
- `frontend/src/components/outlook/OutlookSnapshot.tsx` — reusable snapshot chips/panel.
- `frontend/src/components/outlook/OutlookSnapshot.module.css` — snapshot styles.

**Modify:**
- `shared/types/index.ts` — add `OutlookMetadata` and optional `outlook_metadata`.
- `frontend/src/app/api/articles/route.ts` — accept and persist optional Outlook metadata; allow empty Outlook body.
- `frontend/src/app/api/articles/[id]/route.ts` — return/update optional Outlook metadata; allow empty Outlook body for Outlook.
- `frontend/src/components/admin/OutlookEditor.tsx` — add optional fields and remove required content validation for Outlook.
- `frontend/src/app/admin/(dashboard)/outlook/new/page.tsx` — submit optional metadata.
- `frontend/src/app/admin/(dashboard)/outlook/[id]/edit/page.tsx` — load and submit optional metadata.
- `frontend/src/app/outlook/page.tsx` — query metadata/media and render mixed content feed cards.
- `frontend/src/app/outlook/page.module.css` — listing feed layout.
- `frontend/src/components/outlook/OutlookCard.tsx` — content-type card variants.
- `frontend/src/components/outlook/OutlookCard.module.css` — desktop/mobile mixed card styles.
- `frontend/src/app/outlook/[slug]/page.tsx` — detail mapping and adaptive layout.
- `frontend/src/app/outlook/[slug]/page.module.css` — detail media/snapshot/readability styles.
- `frontend/src/components/outlook/OutlookContent.tsx` — render nothing for empty body.
- `frontend/src/components/outlook/index.ts` — export new snapshot component/helper types if needed.
- `frontend/src/lib/mobileContent.ts` — include Outlook metadata in mobile API response.

**Test:**
- `tests/unit/frontend/outlook.test.ts` — pure mapping tests for inference/fallbacks.
- `tests/unit/frontend/mobileRoutes.test.ts` — update expected Outlook response if mobile metadata tests exist.

---

## Baseline Review Before Implementation

**Files:**
- Read: `docs/superpowers/specs/2026-05-17-outlook-public-reader-refresh-design.md`
- Read: `node_modules/next/dist/docs/01-app/index.md`
- Read: `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md`

- [x] **Step 1: Read approved spec**

Run:

```bash
sed -n '1,240p' docs/superpowers/specs/2026-05-17-outlook-public-reader-refresh-design.md
```

Expected:

- Confirm public-first scope.
- Confirm optional metadata rule.
- Confirm mobile bottom nav consistency requirement.

- [x] **Step 2: Read Next.js app/router docs before edits**

Run:

```bash
sed -n '1,220p' node_modules/next/dist/docs/01-app/index.md
sed -n '1,220p' node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md
```

Expected:

- Route handler and app router behavior is checked against this installed Next.js version before code changes.

- [x] **Step 3: Capture current git status**

Run:

```bash
git status --short
```

Expected:

- Existing unrelated dirty files are visible.
- Do not stage `.env.example`, `docker-compose.yml`, `.superpowers/`, or `docs/teswebimg/`.

- [x] **Checklist selesai Baseline Review**

Centang setelah semua context read selesai.

---

## Task 1: Outlook Metadata Contract

**Files:**
- Create: `db/migrations/012_add_outlook_metadata.sql`
- Modify: `shared/types/index.ts`
- Create: `frontend/src/lib/outlookContent.ts`
- Test: `tests/unit/frontend/outlook.test.ts`

- [x] **Step 1: Add failing tests for metadata normalization and type inference**

Add tests to `tests/unit/frontend/outlook.test.ts` covering:

- Missing metadata and no media becomes `article`.
- External video URL becomes `video`.
- Uploaded video media becomes `video`.
- Image media with short body becomes `chart`.
- Long body with image remains `article`.
- Snapshot chips omit empty fields.
- Empty Outlook body produces empty body state without throwing.

Expected helper API:

```ts
type OutlookContentKind = 'video' | 'article' | 'chart';

interface OutlookMetadataInput {
  contentType?: string | null;
  videoUrl?: string | null;
  summary?: string | null;
  bias?: string | null;
  timeframe?: string | null;
  market?: string | null;
  sentiment?: string | null;
  risk?: string | null;
  keyPoints?: string[] | string | null;
}

interface OutlookMediaInput {
  id: string;
  file_url: string;
  media_type: string;
}

expect(inferOutlookContentKind({
  metadata: { videoUrl: 'https://example.com/recording.mp4' },
  media: [],
  contentHtml: '',
})).toBe('video');

expect(inferOutlookContentKind({
  metadata: {},
  media: [{ id: 'm1', file_url: '/chart.png', media_type: 'image' }],
  contentHtml: '<p>XAUUSD retest demand.</p>',
})).toBe('chart');

expect(buildOutlookSnapshot({
  bias: 'Watch',
  timeframe: '',
  market: 'XAUUSD',
  sentiment: null,
  risk: 'Break demand',
  keyPoints: ['Wait confirmation', 'Invalid below demand'],
})).toEqual([
  { label: 'Bias', value: 'Watch' },
  { label: 'Market', value: 'XAUUSD' },
  { label: 'Risk', value: 'Break demand' },
]);
```

Run:

```bash
npm run test -- tests/unit/frontend/outlook.test.ts
```

Expected:

- FAIL because `frontend/src/lib/outlookContent.ts` does not exist yet.

- [x] **Step 2: Add migration for optional JSONB metadata**

Create `db/migrations/012_add_outlook_metadata.sql`:

```sql
-- ============================================
-- Horizon Trader Platform — Schema Update
-- Migration 012: Add optional Outlook metadata
-- ============================================

ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS outlook_metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_articles_outlook_metadata
  ON articles USING GIN (outlook_metadata)
  WHERE category = 'outlook';
```

Expected:

- Existing articles remain valid.
- Missing metadata reads as `{}`.

- [x] **Step 3: Update shared article types**

Modify `shared/types/index.ts`:

```ts
export interface OutlookMetadata {
  contentType?: 'video' | 'article' | 'chart' | null;
  videoUrl?: string | null;
  summary?: string | null;
  bias?: string | null;
  timeframe?: string | null;
  market?: string | null;
  sentiment?: string | null;
  risk?: string | null;
  keyPoints?: string[] | null;
}

export interface Article {
  id: string;
  author_id: string;
  content_html: string;
  title: string | null;
  category: ArticleCategory;
  source: ArticleSource;
  status: ArticleStatus;
  slug: string;
  created_at: Date;
  telegram_message_id: number | null;
  bot_reply_message_id: number | null;
  telegram_chat_id: number | null;
  outlook_metadata?: OutlookMetadata | null;
}
```

Expected:

- Existing imports of `Article` still compile.
- Outlook metadata remains optional for non-Outlook rows.

- [x] **Step 4: Implement pure Outlook mapping helper**

Create `frontend/src/lib/outlookContent.ts` with exported functions:

```ts
export type OutlookContentKind = 'video' | 'article' | 'chart';

export interface OutlookMetadataInput {
  contentType?: string | null;
  videoUrl?: string | null;
  summary?: string | null;
  bias?: string | null;
  timeframe?: string | null;
  market?: string | null;
  sentiment?: string | null;
  risk?: string | null;
  keyPoints?: string[] | string | null;
}

export interface OutlookMediaInput {
  id: string;
  file_url: string;
  media_type: string;
}

export interface OutlookSnapshotItem {
  label: string;
  value: string;
}

export function stripOutlookHtml(html: string | null | undefined): string {
  return String(html ?? '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

export function normalizeOutlookMetadata(value: unknown): OutlookMetadataInput {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const input = value as Record<string, unknown>;
  const keyPoints = Array.isArray(input.keyPoints)
    ? input.keyPoints.map(String).map((item) => item.trim()).filter(Boolean)
    : typeof input.keyPoints === 'string'
      ? input.keyPoints.split(/\r?\n/).map((item) => item.trim()).filter(Boolean)
      : [];

  return {
    contentType: typeof input.contentType === 'string' ? input.contentType : null,
    videoUrl: typeof input.videoUrl === 'string' ? input.videoUrl.trim() : null,
    summary: typeof input.summary === 'string' ? input.summary.trim() : null,
    bias: typeof input.bias === 'string' ? input.bias.trim() : null,
    timeframe: typeof input.timeframe === 'string' ? input.timeframe.trim() : null,
    market: typeof input.market === 'string' ? input.market.trim() : null,
    sentiment: typeof input.sentiment === 'string' ? input.sentiment.trim() : null,
    risk: typeof input.risk === 'string' ? input.risk.trim() : null,
    keyPoints,
  };
}

export function inferOutlookContentKind(input: {
  metadata: OutlookMetadataInput;
  media: OutlookMediaInput[];
  contentHtml: string;
}): OutlookContentKind {
  if (input.metadata.contentType === 'video') return 'video';
  if (input.metadata.contentType === 'chart') return 'chart';
  if (input.metadata.contentType === 'article') return 'article';
  if (input.metadata.videoUrl) return 'video';
  if (input.media.some((item) => item.media_type === 'video')) return 'video';
  const hasImage = input.media.some((item) => item.media_type === 'image');
  const plainText = stripOutlookHtml(input.contentHtml);
  if (hasImage && plainText.length <= 280) return 'chart';
  return 'article';
}

export function buildOutlookSnapshot(metadata: OutlookMetadataInput): OutlookSnapshotItem[] {
  return [
    ['Bias', metadata.bias],
    ['Timeframe', metadata.timeframe],
    ['Market', metadata.market],
    ['Sentiment', metadata.sentiment],
    ['Risk', metadata.risk],
  ]
    .filter((item): item is [string, string] => typeof item[1] === 'string' && item[1].trim().length > 0)
    .map(([label, value]) => ({ label, value: value.trim() }));
}

export function getOutlookSummary(input: {
  metadata: OutlookMetadataInput;
  contentHtml: string;
  maxLength?: number;
}): string {
  const maxLength = input.maxLength ?? 180;
  const preferred = input.metadata.summary?.trim() || stripOutlookHtml(input.contentHtml);
  if (preferred.length <= maxLength) return preferred;
  return `${preferred.slice(0, maxLength).trimEnd()}...`;
}
```

Expected:

- Helper contains no React code and is unit-testable.
- Empty fields normalize to omitted display state.

- [x] **Step 5: Verify Task 1**

Run:

```bash
npm run test -- tests/unit/frontend/outlook.test.ts
npm run lint
```

Expected:

- Outlook unit tests pass.
- Lint pass.

- [x] **Step 6: Commit Task 1**

Run:

```bash
git add db/migrations/012_add_outlook_metadata.sql shared/types/index.ts frontend/src/lib/outlookContent.ts tests/unit/frontend/outlook.test.ts
git commit -m "Add Outlook metadata mapping contract"
```

- [x] **Checklist selesai Task 1**

Centang setelah tests pass dan commit dibuat.

---

## Task 2: Admin/API Optional Metadata Save Path

**Files:**
- Modify: `frontend/src/app/api/articles/route.ts`
- Modify: `frontend/src/app/api/articles/[id]/route.ts`
- Modify: `frontend/src/components/admin/OutlookEditor.tsx`
- Modify: `frontend/src/components/admin/OutlookEditor.module.css`
- Modify: `frontend/src/app/admin/(dashboard)/outlook/new/page.tsx`
- Modify: `frontend/src/app/admin/(dashboard)/outlook/[id]/edit/page.tsx`
- Test: `tests/unit/frontend/outlook.test.ts`

- [x] **Step 1: Add failing tests for form metadata normalization**

Add test cases to `tests/unit/frontend/outlook.test.ts`:

```ts
expect(normalizeOutlookMetadata({
  contentType: 'video',
  videoUrl: ' https://example.com/outlook.mp4 ',
  summary: ' US session prep ',
  keyPoints: 'Liquidity above high\nInvalid below low',
})).toEqual({
  contentType: 'video',
  videoUrl: 'https://example.com/outlook.mp4',
  summary: 'US session prep',
  bias: null,
  timeframe: null,
  market: null,
  sentiment: null,
  risk: null,
  keyPoints: ['Liquidity above high', 'Invalid below low'],
});
```

Run:

```bash
npm run test -- tests/unit/frontend/outlook.test.ts
```

Expected:

- FAIL until helper behavior matches the admin payload contract.

- [x] **Step 2: Extend article create API**

Modify `frontend/src/app/api/articles/route.ts`:

- Read `outlook_metadata` from request body.
- Use `normalizeOutlookMetadata` when `category === 'outlook'`.
- Allow empty `content_html` only for Outlook.
- Keep existing validation for non-Outlook articles.
- Insert `outlook_metadata` with `JSON.stringify(metadata)`.

Implementation target for POST validation:

```ts
const normalizedContentHtml = typeof content_html === 'string' ? content_html : '';
if (category !== 'outlook' && !normalizedContentHtml.trim()) {
  return NextResponse.json(
    { success: false, error: { error_code: 'VALIDATION_ERROR', message: 'Konten HTML tidak boleh kosong', details: null, timestamp: new Date().toISOString() } },
    { status: 422 },
  );
}
const outlookMetadata = category === 'outlook' ? normalizeOutlookMetadata(body.outlook_metadata) : {};
```

Expected:

- Outlook can save video/chart entries with empty long body.
- Existing category validation remains unchanged.

- [x] **Step 3: Extend article detail/update API**

Modify `frontend/src/app/api/articles/[id]/route.ts`:

- GET returns `outlook_metadata`.
- PUT accepts `outlook_metadata`.
- PUT allows empty `content_html` only when target category is Outlook.
- PUT logs `outlook_metadata` as part of changes when present.

Implementation target:

```ts
const nextCategory = category ?? existing.category;
if (content_html !== undefined) {
  const normalizedContentHtml = typeof content_html === 'string' ? content_html : '';
  if (nextCategory !== 'outlook' && !normalizedContentHtml.trim()) {
    return NextResponse.json(
      { success: false, error: { error_code: 'VALIDATION_ERROR', message: 'Konten HTML tidak boleh kosong', details: null, timestamp: new Date().toISOString() } },
      { status: 422 },
    );
  }
  updates.push(`content_html = $${paramIndex}`);
  values.push(normalizedContentHtml);
  paramIndex++;
}

if (nextCategory === 'outlook' && body.outlook_metadata !== undefined) {
  updates.push(`outlook_metadata = $${paramIndex}`);
  values.push(JSON.stringify(normalizeOutlookMetadata(body.outlook_metadata)));
  paramIndex++;
}
```

Expected:

- Editing old Outlook rows with no metadata keeps working.
- Optional fields never block save.

- [x] **Step 4: Add optional fields to OutlookEditor**

Modify `frontend/src/components/admin/OutlookEditor.tsx`:

- Extend `OutlookFormData` with `outlook_metadata`.
- Extend `OutlookInitialData` with `outlook_metadata`.
- Add optional controls:
  - content type select: blank / video / article / chart
  - video URL input
  - summary/caption textarea
  - bias input
  - timeframe input
  - market input
  - sentiment input
  - risk input
  - key points textarea
- Remove content HTML required validation for Outlook.
- Keep title required unless user later asks to relax it.

Form payload target:

```ts
await onSubmit({
  title: title.trim(),
  content_html: contentHtml,
  category: 'outlook',
  status,
  outlook_metadata: normalizeOutlookMetadata({
    contentType,
    videoUrl,
    summary,
    bias,
    timeframe,
    market,
    sentiment,
    risk,
    keyPoints,
  }),
}, images);
```

Expected:

- Publisher can ignore every new metadata field.
- Publisher can publish a video/chart note without writing a long article body.

- [x] **Step 5: Style optional metadata editor**

Modify `frontend/src/components/admin/OutlookEditor.module.css`:

- Add compact optional metadata section.
- Use existing form group style patterns.
- Keep fields readable on mobile.
- Avoid nested cards.

Expected:

- Editor remains practical, not heavy.
- Optional section is visually secondary.

- [x] **Step 6: Submit metadata from new/edit pages**

Modify:

- `frontend/src/app/admin/(dashboard)/outlook/new/page.tsx`
- `frontend/src/app/admin/(dashboard)/outlook/[id]/edit/page.tsx`

Payload target:

```ts
body: JSON.stringify({
  title: data.title,
  content_html: finalContent,
  category: 'outlook',
  status: data.status,
  outlook_metadata: data.outlook_metadata,
}),
```

Initial data target for edit:

```ts
initialData={{
  title: article.title || '',
  content_html: article.content_html,
  status: article.status,
  outlook_metadata: article.outlook_metadata ?? {},
}}
```

Expected:

- New article saves optional metadata.
- Edit article loads and preserves optional metadata.

- [x] **Step 7: Verify Task 2**

Run:

```bash
npm run test -- tests/unit/frontend/outlook.test.ts
npm run lint
npm run build:frontend
```

Expected:

- Outlook tests pass.
- Lint pass.
- Frontend build pass.

- [x] **Step 8: Commit Task 2**

Run:

```bash
git add frontend/src/app/api/articles/route.ts frontend/src/app/api/articles/[id]/route.ts frontend/src/components/admin/OutlookEditor.tsx frontend/src/components/admin/OutlookEditor.module.css 'frontend/src/app/admin/(dashboard)/outlook/new/page.tsx' 'frontend/src/app/admin/(dashboard)/outlook/[id]/edit/page.tsx' tests/unit/frontend/outlook.test.ts
git commit -m "Add optional Outlook publisher metadata"
```

- [x] **Checklist selesai Task 2**

Centang setelah build pass dan commit dibuat.

---

## Task 3: Mixed Content Listing Feed

**Files:**
- Modify: `frontend/src/app/outlook/page.tsx`
- Modify: `frontend/src/app/outlook/page.module.css`
- Modify: `frontend/src/components/outlook/OutlookCard.tsx`
- Modify: `frontend/src/components/outlook/OutlookCard.module.css`
- Create: `frontend/src/components/outlook/OutlookSnapshot.tsx`
- Create: `frontend/src/components/outlook/OutlookSnapshot.module.css`
- Modify: `frontend/src/components/outlook/index.ts`
- Test: `tests/unit/frontend/outlook.test.ts`

- [x] **Step 1: Add failing tests for listing card model**

Add pure tests to `tests/unit/frontend/outlook.test.ts`:

```ts
const card = buildOutlookCardModel({
  id: '1',
  title: 'XAUUSD retest demand',
  content_html: '<p>Wait candle confirmation.</p>',
  slug: 'xauusd-retest-demand',
  created_at: '2026-05-17T09:00:00.000Z',
  author_name: 'trader',
  outlook_metadata: { contentType: 'chart', bias: 'Watch', market: 'XAUUSD' },
  media: [{ id: 'm1', file_url: '/chart.png', media_type: 'image' }],
});

expect(card.kind).toBe('chart');
expect(card.mediaPreview?.type).toBe('image');
expect(card.summary).toBe('Wait candle confirmation.');
expect(card.snapshot).toEqual([
  { label: 'Bias', value: 'Watch' },
  { label: 'Market', value: 'XAUUSD' },
]);
```

Run:

```bash
npm run test -- tests/unit/frontend/outlook.test.ts
```

Expected:

- FAIL until `buildOutlookCardModel` exists.

- [x] **Step 2: Extend listing query**

Modify `frontend/src/app/outlook/page.tsx`:

- Select `a.outlook_metadata`.
- Select author username as current `author_name`.
- Select first image and first video media.
- Return `media` array to `OutlookCard`.

Query target:

```sql
SELECT a.id, a.title, a.content_html, a.slug, a.created_at, a.outlook_metadata,
       u.username AS author_name,
       (SELECT m.file_url FROM media m WHERE m.article_id = a.id AND m.media_type = 'image' ORDER BY m.created_at ASC LIMIT 1) AS cover_image,
       (SELECT m.file_url FROM media m WHERE m.article_id = a.id AND m.media_type = 'video' ORDER BY m.created_at ASC LIMIT 1) AS video_media
FROM articles a
LEFT JOIN users u ON a.author_id = u.id
WHERE a.status = $1 AND a.category = $2
ORDER BY a.created_at DESC
```

Expected:

- Old rows without metadata still render.
- Video media is available to card inference.

- [x] **Step 3: Build card model helper**

Extend `frontend/src/lib/outlookContent.ts` with `buildOutlookCardModel`.

Model target:

```ts
export interface OutlookCardModel {
  kind: OutlookContentKind;
  title: string;
  summary: string;
  authorHandle: string;
  snapshot: OutlookSnapshotItem[];
  mediaPreview: null | { type: 'image' | 'video' | 'external-video'; url: string };
}
```

Expected:

- `title` falls back to summary or `Outlook`.
- `authorHandle` starts with `@` when author exists.
- `mediaPreview` is null for text-only long reads.

- [x] **Step 4: Render mixed content OutlookCard**

Modify `frontend/src/components/outlook/OutlookCard.tsx`:

- Use `buildOutlookCardModel`.
- Render badges:
  - `Video Outlook`
  - `Long Read`
  - `Chart Note`
- For video card, show video preview surface and omit duration text when no duration exists.
- For chart card, show image uncropped.
- For article card with no media, render text-first preview, not fake thumbnail.
- Render snapshot chips only when available.

Expected:

- Feed supports all three content types.
- No broken empty metadata labels.

- [x] **Step 5: Add reusable OutlookSnapshot component**

Create `frontend/src/components/outlook/OutlookSnapshot.tsx`:

```tsx
import styles from './OutlookSnapshot.module.css';
import type { OutlookSnapshotItem } from '@/lib/outlookContent';

export function OutlookSnapshot({
  items,
  variant = 'chips',
}: {
  items: OutlookSnapshotItem[];
  variant?: 'chips' | 'panel';
}) {
  if (items.length === 0) return null;
  return (
    <dl className={variant === 'panel' ? styles.panel : styles.chips}>
      {items.map((item) => (
        <div key={item.label} className={styles.item}>
          <dt>{item.label}</dt>
          <dd>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
```

Expected:

- Cards and detail reuse the same snapshot rendering.

- [x] **Step 6: Style listing feed**

Modify:

- `frontend/src/app/outlook/page.module.css`
- `frontend/src/components/outlook/OutlookCard.module.css`
- `frontend/src/components/outlook/OutlookSnapshot.module.css`

Style contract:

- Desktop card uses two-column media/body only when media exists.
- Text-only long read remains compact.
- Mobile uses one column.
- Image/chart uses `object-fit: contain` or natural ratio to avoid crop.
- Video/chart media preview can be larger on mobile.
- Text stays within containers at 320px.

Expected:

- Desktop matches approved mixed content feed direction.
- Mobile remains one-column and uses existing HERTZ shell/footer.

- [ ] **Step 7: Verify Task 3**

Run:

```bash
npm run test -- tests/unit/frontend/outlook.test.ts
npm run lint
npm run build:frontend
REVIEW_BASE_URL=https://hertz.cloudnexify.com npm run review:visual
```

Expected:

- Tests pass.
- Lint pass.
- Build pass.
- Visual review runs; if screenshots differ because Outlook intentionally changed, inspect differences before updating baselines.

Actual:

- Unit tests, lint, and frontend build passed.
- Visual review was run against live and failed because existing screenshot baselines drift across Hertz, Outlook, Blog, and Tools. Outlook changed intentionally; unrelated non-Outlook baselines also fail. Snapshots were not updated automatically.

- [x] **Step 8: Commit Task 3**

Run:

```bash
git add frontend/src/app/outlook/page.tsx frontend/src/app/outlook/page.module.css frontend/src/components/outlook/OutlookCard.tsx frontend/src/components/outlook/OutlookCard.module.css frontend/src/components/outlook/OutlookSnapshot.tsx frontend/src/components/outlook/OutlookSnapshot.module.css frontend/src/components/outlook/index.ts frontend/src/lib/outlookContent.ts tests/unit/frontend/outlook.test.ts
git commit -m "Refresh Outlook mixed content feed"
```

- [ ] **Checklist selesai Task 3**

Centang setelah verification pass dan commit dibuat.

---

## Task 4: Adaptive Outlook Detail Page

**Files:**
- Modify: `frontend/src/app/outlook/[slug]/page.tsx`
- Modify: `frontend/src/app/outlook/[slug]/page.module.css`
- Modify: `frontend/src/components/outlook/OutlookContent.tsx`
- Modify: `frontend/src/components/outlook/OutlookContent.module.css`
- Modify: `frontend/src/lib/outlookContent.ts`
- Test: `tests/unit/frontend/outlook.test.ts`

- [x] **Step 1: Add failing tests for detail model**

Add tests to `tests/unit/frontend/outlook.test.ts`:

```ts
const detail = buildOutlookDetailModel({
  title: 'NASDAQ session prep',
  content_html: '',
  author_name: 'horizon',
  outlook_metadata: {
    contentType: 'video',
    videoUrl: 'https://example.com/session.mp4',
    summary: 'Watch liquidity above previous high.',
    bias: 'Neutral Bullish',
  },
  media: [],
});

expect(detail.kind).toBe('video');
expect(detail.primaryMedia).toEqual({ type: 'external-video', url: 'https://example.com/session.mp4' });
expect(detail.hasBody).toBe(false);
expect(detail.snapshot).toEqual([{ label: 'Bias', value: 'Neutral Bullish' }]);
```

Run:

```bash
npm run test -- tests/unit/frontend/outlook.test.ts
```

Expected:

- FAIL until detail model helper exists.

- [x] **Step 2: Extend detail query and type**

Modify `frontend/src/app/outlook/[slug]/page.tsx`:

- Select `a.outlook_metadata`.
- Include metadata in `OutlookDetail`.
- Pass all media to detail model.

Expected:

- Existing published Outlook detail pages still load.

- [x] **Step 3: Add detail model helper**

Extend `frontend/src/lib/outlookContent.ts` with `buildOutlookDetailModel`.

Model target:

```ts
export interface OutlookDetailModel {
  kind: OutlookContentKind;
  title: string;
  summary: string;
  snapshot: OutlookSnapshotItem[];
  keyPoints: string[];
  primaryMedia: null | { type: 'image' | 'video' | 'external-video'; url: string };
  galleryMedia: OutlookMediaInput[];
  hasBody: boolean;
}
```

Expected:

- Video detail chooses external video URL before uploaded video.
- Chart detail chooses first image as primary media.
- Long read can have no primary media.
- `hasBody` is false for empty HTML after stripping tags.

- [x] **Step 4: Render adaptive detail layout**

Modify `frontend/src/app/outlook/[slug]/page.tsx`:

- For video:
  - primary video/embed surface above snapshot.
  - summary/caption below title.
  - body only when `hasBody`.
- For chart:
  - primary image large and uncropped.
  - caption/summary and snapshot.
  - body only when `hasBody`.
- For article:
  - title, meta, snapshot, body.
  - no fake media block.

Expected:

- Detail page supports video-only and chart-caption-only entries.
- Empty body does not show blank article content.

- [x] **Step 5: Make OutlookContent empty-safe**

Modify `frontend/src/components/outlook/OutlookContent.tsx`:

```tsx
export function OutlookContent({ html }: OutlookContentProps) {
  if (!html.replace(/<[^>]*>/g, '').trim()) return null;
  return (
    <div
      className={styles.content}
      dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }}
    />
  );
}
```

Expected:

- Empty Outlook body renders nothing.
- Sanitization remains in place.

- [x] **Step 6: Style detail page**

Modify:

- `frontend/src/app/outlook/[slug]/page.module.css`
- `frontend/src/components/outlook/OutlookContent.module.css`

Style contract:

- `coverImage`/primary chart uses `height: auto`, `object-fit: contain`, and no fixed crop.
- Video uses responsive 16:9 container.
- Snapshot panel is readable but secondary.
- Mobile text fits at 320px.
- Interactions and stats remain accessible.

Expected:

- Detail page matches approved Snapshot + Story direction.

- [ ] **Step 7: Verify Task 4**

Run:

```bash
npm run test -- tests/unit/frontend/outlook.test.ts
npm run lint
npm run build:frontend
REVIEW_BASE_URL=https://hertz.cloudnexify.com npm run review:visual
REVIEW_BASE_URL=https://hertz.cloudnexify.com npm run review:a11y
```

Expected:

- Tests pass.
- Lint pass.
- Build pass.
- Visual and accessibility review run.

Actual:

- Unit tests, lint, and frontend build passed.
- Accessibility review against live passed after deploy: 35/35.
- Visual review against live failed because existing screenshot baselines drift across Hertz, Outlook, Blog, and Tools. Snapshots were not updated automatically.

- [x] **Step 8: Commit Task 4**

Run:

```bash
git add frontend/src/app/outlook/[slug]/page.tsx frontend/src/app/outlook/[slug]/page.module.css frontend/src/components/outlook/OutlookContent.tsx frontend/src/components/outlook/OutlookContent.module.css frontend/src/lib/outlookContent.ts tests/unit/frontend/outlook.test.ts
git commit -m "Add adaptive Outlook detail layout"
```

- [ ] **Checklist selesai Task 4**

Centang setelah verification pass dan commit dibuat.

---

## Task 5: Mobile API Metadata Compatibility

**Files:**
- Modify: `frontend/src/lib/mobileContent.ts`
- Modify: `frontend/src/app/api/mobile/v1/outlook/route.ts`
- Modify: `frontend/src/app/api/mobile/v1/outlook/[slug]/route.ts`
- Test: `tests/unit/frontend/mobileRoutes.test.ts`
- Test: `tests/unit/frontend/outlook.test.ts`

- [x] **Step 1: Check existing mobile route tests**

Run:

```bash
sed -n '1,220p' tests/unit/frontend/mobileRoutes.test.ts
```

Expected:

- Identify whether Outlook mobile payload tests already exist.
- If no Outlook-specific mobile test exists, add one focused on payload shape only.

- [x] **Step 2: Add/update mobile payload expectation**

Target mobile article shape:

```ts
{
  id: '...',
  title: '...',
  slug: '...',
  category: 'outlook',
  excerpt: '...',
  outlook: {
    kind: 'video',
    summary: '...',
    snapshot: [{ label: 'Bias', value: 'Neutral Bullish' }],
    keyPoints: ['...']
  }
}
```

Run:

```bash
npm run test -- tests/unit/frontend/mobileRoutes.test.ts
```

Expected:

- FAIL until `mobileContent` includes Outlook metadata.

- [x] **Step 3: Include metadata in mobileContent queries**

Modify `frontend/src/lib/mobileContent.ts`:

- Add `outlook_metadata` to `ArticleRow`.
- Select `a.outlook_metadata`.
- When `row.category === 'outlook'`, add an `outlook` object using `normalizeOutlookMetadata`, `inferOutlookContentKind`, `buildOutlookSnapshot`, and `getOutlookSummary`.
- Keep non-Outlook blog responses unchanged except for no breaking field removal.

Expected:

- Existing mobile API consumers still receive existing fields.
- Outlook mobile consumers can render mixed content metadata.

- [x] **Step 4: Verify Task 5**

Run:

```bash
npm run test -- tests/unit/frontend/mobileRoutes.test.ts
npm run test -- tests/unit/frontend/outlook.test.ts
npm run lint
npm run build:frontend
```

Expected:

- Mobile route tests pass.
- Outlook tests pass.
- Lint pass.
- Build pass.

- [x] **Step 5: Commit Task 5**

Run:

```bash
git add frontend/src/lib/mobileContent.ts frontend/src/app/api/mobile/v1/outlook/route.ts frontend/src/app/api/mobile/v1/outlook/[slug]/route.ts tests/unit/frontend/mobileRoutes.test.ts tests/unit/frontend/outlook.test.ts
git commit -m "Expose Outlook metadata to mobile API"
```

- [x] **Checklist selesai Task 5**

Centang setelah verification pass dan commit dibuat.

---

## Final Verification And Deploy Prep

**Files:**
- Review: all files changed by Tasks 1-5.
- Do not stage: unrelated pre-existing dirty files.

- [ ] **Step 1: Run full relevant verification**

Run:

```bash
npm run test -- tests/unit/frontend/outlook.test.ts
npm run test -- tests/unit/frontend/mobileRoutes.test.ts
npm run lint
npm run build:frontend
REVIEW_BASE_URL=https://hertz.cloudnexify.com npm run review:visual
REVIEW_BASE_URL=https://hertz.cloudnexify.com npm run review:a11y
```

Expected:

- Unit tests pass.
- Lint pass.
- Frontend build pass.
- Visual/a11y review commands complete.

Actual:

- `npm run test -- tests/unit/frontend/outlook.test.ts` passed.
- `npm run test -- tests/unit/frontend/mobileRoutes.test.ts` passed.
- `npm run lint` passed.
- `npm run build:frontend` passed.
- `REVIEW_BASE_URL=https://hertz.cloudnexify.com npm run review:a11y` passed: 35/35.
- `REVIEW_BASE_URL=https://hertz.cloudnexify.com npm run review:visual` ran and failed: 11 passed, 24 failed due screenshot baseline drift across Hertz, Outlook, Blog, and Tools. Snapshots were not updated.

- [x] **Step 2: Check changed files**

Run:

```bash
git status --short
git log --oneline -6
```

Expected:

- Outlook task commits are visible.
- Unrelated `.env.example`, `docker-compose.yml`, `.superpowers/`, and `docs/teswebimg/` remain unstaged unless explicitly requested.

Actual:

- Outlook task commits are visible through `e8a4b9a`.
- Unrelated `.env.example`, `docker-compose.yml`, `.superpowers/`, and `docs/teswebimg/` remain unstaged.

- [x] **Step 3: Deploy after verification**

Run only after checks pass:

```bash
docker compose up -d --build frontend
```

Expected:

- Frontend container rebuilds and starts.
- User can verify the live web environment.

Actual:

- `docker compose up -d --build frontend` completed.
- `horizon-frontend` is healthy.
- `/outlook` returned HTTP 200.
- `/api/mobile/v1/outlook?limit=1` returned HTTP 200.

- [ ] **Step 4: Manual live cases for user testing**

Ask the user to verify:

- `/outlook` desktop shows mixed content feed.
- `/outlook` mobile uses HERTZ bottom nav.
- Video Outlook entry can be understood without long body.
- Long Read entry works without media.
- Chart Note image is not cropped.
- Empty optional metadata does not create blank labels.
- Detail page adapts correctly for video/article/chart.

- [ ] **Step 5: Final commit if verification artifacts are intentionally updated**

If visual snapshots are intentionally updated, commit them separately:

```bash
git add tests/review/visual.spec.ts-snapshots
git commit -m "Update Outlook review snapshots"
```

Expected:

- Snapshot commit only includes intentional visual baseline updates.

- [ ] **Checklist selesai Final Verification**

Centang setelah deploy prep selesai and live testing handoff jelas.
