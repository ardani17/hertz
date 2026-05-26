# DM X-Like Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mengubah Direct Message HERTZ menjadi pengalaman inbox/thread yang menyerupai X/Twitter Messages sambil mempertahankan fungsi DM yang sudah ada.

**Architecture:** Gunakan API dan tabel DM existing tanpa migration baru. Perubahan ada di client UI `/hertz/messages`: tipe data client diperluas sesuai payload service existing, helper display kecil ditambahkan untuk avatar/timestamp/bubble side, lalu markup dan CSS diubah menjadi inbox/thread X-like untuk desktop dan mobile.

**Tech Stack:** Next.js 16 app router, React 19 client component, TypeScript, CSS modules, existing HERTZ DM APIs, Vitest, Playwright screenshot CLI, Docker Compose frontend rebuild.

---

## Aturan Checklist

- Checkbox hanya boleh dicentang setelah pekerjaan pada baris itu benar-benar selesai.
- Jangan mengubah fungsi inti DM: search member, start conversation, load inbox, load thread, polling, send, upload image, delete, report, archive, dan block harus tetap ada.
- Jangan membuat migration/schema baru untuk pass ini.
- Jangan menjalankan dev server di VPS. Pakai test, lint, build, rebuild container, dan screenshot live.
- Sebelum edit kode Next.js, baca guide relevan di `node_modules/next/dist/docs/`.
- Commit hanya file relevan. Jangan stage `.env.example`, `docker-compose.yml`, `.superpowers/`, atau screenshot `docs/teswebimg/`.

## Source Of Truth

**Approved product contract:**

- UI/UX DM menyerupai X/Twitter Messages.
- Boleh menambah detail kecil yang sudah tersedia dari data/API existing.
- Desktop: inbox kiri, thread kanan.
- Mobile: inbox fullscreen, thread fullscreen setelah conversation dipilih.
- Conversation row: avatar, nama, `@username`, preview pesan, timestamp, unread badge/dot.
- Thread: header avatar/nama/handle, overflow menu, empty state saat belum memilih conversation.
- Bubble: pesan current user di kanan, pesan peer di kiri, timestamp pesan terlihat.
- Composer: rounded chat input, attachment button, send button compact.
- Attachment preview sebelum kirim lebih visual.

## File Map

**Modify:**

- `frontend/src/app/hertz/messages/MessagesClient.tsx` — extend client types, add display helpers, update markup for X-like inbox/thread, use senderId/currentUser for bubble side.
- `frontend/src/app/hertz/messages/page.module.css` — update layout, conversation rows, thread header, bubbles, composer, attachment previews, mobile behavior.
- `tests/unit/frontend/hertzMessages.test.ts` — add helper tests for bubble side, initials, timestamps, and preview fallback.

---

## Baseline Review Before Implementation

**Files:**

- Read: `node_modules/next/dist/docs/01-app/index.md`
- Read: `frontend/src/app/hertz/messages/MessagesClient.tsx`
- Read: `frontend/src/app/hertz/messages/page.module.css`
- Read: `shared/services/hertzDmService.ts`
- Read: `shared/repositories/hertzDmRepository.ts`

- [ ] **Step 1: Confirm Next.js app router docs**

Run:

```bash
sed -n '1,220p' node_modules/next/dist/docs/01-app/index.md
```

Expected:

- Confirm this is a client component inside app router, and changes can stay inside existing route.

- [ ] **Step 2: Confirm DM payload supports requested details**

Run:

```bash
sed -n '1,180p' shared/services/hertzDmService.ts
sed -n '1,130p' shared/repositories/hertzDmRepository.ts
```

Expected:

- Thread payload contains `senderId`, `createdAt`, `sender.username`, `sender.avatarUrl`, and `canDelete`.
- Inbox payload contains `lastMessageAt`, `lastMessageBody`, `unreadCount`, and `peer`.

- [ ] **Step 3: Capture current dirty files**

Run:

```bash
git status --short
```

