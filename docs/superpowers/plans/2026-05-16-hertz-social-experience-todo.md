# HERTZ Social Experience Todo Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mengimplementasikan HERTZ agar terasa seperti Twitter/X untuk komunitas trading, dengan feed sosial, profile activity, DM, search, share, repost, dan responsive behavior yang terverifikasi.

**Architecture:** Eksekusi dilakukan satu fase besar tetapi dipotong menjadi task kecil. Setiap task menyentuh area file yang jelas, memakai verification gate sesuai spec, lalu dicommit sendiri sebelum task berikutnya dimulai.

**Tech Stack:** Next.js 16 app router, React 19, TypeScript, CSS modules, PostgreSQL repositories/services di `shared`, Vitest, Playwright review tooling, Axe accessibility audit, DOM snapshot/diff, rrweb replay audit-only.

---

## Aturan Checklist

- Checkbox hanya boleh dicentang setelah pekerjaan pada baris itu benar-benar selesai.
- Checkbox task utama hanya boleh dicentang setelah semua step task, verifikasi, dan commit task selesai.
- Jika verifikasi gagal, jangan centang. Perbaiki dulu atau catat blocker di dokumen diskusi.
- Setelah task selesai dan terverifikasi, langsung commit file relevan saja.
- Jangan stage perubahan lama yang bukan bagian task, terutama `.env.example`, `docker-compose.yml`, dan screenshot di `docs/teswebimg/` kecuali user meminta.
- Jangan menjalankan dev server di VPS. Gunakan build/check dan review terhadap web live.
- Sebelum edit kode Next.js, baca guide relevan di `node_modules/next/dist/docs/`.

## Baseline Review Sebelum Implementasi

**Files:**
- Read: `docs/superpowers/specs/2026-05-16-hertz-social-experience-spec.md`
- Read: `docs/review-tooling/README.md`
- Generated artifacts ignored: `docs/review-snapshots/latest/`, `docs/review-replays/`, `playwright-report/`, `test-results/`

- [x] **Step 1: Baca spec dan tooling docs**

Run:

```bash
sed -n '1,760p' docs/superpowers/specs/2026-05-16-hertz-social-experience-spec.md
sed -n '1,260p' docs/review-tooling/README.md
```

Expected:

- Paham scope HERTZ satu fase besar.
- Paham kapan memakai visual regression, accessibility audit, DOM diff, MCP, dan replay.

- [x] **Step 2: Buat baseline visual jika kondisi live saat ini diterima**

Run:

```bash
REVIEW_BASE_URL=https://horizon.cloudnexify.com npm run review:visual:update
```

Expected:

- Snapshot baseline tersimpan oleh Playwright.
- Jika baseline tidak ingin dibuat karena UI live belum layak, jangan jalankan command ini dan catat alasannya di final task.

- [x] **Step 3: Buat baseline DOM**

Run:

```bash
REVIEW_BASE_URL=https://horizon.cloudnexify.com npm run review:dom:update
```

Expected:

- DOM baseline route review tersimpan.

- [x] **Step 4: Commit baseline jika baseline sengaja diterima**

Run:

```bash
git status --short
git add tests/review docs/review-snapshots/baseline
git commit -m "Add HERTZ review baselines"
```

Expected:

- Hanya baseline yang sengaja diterima ikut commit.
- Jika tidak ada baseline yang dicommit, step ini boleh dicentang setelah dicatat bahwa baseline tidak dibuat.

- [x] **Ceklist selesai Task Baseline**

Centang hanya setelah baseline decision jelas: dibuat dan dicommit, atau sengaja tidak dibuat dengan alasan tertulis.

---

## Task 1: Access Role Helper dan Navigation Gating

**Files:**
- Create: `frontend/src/lib/accessRole.ts`
- Modify: `frontend/src/components/hertz/MobileBottomNav.tsx`
- Modify: `frontend/src/components/feed/HertzLeftRail.tsx`
- Modify: `frontend/src/components/feed/HertzRails.module.css`
- Modify: `frontend/src/components/hertz/HertzAppShell.tsx`
- Test: `tests/unit/frontend/accessRole.test.ts`

- [x] **Step 1: Tulis test access role**

Coverage:

- `null` user menghasilkan `guest`.
- role `member` menghasilkan `member`.
- role `admin` menghasilkan `admin`.
- guest tidak bisa melihat Tools.
- guest bisa melihat DM/Profile sebagai CTA login.
- member/admin bisa melihat Tools.

Run:

```bash
npm run test -- tests/unit/frontend/accessRole.test.ts
```

Expected:

- FAIL sebelum helper dibuat.

- [x] **Step 2: Implement helper dan pakai di nav**

Implementation target:

- `getAccessRole(currentUser)`
- `canShowNavItem(role, item)`
- `canUseMemberAction(role)`
- `canUseAdminAction(role)`
- Mobile bottom nav guest menyembunyikan Tools.
- DM mobile tetap label `DM` dengan accessible label `Direct Message`.

- [x] **Step 3: Verifikasi unit dan DOM**

Run:

```bash
npm run test -- tests/unit/frontend/accessRole.test.ts
npm run lint
npm run build:frontend
REVIEW_BASE_URL=https://horizon.cloudnexify.com npm run review:dom
```

Expected:

- Unit test pass.
- Lint pass.
- Build frontend pass.
- DOM diff menunjukkan nav gating sesuai expected, bukan regression.

- [x] **Step 4: Commit Task 1**

Run:

```bash
git add frontend/src/lib/accessRole.ts frontend/src/components/hertz/MobileBottomNav.tsx frontend/src/components/feed/HertzLeftRail.tsx frontend/src/components/feed/HertzRails.module.css frontend/src/components/hertz/HertzAppShell.tsx tests/unit/frontend/accessRole.test.ts
git commit -m "Add HERTZ access role navigation gates"
```

- [x] **Ceklist selesai Task 1**

