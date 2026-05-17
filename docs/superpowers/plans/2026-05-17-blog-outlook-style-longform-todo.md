# Blog Outlook-Style Longform Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menyelaraskan UI/UX Blog WordPress dengan Outlook/HERTZ tanpa mengurangi karakter Blog sebagai artikel panjang.

**Architecture:** Pertahankan jalur import WordPress dan data `articles.source = 'wordpress'` apa adanya. Tambahkan helper display khusus Blog untuk membersihkan text WordPress pada title/excerpt/meta, ubah listing Blog menjadi card searah Outlook, dan ubah detail Blog menjadi long-form post shell yang memakai header/engagement Outlook-HERTZ tetapi tetap merender artikel penuh.

**Tech Stack:** Next.js 16 app router, React 19, TypeScript, CSS modules, PostgreSQL existing article/media tables, Vitest, Playwright screenshot CLI, existing `HertzAppShell`, existing Outlook/HERTZ components.

---

## Aturan Checklist

- Checkbox hanya boleh dicentang setelah pekerjaan pada baris itu benar-benar selesai.
- Checkbox task utama hanya boleh dicentang setelah semua step task, verifikasi, dan commit task selesai.
- Jika verifikasi gagal, jangan centang. Perbaiki dulu atau catat blocker.
- Setelah task selesai dan terverifikasi, langsung commit file relevan saja.
- Jangan stage perubahan lama yang bukan bagian task, terutama `.env.example`, `docker-compose.yml`, `.superpowers/`, dan screenshot di `docs/teswebimg/` kecuali user meminta.
- Jangan menjalankan dev server di VPS. Gunakan test/build/check dan review terhadap web live.
- Sebelum edit kode Next.js, baca guide relevan di `node_modules/next/dist/docs/`.
- Artikel Blog harus tetap long-form penuh. Jangan memotong body artikel detail menjadi summary.
- Jangan mengubah kontrak import WordPress kecuali ada bug data yang langsung menghalangi tampilan.

## Source Of Truth

**Approved product contract:**

- Blog adalah hasil import WordPress.
- Detail Blog tetap artikel panjang seperti sekarang.
- Yang disamakan dengan Outlook adalah UI shell, card feel, header post, media handling, dan engagement pattern.
- Blog harus tetap memakai `HertzAppShell` dan mobile footer/bottom nav yang sama.
- Komentar/like tetap mengikuti aturan HERTZ: hanya member login yang bisa melakukan aksi.
- Text display dari WordPress harus bersih dari entity seperti `&#8211;`, `&amp;`, dan `&nbsp;` pada title, excerpt, meta, dan card.

## File Map

**Create:**

- `frontend/src/lib/blogContent.ts` — pure helpers untuk display text Blog: strip HTML, decode entity umum WordPress, excerpt, title fallback, author handle.
- `frontend/src/components/blog/BlogContent.tsx` — renderer long-form Blog yang tetap sanitize HTML tetapi memakai typography Blog/HERTZ.
- `frontend/src/components/blog/BlogContent.module.css` — long-form typography, table, image, iframe, blockquote, dan mobile readability.
- `tests/unit/frontend/blogContent.test.ts` — unit tests helper display Blog.
- `tests/unit/frontend/blogUiContract.test.ts` — static contract tests untuk memastikan Blog detail memakai Outlook/HERTZ engagement dan tidak kembali ke komponen artikel lama.

**Modify:**

- `frontend/src/components/blog/BlogCard.tsx` — ubah card ke struktur visual searah `OutlookCard`, pakai helper Blog.
- `frontend/src/components/blog/BlogCard.module.css` — card Blog menjadi feed card Outlook-like, media preview tidak crop, text-only state bersih.
- `frontend/src/components/blog/index.ts` — export `BlogContent` jika diperlukan.
- `frontend/src/app/blog/page.tsx` — tetap pagination/search, copy dan list wrapper diselaraskan dengan Outlook.
- `frontend/src/app/blog/page.module.css` — spacing/list/search agar konsisten dengan Outlook/HERTZ.
- `frontend/src/app/blog/[slug]/page.tsx` — ganti detail layout lama menjadi long-form post shell; gunakan `BlogContent` dan `OutlookEngagement`.
- `frontend/src/app/blog/[slug]/page.module.css` — adaptasi shell detail Outlook untuk Blog long-form.
- `frontend/src/components/outlook/OutlookEngagement.tsx` — tambah prop label agar pesan tidak hard-coded "Outlook" ketika dipakai Blog.
- `frontend/src/components/outlook/OutlookEngagement.module.css` — hanya jika perlu untuk reuse Blog; jangan pecah visual yang sudah benar di Outlook.

