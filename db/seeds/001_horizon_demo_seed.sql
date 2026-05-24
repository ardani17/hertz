-- ============================================
-- Horizon Trader Platform
-- Unified demo seed: full product surfaces + profiles
-- Safe to re-run: fixed UUID prefixes, cleanup first.
-- ============================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- Comprehensive cleanup (dependency order)
-- ---------------------------------------------------------------------------
UPDATE hertz_conversations SET last_message_id = NULL
WHERE id::text LIKE '82000000-0000-0000-0000-0000000000%';

DELETE FROM notification_events WHERE id::text LIKE '96500000-0000-0000-0000-0000000000%';
DELETE FROM device_tokens WHERE id::text LIKE '96000000-0000-0000-0000-0000000000%';
DELETE FROM challenge_ai_reviews WHERE id::text LIKE '95500000-0000-0000-0000-0000000000%';
DELETE FROM challenge_trades WHERE id::text LIKE '95400000-0000-0000-0000-0000000000%';
DELETE FROM challenge_personas WHERE id::text LIKE '95300000-0000-0000-0000-0000000000%';
DELETE FROM challenge_accounts WHERE id::text LIKE '95200000-0000-0000-0000-0000000000%';
DELETE FROM hertz_notifications WHERE id::text LIKE '90000000-0000-0000-0000-0000000000%';
DELETE FROM hertz_post_stats WHERE post_id::text LIKE '71000000-0000-0000-0000-0000000000%';
DELETE FROM hertz_message_reports WHERE message_id::text LIKE '83000000-0000-0000-0000-0000000000%';
DELETE FROM hertz_message_attachments WHERE message_id::text LIKE '83000000-0000-0000-0000-0000000000%';
DELETE FROM hertz_messages WHERE id::text LIKE '83000000-0000-0000-0000-0000000000%';
DELETE FROM hertz_conversation_participants WHERE conversation_id::text LIKE '82000000-0000-0000-0000-0000000000%';
DELETE FROM hertz_conversations WHERE id::text LIKE '82000000-0000-0000-0000-0000000000%';
DELETE FROM hertz_blocks WHERE id::text LIKE '84000000-0000-0000-0000-0000000000%';
DELETE FROM hertz_community_note_ratings WHERE note_id::text LIKE '73000000-0000-0000-0000-0000000000%';
DELETE FROM hertz_community_note_sources WHERE note_id::text LIKE '73000000-0000-0000-0000-0000000000%';
DELETE FROM hertz_community_notes WHERE id::text LIKE '73000000-0000-0000-0000-0000000000%';
DELETE FROM hertz_reports WHERE id::text LIKE '75000000-0000-0000-0000-0000000000%' OR target_id::text LIKE '71000000-0000-0000-0000-0000000000%';
DELETE FROM hertz_comments WHERE post_id::text LIKE '71000000-0000-0000-0000-0000000000%';
DELETE FROM hertz_reposts WHERE id::text LIKE '74100000-0000-0000-0000-0000000000%' OR original_post_id::text LIKE '71000000-0000-0000-0000-0000000000%' OR repost_post_id::text LIKE '71000000-0000-0000-0000-0000000000%';
DELETE FROM hertz_bookmarks WHERE id::text LIKE '74200000-0000-0000-0000-0000000000%' OR post_id::text LIKE '71000000-0000-0000-0000-0000000000%';
DELETE FROM hertz_reactions WHERE post_id::text LIKE '71000000-0000-0000-0000-0000000000%';
DELETE FROM hertz_views WHERE post_id::text LIKE '71000000-0000-0000-0000-0000000000%';
DELETE FROM hertz_post_market_context WHERE post_id::text LIKE '71000000-0000-0000-0000-0000000000%';
DELETE FROM hertz_post_media WHERE post_id::text LIKE '71000000-0000-0000-0000-0000000000%';
DELETE FROM hertz_credit_ledger WHERE id::text LIKE '85000000-0000-0000-0000-0000000000%';
DELETE FROM hertz_posts WHERE id::text LIKE '71000000-0000-0000-0000-0000000000%';
DELETE FROM post_reports WHERE post_id::text LIKE '61000000-0000-0000-0000-0000000000%' OR post_id::text LIKE '30000000-0000-0000-0000-0000000000%';
DELETE FROM community_note_ratings WHERE note_id::text LIKE '63000000-0000-0000-0000-0000000000%' OR note_id::text LIKE '50000000-0000-0000-0000-0000000000%';
DELETE FROM community_note_sources WHERE note_id::text LIKE '63000000-0000-0000-0000-0000000000%' OR note_id::text LIKE '50000000-0000-0000-0000-0000000000%';
DELETE FROM community_notes WHERE id::text LIKE '63000000-0000-0000-0000-0000000000%' OR id::text LIKE '50000000-0000-0000-0000-0000000000%';
DELETE FROM post_comments WHERE id::text LIKE '62600000-0000-0000-0000-0000000000%' OR id::text LIKE '60000000-0000-0000-0000-0000000000%';
DELETE FROM post_reposts WHERE original_post_id::text LIKE '61000000-0000-0000-0000-0000000000%' OR repost_post_id::text LIKE '61000000-0000-0000-0000-0000000000%' OR original_post_id::text LIKE '30000000-0000-0000-0000-0000000000%' OR repost_post_id::text LIKE '30000000-0000-0000-0000-0000000000%';
DELETE FROM post_bookmarks WHERE post_id::text LIKE '61000000-0000-0000-0000-0000000000%' OR post_id::text LIKE '30000000-0000-0000-0000-0000000000%';
DELETE FROM post_reactions WHERE post_id::text LIKE '61000000-0000-0000-0000-0000000000%' OR post_id::text LIKE '30000000-0000-0000-0000-0000000000%';
DELETE FROM post_views WHERE post_id::text LIKE '61000000-0000-0000-0000-0000000000%' OR post_id::text LIKE '30000000-0000-0000-0000-0000000000%';
DELETE FROM post_market_context WHERE post_id::text LIKE '61000000-0000-0000-0000-0000000000%' OR post_id::text LIKE '30000000-0000-0000-0000-0000000000%';
DELETE FROM feed_posts WHERE id::text LIKE '61000000-0000-0000-0000-0000000000%' OR id::text LIKE '30000000-0000-0000-0000-0000000000%';
DELETE FROM comments WHERE id::text LIKE '68000000-0000-0000-0000-0000000000%';
DELETE FROM likes WHERE id::text LIKE '68500000-0000-0000-0000-0000000000%';
DELETE FROM credit_transactions WHERE id::text LIKE '86000000-0000-0000-0000-0000000000%' OR source_id::text LIKE '20000000-0000-0000-0000-0000000000%';
DELETE FROM activity_logs WHERE id::text LIKE '87000000-0000-0000-0000-0000000000%';
DELETE FROM wordpress_import_jobs WHERE id::text LIKE '88000000-0000-0000-0000-0000000000%' OR id::text LIKE '88100000-0000-0000-0000-0000000000%';
DELETE FROM api_keys WHERE id::text LIKE '97000000-0000-0000-0000-0000000000%';
DELETE FROM media WHERE id::text LIKE '54000000-0000-0000-0000-0000000000%' OR id::text LIKE '54100000-0000-0000-0000-0000000000%' OR id::text LIKE '40000000-0000-0000-0000-0000000000%';
DELETE FROM articles WHERE id::text LIKE '51000000-0000-0000-0000-0000000000%' OR id::text LIKE '20000000-0000-0000-0000-0000000000%';
DELETE FROM hertz_membership_checks WHERE id::text LIKE '12000000-0000-0000-0000-0000000000%' OR telegram_id BETWEEN 920000001 AND 920000999 OR telegram_id BETWEEN 910000001 AND 910000008;

-- Legacy seed 001: clear FKs before user delete
DELETE FROM activity_logs WHERE actor_id::text LIKE '10000000-0000-0000-0000-0000000000%' OR target_id::text LIKE '10000000-0000-0000-0000-0000000000%';
DELETE FROM credit_transactions WHERE user_id::text LIKE '10000000-0000-0000-0000-0000000000%';
DELETE FROM hertz_membership_checks WHERE user_id::text LIKE '10000000-0000-0000-0000-0000000000%';

DELETE FROM users WHERE telegram_id BETWEEN 910000001 AND 910000008 OR id::text LIKE '10000000-0000-0000-0000-0000000000%';

DELETE FROM activity_logs WHERE actor_id IN (SELECT id FROM users WHERE telegram_id BETWEEN 920000001 AND 920000999)
   OR target_id IN (SELECT id FROM users WHERE telegram_id BETWEEN 920000001 AND 920000999);
DELETE FROM users WHERE telegram_id BETWEEN 920000001 AND 920000999;

