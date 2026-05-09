# Requirements Document

## Introduction

HERTZ Platform Refactor mengubah Horizon dari feed lama menjadi ekosistem baru: Horizon sebagai platform/landing utama di `/`, dan HERTZ sebagai produk social media komunitas trading di `/hertz`. Refactor ini total, bukan feature flag sementara. Scope meliputi route publik, shell desktop, database `hertz_*`, admin panel, feed sosial, Blog member, Outlook WordPress, Direct Message, credit, Telegram bot, reset data lama, SEO landing, dan seed testing.

Visual utama mengikuti Figma file Horizon: `V3 / Desktop Final Draft`, `V3 / Outlook Desktop Draft`, `V3 / Blog Desktop Draft`, `V3 / Tools Desktop Draft`, `V3 / Direct Message Desktop Draft`, dan `Horizon Landing / Desktop Mock 02`.

## Glossary

- **Horizon**: Brand dan platform utama.
- **HERTZ**: Produk social media komunitas trading di dalam Horizon.
- **Pulse**: Interaction HERTZ yang menggantikan istilah lama Signal/like.
- **Verified_Member**: User Telegram yang lolos membership check grup Horizon.
- **Admin**: User dengan akses admin panel.
- **Guest**: Visitor tanpa login, hanya read-only.
- **Hertz_Post**: Post sosial HERTZ di timeline.
- **ShortId**: ID publik post, format `hz_` + 8 karakter acak.
- **Trading_Room**: Kategori post trading dengan field pair/risk.
- **Life_Coffee**: Kategori post cerita komunitas.
- **General**: Kategori umum.
- **Community_Note**: Catatan kontekstual bersumber URL.
- **Outlook**: Konten dari WordPress sesuai alur saat ini.
- **Blog**: Artikel member verified di `/blog`.
- **DM**: Direct Message private antar verified member.

## Requirements

### Requirement 1: Brand, naming, and total cutover

**User Story:** Sebagai pemilik platform, saya ingin Horizon dan HERTZ dipisahkan secara jelas, sehingga landing dan social product tidak tercampur.

#### Acceptance Criteria

1. THE UI SHALL write the social product as `HERTZ`.
2. THE code SHALL use normal code naming such as `HertzPage`, `HertzShell`, `hertzService`, and `hertz_posts`.
3. THE system SHALL replace user-facing `Signal Ledger` text with `Hertz` or `HERTZ`.
4. THE system SHALL replace old `signal-ledger` route/admin naming with `hertz`.
5. THE system SHALL use `Pulse` as the post reaction/interaksi label.
6. THE database reaction enum SHALL use `pulse`, not `signal`.
7. THE system SHALL NOT preserve `SIGNAL_LEDGER_ENABLED` as a dual-mode feature flag.
8. THE refactor SHALL be total; old data and old routes are not production compatibility blockers.

### Requirement 2: Public routes

**User Story:** Sebagai visitor, saya ingin route baru jelas, sehingga saya tahu perbedaan Horizon landing dan HERTZ app.

#### Acceptance Criteria

1. THE route `/` SHALL render the Horizon landing page.
2. THE route `/hertz` SHALL render the HERTZ home/feed.
3. THE route `/hertz/post/[shortId]` SHALL render HERTZ post detail.
4. THE route `/blog` SHALL render Blog.
5. THE route `/outlook` SHALL render Outlook.
6. THE route `/tools` SHALL render Tools.
7. THE route `/hertz/messages` SHALL render Direct Message.
8. THE old `/post/[id]` route SHALL be replaced by `/hertz/post/[shortId]` without legacy redirect.
9. THE system SHALL NOT expose raw numeric post IDs in public URLs.
10. THE `shortId` SHALL use prefix `hz_` plus 8 random characters.
11. THE `shortId` SHALL remain immutable after post edits.

### Requirement 3: Horizon landing and SEO

**User Story:** Sebagai visitor baru, saya ingin landing Horizon menjelaskan platform, sehingga saya bisa masuk ke HERTZ, Outlook, Blog, dan Tools.

#### Acceptance Criteria

1. THE landing page SHALL live at `/`.
2. THE landing page SHALL follow `Horizon Landing / Desktop Mock 02`.
3. THE landing page SHALL include Hero Horizon.
4. THE landing page SHALL include product gateway for HERTZ.
5. THE landing page SHALL include Outlook section.
6. THE landing page SHALL include Blog section.
7. THE landing page SHALL include Tools section.
8. THE landing page SHALL include membership CTA.
9. THE landing page SHALL include a simple footer.
10. THE landing page SHALL provide SEO title, description, canonical, and OG image.
11. THE visual theme SHALL use black base and emerald accents.