**Do Not Modify Unless Required:**

- `shared/services/wordpressImport.ts` — import tetap source of truth WordPress.
- `frontend/src/app/api/wordpress-import/*` — tidak termasuk scope UI Blog.
- `frontend/src/app/artikel/[slug]/page.tsx` — page artikel umum tidak ikut diubah.

---

## Baseline Review Before Implementation

**Files:**

- Read: `node_modules/next/dist/docs/01-app/index.md`
- Read: `node_modules/next/dist/docs/01-app/02-guides/json-ld.md`
- Read: `frontend/src/app/blog/page.tsx`
- Read: `frontend/src/app/blog/[slug]/page.tsx`
- Read: `frontend/src/app/outlook/[slug]/page.tsx`
- Read: `frontend/src/components/outlook/OutlookEngagement.tsx`
- Read: `shared/services/wordpressImport.ts`

- [ ] **Step 1: Read installed Next.js docs before code edits**

Run:

```bash
sed -n '1,220p' node_modules/next/dist/docs/01-app/index.md
sed -n '1,220p' node_modules/next/dist/docs/01-app/02-guides/json-ld.md
```

Expected:

- Confirm app router conventions and JSON-LD script pattern against installed Next.js version.

- [ ] **Step 2: Capture current git status**

Run:

```bash
git status --short
```

Expected:

- Existing unrelated dirty files remain visible.
- Do not stage `.env.example`, `docker-compose.yml`, `.superpowers/`, or `docs/teswebimg/`.

- [ ] **Step 3: Capture current live visual baseline**

Run:

```bash
npx playwright screenshot --full-page --viewport-size=390,900 https://horizon.cloudnexify.com/blog /tmp/blog-before-mobile.png
npx playwright screenshot --full-page --viewport-size=390,900 https://horizon.cloudnexify.com/blog/cpi-as-maret-2026 /tmp/blog-detail-before-mobile.png
```

Expected:

- Screenshots show the current Blog list and long-form detail before implementation.
- Screenshots are stored under `/tmp`, not committed.

- [ ] **Checklist selesai Baseline Review**

Centang setelah semua context read selesai.

---

## Task 1: Blog Display Helpers

**Files:**

- Create: `frontend/src/lib/blogContent.ts`
- Create: `tests/unit/frontend/blogContent.test.ts`

- [ ] **Step 1: Write failing tests for WordPress display cleanup**

Create `tests/unit/frontend/blogContent.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  buildBlogAuthorHandle,
  buildBlogDisplayTitle,
  decodeWordPressDisplayText,
  getBlogExcerpt,
  stripBlogHtml,
} from '../../../frontend/src/lib/blogContent';

describe('blogContent display helpers', () => {
  it('decodes common WordPress entities for display text', () => {
    expect(decodeWordPressDisplayText('Horizon Fx Indonesia &#8211; CPI &amp; NFP&nbsp;Update'))
      .toBe('Horizon Fx Indonesia - CPI & NFP Update');
  });

  it('strips tags and normalizes whitespace', () => {
    expect(stripBlogHtml('<p>Market&nbsp;<strong>update</strong></p><p>Next line</p>'))
      .toBe('Market update Next line');
  });

  it('builds clean excerpts without HTML entities', () => {
    const html = '<p>Horizon Fx Indonesia &#8211; pasar bergerak '.repeat(20);
    const excerpt = getBlogExcerpt(html, 80);
    expect(excerpt).toMatch(/Horizon Fx Indonesia - pasar bergerak/);
    expect(excerpt).toMatch(/\.\.\.$/);
    expect(excerpt).not.toContain('&#8211;');
  });

  it('uses clean title before falling back to body excerpt', () => {
    expect(buildBlogDisplayTitle('Oil &amp; Gold Update', '<p>Fallback</p>'))
      .toBe('Oil & Gold Update');
    expect(buildBlogDisplayTitle(null, '<p>Fallback &#8220;Title&#8221; Body</p>'))
      .toBe('Fallback "Title" Body');
  });

  it('builds a public author handle', () => {
    expect(buildBlogAuthorHandle('admin')).toBe('@admin');
    expect(buildBlogAuthorHandle('@editor')).toBe('@editor');
    expect(buildBlogAuthorHandle(null)).toBe('@horizon');
  });
});
```