Centang setelah verifikasi pass dan commit dibuat.

---

## Task 2: Responsive Shell, Tablet Breakpoint, dan Right Rail Sticky

**Files:**
- Modify: `frontend/src/components/hertz/HertzAppShell.module.css`
- Modify: `frontend/src/components/feed/HertzPage.module.css`
- Modify: `frontend/src/components/feed/HertzRails.module.css`
- Modify: `frontend/src/components/feed/HertzRightRail.tsx`
- Modify: `frontend/src/components/feed/HertzMobileMarket.tsx`
- Review: `tests/review/visual.spec.ts`

- [ ] **Step 1: Baca Next.js dan accessibility docs yang relevan**

Run:

```bash
sed -n '1,220p' node_modules/next/dist/docs/01-app/index.md
sed -n '1,220p' node_modules/next/dist/docs/03-architecture/accessibility.md
```

- [ ] **Step 2: Perbaiki shell responsive**

Implementation target:

- Desktop tetap left rail + right rail.
- Right rail sticky saat scroll.
- Tablet 768px memakai compact/mobile-like layout.
- Feed/detail tidak menjadi kolom sempit.
- Mobile bottom nav tidak menabrak konten.

- [ ] **Step 3: Verifikasi responsive**

Run:

```bash
npm run lint
npm run build:frontend
REVIEW_BASE_URL=https://horizon.cloudnexify.com npm run review:visual
REVIEW_BASE_URL=https://horizon.cloudnexify.com npm run review:a11y
```

Manual check:

- `/hertz` di 768px tidak sempit.
- `/hertz/post/hzx_live01` di 768px tidak sempit.
- Right rail desktop tetap terlihat saat scroll.

- [ ] **Step 4: Commit Task 2**

Run:

```bash
git add frontend/src/components/hertz/HertzAppShell.module.css frontend/src/components/feed/HertzPage.module.css frontend/src/components/feed/HertzRails.module.css frontend/src/components/feed/HertzRightRail.tsx frontend/src/components/feed/HertzMobileMarket.tsx
git commit -m "Fix HERTZ responsive shell and sticky rail"
```

- [ ] **Ceklist selesai Task 2**

Centang setelah visual/a11y/build pass dan commit dibuat.

---

## Task 2A: Premium Compact Right Sidebar Market Widget

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `frontend/src/components/feed/HertzRightRail.tsx`
- Modify: `frontend/src/components/feed/HertzRails.module.css`
- Create: `frontend/src/components/feed/MarketSidebarWidget.tsx`
- Create: `frontend/src/components/feed/MarketSidebarWidget.module.css`
- Create: `frontend/src/components/feed/MarketCard.tsx`
- Create: `frontend/src/components/feed/Sparkline.tsx`
- Test: `tests/unit/frontend/hertzMarketSidebar.test.ts`
- Review: `tests/review/visual.spec.ts`

- [ ] **Step 1: Install/check Recharts dependency**

Run:

```bash
npm ls recharts || npm install recharts
```

Expected:

- `recharts` tersedia untuk `AreaChart`.
- Jika dependency ditambahkan, `package.json` dan `package-lock.json` ikut distage pada commit task ini.

- [ ] **Step 2: Tulis test market sidebar data/rendering**

Coverage:

- Render 3 cards: Forex Market, Crypto Market, Stock Market.
- Setiap card punya main asset, price, percentage badge, source, update time.
- Setiap card punya 3 secondary asset rows.
- Widget tidak merender chart besar.
- Dummy data realistis tersedia jika live data kosong.

Run:

```bash
npm run test -- tests/unit/frontend/hertzMarketSidebar.test.ts
```

Expected:

- FAIL sebelum komponen dibuat.

- [ ] **Step 3: Implement reusable components**

Implementation target:

- `MarketSidebarWidget` menyusun 3 compact cards.
- `MarketCard` menerima typed market config dan asset data.
- `Sparkline` reusable untuk main area chart dan tiny row sparkline.
- Main chart memakai Recharts `AreaChart`, height 56-80px.
- Gunakan Next.js + TypeScript.
- Gunakan TailwindCSS/shadcn/ui primitives jika cocok dengan komponen repo yang sudah ada, terutama `badge`, `button`, `card`, dan `separator`.
- Gunakan CSS module untuk detail layout/glassmorphism jika itu lebih konsisten dengan komponen HERTZ existing.
- Tiny sparkline row tetap compact dan tidak overflow.
- No axes, no heavy labels, no large chart.
- Forex emerald/green, Crypto purple, Stock blue.
- Dark glassmorphism, subtle neon glow, rounded premium card.
- Hover transition dan glow halus.
- Accessible label untuk card, live status, price change, source, update time.

- [ ] **Step 4: Integrasikan ke right rail**

Implementation target:

- `HertzRightRail` memakai market widget baru.
- Widget tetap berada di right sidebar sempit.
- Pada mobile/tablet, widget tidak mengalahkan konten utama; gunakan existing mobile market access/collapsible behavior.
- Tidak ada horizontal overflow pada sidebar.

- [ ] **Step 5: Verifikasi**

Run:

```bash
npm run test -- tests/unit/frontend/hertzMarketSidebar.test.ts
npm run lint
npm run build:frontend
REVIEW_BASE_URL=https://horizon.cloudnexify.com npm run review:visual
REVIEW_BASE_URL=https://horizon.cloudnexify.com npm run review:a11y
```

Manual check:

- `/hertz` desktop menampilkan 3 compact market cards.
- Forex chart hijau, Crypto ungu, Stock biru.
- Chart height sekitar 56-80px.
- Tidak ada overflow di right sidebar.
- Card terasa premium, bukan generic admin template.

- [ ] **Step 6: Commit Task 2A**

Run:

```bash
git add package.json package-lock.json frontend/src/components/feed/HertzRightRail.tsx frontend/src/components/feed/HertzRails.module.css frontend/src/components/feed/MarketSidebarWidget.tsx frontend/src/components/feed/MarketSidebarWidget.module.css frontend/src/components/feed/MarketCard.tsx frontend/src/components/feed/Sparkline.tsx tests/unit/frontend/hertzMarketSidebar.test.ts
git commit -m "Add premium HERTZ market sidebar widget"
```

- [ ] **Ceklist selesai Task 2A**

Centang setelah test, visual review, a11y, build, and commit selesai.

---

## Task 3: Feed Card, Composer Outline, Empty/Loading/Error State

**Files:**
- Modify: `frontend/src/components/feed/HertzComposer.tsx`
- Modify: `frontend/src/components/feed/HertzComposer.module.css`
- Modify: `frontend/src/components/feed/HertzPost.tsx`
- Modify: `frontend/src/components/feed/HertzPost.module.css`
- Modify: `frontend/src/components/feed/FeedList.tsx`
- Modify: `frontend/src/components/feed/FeedList.module.css`
- Test: `tests/unit/frontend/hertzFeedUi.test.ts`

- [ ] **Step 1: Tulis test UI state feed**

Coverage:

- Empty state tampil saat feed kosong.
- Error state punya pesan jelas.
- Composer guest menampilkan CTA login.
- Post/composer class outline konsisten.

Run:

```bash
npm run test -- tests/unit/frontend/hertzFeedUi.test.ts
```

Expected:

- FAIL sebelum UI state lengkap.

- [ ] **Step 2: Implement feed state dan outline**

Implementation target:

- Composer outline hijau tipis.
- Post outline hijau tipis dan konsisten dengan composer.
- Empty/loading/error state jelas.
- Action lokal tidak memaksa scroll hilang jika tidak perlu.

- [ ] **Step 3: Verifikasi**

Run:

```bash
npm run test -- tests/unit/frontend/hertzFeedUi.test.ts
npm run lint
npm run build:frontend
REVIEW_BASE_URL=https://horizon.cloudnexify.com npm run review:visual
```

- [ ] **Step 4: Commit Task 3**

Run:

```bash
git add frontend/src/components/feed/HertzComposer.tsx frontend/src/components/feed/HertzComposer.module.css frontend/src/components/feed/HertzPost.tsx frontend/src/components/feed/HertzPost.module.css frontend/src/components/feed/FeedList.tsx frontend/src/components/feed/FeedList.module.css tests/unit/frontend/hertzFeedUi.test.ts
git commit -m "Polish HERTZ feed states and outlines"
```

- [ ] **Ceklist selesai Task 3**

Centang setelah test, visual review, build, dan commit selesai.

---

## Task 4: Composer Media untuk Trading, Life, dan General

**Files:**
- Modify: `frontend/src/components/feed/HertzComposer.tsx`
- Modify: `frontend/src/components/feed/HertzComposer.module.css`
- Modify: `shared/services/hertzPostService.ts`
- Modify: `shared/utils/mediaValidation.ts`
- Modify: `frontend/src/app/api/media/upload/route.ts` jika validasi upload perlu diselaraskan.
- Test: `tests/unit/shared/hertzValidation.test.ts`
- Test: `tests/unit/shared/mediaValidation.test.ts`

- [ ] **Step 1: Tulis/ubah test validasi media**

Coverage:

- Trading boleh media gambar.
- Life boleh media gambar.
- General boleh media gambar.
- Maksimal 4 gambar.
- Format selain JPG/PNG/WEBP ditolak.

Run:

```bash
npm run test -- tests/unit/shared/hertzValidation.test.ts tests/unit/shared/mediaValidation.test.ts
```

- [ ] **Step 2: Implement composer preview/remove/progress**

Implementation target:

- Preview thumbnail per file.
- Remove per file.
- Pesan validasi jumlah/format/ukuran.
- Progress upload.
- Mobile member punya shortcut compose setelah scroll.

- [ ] **Step 3: Verifikasi**

Run:

```bash
npm run test -- tests/unit/shared/hertzValidation.test.ts tests/unit/shared/mediaValidation.test.ts
npm run lint
npm run build:frontend
REVIEW_BASE_URL=https://horizon.cloudnexify.com npm run review:visual
REVIEW_BASE_URL=https://horizon.cloudnexify.com REVIEW_REPLAY_ROUTE=/hertz REVIEW_REPLAY_SECONDS=30 npm run review:replay
```

- [ ] **Step 4: Commit Task 4**

Run:

```bash
git add frontend/src/components/feed/HertzComposer.tsx frontend/src/components/feed/HertzComposer.module.css shared/services/hertzPostService.ts shared/utils/mediaValidation.ts frontend/src/app/api/media/upload/route.ts tests/unit/shared/hertzValidation.test.ts tests/unit/shared/mediaValidation.test.ts
git commit -m "Enable HERTZ media composer across categories"
```

- [ ] **Ceklist selesai Task 4**

Centang setelah media flow verified dan commit selesai.

---

## Task 5: Edit Post dan Metadata Author/Admin

**Files:**
- Modify: `shared/services/hertzPostService.ts`
- Modify: `shared/repositories/hertzPostRepository.ts`
- Modify: `frontend/src/app/api/hertz/posts/[shortId]/route.ts`
- Modify: `frontend/src/components/feed/HertzPostMenu.tsx`
- Modify: `frontend/src/components/feed/HertzPostMenu.module.css`
- Modify: `frontend/src/components/feed/HertzMarketMeta.tsx`
- Test: `tests/unit/shared/hertzPostService.test.ts`

- [ ] **Step 1: Tulis test permission edit metadata**

Coverage:

- Author bisa edit konten post sendiri.
- Author Trading post bisa edit metadata sendiri.
- Non-author member ditolak.
- Admin bisa edit semua metadata.
- Guest ditolak API.

Run:

```bash
npm run test -- tests/unit/shared/hertzPostService.test.ts
```

- [ ] **Step 2: Implement API/service/repository update**

Implementation target:

- API PATCH menerima `content` dan optional `market`.
- Service memvalidasi permission author/admin.
- Repository upsert market context.
- UI edit dialog memuat field metadata Trading.

- [ ] **Step 3: Verifikasi auth roles**

Run:

```bash
npm run test -- tests/unit/shared/hertzPostService.test.ts
npm run lint
npm run build:frontend
REVIEW_BASE_URL=https://horizon.cloudnexify.com npm run review:a11y
```

Manual/live check:

- `ARDANI | vastara.id` melihat edit pada post sendiri.
- Non-author member tidak melihat edit/delete post orang lain.
- Admin melihat edit semua post.

- [ ] **Step 4: Commit Task 5**

Run:

```bash
git add shared/services/hertzPostService.ts shared/repositories/hertzPostRepository.ts frontend/src/app/api/hertz/posts/[shortId]/route.ts frontend/src/components/feed/HertzPostMenu.tsx frontend/src/components/feed/HertzPostMenu.module.css frontend/src/components/feed/HertzMarketMeta.tsx tests/unit/shared/hertzPostService.test.ts
git commit -m "Allow HERTZ authors to edit market metadata"
```

- [ ] **Ceklist selesai Task 5**

Centang setelah permission verified dan commit selesai.

---

## Task 6: Delete Confirm Dialog

**Files:**
- Create: `frontend/src/components/feed/HertzDeletePostDialog.tsx`
- Create: `frontend/src/components/feed/HertzDeletePostDialog.module.css`
- Modify: `frontend/src/components/feed/HertzPostMenu.tsx`
- Test: `tests/unit/frontend/hertzPostActions.test.ts`

- [ ] **Step 1: Tulis test delete confirm**

Coverage:

- Klik `Hapus postingan` membuka dialog.
- DELETE tidak dipanggil sebelum confirm.
- Tombol batal menutup dialog.
- Escape menutup dialog.

Run:

```bash
npm run test -- tests/unit/frontend/hertzPostActions.test.ts
```

- [ ] **Step 2: Implement confirm dialog**

Implementation target:

- Dialog destructive accessible.
- Focus awal bukan tombol hapus.
- Close button, batal, Escape.
- Confirm baru menjalankan DELETE.

- [ ] **Step 3: Verifikasi**

Run:

```bash
npm run test -- tests/unit/frontend/hertzPostActions.test.ts
npm run lint
npm run build:frontend
REVIEW_BASE_URL=https://horizon.cloudnexify.com npm run review:a11y
REVIEW_BASE_URL=https://horizon.cloudnexify.com REVIEW_REPLAY_ROUTE=/hertz REVIEW_REPLAY_SECONDS=20 npm run review:replay
```

- [ ] **Step 4: Commit Task 6**

Run:

```bash
git add frontend/src/components/feed/HertzDeletePostDialog.tsx frontend/src/components/feed/HertzDeletePostDialog.module.css frontend/src/components/feed/HertzPostMenu.tsx tests/unit/frontend/hertzPostActions.test.ts
git commit -m "Add HERTZ delete post confirmation"
```

- [ ] **Ceklist selesai Task 6**

Centang setelah delete confirm verified dan commit selesai.

---

## Task 7: Plain Repost Muncul di Timeline

**Files:**
- Modify: `shared/types/feed.ts`
- Modify: `shared/repositories/hertzPostRepository.ts`
- Modify: `shared/repositories/hertzInteractionRepository.ts`
- Modify: `shared/services/hertzPostService.ts`
- Modify: `shared/services/hertzInteractionService.ts`
- Modify: `frontend/src/components/feed/HertzPost.tsx`
- Modify: `frontend/src/components/feed/HertzActionBar.tsx`
- Test: `tests/unit/shared/hertzPostService.test.ts`
- Test: `tests/unit/frontend/feed.test.ts`

- [ ] **Step 1: Tulis test repost timeline**

Coverage:

- Plain repost tersimpan.
- Feed mengembalikan item repost.
- Header repost memakai user yang merepost.
- Author original tetap author post original.
- Toggle repost count sinkron.
- Repost sendiri ditolak.

Run:

```bash
npm run test -- tests/unit/shared/hertzPostService.test.ts tests/unit/frontend/feed.test.ts
```

- [ ] **Step 2: Implement feed union/repost presentation**

Implementation target:

- Feed menggabungkan post original dan plain repost aktif.
- Repost item punya stable key.
- UI menampilkan `nama merepost`.
- Toggle update local state jika memungkinkan.

- [ ] **Step 3: Verifikasi**

Run:

```bash
npm run test -- tests/unit/shared/hertzPostService.test.ts tests/unit/frontend/feed.test.ts
npm run lint
npm run build:frontend
REVIEW_BASE_URL=https://horizon.cloudnexify.com npm run review:dom
REVIEW_BASE_URL=https://horizon.cloudnexify.com REVIEW_REPLAY_ROUTE=/hertz REVIEW_REPLAY_SECONDS=30 npm run review:replay
```

- [ ] **Step 4: Commit Task 7**

Run:

```bash
git add shared/types/feed.ts shared/repositories/hertzPostRepository.ts shared/repositories/hertzInteractionRepository.ts shared/services/hertzPostService.ts shared/services/hertzInteractionService.ts frontend/src/components/feed/HertzPost.tsx frontend/src/components/feed/HertzActionBar.tsx tests/unit/shared/hertzPostService.test.ts tests/unit/frontend/feed.test.ts
git commit -m "Show plain reposts in HERTZ timeline"
```

- [ ] **Ceklist selesai Task 7**

Centang setelah repost timeline verified dan commit selesai.

---

## Task 8: Profile Activity Tabs dan Saved History