-- ---------------------------------------------------------------------------
-- Users (18 verified + admin + 3 edge cases)
-- ---------------------------------------------------------------------------
INSERT INTO users (
  id, telegram_id, username, display_name, avatar_url, role,
  credit_balance, telegram_first_name, telegram_last_name,
  verified_member_at, muted_until, banned_at,
  profile_bio, profile_location, profile_hobbies, profile_social_links, profile_trading, profile_updated_at,
  created_at
) VALUES

  ('11000000-0000-0000-0000-000000000001', 920000001, 'mira_fx', 'Mira FX', 'https://api.dicebear.com/8.x/initials/svg?seed=Mira%20FX&backgroundColor=064e3b&textColor=d1fae5', 'member', 312, 'Mira', 'FX', NOW() - INTERVAL '95 days', NULL, NULL, 'Trader forex fokus XAUUSD dan EURUSD. Suka breakdown sesi London dengan catatan risk ketat.', 'Jakarta, ID', '["jurnal trading", "fotografi chart", "kopi single origin"]'::jsonb, '{"x": "mira_fx", "instagram": "mira.fx.id", "youtube": "mirafxtrades", "telegram": "mira_fx_room", "tradingview": "MiraFX", "linkedin": "mira-fx"}'::jsonb, '{"experienceLevel": "advanced", "markets": ["forex", "commodities"], "sinceYear": 2016, "style": "Session-based price action"}'::jsonb, NOW() - INTERVAL '3 days', NOW() - INTERVAL '110 days'),
  ('11000000-0000-0000-0000-000000000002', 920000002, 'langit_trading', 'Langit Trading', 'https://api.dicebear.com/8.x/initials/svg?seed=Langit%20Trading&backgroundColor=052e16&textColor=bbf7d0', 'member', 278, 'Langit', 'Trading', NOW() - INTERVAL '84 days', NULL, NULL, 'Swing trader pair mayor. Lebih suka menunggu struktur H4 bersih daripada scalping di tengah range.', 'Bandung, ID', '["membaca macro", "cycling", "podcast trading"]'::jsonb, '{"x": "langit_trading", "instagram": "langit.trading", "youtube": "langittradingid", "telegram": "langit_trading", "tradingview": "LangitTrading"}'::jsonb, '{"experienceLevel": "intermediate", "markets": ["forex"], "sinceYear": 2018, "style": "Swing trading"}'::jsonb, NOW() - INTERVAL '3 days', NOW() - INTERVAL '100 days'),
  ('11000000-0000-0000-0000-000000000003', 920000003, 'raka_macro', 'Raka Macro', 'https://api.dicebear.com/8.x/initials/svg?seed=Raka%20Macro&backgroundColor=0f172a&textColor=34d399', 'member', 256, 'Raka', 'Macro', NOW() - INTERVAL '72 days', NULL, NULL, 'Macro-first trader. Data DXY, yield, dan risk sentiment jadi filter sebelum sentuh chart intraday.', 'Surabaya, ID', '["ekonomi global", "bullet journal", "run pagi"]'::jsonb, '{"x": "raka_macro", "instagram": "raka.macro", "tradingview": "RakaMacro", "linkedin": "raka-macro"}'::jsonb, '{"experienceLevel": "professional", "markets": ["forex", "indices", "commodities"], "sinceYear": 2012, "style": "Macro + intraday confluence"}'::jsonb, NOW() - INTERVAL '3 days', NOW() - INTERVAL '88 days'),
  ('11000000-0000-0000-0000-000000000004', 920000004, 'sena_scalper', 'Sena Scalper', 'https://api.dicebear.com/8.x/initials/svg?seed=Sena%20Scalper&backgroundColor=14532d&textColor=ecfdf5', 'member', 241, 'Sena', 'Scalper', NOW() - INTERVAL '61 days', NULL, NULL, 'Scalper sesi London–New York overlap. Prop firm evaluation aktif, disiplin max 3 trade/hari.', 'Yogyakarta, ID', '["scalping journal", "badminton", "meal prep"]'::jsonb, '{"x": "sena_scalper", "instagram": "sena.scalper", "youtube": "senascalps", "telegram": "sena_scalper", "tradingview": "SenaScalper"}'::jsonb, '{"experienceLevel": "advanced", "markets": ["forex", "indices"], "sinceYear": 2019, "style": "Liquidity scalping"}'::jsonb, NOW() - INTERVAL '3 days', NOW() - INTERVAL '80 days'),
  ('11000000-0000-0000-0000-000000000005', 920000005, 'nara_alpha', 'Nara Alpha', 'https://api.dicebear.com/8.x/initials/svg?seed=Nara%20Alpha&backgroundColor=022c22&textColor=6ee7b7', 'member', 198, 'Nara', 'Alpha', NOW() - INTERVAL '53 days', NULL, NULL, 'Penulis blog risk management. Percaya ukuran posisi konsisten lebih penting dari win rate tinggi.', 'Semarang, ID', '["menulis", "community building", "yoga"]'::jsonb, '{"x": "nara_alpha", "instagram": "nara.alpha", "youtube": "naraalpha", "linkedin": "nara-alpha"}'::jsonb, '{"experienceLevel": "intermediate", "markets": ["forex", "crypto"], "sinceYear": 2020, "style": "Risk-first discretionary"}'::jsonb, NOW() - INTERVAL '3 days', NOW() - INTERVAL '66 days'),
  ('11000000-0000-0000-0000-000000000006', 920000006, 'deka_notes', 'Deka Notes', 'https://api.dicebear.com/8.x/initials/svg?seed=Deka%20Notes&backgroundColor=1f2937&textColor=10b981', 'member', 186, 'Deka', 'Notes', NOW() - INTERVAL '44 days', NULL, NULL, 'Community notes & konteks pasar. Sering tambahkan sumber resmi di diskusi liquidity.', 'Malang, ID', '["riset pasar", "community notes", "film dokumenter"]'::jsonb, '{"x": "deka_notes", "telegram": "deka_notes", "tradingview": "DekaNotes"}'::jsonb, '{"experienceLevel": "advanced", "markets": ["forex", "commodities"], "sinceYear": 2017, "style": "Context-first analysis"}'::jsonb, NOW() - INTERVAL '3 days', NOW() - INTERVAL '58 days'),
  ('11000000-0000-0000-0000-000000000007', 920000007, 'viona_research', 'Viona Research', 'https://api.dicebear.com/8.x/initials/svg?seed=Viona%20Research&backgroundColor=064e3b&textColor=a7f3d0', 'member', 172, 'Viona', 'Research', NOW() - INTERVAL '37 days', NULL, NULL, 'Research liquidity & order flow snapshot untuk sesi US. Outlook chart + video singkat.', 'Tangerang, ID', '["data pasar", "infografis", "jalan kaki"]'::jsonb, '{"x": "viona_research", "instagram": "viona.research", "youtube": "vionaresearch", "tradingview": "VionaResearch", "linkedin": "viona-research"}'::jsonb, '{"experienceLevel": "professional", "markets": ["forex", "indices", "commodities"], "sinceYear": 2014, "style": "Liquidity research"}'::jsonb, NOW() - INTERVAL '3 days', NOW() - INTERVAL '46 days'),
  ('11000000-0000-0000-0000-000000000008', 920000008, 'kai_journal', 'Kai Journal', 'https://api.dicebear.com/8.x/initials/svg?seed=Kai%20Journal&backgroundColor=0f766e&textColor=ecfeff', 'member', 154, 'Kai', 'Journal', NOW() - INTERVAL '30 days', NULL, NULL, 'Jurnal trading harian dengan fokus psikologi. Review process > hasil PnL harian.', 'Bali, ID', '["journaling", "membaca", "surfing ringan"]'::jsonb, '{"x": "kai_journal", "instagram": "kai.journal", "telegram": "kai_journal"}'::jsonb, '{"experienceLevel": "intermediate", "markets": ["forex", "crypto"], "sinceYear": 2021, "style": "Process journaling"}'::jsonb, NOW() - INTERVAL '3 days', NOW() - INTERVAL '38 days'),
  ('11000000-0000-0000-0000-000000000009', 920000009, 'bayu_digest', 'Bayu Digest', 'https://api.dicebear.com/8.x/initials/svg?seed=Bayu%20Digest&backgroundColor=064e3b&textColor=ffffff', 'member', 128, 'Bayu', 'Digest', NOW() - INTERVAL '24 days', NULL, NULL, 'Digest harian pasar: ringkas, tanpa noise. Cocok untuk trader yang punya waktu terbatas.', 'Medan, ID', '["newsletter", "running", "kopi tubruk"]'::jsonb, '{"x": "bayu_digest", "youtube": "bayudigest", "telegram": "bayu_digest"}'::jsonb, '{"experienceLevel": "intermediate", "markets": ["indices", "commodities"], "sinceYear": 2019, "style": "Market digest"}'::jsonb, NOW() - INTERVAL '3 days', NOW() - INTERVAL '31 days'),
  ('11000000-0000-0000-0000-000000000010', 920000010, 'admin_hertz', 'Admin HERTZ', 'https://api.dicebear.com/8.x/initials/svg?seed=Admin%20HERTZ&backgroundColor=020617&textColor=22c55e', 'admin', 420, 'Admin', 'HERTZ', NOW() - INTERVAL '150 days', NULL, NULL, 'Admin platform Horizon HERTZ. Moderasi konten, publish queue Telegram, dan audit tools.', 'Jakarta, ID', '["product ops", "moderation", "automation"]'::jsonb, '{"x": "horizon_hertz", "telegram": "horizon_admin", "linkedin": "horizon-hertz"}'::jsonb, '{"experienceLevel": "professional", "markets": ["forex", "crypto", "indices"], "sinceYear": 2010, "style": "Platform oversight"}'::jsonb, NOW() - INTERVAL '3 days', NOW() - INTERVAL '160 days'),
  ('11000000-0000-0000-0000-000000000011', 920000011, 'pending_member', 'Pending Member', 'https://api.dicebear.com/8.x/initials/svg?seed=Pending%20Member&backgroundColor=374151&textColor=d1d5db', 'member', 0, 'Pending', 'Member', NULL, NULL, NULL, NULL, NULL, '[]'::jsonb, '{}'::jsonb, '{}'::jsonb, NULL, NOW() - INTERVAL '3 days'),
  ('11000000-0000-0000-0000-000000000012', 920000012, 'muted_trader', 'Muted Trader', 'https://api.dicebear.com/8.x/initials/svg?seed=Muted%20Trader&backgroundColor=78350f&textColor=fde68a', 'member', 88, 'Muted', 'Trader', NOW() - INTERVAL '40 days', NOW() + INTERVAL '2 days', NULL, 'Akun demo muted untuk audit moderasi.', 'Solo, ID', '["testing"]'::jsonb, '{"telegram": "muted_trader"}'::jsonb, '{"experienceLevel": "beginner", "markets": ["forex"], "sinceYear": 2024, "style": "Demo only"}'::jsonb, NOW() - INTERVAL '3 days', NOW() - INTERVAL '50 days'),
  ('11000000-0000-0000-0000-000000000013', 920000013, 'banned_spam', 'Banned Spam', 'https://api.dicebear.com/8.x/initials/svg?seed=Banned%20Spam&backgroundColor=450a0a&textColor=fca5a5', 'member', 0, 'Banned', 'Spam', NOW() - INTERVAL '60 days', NULL, NOW() - INTERVAL '1 day', NULL, NULL, '[]'::jsonb, '{}'::jsonb, '{}'::jsonb, NULL, NOW() - INTERVAL '70 days'),
  ('11000000-0000-0000-0000-000000000014', 920000014, 'arjun_swing', 'Arjun Swing', 'https://api.dicebear.com/8.x/initials/svg?seed=Arjun%20Swing&backgroundColor=1e3a8a&textColor=bfdbfe', 'member', 305, 'Arjun', 'Swing', NOW() - INTERVAL '105 days', NULL, NULL, 'Swing trader indeks US & gold. Entry hanya setelah H4 close bersih.', 'Depok, ID', '["swing setup", "chess", "memasak"]'::jsonb, '{"x": "arjun_swing", "tradingview": "ArjunSwing", "youtube": "arjunswing"}'::jsonb, '{"experienceLevel": "advanced", "markets": ["indices", "commodities"], "sinceYear": 2015, "style": "Swing H4/D1"}'::jsonb, NOW() - INTERVAL '3 days', NOW() - INTERVAL '120 days'),
  ('11000000-0000-0000-0000-000000000015', 920000015, 'citra_futures', 'Citra Futures', 'https://api.dicebear.com/8.x/initials/svg?seed=Citra%20Futures&backgroundColor=701a75&textColor=f5d0fe', 'member', 292, 'Citra', 'Futures', NOW() - INTERVAL '78 days', NULL, NULL, 'Fokus kontrak futures energi & metal. Selalu catat slippage aktual vs planned.', 'Balikpapan, ID', '["energi", "risk log", "snorkeling"]'::jsonb, '{"x": "citra_futures", "instagram": "citra.futures", "tradingview": "CitraFutures"}'::jsonb, '{"experienceLevel": "professional", "markets": ["commodities", "options"], "sinceYear": 2013, "style": "Futures relative value"}'::jsonb, NOW() - INTERVAL '3 days', NOW() - INTERVAL '95 days'),
  ('11000000-0000-0000-0000-000000000016', 920000016, 'dimas_crypto', 'Dimas Crypto', 'https://api.dicebear.com/8.x/initials/svg?seed=Dimas%20Crypto&backgroundColor=312e81&textColor=ddd6fe', 'member', 224, 'Dimas', 'Crypto', NOW() - INTERVAL '55 days', NULL, NULL, 'Crypto intraday dengan filter BTC dominance. Tidak trade alt saat BTC range sempit.', 'Jakarta, ID', '["on-chain lite", "gaming", "kopi"]'::jsonb, '{"x": "dimas_crypto", "youtube": "dimascrypto", "telegram": "dimas_crypto", "tradingview": "DimasCrypto"}'::jsonb, '{"experienceLevel": "advanced", "markets": ["crypto"], "sinceYear": 2018, "style": "BTC-led alt rotation"}'::jsonb, NOW() - INTERVAL '3 days', NOW() - INTERVAL '72 days'),
  ('11000000-0000-0000-0000-000000000017', 920000017, 'elisa_macro', 'Elisa Macro', 'https://api.dicebear.com/8.x/initials/svg?seed=Elisa%20Macro&backgroundColor=831843&textColor=fbcfe8', 'member', 201, 'Elisa', 'Macro', NOW() - INTERVAL '48 days', NULL, NULL, 'Macro calendar trader: CPI, NFP, FOMC. Size turun otomatis di hari berita merah.', 'Bogor, ID', '["kalender ekonomi", "membaca laporan", "yoga"]'::jsonb, '{"x": "elisa_macro", "linkedin": "elisa-macro", "tradingview": "ElisaMacro"}'::jsonb, '{"experienceLevel": "professional", "markets": ["forex", "indices"], "sinceYear": 2011, "style": "Event-driven macro"}'::jsonb, NOW() - INTERVAL '3 days', NOW() - INTERVAL '65 days'),
  ('11000000-0000-0000-0000-000000000018', 920000018, 'fajar_indices', 'Fajar Indices', 'https://api.dicebear.com/8.x/initials/svg?seed=Fajar%20Indices&backgroundColor=134e4a&textColor=99f6e4', 'member', 176, 'Fajar', 'Indices', NOW() - INTERVAL '41 days', NULL, NULL, 'NASDAQ & SPX session trader. Breadth dan sector rotation jadi filter utama.', 'Surabaya, ID', '["sector rotation", "basketball", "podcast"]'::jsonb, '{"x": "fajar_indices", "youtube": "fajarindices", "tradingview": "FajarIndices"}'::jsonb, '{"experienceLevel": "intermediate", "markets": ["indices", "stocks"], "sinceYear": 2020, "style": "US index session"}'::jsonb, NOW() - INTERVAL '3 days', NOW() - INTERVAL '52 days'),
  ('11000000-0000-0000-0000-000000000019', 920000019, 'gita_options', 'Gita Options', 'https://api.dicebear.com/8.x/initials/svg?seed=Gita%20Options&backgroundColor=7c2d12&textColor=fed7aa', 'member', 142, 'Gita', 'Options', NOW() - INTERVAL '33 days', NULL, NULL, 'Options defined-risk untuk hedge portofolio swing. Tidak sell naked premium.', 'Jakarta, ID', '["options math", "pilates", "wine tasting"]'::jsonb, '{"x": "gita_options", "linkedin": "gita-options", "youtube": "gitaoptions"}'::jsonb, '{"experienceLevel": "advanced", "markets": ["options", "stocks"], "sinceYear": 2017, "style": "Defined-risk hedging"}'::jsonb, NOW() - INTERVAL '3 days', NOW() - INTERVAL '44 days'),
  ('11000000-0000-0000-0000-000000000020', 920000020, 'hendra_commod', 'Hendra Commod', 'https://api.dicebear.com/8.x/initials/svg?seed=Hendra%20Commod&backgroundColor=713f12&textColor=fef3c7', 'member', 118, 'Hendra', 'Commod', NOW() - INTERVAL '28 days', NULL, NULL, 'Komoditas agrikultur & softs untuk diversifikasi. Lebih lambat tapi stabil untuk journal panjang.', 'Pontianak, ID', '["komoditas", "memancing", "blog"]'::jsonb, '{"x": "hendra_commod", "tradingview": "HendraCommod"}'::jsonb, '{"experienceLevel": "intermediate", "markets": ["commodities"], "sinceYear": 2019, "style": "Slow commodity swings"}'::jsonb, NOW() - INTERVAL '3 days', NOW() - INTERVAL '36 days'),
  ('11000000-0000-0000-0000-000000000021', 920000021, 'indah_scalp', 'Indah Scalp', 'https://api.dicebear.com/8.x/initials/svg?seed=Indah%20Scalp&backgroundColor=9f1239&textColor=fecdd3', 'member', 95, 'Indah', 'Scalp', NOW() - INTERVAL '22 days', NULL, NULL, 'Scalper M5 EURUSD & GBPUSD. Rule ketat: stop setelah 2 loss berturut.', 'Makassar, ID', '["scalping", "lari pagi", "musik"]'::jsonb, '{"x": "indah_scalp", "instagram": "indah.scalp", "telegram": "indah_scalp"}'::jsonb, '{"experienceLevel": "intermediate", "markets": ["forex"], "sinceYear": 2022, "style": "Tight scalp rules"}'::jsonb, NOW() - INTERVAL '3 days', NOW() - INTERVAL '30 days'),
  ('11000000-0000-0000-0000-000000000022', 920000022, 'joko_review', 'Joko Review', 'https://api.dicebear.com/8.x/initials/svg?seed=Joko%20Review&backgroundColor=1c1917&textColor=e7e5e4', 'member', 82, 'Joko', 'Review', NOW() - INTERVAL '18 days', NULL, NULL, 'Review setup komunitas & quality check postingan. Bantu member baru pahami konteks risk.', 'Solo, ID', '["peer review", "mentoring", "wayang"]'::jsonb, '{"x": "joko_review", "telegram": "joko_review"}'::jsonb, '{"experienceLevel": "beginner", "markets": ["forex"], "sinceYear": 2023, "style": "Community review"}'::jsonb, NOW() - INTERVAL '3 days', NOW() - INTERVAL '25 days')