Run:

```bash
npm run test -- tests/unit/frontend/blogContent.test.ts
```

Expected:

- FAIL because `frontend/src/lib/blogContent.ts` does not exist yet.

- [ ] **Step 2: Implement pure Blog display helper**

Create `frontend/src/lib/blogContent.ts`:

```ts
const entityMap: Record<string, string> = {
  amp: '&',
  nbsp: ' ',
  quot: '"',
  apos: "'",
  '#039': "'",
  '#8211': '-',
  '#8212': '-',
  '#8216': "'",
  '#8217': "'",
  '#8220': '"',
  '#8221': '"',
  '#8230': '...',
};

export function decodeWordPressDisplayText(value: string | null | undefined): string {
  return String(value ?? '')
    .replace(/&([a-zA-Z]+|#[0-9]+);/g, (match, entity: string) => entityMap[entity] ?? match)
    .replace(/\s+/g, ' ')
    .trim();
}

export function stripBlogHtml(html: string | null | undefined): string {
  return decodeWordPressDisplayText(String(html ?? '').replace(/<[^>]*>/g, ' '));
}

export function getBlogExcerpt(html: string | null | undefined, maxLength = 200): string {
  const text = stripBlogHtml(html);
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trimEnd()}...`;
}

export function buildBlogDisplayTitle(title: string | null | undefined, contentHtml: string): string {
  const cleanTitle = decodeWordPressDisplayText(title);
  if (cleanTitle) return cleanTitle;
  return getBlogExcerpt(contentHtml, 80);
}

export function buildBlogAuthorHandle(authorName: string | null | undefined): string {
  const clean = decodeWordPressDisplayText(authorName);
  if (!clean) return '@horizon';
  return clean.startsWith('@') ? clean : `@${clean}`;
}
```

- [ ] **Step 3: Verify helper tests pass**

Run:

```bash
npm run test -- tests/unit/frontend/blogContent.test.ts
```

Expected:

- PASS.

- [ ] **Step 4: Commit Task 1**

Run:

```bash
git add frontend/src/lib/blogContent.ts tests/unit/frontend/blogContent.test.ts
git commit -m "Add Blog display text helpers"
```

Expected:

- Commit contains only helper and tests.

- [ ] **Checklist selesai Task 1**

---

## Task 2: Outlook-Like Blog Listing Cards

**Files:**

- Modify: `frontend/src/components/blog/BlogCard.tsx`
- Modify: `frontend/src/components/blog/BlogCard.module.css`
- Modify: `frontend/src/app/blog/page.module.css`

- [ ] **Step 1: Update BlogCard to use clean display model**

Modify `frontend/src/components/blog/BlogCard.tsx` so it imports the helper:

```ts
import {
  buildBlogAuthorHandle,
  buildBlogDisplayTitle,
  getBlogExcerpt,
} from '@/lib/blogContent';
```

Use these values:

```ts
const excerpt = getBlogExcerpt(article.content_html);
const displayTitle = buildBlogDisplayTitle(article.title, article.content_html);
const authorHandle = buildBlogAuthorHandle(article.author_name);
const href = `/blog/${article.slug}`;
```

Update markup to match Outlook-like card structure:

```tsx
<ClickableArticle className={`${styles.card} ${article.cover_image ? styles.withMedia : styles.textOnly}`} href={href}>
  {article.cover_image ? (
    <div className={styles.mediaPreview}>
      <img src={article.cover_image} alt={displayTitle} className={styles.previewImage} loading="lazy" />
    </div>
  ) : null}

  <div className={styles.body}>
    <div className={styles.meta}>
      <span className={styles.badge}>Blog</span>
      <time className={styles.date} dateTime={article.created_at}>{formatDate(article.created_at)}</time>
    </div>

    <h3 className={styles.title}>
      <Link href={href} className={styles.titleLink}>{displayTitle}</Link>
    </h3>

    {excerpt ? <p className={styles.excerpt}>{excerpt}</p> : null}

    <div className={styles.footer}>
      <span className={styles.author}>{authorHandle}</span>
      <span className={styles.readTime}>{readTime} menit baca</span>
    </div>
  </div>