Expected:

- Existing unrelated dirty files remain visible and unstaged.

---

## Task 1: DM Display Helper Contract

**Files:**

- Modify: `tests/unit/frontend/hertzMessages.test.ts`
- Modify: `frontend/src/app/hertz/messages/MessagesClient.tsx`

- [ ] **Step 1: Add failing helper tests**

Add imports to `tests/unit/frontend/hertzMessages.test.ts`:

```ts
import {
  HERTZ_DM_POLL_INTERVAL_MS,
  getDmAccessState,
  getDmThreadMenuActions,
  canAddDmImages,
  getDmInitial,
  getDmMessageSide,
  getDmPreviewText,
  formatDmTimestamp,
} from '../../../frontend/src/app/hertz/messages/MessagesClient';
```

Add tests:

```ts
it('builds avatar initials from display names or username fallback', () => {
  expect(getDmInitial('Raka Macro', 'raka_macro')).toBe('R');
  expect(getDmInitial(null, 'raka_macro')).toBe('R');
  expect(getDmInitial(null, null)).toBe('H');
});

it('places current user messages on the right side', () => {
  expect(getDmMessageSide('member-1', 'member-1')).toBe('outgoing');
  expect(getDmMessageSide('member-2', 'member-1')).toBe('incoming');
});

it('builds concise inbox preview text', () => {
  expect(getDmPreviewText('Halo market update')).toBe('Halo market update');
  expect(getDmPreviewText(null)).toBe('Gambar');
  expect(getDmPreviewText('a'.repeat(90)).length).toBeLessThanOrEqual(73);
});

it('formats DM timestamps compactly', () => {
  expect(formatDmTimestamp('2026-05-17T08:30:00.000Z')).toMatch(/2026|08|15|Mei|May/);
  expect(formatDmTimestamp(null)).toBe('');
});
```

Run:

```bash
npm run test -- tests/unit/frontend/hertzMessages.test.ts
```

Expected:

- FAIL because helper exports do not exist yet.

- [ ] **Step 2: Implement helper exports**

Add to `frontend/src/app/hertz/messages/MessagesClient.tsx` near existing exported helpers:

```ts
export type DmMessageSide = 'incoming' | 'outgoing';

export function getDmInitial(displayName: string | null | undefined, username: string | null | undefined) {
  return (displayName?.trim().charAt(0) || username?.trim().charAt(0) || 'H').toUpperCase();
}

export function getDmMessageSide(senderId: string, currentUserId: string | null | undefined): DmMessageSide {
  return senderId === currentUserId ? 'outgoing' : 'incoming';
}

export function getDmPreviewText(body: string | null | undefined, maxLength = 70): string {
  const text = body?.trim() || 'Gambar';
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trimEnd()}...`;
}