ON CONFLICT (id) DO UPDATE SET
  telegram_id = EXCLUDED.telegram_id,
  username = EXCLUDED.username,
  display_name = EXCLUDED.display_name,
  avatar_url = EXCLUDED.avatar_url,
  role = EXCLUDED.role,
  credit_balance = EXCLUDED.credit_balance,
  telegram_first_name = EXCLUDED.telegram_first_name,
  telegram_last_name = EXCLUDED.telegram_last_name,
  verified_member_at = EXCLUDED.verified_member_at,
  muted_until = EXCLUDED.muted_until,
  banned_at = EXCLUDED.banned_at,
  profile_bio = EXCLUDED.profile_bio,
  profile_location = EXCLUDED.profile_location,
  profile_hobbies = EXCLUDED.profile_hobbies,
  profile_social_links = EXCLUDED.profile_social_links,
  profile_trading = EXCLUDED.profile_trading,
  profile_updated_at = EXCLUDED.profile_updated_at;


INSERT INTO hertz_membership_checks (id, user_id, telegram_id, group_id, is_member, checked_at, last_verified_at, raw_response, created_at, updated_at)
SELECT
  ('12000000-0000-0000-0000-0000000000' || lpad(row_number() OVER (ORDER BY telegram_id)::text, 2, '0'))::uuid,
  id, telegram_id, -1001916607651,
  CASE WHEN telegram_id IN (920000011, 920000013) THEN false ELSE true END,
  NOW() - (row_number() OVER (ORDER BY telegram_id) || ' minutes')::interval,
  CASE WHEN telegram_id IN (920000011, 920000013) THEN NULL ELSE NOW() - INTERVAL '4 minutes' END,
  jsonb_build_object('isMember', CASE WHEN telegram_id IN (920000011, 920000013) THEN false ELSE true END, 'source', 'seed'),
  NOW(), NOW()
FROM users
WHERE telegram_id BETWEEN 920000001 AND 920000022
ON CONFLICT (telegram_id, group_id) DO UPDATE SET
  user_id = EXCLUDED.user_id,
  is_member = EXCLUDED.is_member,
  checked_at = EXCLUDED.checked_at,
  last_verified_at = EXCLUDED.last_verified_at,
  raw_response = EXCLUDED.raw_response,
  updated_at = NOW();

-- ---------------------------------------------------------------------------
-- Outlook articles (8+)
-- ---------------------------------------------------------------------------
INSERT INTO articles (id, author_id, content_html, title, category, source, status, slug, created_at)
VALUES
  ('51000000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000003', '', 'Video Outlook: XAUUSD London liquidity sweep', 'outlook', 'web', 'published', 'outlook-xauusd-london-liquidity-sweep', NOW() - INTERVAL '35 minutes'),
  ('51000000-0000-0000-0000-000000000002', '11000000-0000-0000-0000-000000000007', '<p>Crypto watchlist fokus BTC/USDT setelah market gagal memperpanjang momentum di atas 66.800. Reclaim 67.200 menjadi trigger agresif.</p>', 'Long Read: BTC butuh reclaim 67.2K', 'outlook', 'web', 'published', 'outlook-btc-reclaim-67200', NOW() - INTERVAL '2 hours'),
  ('51000000-0000-0000-0000-000000000003', '11000000-0000-0000-0000-000000000009', '<p>NASDAQ breadth intraday mulai menyempit di resistance. Tunggu demand kecil sebelum follow trend.</p>', 'Chart Note: NASDAQ breadth melemah', 'outlook', 'web', 'published', 'outlook-nasdaq-breadth-melemah', NOW() - INTERVAL '3 hours'),
  ('51000000-0000-0000-0000-000000000004', '11000000-0000-0000-0000-000000000003', '<p>DXY range Asia masih rapat. Pair mayor punya ruang koreksi selama index di bawah 104.20.</p>', 'Chart Note: DXY menjaga range Asia', 'outlook', 'web', 'published', 'outlook-dxy-range-asia', NOW() - INTERVAL '5 hours'),
  ('51000000-0000-0000-0000-000000000005', '11000000-0000-0000-0000-000000000007', '', 'Video Outlook: ETH relative strength vs BTC', 'outlook', 'web', 'published', 'outlook-eth-relative-strength', NOW() - INTERVAL '7 hours'),
  ('51000000-0000-0000-0000-000000000006', '11000000-0000-0000-0000-000000000009', '<p>Dow defensif dengan energi menopang. Breadth belum cukup untuk trend continuation penuh.</p>', 'Long Read: Dow defensif, energi menopang', 'outlook', 'web', 'published', 'outlook-dow-defensive-energy', NOW() - INTERVAL '12 hours'),
  ('51000000-0000-0000-0000-000000000007', '11000000-0000-0000-0000-000000000017', '<p>Oil WTI masih range-bound. Break 78.40 dengan volume baru valid untuk continuation.</p>', 'Chart Note: WTI menunggu break 78.40', 'outlook', 'web', 'published', 'outlook-wti-break-7840', NOW() - INTERVAL '14 hours'),
  ('51000000-0000-0000-0000-000000000008', '11000000-0000-0000-0000-000000000018', '', 'Video Outlook: SPX sector rotation preview', 'outlook', 'web', 'published', 'outlook-spx-sector-rotation', NOW() - INTERVAL '18 hours'),
  ('51000000-0000-0000-0000-000000000009', '11000000-0000-0000-0000-000000000015', '<p>USDJPY sensitif yield spread. Area 156.80 jadi pivot sebelum data Jepang.</p>', 'Long Read: USDJPY pivot 156.80', 'outlook', 'web', 'published', 'outlook-usdjpy-pivot-15680', NOW() - INTERVAL '22 hours')
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, status = EXCLUDED.status, content_html = EXCLUDED.content_html;

UPDATE articles SET outlook_metadata = metadata.value
FROM (VALUES
  ('51000000-0000-0000-0000-000000000001'::uuid, jsonb_build_object('contentType','video','videoUrl','https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4','summary','XAUUSD London: tunggu sweep 2330-2326, konfirmasi rejection M15.','bias','Bullish wait confirmation','timeframe','M15-H1','market','XAUUSD','sentiment','Buyer masih bertahan','risk','Invalid jika M15 close di bawah 2318','keyPoints',jsonb_build_array('Tunggu sweep 2330-2326','Konfirmasi rejection M15','Jangan kejar candle di 2345'))),
  ('51000000-0000-0000-0000-000000000002'::uuid, jsonb_build_object('contentType','article','summary','BTC perlu reclaim 67.2K sebelum setup continuation agresif.','bias','Neutral bullish','timeframe','H1','market','BTC/USDT','sentiment','Menunggu reclaim','risk','Close H1 di bawah 65.780','keyPoints',jsonb_build_array('Reclaim 67.2K trigger agresif','Sweep 66.1K-66.3K lebih sehat','Batalkan long jika H1 < 65.780'))),
  ('51000000-0000-0000-0000-000000000003'::uuid, jsonb_build_object('contentType','chart','summary','NASDAQ trend naik tapi breadth menipis di resistance.','bias','Watch pullback','timeframe','M30-H1','market','NASDAQ','sentiment','Momentum selektif','risk','Break demand intraday','keyPoints',jsonb_build_array('Breadth melemah di resistance','Demand kecil harus bertahan','Bukan breakout confirmed'))),
  ('51000000-0000-0000-0000-000000000004'::uuid, jsonb_build_object('contentType','chart','summary','DXY range Asia sempit; 104.20 level konfirmasi.','bias','Range watch','timeframe','H1','market','DXY','sentiment','Dollar mixed','risk','Reclaim 104.20','keyPoints',jsonb_build_array('Range Asia sempit','104.20 konfirmasi','Tunggu candle close'))),
  ('51000000-0000-0000-0000-000000000005'::uuid, jsonb_build_object('contentType','video','videoUrl','https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4','summary','ETH relative strength membaik; trigger 3.120.','bias','Bullish above trigger','timeframe','H4','market','ETH/USDT','sentiment','Altcoin beta membaik','risk','Gagal di atas 3.040','keyPoints',jsonb_build_array('3.120 trigger utama','ETH mengejar BTC','Hindari jika BTC melemah'))),
  ('51000000-0000-0000-0000-000000000006'::uuid, jsonb_build_object('contentType','article','summary','Dow defensif, energi menahan koreksi.','bias','Defensive bounce','timeframe','Daily-H1','market','Dow Jones','sentiment','Risk selective','risk','Breadth tidak membaik','keyPoints',jsonb_build_array('Energi menahan koreksi','Breadth belum cukup','Pullback > breakout chase'))),
  ('51000000-0000-0000-0000-000000000007'::uuid, jsonb_build_object('contentType','chart','summary','WTI range; break 78.40 validasi continuation.','bias','Breakout watch','timeframe','H4','market','WTI','sentiment','Energy mixed','risk','False break 78.40','keyPoints',jsonb_build_array('Range masih dominan','Volume di break','Stop di bawah 77.60'))),
  ('51000000-0000-0000-0000-000000000008'::uuid, jsonb_build_object('contentType','video','videoUrl','https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4','summary','SPX sector rotation: tech vs energy.','bias','Rotation play','timeframe','Daily','market','SPX','sentiment','Selective risk-on','risk','Breadth collapse','keyPoints',jsonb_build_array('Tech masih leader','Energy defensive bid','Tunggu close harian'))),
  ('51000000-0000-0000-0000-000000000009'::uuid, jsonb_build_object('contentType','article','summary','USDJPY pivot 156.80 sebelum data Jepang.','bias','Two-way','timeframe','H1','market','USDJPY','sentiment','Yield sensitive','risk','Gap spike','keyPoints',jsonb_build_array('156.80 pivot','Yield spread driver','Size turun pre-data')))
) AS metadata(id, value)
WHERE articles.id = metadata.id;