</ClickableArticle>
```

Expected:

- Remove the fake thumbnail placeholder.
- No display text contains raw WordPress entity codes.
- Card still links to `/blog/[slug]`.

- [ ] **Step 2: Restyle Blog cards using Outlook card density**

Modify `frontend/src/components/blog/BlogCard.module.css` with these rules:

```css
.card {
  background: rgba(2, 12, 7, 0.82);
  border: 1px solid rgba(19, 210, 123, 0.26);
  border-radius: 8px;
  cursor: pointer;
  display: grid;
  gap: 0.9rem;
  min-width: 0;
  padding: 0.85rem;
}

.card:hover {
  background: rgba(5, 20, 12, 0.92);
  border-color: rgba(19, 210, 123, 0.5);
}

.withMedia {
  grid-template-columns: minmax(150px, 190px) minmax(0, 1fr);
}

.textOnly {
  grid-template-columns: 1fr;
}

.mediaPreview {
  background: rgba(4, 19, 12, 0.9);
  border: 1px solid rgba(19, 210, 123, 0.22);
  border-radius: 8px;
  display: grid;
  min-height: 124px;
  overflow: hidden;
  place-items: center;
}

.previewImage {
  display: block;
  height: 100%;
  max-height: 180px;
  object-fit: contain;
  width: 100%;
}
```

Keep compact meta/title/footer styles aligned with `frontend/src/components/outlook/OutlookCard.module.css`. For mobile `max-width: 640px`, set `.withMedia { grid-template-columns: 1fr; }` and `.mediaPreview { min-height: 190px; }`.

- [ ] **Step 3: Align Blog list copy and spacing**

Modify `frontend/src/app/blog/page.module.css`:

```css
.list {
  display: grid;
  gap: 0.85rem;
}

.list::before {
  color: #8ea897;
  content: "Artikel WordPress terbaru dari Horizon";
  font-size: 0.86rem;
}
```

Keep search and pagination, but ensure mobile buttons stay full-width as existing behavior.

- [ ] **Step 4: Verify build and visual baseline**

Run:

```bash
npm run lint
npm run build:frontend
```

Expected:

- Both commands pass.

- [ ] **Step 5: Commit Task 2**

Run:

```bash
git add frontend/src/components/blog/BlogCard.tsx frontend/src/components/blog/BlogCard.module.css frontend/src/app/blog/page.module.css
git commit -m "Align Blog listing cards with Outlook style"
```

Expected:

- Commit contains only Blog listing UI changes.

- [ ] **Checklist selesai Task 2**

---

## Task 3: Reusable Blog Long-Form Content

**Files:**

- Create: `frontend/src/components/blog/BlogContent.tsx`
- Create: `frontend/src/components/blog/BlogContent.module.css`
- Modify: `frontend/src/components/blog/index.ts`
- Create/Modify: `tests/unit/frontend/blogUiContract.test.ts`

- [ ] **Step 1: Create static contract test for Blog content renderer**

Create `tests/unit/frontend/blogUiContract.test.ts` with initial checks:

```ts
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const rootDir = resolve(__dirname, '../../..');

function read(relativePath: string) {
  return readFileSync(resolve(rootDir, relativePath), 'utf8');
}

describe('Blog UI contract', () => {
  it('ships a BlogContent renderer for long-form WordPress articles', () => {
    const source = read('frontend/src/components/blog/BlogContent.tsx');
    expect(source).toContain('sanitizeHtml');
    expect(source).toContain('dangerouslySetInnerHTML');
  });

  it('keeps Blog content images inspectable instead of cropped', () => {
    const css = read('frontend/src/components/blog/BlogContent.module.css');
    const imgRule = css.match(/\.content img \{(?<body>[^}]+)\}/)?.groups?.body ?? '';
    expect(imgRule).toContain('object-fit: contain');
    expect(imgRule).not.toContain('object-fit: cover');
  });
});
```

Run:

```bash
npm run test -- tests/unit/frontend/blogUiContract.test.ts
```

Expected:

- FAIL because `BlogContent.tsx` and CSS do not exist yet.

- [ ] **Step 2: Create BlogContent component**

Create `frontend/src/components/blog/BlogContent.tsx`:

```tsx
import { sanitizeHtml } from '@/lib/sanitize';
import styles from './BlogContent.module.css';

interface BlogContentProps {
  html: string;
}