### Requirement 4: HERTZ desktop shell

**User Story:** Sebagai user desktop, saya ingin semua halaman produk terasa satu sistem, sehingga navigasi HERTZ konsisten.

#### Acceptance Criteria

1. THE desktop shell SHALL follow `V3 / Desktop Final Draft`.
2. THE left rail SHALL show atom logo and `HERTZ`.
3. THE left rail menu SHALL contain Home, Outlook, Blog, Tools, and Direct Message.
4. THE Home item SHALL link to `/hertz`.
5. THE Outlook item SHALL link to `/outlook`.
6. THE Blog item SHALL link to `/blog`.
7. THE Tools item SHALL link to `/tools`.
8. THE Direct Message item SHALL link to `/hertz/messages`.
9. THE shell SHALL NOT show duplicate old top header or old footer inside HERTZ pages.
10. THE active state SHALL match the Figma mock direction.
11. THE admin menu SHALL be visible only to admins.
12. THE shell SHALL use real Horizon atom logo asset where available.
13. THE implementation SHALL treat stale Figma layer names such as `Signal Ledger`, `Gallery`, or `HERTS` as non-authoritative when they conflict with this spec.
14. THE final visible brand text SHALL be `HERTZ`.
15. THE menu icon set SHALL follow the Figma/lucide direction: Home, Outlook, Blog, chart-candlestick for Tools, and message-circle for Direct Message.
16. THE visual background for HERTZ shell pages SHALL use full black `#000000` as the dominant page background.
17. THE category tabs SHALL match the desktop mock: All, Trading Room, Life & Coffee, and General.

### Requirement 5: Market right rail

**User Story:** Sebagai pembaca HERTZ, saya ingin melihat market context ringan, sehingga halaman terasa trading-native.

#### Acceptance Criteria

1. THE right rail SHALL appear on `/hertz`, `/outlook`, `/blog`, and `/tools`.
2. THE right rail SHALL NOT appear on `/hertz/messages`.
3. THE right rail SHALL contain Forex Market, Crypto Market, and Stock Market panels.
4. EACH market row SHALL use red/green mini line chart, not candlestick.
5. THE market data MAY use mock/fallback data in phase one.
6. WHEN data is mock/fallback, THE UI SHALL NOT claim it is live.
7. THE market rail SHALL not collide with lower viewport content.
8. THE market rail layout SHALL be reused consistently on Home HERTZ, Outlook, Blog, and Tools.
9. THE market rail SHALL keep three separate panels instead of one combined market card.

### Requirement 6: Guest read-only behavior

**User Story:** Sebagai guest, saya ingin membaca konten tanpa login, tetapi aksi sosial tetap dilindungi.

#### Acceptance Criteria

1. THE Guest SHALL read `/hertz`.
2. THE Guest SHALL read `/hertz/post/[shortId]`.
3. THE Guest SHALL read `/blog`.
4. THE Guest SHALL read `/outlook`.
5. THE Guest SHALL read `/tools`.
6. WHEN Guest clicks Pulse, comment, repost, quote, bookmark, community note, blog create, or DM action, THE UI SHALL show login prompt.
7. WHEN Guest calls write endpoints directly, THE API SHALL return `401`.
8. THE system SHALL NOT allow anonymous likes/comments under the new HERTZ domain.

### Requirement 7: Telegram auth and membership verification

**User Story:** Sebagai member Horizon, saya ingin login Telegram hanya valid jika saya anggota grup, sehingga aksi sosial hanya untuk komunitas asli.

#### Acceptance Criteria

1. THE login flow SHALL validate Telegram identity before creating a session.
2. THE backend SHALL call the membership endpoint with server-side bearer token.
3. THE membership check SHALL use Horizon group id configuration.
4. WHEN the endpoint returns `{"isMember":true}`, THE user SHALL become Verified_Member.
5. WHEN the endpoint returns `{"isMember":false}`, THE login SHALL fail.
6. THE bearer token SHALL NOT be exposed to frontend.
7. THE system SHALL store verification status and last checked timestamp.
8. THE system SHALL recheck membership on login and important write actions.
9. WHEN a user leaves the Telegram group, THE next recheck SHALL revoke write access.
10. THE Verified_Member badge SHALL appear for verified members.
11. THE Admin badge SHALL appear for admins.
12. THE UI SHALL NOT display Pro Member.