-- Blog articles: 6 published wordpress + 1 draft + 1 hidden outlook
INSERT INTO articles (id, author_id, content_html, title, category, source, status, slug, created_at)
VALUES
  ('51000000-0000-0000-0000-000000000021', '11000000-0000-0000-0000-000000000005', '<p>Checklist pre-trade sesi London: invalidasi, alasan entry satu kalimat, batas trade aktif.</p>', 'Checklist Risk Management Sesi London', 'blog', 'wordpress', 'published', 'checklist-risk-management-sesi-london', NOW() - INTERVAL '2 days'),
  ('51000000-0000-0000-0000-000000000022', '11000000-0000-0000-0000-000000000006', '<p>Jurnal trading psikologi: fokus proses review, bukan PnL harian.</p>', 'Jurnal Trading: Proses Review Konsisten', 'blog', 'wordpress', 'published', 'jurnal-trading-proses-review-konsisten', NOW() - INTERVAL '4 days'),
  ('51000000-0000-0000-0000-000000000023', '11000000-0000-0000-0000-000000000008', '<p>Prop firm challenge: hindari overtrading hari ketiga.</p>', 'Prop Firm Challenge: Hindari Overtrading', 'blog', 'wordpress', 'published', 'prop-firm-challenge-hindari-overtrading', NOW() - INTERVAL '6 days'),
  ('51000000-0000-0000-0000-000000000024', '11000000-0000-0000-0000-000000000014', '<p>Swing indeks: tunggu H4 close sebelum entry agresif.</p>', 'Swing Indeks: Disiplin H4 Close', 'blog', 'wordpress', 'published', 'swing-indeks-disiplin-h4-close', NOW() - INTERVAL '8 days'),
  ('51000000-0000-0000-0000-000000000025', '11000000-0000-0000-0000-000000000016', '<p>Crypto playbook saat BTC range sempit.</p>', 'Crypto Playbook Saat BTC Range', 'blog', 'wordpress', 'published', 'crypto-playbook-btc-range', NOW() - INTERVAL '10 days'),
  ('51000000-0000-0000-0000-000000000026', '11000000-0000-0000-0000-000000000019', '<p>Options defined-risk untuk hedging portofolio swing.</p>', 'Options Defined-Risk untuk Hedging', 'blog', 'wordpress', 'published', 'options-defined-risk-hedging', NOW() - INTERVAL '12 days'),
  ('51000000-0000-0000-0000-000000000027', '11000000-0000-0000-0000-000000000003', '<p>Draft blog internal macro week ahead.</p>', 'Draft: Macro Week Ahead', 'blog', 'wordpress', 'draft', 'draft-macro-week-ahead-internal', NOW() - INTERVAL '12 hours'),
  ('51000000-0000-0000-0000-000000000028', '11000000-0000-0000-0000-000000000010', '<p>Hidden outlook untuk audit status filter.</p>', 'Hidden Outlook Audit', 'outlook', 'web', 'hidden', 'hidden-outlook-audit', NOW() - INTERVAL '1 day')
ON CONFLICT (id) DO NOTHING;

-- HERTZ backing articles + posts (16)
INSERT INTO articles (id, author_id, content_html, title, category, source, status, slug, created_at)
VALUES
  ('51000000-0000-0000-0000-000000000031', '11000000-0000-0000-0000-000000000004', '<p>Gold reject 2338. Tunggu retest.</p>', 'Gold reject 2338', 'trading', 'telegram', 'published', 'hertz-gold-reject-2338', NOW() - INTERVAL '9 minutes'),
  ('51000000-0000-0000-0000-000000000032', '11000000-0000-0000-0000-000000000007', '<p>Liquidity snapshot NY session.</p>', 'Liquidity snapshot NY', 'general', 'web', 'published', 'hertz-liquidity-snapshot-ny', NOW() - INTERVAL '45 minutes'),
  ('51000000-0000-0000-0000-000000000033', '11000000-0000-0000-0000-000000000005', '<p>Satu posisi kecil lebih baik dari lima entry panik.</p>', 'Satu posisi kecil', 'life_story', 'web', 'published', 'hertz-satu-posisi-kecil', NOW() - INTERVAL '31 minutes'),
  ('51000000-0000-0000-0000-000000000034', '11000000-0000-0000-0000-000000000002', '<p>EURUSD compression London setup.</p>', 'EURUSD compression', 'trading', 'web', 'published', 'hertz-eurusd-compression', NOW() - INTERVAL '18 minutes'),
  ('51000000-0000-0000-0000-000000000035', '11000000-0000-0000-0000-000000000004', '<p>BTC retest 66.4K.</p>', 'BTC retest 66.4K', 'trading', 'telegram', 'published', 'hertz-btc-retest-66400', NOW() - INTERVAL '1 hour'),
  ('51000000-0000-0000-0000-000000000036', '11000000-0000-0000-0000-000000000006', '<p>Ngopi sebelum sesi New York.</p>', 'Ngopi sebelum NY', 'life_story', 'web', 'published', 'hertz-ngopi-sebelum-ny', NOW() - INTERVAL '1 hour 20 minutes'),
  ('51000000-0000-0000-0000-000000000037', '11000000-0000-0000-0000-000000000003', '<p>Quote DXY kunci setup USD hari ini.</p>', 'Quote DXY', 'general', 'web', 'published', 'hertz-quote-dxy', NOW() - INTERVAL '2 hours'),
  ('51000000-0000-0000-0000-000000000038', '11000000-0000-0000-0000-000000000010', '<p>GBPUSD pending review queue.</p>', 'GBPUSD pending', 'trading', 'telegram', 'pending_review', 'hertz-pending-gbpusd', NOW() - INTERVAL '25 minutes'),
  ('51000000-0000-0000-0000-000000000039', '11000000-0000-0000-0000-000000000018', '<p>NAS100 opening drive watch.</p>', 'NAS100 opening drive', 'trading', 'web', 'published', 'hertz-nas100-opening', NOW() - INTERVAL '50 minutes'),
  ('51000000-0000-0000-0000-000000000040', '11000000-0000-0000-0000-000000000008', '<p>Disiplin jurnal: review sebelum entry.</p>', 'Disiplin jurnal', 'life_story', 'web', 'published', 'hertz-disiplin-jurnal', NOW() - INTERVAL '3 hours'),
  ('51000000-0000-0000-0000-000000000041', '11000000-0000-0000-0000-000000000015', '<p>Oil watch WTI 78.40.</p>', 'Oil watch WTI', 'trading', 'web', 'published', 'hertz-oil-watch-wti', NOW() - INTERVAL '4 hours'),
  ('51000000-0000-0000-0000-000000000042', '11000000-0000-0000-0000-000000000009', '<p>Weekend prep: kalender minggu depan.</p>', 'Weekend prep', 'general', 'web', 'published', 'hertz-weekend-prep', NOW() - INTERVAL '5 hours'),
  ('51000000-0000-0000-0000-000000000043', '11000000-0000-0000-0000-000000000021', '<p>Scalping rules: stop setelah 2 loss.</p>', 'Scalping rules', 'trading', 'web', 'published', 'hertz-scalping-rules', NOW() - INTERVAL '6 hours'),
  ('51000000-0000-0000-0000-000000000044', '11000000-0000-0000-0000-000000000006', '<p>Community coffee hour notes.</p>', 'Community coffee hour', 'life_story', 'web', 'published', 'hertz-community-coffee', NOW() - INTERVAL '7 hours'),
  ('51000000-0000-0000-0000-000000000045', '11000000-0000-0000-0000-000000000017', '<p>Macro week ahead teaser.</p>', 'Macro week ahead', 'general', 'web', 'published', 'hertz-macro-week-ahead', NOW() - INTERVAL '8 hours'),
  ('51000000-0000-0000-0000-000000000046', '11000000-0000-0000-0000-000000000010', '<p>Tools workspace activity seed.</p>', 'Tools workspace', 'tools', 'admin', 'published', 'tools-workspace-demo', NOW() - INTERVAL '20 hours')
ON CONFLICT (id) DO NOTHING;

INSERT INTO media (id, article_id, file_url, media_type, file_key, file_size, created_at)
VALUES
  ('54000000-0000-0000-0000-000000000001', '51000000-0000-0000-0000-000000000001', '/images/hertz-seed/chart-xauusd.svg', 'image', 'seed/demo/outlook-xauusd.svg', 220000, NOW() - INTERVAL '2 hours'),
  ('54000000-0000-0000-0000-000000000002', '51000000-0000-0000-0000-000000000002', '/images/hertz-seed/chart-mini.svg', 'image', 'seed/demo/outlook-btc.svg', 186000, NOW() - INTERVAL '4 hours'),
  ('54000000-0000-0000-0000-000000000003', '51000000-0000-0000-0000-000000000003', '/images/hertz-seed/chart-depth.svg', 'image', 'seed/demo/outlook-nasdaq.svg', 198000, NOW() - INTERVAL '3 hours'),
  ('54100000-0000-0000-0000-000000000001', '51000000-0000-0000-0000-000000000021', '/images/hertz-seed/chart-mini.svg', 'image', 'seed/demo/blog-risk.svg', 142000, NOW() - INTERVAL '2 days'),
  ('54100000-0000-0000-0000-000000000002', '51000000-0000-0000-0000-000000000022', '/images/hertz-seed/chart-depth.svg', 'image', 'seed/demo/blog-journal.svg', 156000, NOW() - INTERVAL '4 days'),
  ('54100000-0000-0000-0000-000000000003', '51000000-0000-0000-0000-000000000031', '/images/hertz-seed/chart-xauusd.svg', 'image', 'seed/demo/feed-gold.svg', 220000, NOW() - INTERVAL '9 minutes'),
  ('54100000-0000-0000-0000-000000000004', '51000000-0000-0000-0000-000000000034', '/images/hertz-seed/chart-mini.svg', 'image', 'seed/demo/feed-eurusd.svg', 186000, NOW() - INTERVAL '18 minutes'),
  ('54100000-0000-0000-0000-000000000005', '51000000-0000-0000-0000-000000000035', '/images/hertz-seed/chart-mini.svg', 'image', 'seed/demo/feed-btc.svg', 186000, NOW() - INTERVAL '1 hour');

INSERT INTO comments (id, article_id, user_id, display_name, content, is_anonymous, status, created_at)
VALUES
  ('68000000-0000-0000-0000-000000000001', '51000000-0000-0000-0000-000000000021', '11000000-0000-0000-0000-000000000001', 'Mira FX', 'Checklist ini membantu banget sebelum London open.', false, 'visible', NOW() - INTERVAL '1 day'),
  ('68000000-0000-0000-0000-000000000002', '51000000-0000-0000-0000-000000000021', NULL, 'Anonim', 'Bisa ditambah contoh invalidasi XAUUSD?', true, 'visible', NOW() - INTERVAL '20 hours'),
  ('68000000-0000-0000-0000-000000000003', '51000000-0000-0000-0000-000000000023', '11000000-0000-0000-0000-000000000004', 'Sena Scalper', 'Overtrading hari ketiga memang jebakan klasik.', false, 'visible', NOW() - INTERVAL '3 days'),
  ('68000000-0000-0000-0000-000000000004', '51000000-0000-0000-0000-000000000025', '11000000-0000-0000-0000-000000000016', 'Dimas Crypto', 'Playbook BTC range sangat relevan minggu ini.', false, 'visible', NOW() - INTERVAL '5 days');