export function BlogContent({ html }: BlogContentProps) {
  return (
    <div
      className={styles.content}
      dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }}
    />
  );
}
```

- [ ] **Step 3: Create long-form Blog typography CSS**

Create `frontend/src/components/blog/BlogContent.module.css` based on `OutlookContent.module.css`, with Blog-specific table/iframe support:

```css
.content {
  color: var(--color-text);
  font-size: var(--text-base);
  line-height: 1.78;
  overflow-wrap: break-word;
  word-wrap: break-word;
}

.content p {
  margin-bottom: var(--space-5);
}

.content a {
  color: var(--color-accent);
  text-decoration: underline;
  text-underline-offset: 2px;
}

.content img {
  border: var(--border-width) solid var(--color-border);
  border-radius: var(--border-radius);
  display: block;
  height: auto;
  margin: var(--space-5) 0;
  max-width: 100%;
  object-fit: contain;
  width: auto;
}

.content iframe,
.content embed,
.content object,
.content video {
  border: 0;
  display: block;
  max-width: 100%;
  width: 100%;
}

.content iframe,
.content video {
  aspect-ratio: 16 / 9;
}

.content table {
  border-collapse: collapse;
  display: block;
  max-width: 100%;
  overflow-x: auto;
  width: 100%;
}
```

Also include `blockquote`, `pre`, `ul`, `ol`, `h2`, `h3`, `h4`, and mobile rules from `OutlookContent.module.css`, keeping line-height comfortable for long articles.

- [ ] **Step 4: Export BlogContent**

Modify `frontend/src/components/blog/index.ts`:

```ts
export { BlogCard } from './BlogCard';
export type { BlogCardData } from './BlogCard';
export { BlogContent } from './BlogContent';
```

- [ ] **Step 5: Verify content tests pass**

Run:

```bash
npm run test -- tests/unit/frontend/blogUiContract.test.ts
```

Expected:

- PASS.

- [ ] **Step 6: Commit Task 3**

Run:

```bash
git add frontend/src/components/blog/BlogContent.tsx frontend/src/components/blog/BlogContent.module.css frontend/src/components/blog/index.ts tests/unit/frontend/blogUiContract.test.ts
git commit -m "Add long-form Blog content renderer"
```

Expected:

- Commit contains Blog content renderer and tests.

- [ ] **Checklist selesai Task 3**

---

## Task 4: Reuse Outlook/HERTZ Engagement For Blog

**Files:**

- Modify: `frontend/src/components/outlook/OutlookEngagement.tsx`
- Modify: `tests/unit/frontend/blogUiContract.test.ts`

- [ ] **Step 1: Extend contract test for generic engagement label**

Add to `tests/unit/frontend/blogUiContract.test.ts`:

```ts
it('allows OutlookEngagement to be reused by Blog without hard-coded Outlook action copy', () => {
  const source = read('frontend/src/components/outlook/OutlookEngagement.tsx');
  expect(source).toContain('contentLabel');
  expect(source).toContain("contentLabel = 'Outlook'");
  expect(source).toContain('Login Telegram member untuk menyukai');
});
```

Run:

```bash
npm run test -- tests/unit/frontend/blogUiContract.test.ts
```

Expected:

- FAIL before `OutlookEngagement` has `contentLabel`.

- [ ] **Step 2: Add optional contentLabel prop**

Modify `frontend/src/components/outlook/OutlookEngagement.tsx`:

```ts
interface OutlookEngagementProps {
  articleId: string;
  title: string;
  excerpt: string;
  url: string;
  initialLikeCount: number;
  initialCommentCount: number;
  currentUser: MemberSessionUser | null;
  contentLabel?: string;
}
```

In the component parameters:

```ts
contentLabel = 'Outlook',
```

Replace hard-coded user-facing action messages:

```ts
setMessage(`Login Telegram member untuk menyukai ${contentLabel}.`);
setMessage(`Login Telegram member untuk ikut berdiskusi di ${contentLabel}.`);
```

Do not change the default behavior for Outlook pages.

- [ ] **Step 3: Verify engagement contract test passes**

Run:

```bash
npm run test -- tests/unit/frontend/blogUiContract.test.ts
```

Expected:

- PASS.

- [ ] **Step 4: Commit Task 4**

Run:

```bash
git add frontend/src/components/outlook/OutlookEngagement.tsx tests/unit/frontend/blogUiContract.test.ts
git commit -m "Allow Outlook engagement reuse for Blog"
```

Expected:

- Commit contains only engagement reuse and contract test changes.

- [ ] **Checklist selesai Task 4**

---

## Task 5: Blog Detail Outlook-Style Longform Shell

**Files:**

- Modify: `frontend/src/app/blog/[slug]/page.tsx`
- Modify: `frontend/src/app/blog/[slug]/page.module.css`
- Modify: `tests/unit/frontend/blogUiContract.test.ts`

- [ ] **Step 1: Add failing static test for Blog detail contract**

Add to `tests/unit/frontend/blogUiContract.test.ts`:

```ts
it('uses Outlook-style engagement on Blog detail while preserving long-form content', () => {
  const source = read('frontend/src/app/blog/[slug]/page.tsx');
  expect(source).toContain('BlogContent');
  expect(source).toContain('OutlookEngagement');
  expect(source).toContain('contentLabel="Blog"');
  expect(source).not.toContain('ShareButtons');
  expect(source).not.toContain('CommentSection');
  expect(source).not.toContain('LikeButton');
});
```

Run:

```bash
npm run test -- tests/unit/frontend/blogUiContract.test.ts
```

Expected:

- FAIL before Blog detail is changed.

- [ ] **Step 2: Update Blog detail imports**

Modify `frontend/src/app/blog/[slug]/page.tsx` imports:

```ts
import { OutlookEngagement } from '@/components/outlook';
import { estimateReadTime, formatDate } from '@/components/article/ArticleMeta';
import { BlogContent } from '@/components/blog';
import { buildBlogAuthorHandle, buildBlogDisplayTitle, getBlogExcerpt } from '@/lib/blogContent';
```

Remove imports:

```ts
import { ArticleMeta } from '@/components/article/ArticleMeta';
import { ArticleContent } from '@/components/article/ArticleContent';
import { ShareButtons } from '@/components/article/ShareButtons';
import { CommentSection } from '@/components/article/CommentSection';
import { LikeButton } from '@/components/article/LikeButton';
```

- [ ] **Step 3: Use clean display fields and preserve full article body**

In `BlogDetailPage`, replace display field derivation with:

```ts
const displayTitle = buildBlogDisplayTitle(article.title, article.content_html);
const excerpt = getBlogExcerpt(article.content_html, 160);
const authorHandle = buildBlogAuthorHandle(article.author_name);
const authorInitial = (article.author_name?.trim().charAt(0) || 'H').toUpperCase();
const readTime = estimateReadTime(article.content_html);
```

For metadata description, use `getBlogExcerpt(article.content_html, 160)` instead of raw regex output.

- [ ] **Step 4: Replace article markup with Outlook-style post header**

Inside the existing `HertzAppShell`, structure the detail like:

```tsx
<div className={styles.content}>
  <Link href="/blog" className={styles.backLink}>Kembali ke Blog</Link>

  <article className={styles.article}>
    <header className={styles.postHeader}>
      <div className={styles.spineNode} aria-hidden="true"><span>B</span></div>
      <div className={styles.avatar} aria-hidden="true">{authorInitial}</div>
      <div className={styles.headerBody}>
        <div className={styles.authorLine}>
          <strong>{article.author_name || 'Horizon'}</strong>
          <span>{authorHandle}</span>
          <span>{formatDate(article.created_at)}</span>
        </div>
        <div className={styles.metaLine}>
          <span className={styles.kindBadge}>Blog</span>
          <span>{readTime} menit baca</span>
        </div>
      </div>
    </header>

    <h1 className={styles.title}>{displayTitle}</h1>

    {coverImage ? (
      <div className={styles.primaryMedia}>
        <img src={coverImage.file_url} alt={displayTitle} className={styles.primaryImage} />
      </div>
    ) : null}

    <BlogContent html={article.content_html} />
  </article>

  <OutlookEngagement
    articleId={article.id}
    title={displayTitle}
    excerpt={excerpt}
    url={blogUrl}
    initialLikeCount={article.likeCount}
    initialCommentCount={article.commentCount}
    currentUser={currentUser}
    contentLabel="Blog"
  />