### Requirement 8: HERTZ feed and composer

**User Story:** Sebagai verified member, saya ingin membuat post dari web dan Telegram, sehingga kontribusi tidak hanya bergantung pada bot.

#### Acceptance Criteria

1. THE HERTZ feed SHALL show published HERTZ posts only.
2. THE feed SHALL support categories Trading Room, Life & Coffee, General, and Community Note.
3. THE web composer SHALL be available to Verified_Member and Admin.
4. THE web composer SHALL publish immediately without review.
5. THE Telegram member flow SHALL remain pending until admin `/publish`.
6. THE Telegram admin flow MAY auto publish as currently implemented.
7. THE composer SHALL require `pair` and `risk` only for Trading Room.
8. THE composer SHALL allow image media.
9. THE composer SHALL store media as `hertz_post_media`.
10. THE feed SHALL truncate long posts and open detail through `/hertz/post/[shortId]`.
11. THE feed SHALL show source, timestamp, badge, category, media, counts, and actions.
12. THE feed SHALL include Horizon-specific vertical category/source indicator as in the mock.
13. THE composer SHALL visually match the desktop mock placement and compact toolbar/chip treatment.
14. THE feed SHALL use category/source spine icons matching the mock direction, including trading/send, community, media, and coffee/life states.
15. THE feed SHALL include community note card styling matching the desktop mock.
16. THE action bar SHALL visually expose comment, repost, quote, Pulse, insight, save/bookmark, and share where applicable.

### Requirement 9: Post interactions

**User Story:** Sebagai verified member, saya ingin Pulse, comment, repost, quote, bookmark, dan share, sehingga HERTZ terasa seperti social media penuh.

#### Acceptance Criteria

1. THE Pulse action SHALL require Verified_Member or Admin.
2. THE system SHALL enforce one active Pulse per user per post.
3. THE comment action SHALL require Verified_Member or Admin.
4. THE comment owner SHALL be able to edit/delete their comment.
5. THE admin SHALL be able to hide/delete any comment.
6. THE plain repost SHALL be allowed once per user per post.
7. THE plain repost SHALL not allow self-repost.
8. THE quote repost SHALL publish immediately.
9. THE quote repost SHALL allow text and media.
10. THE quote repost SHALL be deletable by author or admin.
11. THE bookmark SHALL be private to the user.
12. THE share action SHALL expose a share/copy-link affordance.

### Requirement 10: Community notes

**User Story:** Sebagai verified member, saya ingin menambahkan catatan bersumber, sehingga pembaca mendapat konteks yang bisa diaudit.

#### Acceptance Criteria

1. THE community note create action SHALL require Verified_Member or Admin.
2. THE community note SHALL require at least one source URL.
3. THE source URL SHALL be valid `http` or `https`.
4. THE note SHALL publish immediately.
5. THE feed SHALL show a primary note when available.
6. THE detail page SHALL support multiple notes.
7. THE creator SHALL be able to delete their note.
8. THE admin SHALL be able to hide/remove any note.
9. THE note SHALL store source URLs for audit.
10. THE rating action SHALL support helpful/not helpful where implemented.

### Requirement 11: Blog member publishing

**User Story:** Sebagai verified member, saya ingin membuat artikel Blog, sehingga Horizon punya ruang artikel panjang selain HERTZ feed.

#### Acceptance Criteria

1. THE Blog route SHALL remain `/blog`.
2. THE Blog SHALL be separate from HERTZ feed.
3. THE Blog SHALL use HERTZ desktop shell on desktop.
4. THE Verified_Member SHALL create Blog articles.
5. THE Blog article SHALL publish immediately without review.
6. THE Verified_Member SHALL edit/delete their own Blog articles.
7. THE Admin SHALL edit/delete/unpublish all Blog articles.
8. THE Blog SHALL support cover image.
9. THE Blog SHALL support unique slug.
10. THE Blog SHALL support SEO title, description, canonical, and OG image.
11. THE Blog SHALL support report/takedown guardrail.
12. THE Blog publish event SHALL be eligible for credit through admin settings.

### Requirement 12: Outlook WordPress preservation

**User Story:** Sebagai user, saya ingin Outlook tetap mengambil data WordPress seperti sekarang, sehingga refactor tidak merusak konten yang sudah berjalan.