**Files:**
- Modify: `frontend/src/app/hertz/profile/page.tsx`
- Modify: `frontend/src/app/hertz/profile/page.module.css`
- Create: `frontend/src/app/api/hertz/profile/activity/route.ts`
- Modify: `shared/repositories/hertzInteractionRepository.ts`
- Modify: `shared/repositories/hertzPostRepository.ts`
- Create: `shared/services/hertzProfileService.ts`
- Test: `tests/unit/shared/hertzProfileService.test.ts`
- Test: `tests/unit/frontend/hertzProfile.test.ts`

- [ ] **Step 1: Tulis test profile activity**

Coverage:

- Guest profile menampilkan CTA dan manfaat login.
- Member melihat `Post saya`.
- Member melihat `Disimpan`.
- Member melihat `Repost saya`.
- Member melihat `Komentar saya`.
- Bookmark yang di-unsave hilang dari `Disimpan`.

Run:

```bash
npm run test -- tests/unit/shared/hertzProfileService.test.ts tests/unit/frontend/hertzProfile.test.ts
```

- [ ] **Step 2: Implement profile service dan UI tabs**

Implementation target:

- API profile activity.
- Bio/statistik/joined date.
- Tabs: Post saya, Disimpan, Repost saya, Komentar saya, Credit/history, Setting Telegram/session.
- Guest CTA tidak kosong.

- [ ] **Step 3: Verifikasi**

Run:

```bash
npm run test -- tests/unit/shared/hertzProfileService.test.ts tests/unit/frontend/hertzProfile.test.ts
npm run lint
npm run build:frontend
REVIEW_BASE_URL=https://horizon.cloudnexify.com npm run review:visual
REVIEW_BASE_URL=https://horizon.cloudnexify.com npm run review:dom
```

- [ ] **Step 4: Commit Task 8**

Run:

```bash
git add frontend/src/app/hertz/profile/page.tsx frontend/src/app/hertz/profile/page.module.css frontend/src/app/api/hertz/profile/activity/route.ts shared/repositories/hertzInteractionRepository.ts shared/repositories/hertzPostRepository.ts shared/services/hertzProfileService.ts tests/unit/shared/hertzProfileService.test.ts tests/unit/frontend/hertzProfile.test.ts
git commit -m "Add HERTZ profile activity history"
```

- [ ] **Ceklist selesai Task 8**

Centang setelah profile tabs verified dan commit selesai.

---

## Task 9: Share Sheet Desktop/Mobile

**Files:**
- Create: `frontend/src/components/feed/HertzShareSheet.tsx`
- Create: `frontend/src/components/feed/HertzShareSheet.module.css`
- Modify: `frontend/src/components/feed/HertzActionBar.tsx`
- Modify: `frontend/src/components/feed/HertzPostMenu.tsx`
- Test: `tests/unit/frontend/shareButtons.test.ts`

- [ ] **Step 1: Tulis test share targets**

Coverage:

- `Bagikan` membuka sheet.
- `Salin link` memakai canonical URL.
- Telegram/WhatsApp/X/Facebook target benar.
- Native share hanya dipakai jika tersedia.

Run:

```bash
npm run test -- tests/unit/frontend/shareButtons.test.ts
```

- [ ] **Step 2: Implement share sheet**

Implementation target:

- Desktop popover/modal kecil.
- Mobile bottom sheet.
- Feedback `Link disalin`.
- `Salin link` di menu tiga titik tetap shortcut langsung.

- [ ] **Step 3: Verifikasi**

Run:

```bash
npm run test -- tests/unit/frontend/shareButtons.test.ts
npm run lint
npm run build:frontend
REVIEW_BASE_URL=https://horizon.cloudnexify.com npm run review:a11y
REVIEW_BASE_URL=https://horizon.cloudnexify.com REVIEW_REPLAY_ROUTE=/hertz REVIEW_REPLAY_SECONDS=30 npm run review:replay
```

- [ ] **Step 4: Commit Task 9**

Run:

```bash
git add frontend/src/components/feed/HertzShareSheet.tsx frontend/src/components/feed/HertzShareSheet.module.css frontend/src/components/feed/HertzActionBar.tsx frontend/src/components/feed/HertzPostMenu.tsx tests/unit/frontend/shareButtons.test.ts
git commit -m "Add HERTZ social share sheet"
```

- [ ] **Ceklist selesai Task 9**

Centang setelah share sheet verified dan commit selesai.

---

## Task 10: Desktop Post Detail Modal dan Mobile Detail Priority

**Files:**
- Modify: `frontend/src/app/hertz/page.tsx`
- Modify: `frontend/src/app/hertz/post/[shortId]/page.tsx`
- Modify: `frontend/src/app/hertz/post/[shortId]/post-detail.module.css`
- Create: `frontend/src/components/feed/HertzPostDetailModal.tsx`
- Create: `frontend/src/components/feed/HertzPostDetailModal.module.css`
- Modify: `frontend/src/components/feed/HertzPost.tsx`
- Modify: `frontend/src/components/feed/HertzDetailInteractions.tsx`
- Test: `tests/unit/frontend/hertzPostDetail.test.ts`

- [ ] **Step 1: Tulis test detail behavior**

Coverage:

- Desktop click post membuka modal.
- Mobile click post memakai route detail.
- Escape menutup modal.
- Focus kembali ke trigger.
- Mobile detail menampilkan post sebelum Market Live panjang.

Run:

```bash
npm run test -- tests/unit/frontend/hertzPostDetail.test.ts
```

- [ ] **Step 2: Implement modal desktop dan mobile priority**

Implementation target:

- Modal desktop tidak menghilangkan feed scroll.
- Direct link tetap bekerja.
- Mobile route tetap full page.
- Market Live mobile collapsible atau setelah konten.

- [ ] **Step 3: Verifikasi**

Run:

```bash
npm run test -- tests/unit/frontend/hertzPostDetail.test.ts
npm run lint
npm run build:frontend
REVIEW_BASE_URL=https://horizon.cloudnexify.com npm run review:visual
REVIEW_BASE_URL=https://horizon.cloudnexify.com npm run review:a11y
REVIEW_BASE_URL=https://horizon.cloudnexify.com REVIEW_REPLAY_ROUTE=/hertz REVIEW_REPLAY_SECONDS=30 npm run review:replay
```