</div>
```

Expected:

- Full `article.content_html` is still rendered.
- Old separate stats/share/comment/like blocks are removed.
- Engagement UI becomes the same pattern as Outlook.

- [ ] **Step 5: Replace Blog detail CSS with Outlook-like longform shell**

Modify `frontend/src/app/blog/[slug]/page.module.css` by adapting these classes from `frontend/src/app/outlook/[slug]/page.module.css`:

- `.content`
- `.backLink`
- `.article`
- `.postHeader`
- `.spineNode`
- `.avatar`
- `.headerBody`
- `.authorLine`
- `.metaLine`
- `.kindBadge`
- `.title`
- `.primaryMedia`
- `.primaryImage`

Keep Blog detail readable for long-form:

```css
.content {
  border-left: 1px solid rgba(75, 118, 92, 0.28);
  border-right: 1px solid rgba(75, 118, 92, 0.28);
  margin: 0 auto;
  max-width: 760px;
  min-height: 100vh;
  width: 100%;
}

.article {
  border-bottom: 1px solid rgba(75, 118, 92, 0.28);
  border-top: 1px solid rgba(75, 118, 92, 0.28);
  margin: 0;
  padding: 1.25rem;
}

.primaryImage {
  display: block;
  height: auto;
  object-fit: contain;
  width: 100%;
}
```

On `max-width: 420px`, follow Outlook behavior: hide `.avatar`, keep `.spineNode`, and reduce title size.

- [ ] **Step 6: Verify detail contract test passes**

Run:

```bash
npm run test -- tests/unit/frontend/blogUiContract.test.ts
```

Expected:

- PASS.

- [ ] **Step 7: Commit Task 5**

Run:

```bash
git add 'frontend/src/app/blog/[slug]/page.tsx' 'frontend/src/app/blog/[slug]/page.module.css' tests/unit/frontend/blogUiContract.test.ts
git commit -m "Match Blog detail to Outlook longform style"
```

Expected:

- Commit contains only Blog detail shell and contract test changes.

- [ ] **Checklist selesai Task 5**

---

## Task 6: Final Verification And Deployment

**Files:**

- No new files expected.
- Review all files touched by Tasks 1-5.

- [ ] **Step 1: Run focused tests**

Run:

```bash
npm run test -- tests/unit/frontend/blogContent.test.ts tests/unit/frontend/blogUiContract.test.ts
```

Expected:

- PASS.

- [ ] **Step 2: Run full lint and frontend build**

Run:

```bash
npm run lint
npm run build:frontend
```

Expected:

- PASS.

- [ ] **Step 3: Rebuild frontend container**

Run:

```bash
docker compose up -d --build frontend
docker compose ps frontend
```

Expected:

- `horizon-frontend` is `Up` and healthy.
- No dev server is started.

- [ ] **Step 4: Smoke test live Blog pages**

Run:

```bash
curl -s -o /tmp/blog-live.html -w "%{http_code}\n" https://horizon.cloudnexify.com/blog
curl -s -o /tmp/blog-detail-live.html -w "%{http_code}\n" https://horizon.cloudnexify.com/blog/cpi-as-maret-2026
```

Expected:

- Both commands output `200`.

- [ ] **Step 5: Capture mobile screenshots for user review**

Run:

```bash
npx playwright screenshot --full-page --viewport-size=390,900 https://horizon.cloudnexify.com/blog /tmp/blog-after-mobile.png
npx playwright screenshot --full-page --viewport-size=390,900 https://horizon.cloudnexify.com/blog/cpi-as-maret-2026 /tmp/blog-detail-after-mobile.png
```

Expected:

- Blog list visually resembles Outlook/HERTZ feed cards.
- Blog detail uses Outlook-style post header and engagement.
- Article body remains full long-form content.
- No raw entity codes appear in title/card excerpt.

- [ ] **Step 6: Final git status**

Run:

```bash
git status --short
```

Expected:

- Only unrelated pre-existing dirty files remain, if any.
- All Blog implementation commits exist.

- [ ] **Checklist selesai Final Verification**

---

## Self-Review

- Spec coverage: Plan covers Blog list, Blog detail, long-form preservation, WordPress display cleanup, HERTZ/Outlook engagement reuse, mobile consistency, and no WordPress import rewrite.
- Placeholder scan: No task relies on placeholder markers or unspecified implementation. Each task has exact file paths, commands, and expected outputs.
- Type consistency: `BlogContent`, `blogContent.ts`, `contentLabel`, and page import names are consistent across tasks.
- Scope check: This is a single public Blog UI refresh. Admin WordPress import and generic article pages remain out of scope.