INSERT INTO likes (id, article_id, fingerprint, created_at)
VALUES
  ('68500000-0000-0000-0000-000000000001', '51000000-0000-0000-0000-000000000021', 'seed-fp-mira-blog-21', NOW() - INTERVAL '1 day'),
  ('68500000-0000-0000-0000-000000000002', '51000000-0000-0000-0000-000000000021', 'seed-fp-langit-blog-21', NOW() - INTERVAL '22 hours'),
  ('68500000-0000-0000-0000-000000000003', '51000000-0000-0000-0000-000000000022', 'seed-fp-deka-blog-22', NOW() - INTERVAL '2 days'),
  ('68500000-0000-0000-0000-000000000004', '51000000-0000-0000-0000-000000000024', 'seed-fp-arjun-blog-24', NOW() - INTERVAL '4 days');

INSERT INTO hertz_posts (id, short_id, article_id, author_id, type, source, category, status, content, telegram_message_id, telegram_chat_id, pinned_at, published_at, created_at, updated_at)
VALUES
  ('71000000-0000-0000-0000-000000000001', 'hzx_demo01', '51000000-0000-0000-0000-000000000031', '11000000-0000-0000-0000-000000000004', 'original', 'telegram', 'trading_room', 'published', 'Gold reject 2338. Tunggu retest, jangan kejar candle.', 9203001, -1001916607651, NOW() - INTERVAL '8 minutes', NOW() - INTERVAL '9 minutes', NOW() - INTERVAL '9 minutes', NOW() - INTERVAL '9 minutes'),
  ('71000000-0000-0000-0000-000000000002', 'hzx_demo02', '51000000-0000-0000-0000-000000000032', '11000000-0000-0000-0000-000000000007', 'original', 'web', 'general', 'published', 'Liquidity snapshot NY: buy limit menumpuk 2332-2335.', NULL, NULL, NULL, NOW() - INTERVAL '45 minutes', NOW() - INTERVAL '45 minutes', NOW() - INTERVAL '45 minutes'),
  ('71000000-0000-0000-0000-000000000003', 'hzx_demo03', '51000000-0000-0000-0000-000000000033', '11000000-0000-0000-0000-000000000005', 'original', 'web', 'life_coffee', 'published', 'Satu posisi kecil lebih baik dari lima entry panik.', NULL, NULL, NULL, NOW() - INTERVAL '31 minutes', NOW() - INTERVAL '31 minutes', NOW() - INTERVAL '31 minutes'),
  ('71000000-0000-0000-0000-000000000004', 'hzx_demo04', '51000000-0000-0000-0000-000000000034', '11000000-0000-0000-0000-000000000002', 'original', 'web', 'trading_room', 'published', 'EURUSD compression, tunggu sweep bawah dulu.', NULL, NULL, NULL, NOW() - INTERVAL '18 minutes', NOW() - INTERVAL '18 minutes', NOW() - INTERVAL '18 minutes'),
  ('71000000-0000-0000-0000-000000000005', 'hzx_demo05', '51000000-0000-0000-0000-000000000035', '11000000-0000-0000-0000-000000000004', 'original', 'telegram', 'trading_room', 'published', 'BTC retest 66.4K berjalan rapi. Tunggu H1 reclaim.', 9203006, -1001916607651, NULL, NOW() - INTERVAL '1 hour', NOW() - INTERVAL '1 hour', NOW() - INTERVAL '1 hour'),
  ('71000000-0000-0000-0000-000000000006', 'hzx_demo06', '51000000-0000-0000-0000-000000000036', '11000000-0000-0000-0000-000000000006', 'original', 'web', 'life_coffee', 'published', 'Ngopi dulu sebelum New York. Kalau belum ada setup, baca jurnal.', NULL, NULL, NULL, NOW() - INTERVAL '1 hour 20 minutes', NOW() - INTERVAL '1 hour 20 minutes', NOW() - INTERVAL '1 hour 20 minutes'),
  ('71000000-0000-0000-0000-000000000007', 'hzx_demo07', '51000000-0000-0000-0000-000000000037', '11000000-0000-0000-0000-000000000003', 'quote', 'web', 'general', 'published', 'DXY masih kunci semua setup USD hari ini.', NULL, NULL, NULL, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours'),
  ('71000000-0000-0000-0000-000000000008', 'hzx_demo08', '51000000-0000-0000-0000-000000000038', '11000000-0000-0000-0000-000000000010', 'original', 'telegram', 'trading_room', 'pending_review', 'GBPUSD menunggu konfirmasi M15. Draft admin queue.', 9203999, -1001916607651, NULL, NULL, NOW() - INTERVAL '25 minutes', NOW() - INTERVAL '25 minutes'),
  ('71000000-0000-0000-0000-000000000009', 'hzx_demo09', '51000000-0000-0000-0000-000000000039', '11000000-0000-0000-0000-000000000018', 'original', 'web', 'trading_room', 'published', 'NAS100 opening drive: tunggu breadth membaik.', NULL, NULL, NULL, NOW() - INTERVAL '50 minutes', NOW() - INTERVAL '50 minutes', NOW() - INTERVAL '50 minutes'),
  ('71000000-0000-0000-0000-000000000010', 'hzx_demo10', '51000000-0000-0000-0000-000000000040', '11000000-0000-0000-0000-000000000008', 'original', 'web', 'life_coffee', 'published', 'Disiplin jurnal: tulis emosi sebelum sentuh chart.', NULL, NULL, NULL, NOW() - INTERVAL '3 hours', NOW() - INTERVAL '3 hours', NOW() - INTERVAL '3 hours'),
  ('71000000-0000-0000-0000-000000000011', 'hzx_demo11', '51000000-0000-0000-0000-000000000041', '11000000-0000-0000-0000-000000000015', 'original', 'web', 'trading_room', 'published', 'WTI 78.40 pivot — volume tipis, tunggu break bersih.', NULL, NULL, NULL, NOW() - INTERVAL '4 hours', NOW() - INTERVAL '4 hours', NOW() - INTERVAL '4 hours'),
  ('71000000-0000-0000-0000-000000000012', 'hzx_demo12', '51000000-0000-0000-0000-000000000042', '11000000-0000-0000-0000-000000000009', 'original', 'web', 'general', 'published', 'Weekend prep: kalender CPI & FOMC minggu depan sudah ditandai.', NULL, NULL, NULL, NOW() - INTERVAL '5 hours', NOW() - INTERVAL '5 hours', NOW() - INTERVAL '5 hours'),
  ('71000000-0000-0000-0000-000000000013', 'hzx_demo13', '51000000-0000-0000-0000-000000000043', '11000000-0000-0000-0000-000000000021', 'original', 'web', 'trading_room', 'published', 'Scalping rules: stop trading setelah 2 loss berturut.', NULL, NULL, NULL, NOW() - INTERVAL '6 hours', NOW() - INTERVAL '6 hours', NOW() - INTERVAL '6 hours'),
  ('71000000-0000-0000-0000-000000000014', 'hzx_demo14', '51000000-0000-0000-0000-000000000044', '11000000-0000-0000-0000-000000000006', 'original', 'web', 'life_coffee', 'published', 'Community coffee hour: share satu lesson loss minggu ini.', NULL, NULL, NULL, NOW() - INTERVAL '7 hours', NOW() - INTERVAL '7 hours', NOW() - INTERVAL '7 hours'),
  ('71000000-0000-0000-0000-000000000015', 'hzx_demo15', '51000000-0000-0000-0000-000000000045', '11000000-0000-0000-0000-000000000017', 'original', 'web', 'general', 'published', 'Macro week ahead: DXY, yields, dan risk events penting.', NULL, NULL, NULL, NOW() - INTERVAL '8 hours', NOW() - INTERVAL '8 hours', NOW() - INTERVAL '8 hours'),
  ('71000000-0000-0000-0000-000000000016', 'hzx_demo16', '51000000-0000-0000-0000-000000000046', '11000000-0000-0000-0000-000000000010', 'original', 'admin', 'general', 'published', 'Tools workspace seed: Profitability, CFTC, Market Pulse.', NULL, NULL, NULL, NOW() - INTERVAL '20 hours', NOW() - INTERVAL '20 hours', NOW() - INTERVAL '20 hours')
ON CONFLICT (id) DO UPDATE SET short_id = EXCLUDED.short_id, status = EXCLUDED.status, content = EXCLUDED.content, pinned_at = EXCLUDED.pinned_at;

INSERT INTO hertz_post_media (id, post_id, media_id, file_url, media_type, file_key, file_size, alt_text, sort_order)
VALUES
  ('72000000-0000-0000-0000-000000000001', '71000000-0000-0000-0000-000000000001', '54100000-0000-0000-0000-000000000003', '/images/hertz-seed/chart-xauusd.svg', 'image', 'seed/demo/feed-gold.svg', 220000, 'XAUUSD setup chart', 0),
  ('72000000-0000-0000-0000-000000000002', '71000000-0000-0000-0000-000000000004', '54100000-0000-0000-0000-000000000004', '/images/hertz-seed/chart-mini.svg', 'image', 'seed/demo/feed-eurusd.svg', 186000, 'EURUSD compression chart', 0),
  ('72000000-0000-0000-0000-000000000003', '71000000-0000-0000-0000-000000000005', '54100000-0000-0000-0000-000000000005', '/images/hertz-seed/chart-mini.svg', 'image', 'seed/demo/feed-btc.svg', 186000, 'BTC retest chart', 0),
  ('72000000-0000-0000-0000-000000000004', '71000000-0000-0000-0000-000000000009', '54000000-0000-0000-0000-000000000003', '/images/hertz-seed/chart-depth.svg', 'image', 'seed/demo/nas100.svg', 198000, 'NAS100 chart', 0);

INSERT INTO hertz_post_market_context (post_id, pair, timeframe, risk_percent, direction, entry_zone, stop_loss, take_profit, setup_type, confidence_percent, broker_or_source)
VALUES
  ('71000000-0000-0000-0000-000000000001', 'XAUUSD', 'M15', 1.0000, 'long', '2330 - 2326', 2318, 2345, 'Retest rejection', 74, 'OANDA'),
  ('71000000-0000-0000-0000-000000000004', 'EURUSD', 'H1', 0.7500, 'long', '1.0830 - 1.0821', 1.0795, 1.0902, 'Liquidity sweep', 68, 'TradingView'),
  ('71000000-0000-0000-0000-000000000005', 'BTC/USDT', 'H1', 0.5000, 'long', '66400 - 66150', 65780, 67200, 'Resistance reclaim', 66, 'Binance'),
  ('71000000-0000-0000-0000-000000000009', 'NAS100', 'M30', 0.8000, 'long', '18240 - 18220', 18190, 18380, 'Opening drive', 62, 'Horizon seed'),
  ('71000000-0000-0000-0000-000000000011', 'WTI', 'H4', 0.6000, 'long', '78.10 - 78.00', 77.60, 79.20, 'Range break', 58, 'CME seed');

INSERT INTO hertz_reactions (id, post_id, user_id, type, created_at)
SELECT ('74000000-0000-0000-0000-' || lpad(row_number() OVER ()::text, 12, '0'))::uuid, p.id, u.id, 'pulse', NOW() - (row_number() OVER () || ' minutes')::interval
FROM hertz_posts p
JOIN users u ON u.telegram_id BETWEEN 920000001 AND 920000018
WHERE p.id::text LIKE '71000000-0000-0000-0000-0000000000%'
  AND u.id <> p.author_id
  AND right(u.id::text, 2)::int <= 18;

INSERT INTO hertz_views (id, post_id, user_id, session_hash, ip_hash, user_agent_hash, viewed_at)
SELECT ('74500000-0000-0000-0000-' || lpad(row_number() OVER ()::text, 12, '0'))::uuid, p.id, u.id, 'seed-session-' || u.username, 'seed-ip', 'seed-agent', NOW() - (row_number() OVER () || ' minutes')::interval
FROM hertz_posts p
JOIN users u ON u.telegram_id BETWEEN 920000001 AND 920000018
WHERE p.id::text LIKE '71000000-0000-0000-0000-0000000000%';

INSERT INTO hertz_comments (id, post_id, user_id, content, status, created_at, updated_at)
VALUES
  ('74600000-0000-0000-0000-000000000001', '71000000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000001', 'Saya tandai 2326 sebagai invalidasi utama.', 'visible', NOW() - INTERVAL '5 minutes', NOW() - INTERVAL '5 minutes'),
  ('74600000-0000-0000-0000-000000000002', '71000000-0000-0000-0000-000000000002', '11000000-0000-0000-0000-000000000006', 'Sumber liquidity-nya bagus, saya cek lagi nanti.', 'visible', NOW() - INTERVAL '29 minutes', NOW() - INTERVAL '29 minutes'),
  ('74600000-0000-0000-0000-000000000003', '71000000-0000-0000-0000-000000000004', '11000000-0000-0000-0000-000000000003', 'Setuju, jangan entry kalau spread melebar pas news.', 'visible', NOW() - INTERVAL '12 minutes', NOW() - INTERVAL '12 minutes'),
  ('74600000-0000-0000-0000-000000000004', '71000000-0000-0000-0000-000000000005', '11000000-0000-0000-0000-000000000016', 'Reclaim H1 67200 baru valid untuk add size.', 'visible', NOW() - INTERVAL '40 minutes', NOW() - INTERVAL '40 minutes'),
  ('74600000-0000-0000-0000-000000000005', '71000000-0000-0000-0000-000000000009', '11000000-0000-0000-0000-000000000014', 'Opening drive butuh breadth, setuju tunggu dulu.', 'visible', NOW() - INTERVAL '35 minutes', NOW() - INTERVAL '35 minutes'),
  ('74600000-0000-0000-0000-000000000006', '71000000-0000-0000-0000-000000000003', '11000000-0000-0000-0000-000000000008', 'Lesson penting — saya apply juga di jurnal.', 'visible', NOW() - INTERVAL '20 minutes', NOW() - INTERVAL '20 minutes'),
  ('74600000-0000-0000-0000-000000000007', '71000000-0000-0000-0000-000000000013', '11000000-0000-0000-0000-000000000021', 'Rule 2 loss stop sangat membantu disiplin scalp.', 'visible', NOW() - INTERVAL '4 hours', NOW() - INTERVAL '4 hours'),
  ('74600000-0000-0000-0000-000000000008', '71000000-0000-0000-0000-000000000015', '11000000-0000-0000-0000-000000000017', 'Macro week note lengkap, thanks.', 'visible', NOW() - INTERVAL '6 hours', NOW() - INTERVAL '6 hours');

INSERT INTO hertz_bookmarks (id, post_id, user_id, created_at)
VALUES
  ('74200000-0000-0000-0000-000000000001', '71000000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000002', NOW() - INTERVAL '4 minutes'),
  ('74200000-0000-0000-0000-000000000002', '71000000-0000-0000-0000-000000000005', '11000000-0000-0000-0000-000000000001', NOW() - INTERVAL '30 minutes'),
  ('74200000-0000-0000-0000-000000000003', '71000000-0000-0000-0000-000000000003', '11000000-0000-0000-0000-000000000008', NOW() - INTERVAL '2 hours'),
  ('74200000-0000-0000-0000-000000000004', '71000000-0000-0000-0000-000000000009', '11000000-0000-0000-0000-000000000014', NOW() - INTERVAL '3 hours'),
  ('74200000-0000-0000-0000-000000000005', '71000000-0000-0000-0000-000000000011', '11000000-0000-0000-0000-000000000015', NOW() - INTERVAL '4 hours'),
  ('74200000-0000-0000-0000-000000000006', '71000000-0000-0000-0000-000000000015', '11000000-0000-0000-0000-000000000001', NOW() - INTERVAL '5 hours');

INSERT INTO hertz_reposts (id, original_post_id, repost_post_id, user_id, repost_type, created_at)
VALUES
  ('74100000-0000-0000-0000-000000000001', '71000000-0000-0000-0000-000000000001', NULL, '11000000-0000-0000-0000-000000000003', 'repost', NOW() - INTERVAL '15 minutes'),
  ('74100000-0000-0000-0000-000000000002', '71000000-0000-0000-0000-000000000004', NULL, '11000000-0000-0000-0000-000000000005', 'repost', NOW() - INTERVAL '40 minutes'),
  ('74100000-0000-0000-0000-000000000003', '71000000-0000-0000-0000-000000000005', NULL, '11000000-0000-0000-0000-000000000016', 'repost', NOW() - INTERVAL '55 minutes'),
  ('74100000-0000-0000-0000-000000000004', '71000000-0000-0000-0000-000000000015', NULL, '11000000-0000-0000-0000-000000000009', 'repost', NOW() - INTERVAL '2 hours');

INSERT INTO hertz_community_notes (id, post_id, author_id, content, status, helpful_count, not_helpful_count, created_at, updated_at)
VALUES
  ('73000000-0000-0000-0000-000000000001', '71000000-0000-0000-0000-000000000002', '11000000-0000-0000-0000-000000000006', 'Konteks liquidity selaras dengan kalender USD 14:30. Volatilitas naik 20 menit sebelum rilis.', 'published', 3, 0, NOW() - INTERVAL '20 minutes', NOW() - INTERVAL '20 minutes'),
  ('73000000-0000-0000-0000-000000000002', '71000000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000007', 'Area 2326 sudah di-test tiga kali minggu ini. Pertimbangkan invalidasi lebih ketat jika spread melebar.', 'published', 1, 1, NOW() - INTERVAL '8 minutes', NOW() - INTERVAL '8 minutes');

INSERT INTO hertz_community_note_sources (id, note_id, source_url, source_title, created_at)
VALUES
  ('73100000-0000-0000-0000-000000000001', '73000000-0000-0000-0000-000000000001', 'https://www.bls.gov/', 'BLS Economic Releases', NOW() - INTERVAL '20 minutes'),
  ('73100000-0000-0000-0000-000000000002', '73000000-0000-0000-0000-000000000001', 'https://www.cmegroup.com/markets/interest-rates/cme-fedwatch-tool.html', 'CME FedWatch', NOW() - INTERVAL '20 minutes');

INSERT INTO hertz_community_note_ratings (id, note_id, user_id, rating, created_at, updated_at)
VALUES
  ('73200000-0000-0000-0000-000000000001', '73000000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000001', 'helpful', NOW() - INTERVAL '18 minutes', NOW() - INTERVAL '18 minutes'),
  ('73200000-0000-0000-0000-000000000002', '73000000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000004', 'helpful', NOW() - INTERVAL '17 minutes', NOW() - INTERVAL '17 minutes'),
  ('73200000-0000-0000-0000-000000000003', '73000000-0000-0000-0000-000000000002', '11000000-0000-0000-0000-000000000002', 'not_helpful', NOW() - INTERVAL '7 minutes', NOW() - INTERVAL '7 minutes');

INSERT INTO hertz_reports (id, target_type, target_id, reporter_user_id, reason, details, status, created_at)
VALUES
  ('75000000-0000-0000-0000-000000000001', 'post', '71000000-0000-0000-0000-000000000002', '11000000-0000-0000-0000-000000000009', 'misleading', 'Seed report: perlu review konteks liquidity.', 'open', NOW() - INTERVAL '12 minutes'),
  ('75000000-0000-0000-0000-000000000002', 'comment', '74600000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000008', 'spam', 'Seed report komentar untuk admin queue.', 'reviewing', NOW() - INTERVAL '9 minutes'),
  ('75000000-0000-0000-0000-000000000003', 'community_note', '73000000-0000-0000-0000-000000000002', '11000000-0000-0000-0000-000000000004', 'other', 'Community note perlu verifikasi sumber.', 'open', NOW() - INTERVAL '6 minutes');

-- 5 DM conversations, 22 messages
INSERT INTO hertz_conversations (id, conversation_type, direct_key, last_message_at, created_at, updated_at)
VALUES
  ('82000000-0000-0000-0000-000000000001', 'direct', '11000000-0000-0000-0000-000000000001:11000000-0000-0000-0000-000000000004', NOW() - INTERVAL '3 minutes', NOW() - INTERVAL '1 day', NOW() - INTERVAL '3 minutes'),
  ('82000000-0000-0000-0000-000000000002', 'direct', '11000000-0000-0000-0000-000000000001:11000000-0000-0000-0000-000000000007', NOW() - INTERVAL '17 minutes', NOW() - INTERVAL '2 days', NOW() - INTERVAL '17 minutes'),
  ('82000000-0000-0000-0000-000000000003', 'direct', '11000000-0000-0000-0000-000000000002:11000000-0000-0000-0000-000000000005', NOW() - INTERVAL '44 minutes', NOW() - INTERVAL '3 days', NOW() - INTERVAL '44 minutes'),
  ('82000000-0000-0000-0000-000000000004', 'direct', '11000000-0000-0000-0000-000000000001:11000000-0000-0000-0000-000000000016', NOW() - INTERVAL '8 minutes', NOW() - INTERVAL '4 days', NOW() - INTERVAL '8 minutes'),
  ('82000000-0000-0000-0000-000000000005', 'direct', '11000000-0000-0000-0000-000000000014:11000000-0000-0000-0000-000000000018', NOW() - INTERVAL '25 minutes', NOW() - INTERVAL '5 days', NOW() - INTERVAL '25 minutes');

INSERT INTO hertz_conversation_participants (id, conversation_id, user_id, last_read_at, created_at)
VALUES
  ('82100000-0000-0000-0000-000000000001', '82000000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000001', NOW() - INTERVAL '6 minutes', NOW() - INTERVAL '1 day'),
  ('82100000-0000-0000-0000-000000000002', '82000000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000004', NOW() - INTERVAL '2 minutes', NOW() - INTERVAL '1 day'),
  ('82100000-0000-0000-0000-000000000003', '82000000-0000-0000-0000-000000000002', '11000000-0000-0000-0000-000000000001', NOW() - INTERVAL '20 minutes', NOW() - INTERVAL '2 days'),
  ('82100000-0000-0000-0000-000000000004', '82000000-0000-0000-0000-000000000002', '11000000-0000-0000-0000-000000000007', NOW() - INTERVAL '14 minutes', NOW() - INTERVAL '2 days'),
  ('82100000-0000-0000-0000-000000000005', '82000000-0000-0000-0000-000000000003', '11000000-0000-0000-0000-000000000002', NOW() - INTERVAL '1 hour', NOW() - INTERVAL '3 days'),
  ('82100000-0000-0000-0000-000000000006', '82000000-0000-0000-0000-000000000003', '11000000-0000-0000-0000-000000000005', NOW() - INTERVAL '40 minutes', NOW() - INTERVAL '3 days'),
  ('82100000-0000-0000-0000-000000000007', '82000000-0000-0000-0000-000000000004', '11000000-0000-0000-0000-000000000001', NOW() - INTERVAL '15 minutes', NOW() - INTERVAL '4 days'),
  ('82100000-0000-0000-0000-000000000008', '82000000-0000-0000-0000-000000000004', '11000000-0000-0000-0000-000000000016', NOW() - INTERVAL '5 minutes', NOW() - INTERVAL '4 days'),
  ('82100000-0000-0000-0000-000000000009', '82000000-0000-0000-0000-000000000005', '11000000-0000-0000-0000-000000000014', NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '5 days'),
  ('82100000-0000-0000-0000-000000000010', '82000000-0000-0000-0000-000000000005', '11000000-0000-0000-0000-000000000018', NOW() - INTERVAL '22 minutes', NOW() - INTERVAL '5 days');

INSERT INTO hertz_messages (id, conversation_id, sender_id, body, created_at)
VALUES
  ('83000000-0000-0000-0000-000000000001', '82000000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000004', 'Bang, gold tadi valid kalau retest 2330 dulu ya?', NOW() - INTERVAL '38 minutes'),
  ('83000000-0000-0000-0000-000000000002', '82000000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000001', 'Iya, tunggu reaksi. Kalau langsung spike jangan dikejar.', NOW() - INTERVAL '31 minutes'),
  ('83000000-0000-0000-0000-000000000003', '82000000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000004', 'Noted. Saya kecilkan risk ke 0.5 dulu.', NOW() - INTERVAL '3 minutes'),
  ('83000000-0000-0000-0000-000000000004', '82000000-0000-0000-0000-000000000002', '11000000-0000-0000-0000-000000000007', 'Saya kirim sumber liquidity untuk konteks sesi New York ya.', NOW() - INTERVAL '52 minutes'),
  ('83000000-0000-0000-0000-000000000005', '82000000-0000-0000-0000-000000000002', '11000000-0000-0000-0000-000000000001', 'Mantap, pastikan source URL tersimpan supaya konteksnya kuat.', NOW() - INTERVAL '17 minutes'),
  ('83000000-0000-0000-0000-000000000006', '82000000-0000-0000-0000-000000000003', '11000000-0000-0000-0000-000000000005', 'Aku lagi susun jurnal psikologi buat blog. Perlu review?', NOW() - INTERVAL '1 hour'),
  ('83000000-0000-0000-0000-000000000007', '82000000-0000-0000-0000-000000000003', '11000000-0000-0000-0000-000000000002', 'Boleh, kirim draft pendek dulu. Fokus ke proses, bukan hasil trade.', NOW() - INTERVAL '44 minutes'),
  ('83000000-0000-0000-0000-000000000008', '82000000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000001', 'Kalau sudah ada screenshot, simpan di jurnal juga.', NOW() - INTERVAL '2 minutes'),
  ('83000000-0000-0000-0000-000000000009', '82000000-0000-0000-0000-000000000002', '11000000-0000-0000-0000-000000000007', 'Source sudah saya rapikan. Ada dua link: kalender dan news context.', NOW() - INTERVAL '12 minutes'),
  ('83000000-0000-0000-0000-000000000010', '82000000-0000-0000-0000-000000000002', '11000000-0000-0000-0000-000000000001', 'Bagus. Nanti konteks ini bisa jadi bahan diskusi di komentar.', NOW() - INTERVAL '7 minutes'),
  ('83000000-0000-0000-0000-000000000011', '82000000-0000-0000-0000-000000000003', '11000000-0000-0000-0000-000000000005', 'Aku buat versi pendeknya dulu untuk feed, versi panjang masuk blog.', NOW() - INTERVAL '35 minutes'),
  ('83000000-0000-0000-0000-000000000012', '82000000-0000-0000-0000-000000000003', '11000000-0000-0000-0000-000000000002', 'Sip. Judulnya jangan terlalu teknikal, biar member baru tetap nyaman baca.', NOW() - INTERVAL '21 minutes'),
  ('83000000-0000-0000-0000-000000000013', '82000000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000004', 'Oke, aku juga lihat spread sempat melebar di brokerku.', NOW() - INTERVAL '1 minute'),
  ('83000000-0000-0000-0000-000000000014', '82000000-0000-0000-0000-000000000004', '11000000-0000-0000-0000-000000000016', 'BTC dominance turun — alt rotation mulai?', NOW() - INTERVAL '20 minutes'),
  ('83000000-0000-0000-0000-000000000015', '82000000-0000-0000-0000-000000000004', '11000000-0000-0000-0000-000000000001', 'Mungkin, tapi tunggu ETH reclaim 3.120 dulu biar aman.', NOW() - INTERVAL '12 minutes'),
  ('83000000-0000-0000-0000-000000000016', '82000000-0000-0000-0000-000000000004', '11000000-0000-0000-0000-000000000016', 'Noted. Saya share chart relative strength nanti.', NOW() - INTERVAL '8 minutes'),
  ('83000000-0000-0000-0000-000000000017', '82000000-0000-0000-0000-000000000005', '11000000-0000-0000-0000-000000000014', 'NAS100 opening drive setup masih valid?', NOW() - INTERVAL '40 minutes'),
  ('83000000-0000-0000-0000-000000000018', '82000000-0000-0000-0000-000000000005', '11000000-0000-0000-0000-000000000018', 'Valid kalau breadth membaik. Kalau tidak, skip dulu.', NOW() - INTERVAL '25 minutes'),
  ('83000000-0000-0000-0000-000000000019', '82000000-0000-0000-0000-000000000005', '11000000-0000-0000-0000-000000000014', 'Mantap, saya pantau sector rotation di premarket.', NOW() - INTERVAL '18 minutes'),
  ('83000000-0000-0000-0000-000000000020', '82000000-0000-0000-0000-000000000003', '11000000-0000-0000-0000-000000000005', 'Draft blog selesai malam ini. Saya tag kamu untuk review.', NOW() - INTERVAL '8 minutes'),
  ('83000000-0000-0000-0000-000000000021', '82000000-0000-0000-0000-000000000002', '11000000-0000-0000-0000-000000000007', 'Kalau market sudah lebih tenang, saya update konteks liquidity-nya.', NOW() - INTERVAL '4 minutes'),
  ('83000000-0000-0000-0000-000000000022', '82000000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000004', 'Siap, thanks Mira.', NOW() - INTERVAL '30 seconds');

UPDATE hertz_conversations SET last_message_id = latest.message_id, last_message_at = latest.created_at, updated_at = latest.created_at
FROM (
  SELECT DISTINCT ON (conversation_id) conversation_id, id AS message_id, created_at
  FROM hertz_messages WHERE id::text LIKE '83000000-0000-0000-0000-0000000000%'
  ORDER BY conversation_id, created_at DESC
) latest
WHERE hertz_conversations.id = latest.conversation_id;

INSERT INTO hertz_message_attachments (id, message_id, file_url, file_key, mime_type, file_size, width, height, created_at)
VALUES ('83200000-0000-0000-0000-000000000001', '83000000-0000-0000-0000-000000000004', '/images/hertz-seed/chart-mini.svg', 'seed/demo/dm-liquidity.svg', 'image/png', 128000, 1200, 720, NOW() - INTERVAL '52 minutes');

INSERT INTO hertz_message_reports (id, message_id, reporter_user_id, reason, details, status, created_at)
VALUES ('83300000-0000-0000-0000-000000000001', '83000000-0000-0000-0000-000000000006', '11000000-0000-0000-0000-000000000002', 'other', 'Seed report untuk audit admin moderation DM.', 'resolved', NOW() - INTERVAL '30 minutes');

INSERT INTO hertz_blocks (id, blocker_user_id, blocked_user_id, created_at)
VALUES ('84000000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000006', '11000000-0000-0000-0000-000000000009', NOW() - INTERVAL '5 days');

INSERT INTO hertz_notifications (id, user_id, actor_user_id, type, target_type, target_id, post_id, conversation_id, metadata, read_at, created_at)
VALUES
  ('90000000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000004', 'pulse', 'post', '71000000-0000-0000-0000-000000000001', '71000000-0000-0000-0000-000000000001', NULL, '{"seed":true}'::jsonb, NULL, NOW() - INTERVAL '3 minutes'),
  ('90000000-0000-0000-0000-000000000002', '11000000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000006', 'comment', 'comment', '74600000-0000-0000-0000-000000000002', '71000000-0000-0000-0000-000000000002', NULL, '{"preview":"Sumber liquidity-nya bagus"}'::jsonb, NULL, NOW() - INTERVAL '5 minutes'),
  ('90000000-0000-0000-0000-000000000003', '11000000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000004', 'dm', 'conversation', '82000000-0000-0000-0000-000000000001', NULL, '82000000-0000-0000-0000-000000000001', '{"preview":"Siap, thanks Mira."}'::jsonb, NULL, NOW() - INTERVAL '1 minute'),
  ('90000000-0000-0000-0000-000000000004', '11000000-0000-0000-0000-000000000004', '11000000-0000-0000-0000-000000000003', 'repost', 'post', '71000000-0000-0000-0000-000000000001', '71000000-0000-0000-0000-000000000001', NULL, '{"seed":true}'::jsonb, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '3 hours'),
  ('90000000-0000-0000-0000-000000000005', '11000000-0000-0000-0000-000000000010', '11000000-0000-0000-0000-000000000009', 'pulse', 'post', '71000000-0000-0000-0000-000000000002', '71000000-0000-0000-0000-000000000002', NULL, '{"seed":true}'::jsonb, NULL, NOW() - INTERVAL '10 minutes'),
  ('90000000-0000-0000-0000-000000000006', '11000000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000016', 'pulse', 'post', '71000000-0000-0000-0000-000000000005', '71000000-0000-0000-0000-000000000005', NULL, '{"seed":true}'::jsonb, NULL, NOW() - INTERVAL '8 minutes'),
  ('90000000-0000-0000-0000-000000000007', '11000000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000017', 'comment', 'comment', '74600000-0000-0000-0000-000000000008', '71000000-0000-0000-0000-000000000015', NULL, '{"preview":"Macro week note lengkap"}'::jsonb, NULL, NOW() - INTERVAL '15 minutes'),
  ('90000000-0000-0000-0000-000000000008', '11000000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000014', 'repost', 'post', '71000000-0000-0000-0000-000000000009', '71000000-0000-0000-0000-000000000009', NULL, '{"seed":true}'::jsonb, NULL, NOW() - INTERVAL '20 minutes');

INSERT INTO hertz_post_stats (post_id, comment_count, pulse_count, repost_count, view_count, updated_at)
SELECT p.id, COALESCE(c.cnt,0), COALESCE(r.cnt,0), COALESCE(rp.cnt,0), COALESCE(v.cnt,0), NOW()
FROM hertz_posts p
LEFT JOIN (SELECT post_id, COUNT(*)::int cnt FROM hertz_comments WHERE status='visible' GROUP BY post_id) c ON c.post_id=p.id
LEFT JOIN (SELECT post_id, COUNT(*)::int cnt FROM hertz_reactions GROUP BY post_id) r ON r.post_id=p.id
LEFT JOIN (SELECT original_post_id post_id, COUNT(*)::int cnt FROM hertz_reposts GROUP BY original_post_id) rp ON rp.post_id=p.id
LEFT JOIN (SELECT post_id, COUNT(*)::int cnt FROM hertz_views GROUP BY post_id) v ON v.post_id=p.id
WHERE p.id::text LIKE '71000000-0000-0000-0000-0000000000%'
ON CONFLICT (post_id) DO UPDATE SET comment_count=EXCLUDED.comment_count, pulse_count=EXCLUDED.pulse_count, repost_count=EXCLUDED.repost_count, view_count=EXCLUDED.view_count, updated_at=NOW();

INSERT INTO challenge_accounts (id, user_id, name, account_currency, initial_balance, current_balance, current_equity, profit_target_percent, profit_target_amount, max_daily_loss_percent, max_daily_loss_amount, max_overall_drawdown_percent, max_overall_drawdown_amount, min_trading_days, start_date, end_date, account_type, drawdown_mode, news_trading_allowed, hold_overnight_allowed, hold_weekend_allowed, consistency_rule_percent, max_lot, max_risk_per_trade_percent, max_trades_per_day, preset_id, created_at, updated_at)
VALUES
  ('95200000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000004', 'FTMO 100K Phase 1', 'USD', 100000, 102350, 102100, 10, 10000, 5, 5000, 10, 10000, 4, CURRENT_DATE - 12, CURRENT_DATE + 18, 'evaluation', 'static', false, true, false, 30, 5, 1, 3, 'ftmo-100k', NOW() - INTERVAL '12 days', NOW()),
  ('95200000-0000-0000-0000-000000000002', '11000000-0000-0000-0000-000000000001', 'Personal 10K Journal', 'USD', 10000, 9875, 9875, NULL, NULL, NULL, NULL, NULL, NULL, 0, CURRENT_DATE - 30, NULL, 'personal', 'balance_based', true, true, true, NULL, NULL, 2, NULL, NULL, NOW() - INTERVAL '30 days', NOW());

INSERT INTO challenge_trades (id, challenge_account_id, user_id, trade_date, symbol, session, direction, entry_price, stop_loss, take_profit, exit_price, lot_size, risk_amount, risk_percent, result, pnl_amount, pnl_percent, rr_planned, rr_realized, setup_name, entry_reason, exit_reason, emotional_state, mistake_category, confidence_level, discipline_input_score, trade_quality, followed_plan, discipline_score, created_at, updated_at)
VALUES
  ('95400000-0000-0000-0000-000000000001', '95200000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000004', CURRENT_DATE - 1, 'XAUUSD', 'london', 'buy', 2328.5, 2318.0, 2345.0, 2338.2, 0.50, 500, 0.5, 'win', 485, 0.485, 2.0, 1.6, 'Retest rejection', 'Sweep + M15 reclaim', 'TP1 partial', 'calm', 'no_mistake', 4, 5, 'a', true, 100, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
  ('95400000-0000-0000-0000-000000000002', '95200000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000004', CURRENT_DATE - 2, 'EURUSD', 'london', 'sell', 1.0865, 1.0895, 1.0810, 1.0895, 1.00, 600, 0.6, 'loss', -600, -0.6, 1.8, -1.0, 'Failed breakdown', 'Chased momentum', 'SL hit', 'fomo', 'late_entry', 2, 2, 'c', false, 55, NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
  ('95400000-0000-0000-0000-000000000003', '95200000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000004', CURRENT_DATE - 3, 'BTCUSDT', 'new_york', 'buy', 66400, 65780, 67200, 66880, 0.20, 400, 0.4, 'win', 320, 0.32, 1.5, 1.2, 'Range reclaim', 'H1 close above 66400', 'Manual partial', 'calm', 'no_mistake', 4, 4, 'b', true, 92, NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
  ('95400000-0000-0000-0000-000000000004', '95200000-0000-0000-0000-000000000002', '11000000-0000-0000-0000-000000000001', CURRENT_DATE - 1, 'NAS100', 'new_york', 'buy', 18250, 18190, 18380, 18210, 0.10, 120, 1.2, 'loss', -125, -1.25, 2.0, -0.8, 'Opening drive', 'Premature entry', 'Cut early', 'hesitant', 'early_entry', 3, 3, 'c', false, 70, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
  ('95400000-0000-0000-0000-000000000005', '95200000-0000-0000-0000-000000000002', '11000000-0000-0000-0000-000000000001', CURRENT_DATE - 4, 'XAUUSD', 'london', 'buy', 2330.0, 2318.0, 2345.0, 2342.0, 0.05, 60, 0.6, 'win', 55, 0.55, 1.5, 1.0, 'London retest', 'M15 rejection', 'TP1', 'calm', 'no_mistake', 4, 4, 'b', true, 88, NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days'),
  ('95400000-0000-0000-0000-000000000006', '95200000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000004', CURRENT_DATE - 5, 'GBPUSD', 'london', 'buy', 1.2650, 1.2610, 1.2720, 1.2610, 0.80, 480, 0.48, 'loss', -480, -0.48, 1.75, -1.0, 'Breakout fail', 'No H1 close', 'SL hit', 'fear', 'bad_setup', 2, 2, 'd', false, 45, NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days');

INSERT INTO challenge_personas (id, user_id, name, description, content, is_default, created_at, updated_at)
VALUES ('95300000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000004', 'Strict Risk Coach', 'Persona seed untuk AI review challenge tracker.', 'You are a strict prop-firm risk coach. Focus on rule breaches, overtrading, and emotional entries. Respond in Indonesian with bullet points.', true, NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days');

INSERT INTO challenge_ai_reviews (id, challenge_account_id, user_id, persona_id, provider, review_scope, review_style, user_message, system_prompt, context_prompt, user_prompt, assistant_response, created_at)
VALUES ('95500000-0000-0000-0000-000000000001', '95200000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000004', '95300000-0000-0000-0000-000000000001', 'seed', 'last_7_days', 'strict', 'Review performa challenge saya minggu ini.', 'Strict risk coach system prompt (seed).', 'Account FTMO 100K, 3 trades, 1 loss FOMO EURUSD.', 'Berikan evaluasi disiplin dan saran konkret.', '- Loss EURUSD disebabkan late entry / FOMO.\n- XAUUSD dan BTC menunjukkan eksekusi lebih baik.\n- Pertahankan max 3 trade/hari.', NOW() - INTERVAL '2 hours');

INSERT INTO device_tokens (id, user_id, platform, token, device_id, app_version, enabled, created_at, updated_at, last_seen_at)
VALUES
  ('96000000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000001', 'android', 'seed-fcm-token-mira-android', 'seed-pixel-8', '1.0.0', true, NOW() - INTERVAL '3 days', NOW() - INTERVAL '1 hour', NOW() - INTERVAL '1 hour'),
  ('96000000-0000-0000-0000-000000000002', '11000000-0000-0000-0000-000000000001', 'ios', 'seed-fcm-token-mira-ios', 'seed-iphone-15', '1.0.0', true, NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours'),
  ('96000000-0000-0000-0000-000000000003', '11000000-0000-0000-0000-000000000004', 'android', 'seed-fcm-token-sena-android', 'seed-s23', '1.0.0', false, NOW() - INTERVAL '10 days', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days');

INSERT INTO notification_events (id, user_id, device_token_id, event_type, title, body, payload, provider, status, created_at, sent_at, failed_at)
VALUES
  ('96500000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000001', '96000000-0000-0000-0000-000000000001', 'hertz.pulse', 'Pulse baru', 'Sena Scalper memberi pulse pada Gold reject 2338', '{"postId":"71000000-0000-0000-0000-000000000001"}'::jsonb, 'fcm', 'sent', NOW() - INTERVAL '3 minutes', NOW() - INTERVAL '3 minutes', NULL),
  ('96500000-0000-0000-0000-000000000002', '11000000-0000-0000-0000-000000000001', '96000000-0000-0000-0000-000000000002', 'hertz.dm', 'Pesan baru', 'Sena: Siap, thanks Mira.', '{"conversationId":"82000000-0000-0000-0000-000000000001"}'::jsonb, 'fcm', 'pending', NOW() - INTERVAL '1 minute', NULL, NULL),
  ('96500000-0000-0000-0000-000000000003', '11000000-0000-0000-0000-000000000004', '96000000-0000-0000-0000-000000000003', 'hertz.comment', 'Komentar baru', 'Mira FX: Saya tandai 2326 sebagai invalidasi utama', '{"postId":"71000000-0000-0000-0000-000000000001"}'::jsonb, 'fcm', 'failed', NOW() - INTERVAL '20 minutes', NULL, NOW() - INTERVAL '19 minutes');
UPDATE notification_events SET error_message = 'Seed: device token disabled' WHERE id = '96500000-0000-0000-0000-000000000003';

INSERT INTO api_keys (id, key_hash, key_prefix, app_name, created_by, allowed_origins, is_active, last_used_at, created_at)
VALUES
  ('97000000-0000-0000-0000-000000000001', crypt('hz_seed_active_key_2026', gen_salt('bf')), 'hz_actv', 'Horizon Mobile (seed)', '11000000-0000-0000-0000-000000000010', 'https://horizon.cloudnexify.com,http://localhost:3000', true, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '30 days'),
  ('97000000-0000-0000-0000-000000000002', crypt('hz_seed_revoked_key_2026', gen_salt('bf')), 'hz_rev', 'Legacy Widget (revoked seed)', '11000000-0000-0000-0000-000000000010', '*', false, NOW() - INTERVAL '40 days', NOW() - INTERVAL '90 days');

INSERT INTO wordpress_import_jobs (id, status, started_at, completed_at, total_fetched, total_imported, total_skipped, total_failed, error_message, triggered_by)
VALUES
  ('88100000-0000-0000-0000-000000000001', 'completed', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days' + INTERVAL '4 minutes', 48, 45, 2, 1, NULL, '11000000-0000-0000-0000-000000000010'),
  ('88100000-0000-0000-0000-000000000002', 'failed', NOW() - INTERVAL '6 hours', NOW() - INTERVAL '6 hours' + INTERVAL '90 seconds', 12, 0, 0, 12, 'Seed: WordPress API timeout (audit example)', '11000000-0000-0000-0000-000000000010');

INSERT INTO hertz_credit_ledger (id, user_id, event_type, entity_id, amount, created_at)
VALUES
  ('85000000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000004', 'telegram_post_published', '71000000-0000-0000-0000-000000000001', 10, NOW() - INTERVAL '9 minutes'),
  ('85000000-0000-0000-0000-000000000002', '11000000-0000-0000-0000-000000000007', 'hertz_post_published', '71000000-0000-0000-0000-000000000002', 10, NOW() - INTERVAL '45 minutes'),
  ('85000000-0000-0000-0000-000000000003', '11000000-0000-0000-0000-000000000016', 'hertz_post_published', '71000000-0000-0000-0000-000000000005', 10, NOW() - INTERVAL '1 hour');

INSERT INTO credit_transactions (id, user_id, amount, transaction_type, source_type, source_id, description, created_at)
VALUES
  ('86000000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000004', 10, 'earned', 'hertz_post', '71000000-0000-0000-0000-000000000001', 'Seed reward: published Telegram HERTZ post', NOW() - INTERVAL '9 minutes'),
  ('86000000-0000-0000-0000-000000000002', '11000000-0000-0000-0000-000000000007', 10, 'earned', 'hertz_post', '71000000-0000-0000-0000-000000000002', 'Seed reward: liquidity snapshot post', NOW() - INTERVAL '45 minutes'),
  ('86000000-0000-0000-0000-000000000003', '11000000-0000-0000-0000-000000000001', -5, 'spent', 'tool', NULL, 'Seed: tools profitability calculation', NOW() - INTERVAL '20 minutes'),
  ('86000000-0000-0000-0000-000000000004', '11000000-0000-0000-0000-000000000005', 10, 'earned', 'blog', '51000000-0000-0000-0000-000000000021', 'Seed reward: blog published', NOW() - INTERVAL '2 days'),
  ('86000000-0000-0000-0000-000000000005', '11000000-0000-0000-0000-000000000002', 10, 'earned', 'hertz_post', '71000000-0000-0000-0000-000000000004', 'Seed reward: EURUSD post', NOW() - INTERVAL '18 minutes'),
  ('86000000-0000-0000-0000-000000000006', '11000000-0000-0000-0000-000000000016', 10, 'earned', 'hertz_post', '71000000-0000-0000-0000-000000000005', 'Seed reward: BTC retest post', NOW() - INTERVAL '1 hour'),
  ('86000000-0000-0000-0000-000000000007', '11000000-0000-0000-0000-000000000010', 25, 'earned', 'admin', NULL, 'Seed: admin credit adjustment', NOW() - INTERVAL '3 days'),
  ('86000000-0000-0000-0000-000000000008', '11000000-0000-0000-0000-000000000014', 10, 'earned', 'hertz_post', '71000000-0000-0000-0000-000000000011', 'Seed reward: WTI watch post', NOW() - INTERVAL '4 hours'),
  ('86000000-0000-0000-0000-000000000009', '11000000-0000-0000-0000-000000000008', 10, 'earned', 'blog', '51000000-0000-0000-0000-000000000023', 'Seed reward: prop firm blog', NOW() - INTERVAL '6 days'),
  ('86000000-0000-0000-0000-000000000010', '11000000-0000-0000-0000-000000000021', 10, 'earned', 'hertz_post', '71000000-0000-0000-0000-000000000013', 'Seed reward: scalping rules post', NOW() - INTERVAL '6 hours'),
  ('86000000-0000-0000-0000-000000000011', '11000000-0000-0000-0000-000000000003', -3, 'spent', 'tool', NULL, 'Seed: CFTC viewer access', NOW() - INTERVAL '1 hour'),
  ('86000000-0000-0000-0000-000000000012', '11000000-0000-0000-0000-000000000018', 10, 'earned', 'hertz_post', '71000000-0000-0000-0000-000000000009', 'Seed reward: NAS100 post', NOW() - INTERVAL '50 minutes');

INSERT INTO activity_logs (id, actor_id, actor_type, action, target_type, target_id, details, ip_address, created_at)
VALUES
  ('87000000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000010', 'admin', 'hertz.demo_seed.loaded', 'seed', NULL, '{"version":"001","surfaces":["feed","outlook","blog","dm","profile"]}', '127.0.0.1', NOW() - INTERVAL '2 minutes'),
  ('87000000-0000-0000-0000-000000000002', '11000000-0000-0000-0000-000000000001', 'member', 'tools.profitability.opened', 'tool', '51000000-0000-0000-0000-000000000046', '{"tool":"profitability","mode":"USD/USC"}', '127.0.0.1', NOW() - INTERVAL '20 minutes'),
  ('87000000-0000-0000-0000-000000000003', '11000000-0000-0000-0000-000000000007', 'member', 'tools.cftc_viewer.opened', 'tool', '51000000-0000-0000-0000-000000000046', '{"tool":"cftc-viewer","market":"gold"}', '127.0.0.1', NOW() - INTERVAL '1 hour'),
  ('87000000-0000-0000-0000-000000000004', '11000000-0000-0000-0000-000000000004', 'member', 'challenge.trade.logged', 'challenge_trade', '95400000-0000-0000-0000-000000000001', '{"symbol":"XAUUSD","result":"win"}', '127.0.0.1', NOW() - INTERVAL '1 day'),
  ('87000000-0000-0000-0000-000000000005', '11000000-0000-0000-0000-000000000010', 'admin', 'wordpress.import.completed', 'wordpress_import_job', '88100000-0000-0000-0000-000000000001', '{"imported":45,"failed":1}', '127.0.0.1', NOW() - INTERVAL '2 days'),
  ('87000000-0000-0000-0000-000000000006', '11000000-0000-0000-0000-000000000001', 'member', 'profile.updated', 'user', '11000000-0000-0000-0000-000000000001', '{"fields":["bio","socialLinks"]}', '127.0.0.1', NOW() - INTERVAL '3 days');

COMMIT;