- [ ] **Step 4: Commit Task 10**

Run:

```bash
git add frontend/src/app/hertz/page.tsx frontend/src/app/hertz/post/[shortId]/page.tsx frontend/src/app/hertz/post/[shortId]/post-detail.module.css frontend/src/components/feed/HertzPostDetailModal.tsx frontend/src/components/feed/HertzPostDetailModal.module.css frontend/src/components/feed/HertzPost.tsx frontend/src/components/feed/HertzDetailInteractions.tsx tests/unit/frontend/hertzPostDetail.test.ts
git commit -m "Add HERTZ desktop post detail modal"
```

- [ ] **Ceklist selesai Task 10**

Centang setelah modal/detail verified dan commit selesai.

---

## Task 11: Guest Comment CTA dan Comment Feedback

**Files:**
- Modify: `frontend/src/components/feed/HertzDetailInteractions.tsx`
- Modify: `frontend/src/components/feed/HertzDetailInteractions.module.css`
- Modify: `shared/services/hertzCommentService.ts`
- Test: `tests/unit/shared/hertzPostService.test.ts`
- Test: `tests/unit/frontend/hertzPostDetail.test.ts`

- [ ] **Step 1: Tulis test guest comment CTA**

Coverage:

- Guest tidak melihat textarea aktif penuh.
- Guest melihat CTA login Telegram.
- Member bisa submit komentar.
- Error submit komentar tampil jelas.

Run:

```bash
npm run test -- tests/unit/shared/hertzPostService.test.ts tests/unit/frontend/hertzPostDetail.test.ts
```

- [ ] **Step 2: Implement comment UX**

Implementation target:

- CTA guest menggantikan form aktif.
- Member form punya loading/error/success.
- Comment action feed membuka modal/page sesuai device.

- [ ] **Step 3: Verifikasi**

Run:

```bash
npm run test -- tests/unit/shared/hertzPostService.test.ts tests/unit/frontend/hertzPostDetail.test.ts
npm run lint
npm run build:frontend
REVIEW_BASE_URL=https://horizon.cloudnexify.com npm run review:a11y
```

- [ ] **Step 4: Commit Task 11**

Run:

```bash
git add frontend/src/components/feed/HertzDetailInteractions.tsx frontend/src/components/feed/HertzDetailInteractions.module.css shared/services/hertzCommentService.ts tests/unit/shared/hertzPostService.test.ts tests/unit/frontend/hertzPostDetail.test.ts
git commit -m "Improve HERTZ comment guest state"
```

- [ ] **Ceklist selesai Task 11**

Centang setelah comment CTA verified dan commit selesai.

---

## Task 12: Direct Message Guest CTA, Mobile Two-Screen, Menu Tiga Titik

**Files:**
- Modify: `frontend/src/app/hertz/messages/MessagesClient.tsx`
- Modify: `frontend/src/app/hertz/messages/page.module.css`
- Modify: `shared/services/hertzDmService.ts`
- Modify: `shared/repositories/hertzDmRepository.ts`
- Modify: `frontend/src/app/api/hertz/messages/inbox/route.ts`
- Modify: `frontend/src/app/api/hertz/messages/conversations/[conversationId]/route.ts`
- Test: `tests/unit/frontend/hertzMessages.test.ts`
- Test: `tests/unit/shared/hertzDmService.test.ts`

- [ ] **Step 1: Tulis test DM state**

Coverage:

- Guest langsung CTA login Telegram.
- Guest tidak melihat filter inbox, archive, block, upload, composer, kirim.
- Member mobile punya inbox screen dan thread screen.
- Polling tidak lebih sering dari 5 detik.
- Upload DM maksimal 4 gambar JPG/PNG/WEBP.

Run:

```bash
npm run test -- tests/unit/frontend/hertzMessages.test.ts tests/unit/shared/hertzDmService.test.ts
```

- [ ] **Step 2: Implement DM UX**

Implementation target:

- Guest CTA only.
- Mobile two-screen.
- Header thread bersih.
- Arsipkan/Blokir ke menu tiga titik.
- Composer file input custom HERTZ style.

- [ ] **Step 3: Verifikasi**

Run:

```bash
npm run test -- tests/unit/frontend/hertzMessages.test.ts tests/unit/shared/hertzDmService.test.ts
npm run lint
npm run build:frontend
REVIEW_BASE_URL=https://horizon.cloudnexify.com npm run review:visual
REVIEW_BASE_URL=https://horizon.cloudnexify.com npm run review:a11y
REVIEW_BASE_URL=https://horizon.cloudnexify.com npm run review:dom
REVIEW_BASE_URL=https://horizon.cloudnexify.com REVIEW_REPLAY_ROUTE=/hertz/messages REVIEW_REPLAY_SECONDS=30 npm run review:replay
```

- [ ] **Step 4: Commit Task 12**

Run:

```bash
git add frontend/src/app/hertz/messages/MessagesClient.tsx frontend/src/app/hertz/messages/page.module.css shared/services/hertzDmService.ts shared/repositories/hertzDmRepository.ts frontend/src/app/api/hertz/messages/inbox/route.ts frontend/src/app/api/hertz/messages/conversations/[conversationId]/route.ts tests/unit/frontend/hertzMessages.test.ts tests/unit/shared/hertzDmService.test.ts
git commit -m "Polish HERTZ direct messages"
```

- [ ] **Ceklist selesai Task 12**

Centang setelah DM verified dan commit selesai.

---

## Task 13: Social Search dan Hashtag/Topik