export function formatDmTimestamp(value: string | null | undefined): string {
  if (!value) return '';
  return new Date(value).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
```

- [ ] **Step 3: Verify helper tests pass**

Run:

```bash
npm run test -- tests/unit/frontend/hertzMessages.test.ts
```

Expected:

- PASS.

---

## Task 2: X-Like Inbox And Thread Markup

**Files:**

- Modify: `frontend/src/app/hertz/messages/MessagesClient.tsx`

- [ ] **Step 1: Extend client interfaces**

Update `Conversation`:

```ts
interface Conversation {
  id: string;
  archivedAt?: string | null;
  lastReadAt?: string | null;
  lastMessageAt?: string | null;
  unreadCount: number;
  lastMessageBody: string | null;
  peer: { id: string; displayName: string; username: string | null; avatarUrl?: string | null; role?: string | null } | null;
}
```

Update `Message`:

```ts
interface Message {
  id: string;
  senderId: string;
  body: string | null;
  createdAt: string;
  sender: { id?: string; displayName: string; username?: string | null; avatarUrl?: string | null };
  attachments: Array<{ id: string; url: string; mimeType: string }>;
  canDelete?: boolean;
}
```

- [ ] **Step 2: Add filter labels**

Add:

```ts
const filterLabels = {
  inbox: 'All',
  unread: 'Unread',
  admin: 'Admin',
  archived: 'Archived',
} as const;
```

Use `filterLabels[item]` in filter buttons.

- [ ] **Step 3: Update inbox row markup**

Each conversation button should render:

```tsx
<span className={styles.itemAvatar} aria-hidden="true">
  {getDmInitial(item.peer?.displayName, item.peer?.username)}
</span>
<span className={styles.itemMain}>
  <span className={styles.itemTop}>
    <strong>{item.peer?.displayName ?? `Conversation ${item.id.slice(0, 8)}`}</strong>
    <time>{formatDmTimestamp(item.lastMessageAt)}</time>
  </span>
  <span className={styles.itemMeta}>
    {item.peer?.username ? `@${item.peer.username}` : 'HERTZ member'}
  </span>
  <span className={styles.itemPreview}>{getDmPreviewText(item.lastMessageBody)}</span>
</span>
{item.unreadCount > 0 ? <em>{item.unreadCount}</em> : null}
```

- [ ] **Step 4: Update thread header and empty state**

Thread header should include avatar and metadata:

```tsx
<div className={styles.threadPeerAvatar} aria-hidden="true">
  {getDmInitial(activeConversation?.peer?.displayName, activeConversation?.peer?.username)}
</div>
<div className={styles.threadPeer}>
  <strong>{activeConversation?.peer?.displayName ?? 'Pilih conversation'}</strong>
  <span>{activeConversation?.peer?.username ? `@${activeConversation.peer.username}` : 'HERTZ DM'}</span>
</div>
```

Inside `.messages`, render empty state when `!activeId`:

```tsx
{!activeId ? (
  <div className={styles.emptyThread}>
    <h2>Select a message</h2>
    <p>Pilih conversation atau cari member untuk mulai Direct Message.</p>
  </div>
) : messages.length === 0 ? (
  <div className={styles.emptyThread}>
    <h2>Belum ada pesan</h2>
    <p>Kirim pesan pertama ke conversation ini.</p>
  </div>
) : (
  messages.map(...)
)}
```

- [ ] **Step 5: Update message bubble markup**

For each message:

```tsx
const side = getDmMessageSide(item.senderId, currentUser?.id);
```

Render:

```tsx
<div className={`${styles.bubbleRow} ${side === 'outgoing' ? styles.outgoing : styles.incoming}`} key={item.id}>
  {side === 'incoming' ? <span className={styles.messageAvatar}>{getDmInitial(item.sender.displayName, item.sender.username)}</span> : null}
  <div className={styles.bubble}>
    <div className={styles.bubbleMeta}>
      <strong>{side === 'outgoing' ? 'Anda' : item.sender.displayName}</strong>
      <time>{formatDmTimestamp(item.createdAt)}</time>
    </div>
    <span>{item.body ?? 'Pesan dihapus'}</span>
    ...
  </div>
</div>
```

- [ ] **Step 6: Update composer copy**

Use placeholder:

```tsx
placeholder={activeId ? 'Start a new message' : 'Pilih conversation dulu'}
```

Keep existing send/upload handlers unchanged.

---

## Task 3: X-Like DM CSS

**Files:**

- Modify: `frontend/src/app/hertz/messages/page.module.css`

- [ ] **Step 1: Restyle desktop layout**

Set `.dmLayout`:

```css
.dmLayout {
  border: 1px solid rgba(75, 118, 92, 0.28);
  border-radius: 0;
  display: grid;
  grid-template-columns: minmax(300px, 380px) minmax(0, 1fr);
  min-height: calc(100vh - 8rem);
  overflow: hidden;
}
```

Make `.sidebar` and `.thread` look like X columns: no floating cards, clear borders, dark HERTZ background.

- [ ] **Step 2: Restyle conversation rows**

Add classes:

```css
.item {
  align-items: start;
  background: transparent;
  border: 0;
  border-bottom: 1px solid rgba(75, 118, 92, 0.22);
  border-radius: 0;
  display: grid;
  gap: 0.75rem;
  grid-template-columns: 44px minmax(0, 1fr) auto;
  padding: 0.85rem;
}

.itemAvatar,
.threadPeerAvatar,
.messageAvatar {
  align-items: center;
  background: #084729;
  border: 1px solid rgba(19, 210, 123, 0.45);
  border-radius: 999px;
  color: #a7f3d0;
  display: inline-flex;
  font-weight: 900;
  justify-content: center;
}
```

- [ ] **Step 3: Restyle message bubbles**

Add:

```css
.bubbleRow {
  align-items: end;
  display: flex;
  gap: 0.55rem;
}

.incoming {
  justify-content: flex-start;
}

.outgoing {
  justify-content: flex-end;
}

.bubble {
  max-width: min(78%, 620px);
}

.outgoing .bubble {
  background: #13d27b;
  border-color: #13d27b;
  color: #02100a;
}

.incoming .bubble {
  background: rgba(2, 12, 7, 0.86);
}
```

- [ ] **Step 4: Restyle composer and pending attachments**

Composer should be sticky-looking at bottom of thread:

```css
.composer {
  align-items: end;
  background: rgba(15, 15, 20, 0.92);
  border-top: 1px solid rgba(75, 118, 92, 0.28);
  display: grid;
  gap: 0.6rem;
  grid-template-columns: auto minmax(0, 1fr) auto;
  margin: 0 -1rem -1rem;
  padding: 0.8rem 1rem 1rem;
}
```

Attachment images should use `object-fit: contain`, not crop.

- [ ] **Step 5: Preserve mobile fullscreen flow**

Keep existing `.threadOpen` behavior:

```css
.dmLayout:not(.threadOpen) .thread { display: none; }
.dmLayout.threadOpen .sidebar { display: none; }
```

Update mobile header and composer so nothing overlaps bottom nav.

---

## Task 4: Verification, Deploy, And Commit

**Files:**

- Modify: `frontend/src/app/hertz/messages/MessagesClient.tsx`
- Modify: `frontend/src/app/hertz/messages/page.module.css`
- Modify: `tests/unit/frontend/hertzMessages.test.ts`

- [ ] **Step 1: Run focused test**

Run:

```bash
npm run test -- tests/unit/frontend/hertzMessages.test.ts
```

Expected:

- PASS.

- [ ] **Step 2: Run lint and build**

Run:

```bash
npm run lint
npm run build:frontend
```

Expected:

- PASS.

- [ ] **Step 3: Rebuild frontend**

Run:

```bash
docker compose up -d --build frontend
docker compose ps frontend
```

Expected:

- Frontend container is healthy.

- [ ] **Step 4: Live smoke and screenshot**

Run:

```bash
curl -s -o /tmp/dm-live.html -w "%{http_code}\n" https://hertz.cloudnexify.com/hertz/messages
npx playwright screenshot --full-page --viewport-size=390,900 https://hertz.cloudnexify.com/hertz/messages /tmp/dm-x-like-mobile.png
```

Expected:

- HTTP status is `200`.
- Guest view or member view renders without layout break.

- [ ] **Step 5: Commit**

Run:

```bash
git add frontend/src/app/hertz/messages/MessagesClient.tsx frontend/src/app/hertz/messages/page.module.css tests/unit/frontend/hertzMessages.test.ts
git commit -m "Refresh HERTZ direct messages UI"
```

Expected:

- Commit contains only DM UI/test files.

## Self-Review

- Spec coverage: The plan covers X-like desktop/mobile layout, conversation rows, thread header, bubble side, timestamps, composer, attachment preview, and empty state.
- Scope check: No schema/API changes are required because current DM service already returns the needed fields.
- Placeholder scan: This plan contains exact files, commands, expected outputs, and code snippets for each behavioral change.