#### Acceptance Criteria

1. THE Outlook route SHALL remain `/outlook`.
2. THE Outlook source SHALL remain the current WordPress import/sync flow.
3. THE Outlook SHALL be separate from HERTZ feed and Blog.
4. THE Outlook SHALL use HERTZ desktop shell on desktop.
5. THE Outlook SHALL sanitize WordPress content before rendering.
6. THE Outlook SHALL provide fallback UI when WordPress is unavailable.
7. THE Outlook SHALL NOT automatically award credit unless Horizon author mapping is explicit.
8. THE implementation SHALL not rewrite WordPress logic beyond what is required for shell integration.

### Requirement 13: Tools integration

**User Story:** Sebagai trader, saya ingin Tools tetap tersedia dalam shell HERTZ, sehingga navigasi tools tidak terasa terpisah.

#### Acceptance Criteria

1. THE Tools route SHALL remain `/tools`.
2. THE Tools hub SHALL use HERTZ desktop shell.
3. THE right rail market SHALL appear on Tools hub.
4. THE existing tools SHALL continue to work.
5. THE detail tool pages MAY keep their current layout in phase one if full shell migration is too risky.
6. THE implementation SHALL NOT break profitability, CFTC, calendar, or existing tool links.

### Requirement 14: Direct Message

**User Story:** Sebagai verified member, saya ingin DM private, sehingga saya bisa chat dengan member lain seperti social media modern.

#### Acceptance Criteria

1. THE DM route SHALL be `/hertz/messages`.
2. THE DM SHALL require Verified_Member or Admin.
3. THE Guest SHALL NOT read or mutate DM data.
4. THE DM SHALL support all verified member to all verified member.
5. THE DM SHALL use polling every 5-10 seconds in phase one.
6. THE DM SHALL NOT require websocket in phase one.
7. THE DM SHALL support conversation list.
8. THE DM SHALL support message thread.
9. THE DM SHALL support send message.
10. THE DM SHALL support read/unread state.
11. THE DM SHALL support block/report guardrails.
12. THE DM SHALL support image attachments only.
13. THE DM image types SHALL be `jpg`, `jpeg`, `png`, and `webp`.
14. THE DM SHALL limit images to `5MB` each.
15. THE DM SHALL limit attachments to 4 images per message.
16. THE DM SHALL keep messages private by default.
17. WHEN a message is reported, THE admin SHALL see only the reported message plus limited context.
18. THE DM SHALL NOT show market right rail.
19. THE DM desktop UI SHALL follow `V3 / Direct Message Desktop Draft`.
20. THE DM UI SHALL include conversation filters for Inbox, Unread, Admin, and Archived if supported by backend data.
21. THE DM nav item SHALL be Direct Message even if the Figma layer name still says Gallery.

### Requirement 15: Admin panel and moderation

**User Story:** Sebagai admin, saya ingin admin panel mengikuti HERTZ, sehingga queue, moderation, dan settings tetap mudah dikelola.

#### Acceptance Criteria

1. THE admin module SHALL be renamed from Signal Ledger to Hertz.
2. THE admin route SHALL be `/admin/hertz`.
3. THE admin SHALL publish/reject Telegram pending posts.
4. THE admin SHALL hide/delete posts.
5. THE admin SHALL hide/delete comments.
6. THE admin SHALL hide/delete community notes.
7. THE admin SHALL manage credit amounts from dashboard.
8. THE admin SHALL see pending Telegram count only as admin.
9. THE admin SHALL have access to Blog takedown/unpublish.
10. THE admin SHALL have report review tools for Blog, posts, notes, and DM reports.
11. THE system SHALL log moderation actions.

### Requirement 16: Database and data reset

**User Story:** Sebagai maintainer, saya ingin schema bersih `hertz_*`, sehingga kode tidak membawa sisa nama lama.

#### Acceptance Criteria

1. THE new domain tables SHALL use `hertz_*` names.
2. THE migration SHALL avoid mixed `signal_ledger` naming.
3. THE migration MAY drop/create old testing domain tables because data lama reset total.
4. THE reset process SHALL include new seed data.
5. THE reset process SHALL not run production destructive commands without explicit confirmation.
6. THE schema SHALL include `hertz_posts`.
7. THE schema SHALL include `hertz_post_media`.
8. THE schema SHALL include `hertz_comments`.
9. THE schema SHALL include `hertz_reactions`.
10. THE schema SHALL include `hertz_reposts`.
11. THE schema SHALL include `hertz_bookmarks`.
12. THE schema SHALL include `hertz_community_notes`.
13. THE schema SHALL include `hertz_conversations`.
14. THE schema SHALL include `hertz_messages`.