**Files:**
- Create: `frontend/src/app/api/hertz/search/route.ts`
- Create: `shared/services/hertzSearchService.ts`
- Modify: `shared/repositories/hertzPostRepository.ts`
- Modify: `frontend/src/components/feed/HertzHeader.tsx`
- Modify: `frontend/src/components/feed/HertzPost.tsx`
- Modify: `frontend/src/components/feed/HertzPage.tsx`
- Test: `tests/unit/shared/hertzSearchService.test.ts`
- Test: `tests/unit/frontend/hertzSearch.test.ts`

- [ ] **Step 1: Tulis test search**

Coverage:

- Search post.
- Search member.
- Search hashtag/topik.
- Search pair seperti `xau`.
- Empty result punya state jelas.

Run:

```bash
npm run test -- tests/unit/shared/hertzSearchService.test.ts tests/unit/frontend/hertzSearch.test.ts
```

- [ ] **Step 2: Implement search API dan UI**

Implementation target:

- Search kanan atas aktif.
- Result typed: post/member/topic/pair.
- Hashtag link/filter dari konten post.
- Mobile search tidak menabrak nav.

- [ ] **Step 3: Verifikasi**

Run:

```bash
npm run test -- tests/unit/shared/hertzSearchService.test.ts tests/unit/frontend/hertzSearch.test.ts
npm run lint
npm run build:frontend
REVIEW_BASE_URL=https://horizon.cloudnexify.com npm run review:visual
REVIEW_BASE_URL=https://horizon.cloudnexify.com npm run review:dom
```

- [ ] **Step 4: Commit Task 13**

Run:

```bash
git add frontend/src/app/api/hertz/search/route.ts shared/services/hertzSearchService.ts shared/repositories/hertzPostRepository.ts frontend/src/components/feed/HertzHeader.tsx frontend/src/components/feed/HertzPost.tsx frontend/src/components/feed/HertzPage.tsx tests/unit/shared/hertzSearchService.test.ts tests/unit/frontend/hertzSearch.test.ts
git commit -m "Add HERTZ social search"
```

- [ ] **Ceklist selesai Task 13**

Centang setelah search/topik verified dan commit selesai.

---

## Task 14: Minimal Notifications dan Activity Indicator

**Files:**
- Modify: `shared/repositories/hertzDmRepository.ts`
- Modify: `shared/services/hertzDmService.ts`
- Create: `shared/services/hertzNotificationService.ts`
- Modify: `frontend/src/app/api/auth/me/route.ts`
- Modify: `frontend/src/components/hertz/MobileBottomNav.tsx`
- Modify: `frontend/src/components/feed/HertzRightRail.tsx`
- Test: `tests/unit/shared/mobileNotifications.test.ts`
- Test: `tests/unit/frontend/hertzNotifications.test.ts`

- [ ] **Step 1: Tulis test notification minimal**

Coverage:

- Member dengan unread DM mendapat badge.
- Guest tidak mendapat badge palsu.
- Activity indicator punya empty state.

Run:

```bash
npm run test -- tests/unit/shared/mobileNotifications.test.ts tests/unit/frontend/hertzNotifications.test.ts
```

- [ ] **Step 2: Implement unread/activity**

Implementation target:

- Unread count DM.
- Badge nav DM.
- Indicator ringan right rail/mobile.
- Tidak membuat notification center penuh.

- [ ] **Step 3: Verifikasi**

Run:

```bash
npm run test -- tests/unit/shared/mobileNotifications.test.ts tests/unit/frontend/hertzNotifications.test.ts
npm run lint
npm run build:frontend
REVIEW_BASE_URL=https://horizon.cloudnexify.com npm run review:visual
REVIEW_BASE_URL=https://horizon.cloudnexify.com npm run review:dom
```

- [ ] **Step 4: Commit Task 14**

Run:

```bash
git add shared/repositories/hertzDmRepository.ts shared/services/hertzDmService.ts shared/services/hertzNotificationService.ts frontend/src/app/api/auth/me/route.ts frontend/src/components/hertz/MobileBottomNav.tsx frontend/src/components/feed/HertzRightRail.tsx tests/unit/shared/mobileNotifications.test.ts tests/unit/frontend/hertzNotifications.test.ts
git commit -m "Add HERTZ minimal notification indicators"
```

- [ ] **Ceklist selesai Task 14**

Centang setelah notification verified dan commit selesai.

---

## Task 15: SEO dan Social Preview Detail Post

**Files:**
- Modify: `frontend/src/app/hertz/post/[shortId]/page.tsx`
- Modify: `frontend/src/app/layout.tsx` jika metadata base perlu disesuaikan.
- Modify: `shared/services/hertzPostService.ts`
- Test: `tests/unit/frontend/seo.test.ts`

- [ ] **Step 1: Tulis test metadata detail post**

Coverage:

- Title memakai konten/author, bukan shortId saja.
- Description dari konten post.
- OG/Twitter metadata punya canonical URL.
- Deleted/hidden post memakai fallback.

Run:

```bash
npm run test -- tests/unit/frontend/seo.test.ts
```

- [ ] **Step 2: Implement generateMetadata**

Implementation target:

- Metadata detail mengambil post server-side.
- Fallback aman untuk not found/hidden/deleted.
- Tidak membocorkan konten private.

- [ ] **Step 3: Verifikasi**

Run:

```bash
npm run test -- tests/unit/frontend/seo.test.ts
npm run lint
npm run build:frontend
```

- [ ] **Step 4: Commit Task 15**

Run:

```bash
git add frontend/src/app/hertz/post/[shortId]/page.tsx frontend/src/app/layout.tsx shared/services/hertzPostService.ts tests/unit/frontend/seo.test.ts
git commit -m "Improve HERTZ post social metadata"
```

- [ ] **Ceklist selesai Task 15**

Centang setelah SEO verified dan commit selesai.

---

## Task 16: Accessibility Pass Semua Overlay dan Icon Action