### Requirement 17: Credit ledger and settings

**User Story:** Sebagai admin, saya ingin credit bisa diatur manual, sehingga reward HERTZ fleksibel.

#### Acceptance Criteria

1. THE HERTZ post publish event SHALL be credit eligible.
2. THE Telegram publish event SHALL be credit eligible.
3. THE Blog publish event SHALL be credit eligible.
4. THE credit amount SHALL NOT be hardcoded.
5. THE credit amount SHALL come from admin dashboard settings.
6. THE credit ledger SHALL be idempotent.
7. THE same entity/user/event SHALL not receive duplicate credit.
8. THE edit/re-publish flow SHALL not duplicate credit.
9. THE DM SHALL NOT give credit.
10. THE Outlook SHALL NOT give credit automatically.
11. THE Pulse/comment/repost credit behavior SHALL follow admin settings if enabled.

### Requirement 18: Telegram bot refactor

**User Story:** Sebagai admin, saya ingin Telegram flow lama tetap jalan, sehingga kebiasaan publish dari grup tidak hilang.

#### Acceptance Criteria

1. THE Telegram bot SHALL keep current posting flow.
2. THE `/publish` command SHALL remain for member Telegram posts.
3. THE bot copy SHALL rename Signal Ledger wording to HERTZ.
4. THE admin queue copy SHALL rename Signal Ledger wording to HERTZ.
5. THE bot SHALL map current hashtags into HERTZ categories.
6. THE bot SHALL store media as HERTZ post media.
7. THE bot SHALL prevent duplicate posts by Telegram message id.
8. THE bot SHALL award credit once after publish according to settings.

### Requirement 19: Mobile readiness

**User Story:** Sebagai owner, saya ingin mobile ditunda tetapi tidak diblokir, sehingga backend dan struktur tidak menyulitkan fase mobile.

#### Acceptance Criteria

1. THE mobile visual implementation MAY be deferred.
2. THE backend SHALL be ready for mobile clients.
3. THE desktop layout SHALL avoid assumptions that make mobile impossible.
4. THE right rail SHALL be hideable on mobile.
5. THE left rail SHALL be replaceable by compact mobile navigation.
6. THE saved mobile mocks SHALL remain reference material.

### Requirement 20: Seed, QA, and deployment checks

**User Story:** Sebagai tester, saya ingin seed lengkap dan audit, sehingga hasil refactor bisa dinilai sebelum deploy.

#### Acceptance Criteria

1. THE seed SHALL include many HERTZ posts.
2. THE seed SHALL include Trading Room, Life & Coffee, General, and Community Note examples.
3. THE seed SHALL include images/media.
4. THE seed SHALL include comments, Pulse counts, reposts, bookmarks, and notes.
5. THE seed SHALL include Blog examples.
6. THE seed SHALL include DM conversations/messages.
7. THE seed SHALL include market mock data.
8. THE implementation SHALL run build checks.
9. THE implementation SHALL run relevant tests.
10. THE implementation SHALL perform visual QA against Figma/mock references.
11. THE implementation SHALL verify docker compatibility because production uses Docker.
12. THE audit SHALL compare implementation against this spec.
13. THE visual QA SHALL explicitly check the Figma frames `40:2`, `84:2`, `84:1368`, `84:2770`, `84:4014`, and `104:2`.
14. THE visual QA SHALL check that visible text uses `HERTZ`, not stale `HERTS` or `Signal Ledger`.
15. THE visual QA SHALL check that Direct Message replaces stale Gallery copy in the final menu.

### Requirement 21: Code organization

**User Story:** Sebagai maintainer, saya ingin kode dipisah berdasarkan fungsi, sehingga refactor besar tetap mudah dirawat.

#### Acceptance Criteria

1. THE API routes SHALL remain thin.
2. THE business logic SHALL live in services.
3. THE database queries SHALL live in repositories.
4. THE shared types SHALL live in shared/domain type files.
5. THE frontend components SHALL be split by feature and function.
6. THE implementation SHALL avoid giant page files.
7. THE implementation SHALL follow project file length discipline where practical.
8. THE implementation SHALL read relevant Next.js docs before app route work.
9. THE implementation SHALL preserve unrelated user changes.