**Files:**
- Modify: `frontend/src/components/feed/HertzPostDetailModal.tsx`
- Modify: `frontend/src/components/feed/HertzShareSheet.tsx`
- Modify: `frontend/src/components/feed/HertzDeletePostDialog.tsx`
- Modify: `frontend/src/components/feed/HertzPostMenu.tsx`
- Modify: `frontend/src/app/hertz/messages/MessagesClient.tsx`
- Modify: `frontend/src/components/feed/HertzActionBar.tsx`
- Review: `tests/review/accessibility.spec.ts`

- [ ] **Step 1: Audit overlay keyboard**

Manual/MCP checks:

- Tab focus tertahan di modal/sheet/menu.
- Escape menutup overlay.
- Focus balik ke trigger.
- Icon-only punya accessible name.
- Delete confirm tidak fokus default ke tombol hapus.

- [ ] **Step 2: Fix accessibility gaps**

Implementation target:

- `aria-label`, `aria-modal`, `role="dialog"` jika relevan.
- Close button konsisten.
- Focus restore.
- Focus ring terlihat.

- [ ] **Step 3: Verifikasi**

Run:

```bash
npm run lint
npm run build:frontend
REVIEW_BASE_URL=https://horizon.cloudnexify.com npm run review:a11y
```

Optional browser-agent:

```bash
npm run review:mcp
```

- [ ] **Step 4: Commit Task 16**

Run:

```bash
git add frontend/src/components/feed/HertzPostDetailModal.tsx frontend/src/components/feed/HertzShareSheet.tsx frontend/src/components/feed/HertzDeletePostDialog.tsx frontend/src/components/feed/HertzPostMenu.tsx frontend/src/app/hertz/messages/MessagesClient.tsx frontend/src/components/feed/HertzActionBar.tsx
git commit -m "Audit HERTZ overlay accessibility"
```

- [ ] **Ceklist selesai Task 16**

Centang setelah a11y pass dan commit selesai.

---

## Task 17: Full Review Pass dan Cleanup

**Files:**
- Review all HERTZ files touched in tasks 1-16.
- Review docs if implementation decisions changed: `docs/frontend-discussion/2026-05-16-hertz-frontend-review-discussion.md`
- Review spec only if behavior intentionally changed: `docs/superpowers/specs/2026-05-16-hertz-social-experience-spec.md`

- [ ] **Step 1: Run full automated verification**

Run:

```bash
npm run test
npm run lint
npm run build:frontend
```

Expected:

- All pass.

- [ ] **Step 2: Run review tooling**

Run:

```bash
REVIEW_BASE_URL=https://horizon.cloudnexify.com npm run review:visual
REVIEW_BASE_URL=https://horizon.cloudnexify.com npm run review:a11y
REVIEW_BASE_URL=https://horizon.cloudnexify.com npm run review:dom
```

Expected:

- Visual diffs are expected and documented, or no unexpected diffs remain.
- Critical/serious a11y issues are fixed or documented as pre-existing.
- DOM diff matches intended structural changes.

- [ ] **Step 3: Replay critical flows**

Run for representative flows:

```bash
REVIEW_BASE_URL=https://horizon.cloudnexify.com REVIEW_REPLAY_ROUTE=/hertz REVIEW_REPLAY_SECONDS=45 npm run review:replay
REVIEW_BASE_URL=https://horizon.cloudnexify.com REVIEW_REPLAY_ROUTE=/hertz/messages REVIEW_REPLAY_SECONDS=45 npm run review:replay
REVIEW_BASE_URL=https://horizon.cloudnexify.com REVIEW_REPLAY_ROUTE=/hertz/profile REVIEW_REPLAY_SECONDS=30 npm run review:replay
```

Expected:

- Replay confirms feed/detail/share/repost/profile/DM flows.
- Artifact remains ignored unless intentionally attached to discussion.

- [ ] **Step 4: Manual auth role sweep**

Check:

- Guest.
- Member pembuat post `ARDANI | vastara.id`.
- Non-author member.
- Admin.

Expected:

- Permissions match spec.
- No guest-only UI exposes member actions.
- Admin actions do not appear for regular member.

- [ ] **Step 5: Final commit decision if cleanup changes were made**

Run:

```bash
git status --short
```

Expected:

- If cleanup edits happened, stage only the exact files shown by `git status --short` that belong to the cleanup.
- Commit staged cleanup files with message `Finalize HERTZ social experience verification`.
- If no cleanup edits happened, do not create an empty commit.
- No unrelated existing dirty files staged.

- [ ] **Ceklist selesai Task 17**

Centang setelah full verification pass, role sweep pass, and cleanup commit decision selesai.

---

## Coverage Map

- Access role and guest/member/admin gating: Task 1, Task 12, Task 17.
- Responsive shell, tablet, right rail: Task 2, Task 17.
- Premium compact market sidebar widget: Task 2A, Task 17.
- Feed social polish and outlines: Task 3.
- Composer media all categories: Task 4.
- Edit/delete author/admin: Task 5, Task 6.
- Repost timeline: Task 7.
- Saved history and profile center: Task 8.
- Share sheet: Task 9.
- Desktop detail modal/mobile detail: Task 10.
- Guest comment CTA: Task 11.
- DM polish: Task 12.
- Social search/hashtag: Task 13.
- Minimal notifications: Task 14.
- SEO/social preview: Task 15.
- Accessibility overlays: Task 16.
- Review tooling gates: Baseline task and Task 17.

## Plan Self-Review

- Semua scope utama dari spec masuk task.
- Setiap task punya checkbox dan aturan kapan boleh dicentang.
- Setiap task punya file path, verification command, dan commit command.
- Plan tidak menginstruksikan menjalankan dev server.
- Plan memisahkan artifact review dari commit biasa.
- Plan menjaga perubahan lama yang tidak terkait tetap tidak distage.
- Plan sinkron dengan diskusi dan spec untuk right sidebar market widget: Task 2A memakai Recharts, compact charts 56-80px, TailwindCSS/shadcn-compatible primitives bila cocok, CSS module untuk konsistensi HERTZ, dan bukan full dashboard.
