-- ============================================
-- Horizon Trader Platform
-- Review seed: HERTZ full product surfaces
-- ============================================
-- Safe to run repeatedly. It replaces only rows whose ids are declared here.

BEGIN;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Clean HERTZ v2 review rows.
UPDATE hertz_conversations
SET last_message_id = NULL
WHERE id::text LIKE '82000000-0000-0000-0000-0000000000%';

DELETE FROM hertz_message_reports WHERE message_id::text LIKE '83000000-0000-0000-0000-0000000000%';
DELETE FROM hertz_message_attachments WHERE message_id::text LIKE '83000000-0000-0000-0000-0000000000%';
DELETE FROM hertz_messages WHERE id::text LIKE '83000000-0000-0000-0000-0000000000%';
DELETE FROM hertz_conversation_participants WHERE conversation_id::text LIKE '82000000-0000-0000-0000-0000000000%';
DELETE FROM hertz_conversations WHERE id::text LIKE '82000000-0000-0000-0000-0000000000%';
DELETE FROM hertz_blocks WHERE id::text LIKE '84000000-0000-0000-0000-0000000000%';

DELETE FROM hertz_community_note_ratings WHERE note_id::text LIKE '73000000-0000-0000-0000-0000000000%';
DELETE FROM hertz_community_note_sources WHERE note_id::text LIKE '73000000-0000-0000-0000-0000000000%';
DELETE FROM hertz_community_notes WHERE id::text LIKE '73000000-0000-0000-0000-0000000000%';
DELETE FROM hertz_reports WHERE target_id::text LIKE '71000000-0000-0000-0000-0000000000%';
DELETE FROM hertz_comments WHERE post_id::text LIKE '71000000-0000-0000-0000-0000000000%';
DELETE FROM hertz_reposts WHERE original_post_id::text LIKE '71000000-0000-0000-0000-0000000000%' OR repost_post_id::text LIKE '71000000-0000-0000-0000-0000000000%';
DELETE FROM hertz_bookmarks WHERE post_id::text LIKE '71000000-0000-0000-0000-0000000000%';
DELETE FROM hertz_reactions WHERE post_id::text LIKE '71000000-0000-0000-0000-0000000000%';
DELETE FROM hertz_views WHERE post_id::text LIKE '71000000-0000-0000-0000-0000000000%';
DELETE FROM hertz_post_market_context WHERE post_id::text LIKE '71000000-0000-0000-0000-0000000000%';
DELETE FROM hertz_post_media WHERE post_id::text LIKE '71000000-0000-0000-0000-0000000000%';
DELETE FROM hertz_credit_ledger WHERE id::text LIKE '85000000-0000-0000-0000-0000000000%';
DELETE FROM hertz_posts WHERE id::text LIKE '71000000-0000-0000-0000-0000000000%';

DELETE FROM post_reports WHERE post_id::text LIKE '61000000-0000-0000-0000-0000000000%';
DELETE FROM community_note_ratings WHERE note_id::text LIKE '63000000-0000-0000-0000-0000000000%';
DELETE FROM community_note_sources WHERE note_id::text LIKE '63000000-0000-0000-0000-0000000000%';
DELETE FROM community_notes WHERE id::text LIKE '63000000-0000-0000-0000-0000000000%';
DELETE FROM post_comments WHERE post_id::text LIKE '61000000-0000-0000-0000-0000000000%';
DELETE FROM post_reposts WHERE original_post_id::text LIKE '61000000-0000-0000-0000-0000000000%' OR repost_post_id::text LIKE '61000000-0000-0000-0000-0000000000%';
DELETE FROM post_bookmarks WHERE post_id::text LIKE '61000000-0000-0000-0000-0000000000%';
DELETE FROM post_reactions WHERE post_id::text LIKE '61000000-0000-0000-0000-0000000000%';
DELETE FROM post_views WHERE post_id::text LIKE '61000000-0000-0000-0000-0000000000%';
DELETE FROM post_market_context WHERE post_id::text LIKE '61000000-0000-0000-0000-0000000000%';
DELETE FROM feed_posts WHERE id::text LIKE '61000000-0000-0000-0000-0000000000%';

DELETE FROM credit_transactions WHERE id::text LIKE '86000000-0000-0000-0000-0000000000%';
DELETE FROM activity_logs WHERE id::text LIKE '87000000-0000-0000-0000-0000000000%';
DELETE FROM wordpress_import_jobs WHERE id::text LIKE '88000000-0000-0000-0000-0000000000%';
DELETE FROM hertz_membership_checks
WHERE id::text LIKE '12000000-0000-0000-0000-0000000000%'
   OR telegram_id BETWEEN 920000001 AND 920000010;
DELETE FROM media WHERE id::text LIKE '54000000-0000-0000-0000-0000000000%';
DELETE FROM articles WHERE id::text LIKE '51000000-0000-0000-0000-0000000000%';

INSERT INTO users (
  id, telegram_id, username, display_name, avatar_url, role,
  credit_balance, telegram_first_name, telegram_last_name,
  verified_member_at, created_at
) VALUES
  ('11000000-0000-0000-0000-000000000001', 920000001, 'mira_fx', 'Mira FX', 'https://api.dicebear.com/8.x/initials/svg?seed=Mira%20FX&backgroundColor=064e3b&textColor=d1fae5', 'member', 245, 'Mira', 'FX', NOW() - INTERVAL '95 days', NOW() - INTERVAL '110 days'),
  ('11000000-0000-0000-0000-000000000002', 920000002, 'langit_trading', 'Langit Trading', 'https://api.dicebear.com/8.x/initials/svg?seed=Langit%20Trading&backgroundColor=052e16&textColor=bbf7d0', 'member', 198, 'Langit', 'Trading', NOW() - INTERVAL '84 days', NOW() - INTERVAL '100 days'),
  ('11000000-0000-0000-0000-000000000003', 920000003, 'raka_macro', 'Raka Macro', 'https://api.dicebear.com/8.x/initials/svg?seed=Raka%20Macro&backgroundColor=0f172a&textColor=34d399', 'member', 176, 'Raka', 'Macro', NOW() - INTERVAL '72 days', NOW() - INTERVAL '88 days'),
  ('11000000-0000-0000-0000-000000000004', 920000004, 'sena_scalper', 'Sena Scalper', 'https://api.dicebear.com/8.x/initials/svg?seed=Sena%20Scalper&backgroundColor=14532d&textColor=ecfdf5', 'member', 164, 'Sena', 'Scalper', NOW() - INTERVAL '61 days', NOW() - INTERVAL '80 days'),
  ('11000000-0000-0000-0000-000000000005', 920000005, 'nara_alpha', 'Nara Alpha', 'https://api.dicebear.com/8.x/initials/svg?seed=Nara%20Alpha&backgroundColor=022c22&textColor=6ee7b7', 'member', 152, 'Nara', 'Alpha', NOW() - INTERVAL '53 days', NOW() - INTERVAL '66 days'),
  ('11000000-0000-0000-0000-000000000006', 920000006, 'deka_notes', 'Deka Notes', 'https://api.dicebear.com/8.x/initials/svg?seed=Deka%20Notes&backgroundColor=1f2937&textColor=10b981', 'member', 138, 'Deka', 'Notes', NOW() - INTERVAL '44 days', NOW() - INTERVAL '58 days'),
  ('11000000-0000-0000-0000-000000000007', 920000007, 'viona_research', 'Viona Research', 'https://api.dicebear.com/8.x/initials/svg?seed=Viona%20Research&backgroundColor=064e3b&textColor=a7f3d0', 'member', 128, 'Viona', 'Research', NOW() - INTERVAL '37 days', NOW() - INTERVAL '46 days'),
  ('11000000-0000-0000-0000-000000000008', 920000008, 'kai_journal', 'Kai Journal', 'https://api.dicebear.com/8.x/initials/svg?seed=Kai%20Journal&backgroundColor=0f766e&textColor=ecfeff', 'member', 116, 'Kai', 'Journal', NOW() - INTERVAL '30 days', NOW() - INTERVAL '38 days'),
  ('11000000-0000-0000-0000-000000000009', 920000009, 'bayu_digest', 'Bayu Digest', 'https://api.dicebear.com/8.x/initials/svg?seed=Bayu%20Digest&backgroundColor=064e3b&textColor=ffffff', 'member', 104, 'Bayu', 'Digest', NOW() - INTERVAL '24 days', NOW() - INTERVAL '31 days'),
  ('11000000-0000-0000-0000-000000000010', 920000010, 'admin_hertz', 'Admin HERTZ', 'https://api.dicebear.com/8.x/initials/svg?seed=Admin%20HERTZ&backgroundColor=020617&textColor=22c55e', 'admin', 360, 'Admin', 'HERTZ', NOW() - INTERVAL '150 days', NOW() - INTERVAL '160 days')
ON CONFLICT (id) DO UPDATE SET
  telegram_id = EXCLUDED.telegram_id,
  username = EXCLUDED.username,
  display_name = EXCLUDED.display_name,
  avatar_url = EXCLUDED.avatar_url,
  role = EXCLUDED.role,
  credit_balance = EXCLUDED.credit_balance,
  telegram_first_name = EXCLUDED.telegram_first_name,
  telegram_last_name = EXCLUDED.telegram_last_name,
  verified_member_at = EXCLUDED.verified_member_at;

INSERT INTO hertz_membership_checks (
  id, user_id, telegram_id, group_id, is_member,
  checked_at, last_verified_at, raw_response, created_at, updated_at
)
SELECT
  ('12000000-0000-0000-0000-0000000000' || lpad(row_number() OVER (ORDER BY telegram_id)::text, 2, '0'))::uuid,
  id,
  telegram_id,
  -1001916607651,
  true,
  NOW() - INTERVAL '4 minutes',
  NOW() - INTERVAL '4 minutes',
  jsonb_build_object('isMember', true, 'source', 'seed'),
  NOW() - INTERVAL '4 minutes',
  NOW() - INTERVAL '4 minutes'
FROM users
WHERE id::text LIKE '11000000-0000-0000-0000-0000000000%'
ON CONFLICT (telegram_id, group_id) DO UPDATE SET
  is_member = true,
  checked_at = EXCLUDED.checked_at,
  last_verified_at = EXCLUDED.last_verified_at,
  raw_response = EXCLUDED.raw_response,
  updated_at = NOW();

INSERT INTO articles (id, author_id, content_html, title, category, source, status, slug, created_at)
VALUES
  ('51000000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000003', '<p>Outlook London: XAUUSD masih bertahan di atas area 2332. Selama buyer mempertahankan area ini, struktur intraday tetap condong mencari continuation menuju 2346.</p>', 'London Outlook: XAUUSD menunggu reclaim 2340', 'outlook', 'web', 'published', 'outlook-xauusd-reclaim-2340', NOW() - INTERVAL '2 hours'),
  ('51000000-0000-0000-0000-000000000002', '11000000-0000-0000-0000-000000000007', '<p>Crypto watchlist hari ini fokus pada BTC/USDT. Area 66.400 menjadi batas penting; reclaim bersih dapat membuka ruang ke 67.200.</p>', 'Crypto Outlook: BTC butuh reclaim sebelum agresif', 'outlook', 'web', 'published', 'outlook-btc-reclaim-67200', NOW() - INTERVAL '4 hours'),
  ('51000000-0000-0000-0000-000000000003', '11000000-0000-0000-0000-000000000009', '<p>US index masih ditopang saham teknologi besar, tetapi breadth mulai menyempit. Untuk NASDAQ, perhatikan reaksi di resistance intraday sebelum follow trend.</p>', 'Stock Outlook: NASDAQ kuat tapi breadth melemah', 'outlook', 'web', 'published', 'outlook-nasdaq-breadth-melemah', NOW() - INTERVAL '6 hours'),
  ('51000000-0000-0000-0000-000000000007', '11000000-0000-0000-0000-000000000010', '<p>Tools workspace: Profitability, CFTC Viewer, dan Market Pulse disiapkan sebagai ruang kerja trader. Data ini adalah activity seed untuk membuat admin dashboard terasa terisi.</p>', 'Tools workspace review activity', 'tools', 'admin', 'published', 'tools-workspace-review-activity', NOW() - INTERVAL '20 hours'),
  ('51000000-0000-0000-0000-000000000008', '11000000-0000-0000-0000-000000000004', '<p>Gold reject 2338. Tunggu retest, jangan kejar candle. Setup baru valid kalau M15 close tetap di atas 2331.</p>', 'Gold reject 2338', 'trading', 'telegram', 'published', 'hertz-gold-reject-2338', NOW() - INTERVAL '9 minutes'),
  ('51000000-0000-0000-0000-000000000009', '11000000-0000-0000-0000-000000000002', '<p>Struktur EURUSD masih compression. Saya ingin lihat sweep bawah dulu sebelum cari long kecil.</p>', 'EURUSD compression London setup', 'trading', 'web', 'published', 'hertz-eurusd-compression-london', NOW() - INTERVAL '18 minutes'),
  ('51000000-0000-0000-0000-000000000010', '11000000-0000-0000-0000-000000000005', '<p>Hari ini saya hanya ambil satu posisi kecil. Fokusnya bukan jumlah trade, tapi kualitas keputusan setelah market bergerak cepat.</p>', 'Satu posisi kecil lebih baik dari lima entry panik', 'life_story', 'web', 'published', 'hertz-satu-posisi-kecil', NOW() - INTERVAL '31 minutes'),
  ('51000000-0000-0000-0000-000000000011', '11000000-0000-0000-0000-000000000007', '<p>Catatan komunitas: data liquidity menunjukkan buy limit menumpuk di area 2332-2335. Diskusi lengkap ada di komentar.</p>', 'Liquidity note untuk sesi New York', 'general', 'web', 'published', 'hertz-liquidity-note-new-york', NOW() - INTERVAL '45 minutes'),
  ('51000000-0000-0000-0000-000000000012', '11000000-0000-0000-0000-000000000010', '<p>Telegram draft: setup GBPUSD masih menunggu approval admin sebelum tampil ke publik.</p>', 'Draft telegram menunggu publish', 'trading', 'telegram', 'pending_review', 'hertz-draft-telegram-gbpusd', NOW() - INTERVAL '52 minutes'),
  ('51000000-0000-0000-0000-000000000013', '11000000-0000-0000-0000-000000000003', '<p>DXY membuka sesi Asia dengan range sempit. Jika index gagal bertahan di atas 104.20, pair mayor bisa punya ruang koreksi pendek.</p>', 'Forex Outlook: DXY menjaga range Asia', 'outlook', 'web', 'published', 'outlook-dxy-range-asia', NOW() - INTERVAL '10 hours'),
  ('51000000-0000-0000-0000-000000000014', '11000000-0000-0000-0000-000000000007', '<p>ETH/USDT masih mengikuti ritme BTC, tetapi relative strength mulai membaik. Break 3.120 dapat membuat altcoin beta ikut bergerak.</p>', 'Crypto Outlook: ETH mulai mengejar BTC', 'outlook', 'web', 'published', 'outlook-eth-relative-strength', NOW() - INTERVAL '14 hours'),
  ('51000000-0000-0000-0000-000000000015', '11000000-0000-0000-0000-000000000009', '<p>Dow Jones cenderung defensif setelah pembukaan US. Sektor energi membantu menahan koreksi, tetapi momentum belum cukup bersih.</p>', 'Stock Outlook: Dow defensif, energi menopang', 'outlook', 'web', 'published', 'outlook-dow-defensive-energy', NOW() - INTERVAL '22 hours'),
  ('51000000-0000-0000-0000-000000000019', '11000000-0000-0000-0000-000000000004', '<p>BTC retest 66.4K berjalan rapi. Saya tidak entry kalau candle H1 masih menutup di bawah resistance.</p>', 'BTC retest 66.4K', 'trading', 'telegram', 'published', 'hertz-btc-retest-66400', NOW() - INTERVAL '1 hour'),
  ('51000000-0000-0000-0000-000000000020', '11000000-0000-0000-0000-000000000006', '<p>Ngopi dulu sebelum New York. Kalau market belum memberi setup, saya lebih baik baca ulang jurnal kemarin.</p>', 'Ngopi sebelum sesi New York', 'life_story', 'web', 'published', 'hertz-ngopi-sebelum-new-york', NOW() - INTERVAL '1 hour 20 minutes');

INSERT INTO media (id, article_id, file_url, media_type, file_key, file_size, created_at)
VALUES
  ('54000000-0000-0000-0000-000000000001', '51000000-0000-0000-0000-000000000001', '/images/hertz-seed/chart-xauusd.svg', 'image', 'seed/v2/outlook-xauusd.svg', 220000, NOW() - INTERVAL '2 hours'),
  ('54000000-0000-0000-0000-000000000002', '51000000-0000-0000-0000-000000000002', '/images/hertz-seed/chart-mini.svg', 'image', 'seed/v2/outlook-btc.svg', 186000, NOW() - INTERVAL '4 hours'),
  ('54000000-0000-0000-0000-000000000004', '51000000-0000-0000-0000-000000000008', '/images/hertz-seed/chart-xauusd.svg', 'image', 'seed/v2/feed-gold.svg', 220000, NOW() - INTERVAL '9 minutes'),
  ('54000000-0000-0000-0000-000000000005', '51000000-0000-0000-0000-000000000009', '/images/hertz-seed/chart-mini.svg', 'image', 'seed/v2/feed-eurusd.svg', 186000, NOW() - INTERVAL '18 minutes'),
  ('54000000-0000-0000-0000-000000000006', '51000000-0000-0000-0000-000000000013', '/images/hertz-seed/chart-mini.svg', 'image', 'seed/v2/outlook-dxy.svg', 176000, NOW() - INTERVAL '10 hours'),
  ('54000000-0000-0000-0000-000000000007', '51000000-0000-0000-0000-000000000019', '/images/hertz-seed/chart-mini.svg', 'image', 'seed/v2/feed-btc.svg', 186000, NOW() - INTERVAL '1 hour'),
  ('54000000-0000-0000-0000-000000000008', '51000000-0000-0000-0000-000000000020', '/images/hertz-seed/chart-mini.svg', 'image', 'seed/v2/feed-coffee.svg', 164000, NOW() - INTERVAL '1 hour 20 minutes');

INSERT INTO feed_posts (id, short_id, article_id, author_id, post_type, source, category, status, quoted_post_id, telegram_message_id, telegram_chat_id, pinned_at, created_at, updated_at)
VALUES
  ('61000000-0000-0000-0000-000000000001', 'hz_live01', '51000000-0000-0000-0000-000000000008', '11000000-0000-0000-0000-000000000004', 'original', 'telegram', 'trading', 'published', NULL, 9203001, -1001916607651, NOW() - INTERVAL '8 minutes', NOW() - INTERVAL '9 minutes', NOW() - INTERVAL '9 minutes'),
  ('61000000-0000-0000-0000-000000000002', 'hz_live02', '51000000-0000-0000-0000-000000000011', '11000000-0000-0000-0000-000000000007', 'original', 'web', 'general', 'published', NULL, NULL, NULL, NULL, NOW() - INTERVAL '45 minutes', NOW() - INTERVAL '45 minutes'),
  ('61000000-0000-0000-0000-000000000003', 'hz_live03', '51000000-0000-0000-0000-000000000009', '11000000-0000-0000-0000-000000000002', 'original', 'web', 'trading', 'published', NULL, NULL, NULL, NULL, NOW() - INTERVAL '18 minutes', NOW() - INTERVAL '18 minutes'),
  ('61000000-0000-0000-0000-000000000004', 'hz_live04', '51000000-0000-0000-0000-000000000010', '11000000-0000-0000-0000-000000000005', 'original', 'web', 'life_story', 'published', NULL, NULL, NULL, NULL, NOW() - INTERVAL '31 minutes', NOW() - INTERVAL '31 minutes'),
  ('61000000-0000-0000-0000-000000000005', 'hz_live05', '51000000-0000-0000-0000-000000000012', '11000000-0000-0000-0000-000000000010', 'original', 'telegram', 'trading', 'pending_review', NULL, 9203005, -1001916607651, NULL, NOW() - INTERVAL '52 minutes', NOW() - INTERVAL '52 minutes'),
  ('61000000-0000-0000-0000-000000000006', 'hz_live06', '51000000-0000-0000-0000-000000000019', '11000000-0000-0000-0000-000000000004', 'original', 'telegram', 'trading', 'published', NULL, 9203006, -1001916607651, NULL, NOW() - INTERVAL '1 hour', NOW() - INTERVAL '1 hour'),
  ('61000000-0000-0000-0000-000000000007', 'hz_live07', '51000000-0000-0000-0000-000000000020', '11000000-0000-0000-0000-000000000006', 'original', 'web', 'life_story', 'published', NULL, NULL, NULL, NULL, NOW() - INTERVAL '1 hour 20 minutes', NOW() - INTERVAL '1 hour 20 minutes'),
  ('61000000-0000-0000-0000-000000000008', 'hz_live08', '51000000-0000-0000-0000-000000000013', '11000000-0000-0000-0000-000000000003', 'quote', 'web', 'general', 'published', '61000000-0000-0000-0000-000000000001', NULL, NULL, NULL, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours');

INSERT INTO post_market_context (post_id, pair, timeframe, risk_percent, direction, entry_zone, stop_loss, take_profit, take_profit_1, take_profit_2, take_profit_3, setup_type, confidence_percent, broker_or_source)
VALUES
  ('61000000-0000-0000-0000-000000000001', 'XAUUSD', 'M15', 1.0000, 'long', '2330 - 2326', 2318, 2345, 2338, 2342, 2345, 'Retest rejection', 74, 'OANDA'),
  ('61000000-0000-0000-0000-000000000003', 'EURUSD', 'H1', 0.7500, 'long', '1.0830 - 1.0821', 1.0795, 1.0902, 1.0868, 1.0885, 1.0902, 'Liquidity sweep', 68, 'TradingView'),
  ('61000000-0000-0000-0000-000000000006', 'BTC/USDT', 'H1', 0.5000, 'long', '66400 - 66150', 65780, 67200, 66880, 67040, 67200, 'Resistance reclaim', 66, 'Binance');

INSERT INTO hertz_posts (id, short_id, article_id, author_id, type, source, category, status, content, telegram_message_id, telegram_chat_id, pinned_at, published_at, created_at, updated_at)
VALUES
  ('71000000-0000-0000-0000-000000000001', 'hzx_live01', '51000000-0000-0000-0000-000000000008', '11000000-0000-0000-0000-000000000004', 'original', 'telegram', 'trading_room', 'published', 'Gold reject 2338. Tunggu retest, jangan kejar candle.', 9203001, -1001916607651, NOW() - INTERVAL '8 minutes', NOW() - INTERVAL '9 minutes', NOW() - INTERVAL '9 minutes', NOW() - INTERVAL '9 minutes'),
  ('71000000-0000-0000-0000-000000000002', 'hzx_live02', '51000000-0000-0000-0000-000000000011', '11000000-0000-0000-0000-000000000007', 'original', 'web', 'community_note', 'published', 'Data liquidity menunjukkan akumulasi buy limit di 2332-2335. Diskusi lengkap di komentar.', NULL, NULL, NULL, NOW() - INTERVAL '45 minutes', NOW() - INTERVAL '45 minutes', NOW() - INTERVAL '45 minutes'),
  ('71000000-0000-0000-0000-000000000003', 'hzx_live03', '51000000-0000-0000-0000-000000000010', '11000000-0000-0000-0000-000000000005', 'original', 'web', 'life_coffee', 'published', 'Satu posisi kecil lebih baik dari lima entry panik.', NULL, NULL, NULL, NOW() - INTERVAL '31 minutes', NOW() - INTERVAL '31 minutes', NOW() - INTERVAL '31 minutes'),
  ('71000000-0000-0000-0000-000000000004', 'hzx_live04', '51000000-0000-0000-0000-000000000009', '11000000-0000-0000-0000-000000000002', 'original', 'web', 'trading_room', 'published', 'EURUSD compression, saya tunggu sweep bawah dulu.', NULL, NULL, NULL, NOW() - INTERVAL '18 minutes', NOW() - INTERVAL '18 minutes', NOW() - INTERVAL '18 minutes'),
  ('71000000-0000-0000-0000-000000000005', 'hzx_live05', '51000000-0000-0000-0000-000000000019', '11000000-0000-0000-0000-000000000004', 'original', 'telegram', 'trading_room', 'published', 'BTC retest 66.4K berjalan rapi. Tunggu H1 reclaim.', 9203006, -1001916607651, NULL, NOW() - INTERVAL '1 hour', NOW() - INTERVAL '1 hour', NOW() - INTERVAL '1 hour'),
  ('71000000-0000-0000-0000-000000000006', 'hzx_live06', '51000000-0000-0000-0000-000000000020', '11000000-0000-0000-0000-000000000006', 'original', 'web', 'life_coffee', 'published', 'Ngopi dulu sebelum New York. Kalau market belum memberi setup, saya baca ulang jurnal kemarin.', NULL, NULL, NULL, NOW() - INTERVAL '1 hour 20 minutes', NOW() - INTERVAL '1 hour 20 minutes', NOW() - INTERVAL '1 hour 20 minutes'),
  ('71000000-0000-0000-0000-000000000007', 'hzx_live07', '51000000-0000-0000-0000-000000000013', '11000000-0000-0000-0000-000000000003', 'quote', 'web', 'general', 'published', 'DXY masih jadi kunci untuk semua setup USD hari ini.', NULL, NULL, NULL, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours');

INSERT INTO hertz_post_media (id, post_id, media_id, file_url, media_type, file_key, file_size, alt_text, sort_order)
VALUES
  ('72000000-0000-0000-0000-000000000001', '71000000-0000-0000-0000-000000000001', '54000000-0000-0000-0000-000000000004', '/images/hertz-seed/chart-xauusd.svg', 'image', 'seed/v2/feed-gold.svg', 220000, 'XAUUSD setup chart', 0),
  ('72000000-0000-0000-0000-000000000002', '71000000-0000-0000-0000-000000000004', '54000000-0000-0000-0000-000000000005', '/images/hertz-seed/chart-mini.svg', 'image', 'seed/v2/feed-eurusd.svg', 186000, 'EURUSD compression chart', 0),
  ('72000000-0000-0000-0000-000000000003', '71000000-0000-0000-0000-000000000005', '54000000-0000-0000-0000-000000000007', '/images/hertz-seed/chart-mini.svg', 'image', 'seed/v2/feed-btc.svg', 186000, 'BTC retest chart', 0);

INSERT INTO hertz_post_market_context (post_id, pair, timeframe, risk_percent, direction, entry_zone, stop_loss, take_profit, setup_type, confidence_percent, broker_or_source)
VALUES
  ('71000000-0000-0000-0000-000000000001', 'XAUUSD', 'M15', 1.0000, 'long', '2330 - 2326', 2318, 2345, 'Retest rejection', 74, 'OANDA'),
  ('71000000-0000-0000-0000-000000000004', 'EURUSD', 'H1', 0.7500, 'long', '1.0830 - 1.0821', 1.0795, 1.0902, 'Liquidity sweep', 68, 'TradingView'),
  ('71000000-0000-0000-0000-000000000005', 'BTC/USDT', 'H1', 0.5000, 'long', '66400 - 66150', 65780, 67200, 'Resistance reclaim', 66, 'Binance');

INSERT INTO post_reactions (id, post_id, user_id, reaction_type, created_at)
SELECT ('62000000-0000-0000-0000-' || lpad(row_number() OVER ()::text, 12, '0'))::uuid, p.id, u.id, 'pulse', NOW() - INTERVAL '2 minutes'
FROM feed_posts p
JOIN users u ON u.id::text LIKE '11000000-0000-0000-0000-0000000000%'
WHERE p.id::text LIKE '61000000-0000-0000-0000-00000000000%'
  AND u.id <> p.author_id
  AND right(u.id::text, 1)::int <= 7;

INSERT INTO post_views (id, post_id, user_id, session_hash, ip_hash, user_agent_hash, viewed_at)
SELECT ('62500000-0000-0000-0000-' || lpad(row_number() OVER ()::text, 12, '0'))::uuid, p.id, u.id, 'seed-session-' || u.username, 'seed-ip', 'seed-agent', NOW() - (row_number() OVER () || ' minutes')::interval
FROM feed_posts p
JOIN users u ON u.id::text LIKE '11000000-0000-0000-0000-0000000000%'
WHERE p.id::text LIKE '61000000-0000-0000-0000-00000000000%';

INSERT INTO post_comments (id, post_id, user_id, content, status, created_at, updated_at)
VALUES
  ('62600000-0000-0000-0000-000000000001', '61000000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000001', 'Area 2326 ini menarik, saya tunggu candle close dulu.', 'visible', NOW() - INTERVAL '6 minutes', NOW() - INTERVAL '6 minutes'),
  ('62600000-0000-0000-0000-000000000002', '61000000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000003', 'Setuju, jangan entry kalau spread melebar pas news.', 'visible', NOW() - INTERVAL '5 minutes', NOW() - INTERVAL '5 minutes'),
  ('62600000-0000-0000-0000-000000000003', '61000000-0000-0000-0000-000000000002', '11000000-0000-0000-0000-000000000006', 'Tambahkan juga kalender USD biar konteksnya lengkap.', 'visible', NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '30 minutes');

INSERT INTO community_notes (id, post_id, author_id, content, status, helpful_count, not_helpful_count, created_at, updated_at)
VALUES
  ('63000000-0000-0000-0000-000000000001', '61000000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000007', 'XAUUSD rawan melebar saat data USD besar. Wajib cek kalender ekonomi sebelum mengikuti setup intraday.', 'published', 8, 1, NOW() - INTERVAL '4 minutes', NOW() - INTERVAL '4 minutes'),
  ('63000000-0000-0000-0000-000000000002', '61000000-0000-0000-0000-000000000003', '11000000-0000-0000-0000-000000000009', 'EURUSD sering false break saat London lunch. Tunggu konfirmasi volume atau candle close.', 'published', 5, 0, NOW() - INTERVAL '12 minutes', NOW() - INTERVAL '12 minutes');

INSERT INTO community_note_sources (id, note_id, source_url, source_title, created_at)
VALUES
  ('63100000-0000-0000-0000-000000000001', '63000000-0000-0000-0000-000000000001', 'https://www.forexfactory.com/calendar', 'Forex Factory Calendar', NOW() - INTERVAL '4 minutes'),
  ('63100000-0000-0000-0000-000000000002', '63000000-0000-0000-0000-000000000002', 'https://www.babypips.com/news', 'Babypips Market News', NOW() - INTERVAL '12 minutes');

INSERT INTO hertz_reactions (id, post_id, user_id, type, created_at)
SELECT ('74000000-0000-0000-0000-' || lpad(row_number() OVER ()::text, 12, '0'))::uuid, p.id, u.id, 'pulse', NOW() - INTERVAL '2 minutes'
FROM hertz_posts p
JOIN users u ON u.id::text LIKE '11000000-0000-0000-0000-0000000000%'
WHERE p.id::text LIKE '71000000-0000-0000-0000-00000000000%'
  AND u.id <> p.author_id
  AND right(u.id::text, 1)::int <= 7;

INSERT INTO hertz_views (id, post_id, user_id, session_hash, ip_hash, user_agent_hash, viewed_at)
SELECT ('74500000-0000-0000-0000-' || lpad(row_number() OVER ()::text, 12, '0'))::uuid, p.id, u.id, 'seed-session-' || u.username, 'seed-ip', 'seed-agent', NOW() - (row_number() OVER () || ' minutes')::interval
FROM hertz_posts p
JOIN users u ON u.id::text LIKE '11000000-0000-0000-0000-0000000000%'
WHERE p.id::text LIKE '71000000-0000-0000-0000-00000000000%';

INSERT INTO hertz_comments (id, post_id, user_id, content, status, created_at, updated_at)
VALUES
  ('74600000-0000-0000-0000-000000000001', '71000000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000001', 'Saya tandai 2326 sebagai invalidasi utama.', 'visible', NOW() - INTERVAL '5 minutes', NOW() - INTERVAL '5 minutes'),
  ('74600000-0000-0000-0000-000000000002', '71000000-0000-0000-0000-000000000002', '11000000-0000-0000-0000-000000000006', 'Sumber liquidity-nya bagus, saya cek lagi nanti.', 'visible', NOW() - INTERVAL '29 minutes', NOW() - INTERVAL '29 minutes');

INSERT INTO hertz_community_notes (id, post_id, author_id, content, status, helpful_count, not_helpful_count, created_at, updated_at)
VALUES
  ('73000000-0000-0000-0000-000000000001', '71000000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000007', 'Setup gold ini perlu dibaca bersama kalender USD dan spread broker, terutama menjelang rilis data besar.', 'published', 9, 1, NOW() - INTERVAL '4 minutes', NOW() - INTERVAL '4 minutes');

INSERT INTO hertz_community_note_sources (id, note_id, source_url, source_title, created_at)
VALUES
  ('73100000-0000-0000-0000-000000000001', '73000000-0000-0000-0000-000000000001', 'https://www.forexfactory.com/calendar', 'Forex Factory Calendar', NOW() - INTERVAL '4 minutes');

INSERT INTO hertz_conversations (id, conversation_type, direct_key, last_message_at, created_at, updated_at)
VALUES
  ('82000000-0000-0000-0000-000000000001', 'direct', '11000000-0000-0000-0000-000000000001:11000000-0000-0000-0000-000000000004', NOW() - INTERVAL '3 minutes', NOW() - INTERVAL '1 day', NOW() - INTERVAL '3 minutes'),
  ('82000000-0000-0000-0000-000000000002', 'direct', '11000000-0000-0000-0000-000000000001:11000000-0000-0000-0000-000000000007', NOW() - INTERVAL '17 minutes', NOW() - INTERVAL '2 days', NOW() - INTERVAL '17 minutes'),
  ('82000000-0000-0000-0000-000000000003', 'direct', '11000000-0000-0000-0000-000000000002:11000000-0000-0000-0000-000000000005', NOW() - INTERVAL '44 minutes', NOW() - INTERVAL '3 days', NOW() - INTERVAL '44 minutes');

INSERT INTO hertz_conversation_participants (id, conversation_id, user_id, last_read_at, created_at)
VALUES
  ('82100000-0000-0000-0000-000000000001', '82000000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000001', NOW() - INTERVAL '6 minutes', NOW() - INTERVAL '1 day'),
  ('82100000-0000-0000-0000-000000000002', '82000000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000004', NOW() - INTERVAL '2 minutes', NOW() - INTERVAL '1 day'),
  ('82100000-0000-0000-0000-000000000003', '82000000-0000-0000-0000-000000000002', '11000000-0000-0000-0000-000000000001', NOW() - INTERVAL '20 minutes', NOW() - INTERVAL '2 days'),
  ('82100000-0000-0000-0000-000000000004', '82000000-0000-0000-0000-000000000002', '11000000-0000-0000-0000-000000000007', NOW() - INTERVAL '14 minutes', NOW() - INTERVAL '2 days'),
  ('82100000-0000-0000-0000-000000000005', '82000000-0000-0000-0000-000000000003', '11000000-0000-0000-0000-000000000002', NOW() - INTERVAL '1 hour', NOW() - INTERVAL '3 days'),
  ('82100000-0000-0000-0000-000000000006', '82000000-0000-0000-0000-000000000003', '11000000-0000-0000-0000-000000000005', NOW() - INTERVAL '40 minutes', NOW() - INTERVAL '3 days');

INSERT INTO hertz_messages (id, conversation_id, sender_id, body, created_at)
VALUES
  ('83000000-0000-0000-0000-000000000001', '82000000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000004', 'Bang, gold tadi valid kalau retest 2330 dulu ya?', NOW() - INTERVAL '38 minutes'),
  ('83000000-0000-0000-0000-000000000002', '82000000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000001', 'Iya, tunggu reaksi. Kalau langsung spike jangan dikejar.', NOW() - INTERVAL '31 minutes'),
  ('83000000-0000-0000-0000-000000000003', '82000000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000004', 'Noted. Saya kecilkan risk ke 0.5 dulu.', NOW() - INTERVAL '3 minutes'),
  ('83000000-0000-0000-0000-000000000004', '82000000-0000-0000-0000-000000000002', '11000000-0000-0000-0000-000000000007', 'Saya kirim sumber liquidity untuk catatan komunitas ya.', NOW() - INTERVAL '52 minutes'),
  ('83000000-0000-0000-0000-000000000005', '82000000-0000-0000-0000-000000000002', '11000000-0000-0000-0000-000000000001', 'Mantap, pastikan source URL wajib ada supaya note kuat.', NOW() - INTERVAL '17 minutes'),
  ('83000000-0000-0000-0000-000000000006', '82000000-0000-0000-0000-000000000003', '11000000-0000-0000-0000-000000000005', 'Aku lagi susun jurnal psikologi buat blog. Perlu review?', NOW() - INTERVAL '1 hour'),
  ('83000000-0000-0000-0000-000000000007', '82000000-0000-0000-0000-000000000003', '11000000-0000-0000-0000-000000000002', 'Boleh, kirim draft pendek dulu. Fokus ke proses, bukan hasil trade.', NOW() - INTERVAL '44 minutes'),
  ('83000000-0000-0000-0000-000000000008', '82000000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000001', 'Kalau sudah ada screenshot, simpan di jurnal juga.', NOW() - INTERVAL '2 minutes'),
  ('83000000-0000-0000-0000-000000000009', '82000000-0000-0000-0000-000000000002', '11000000-0000-0000-0000-000000000007', 'Source sudah saya rapikan. Ada dua link: kalender dan news context.', NOW() - INTERVAL '12 minutes'),
  ('83000000-0000-0000-0000-000000000010', '82000000-0000-0000-0000-000000000002', '11000000-0000-0000-0000-000000000001', 'Bagus. Nanti note ini bisa langsung tampil tanpa approve dulu.', NOW() - INTERVAL '7 minutes'),
  ('83000000-0000-0000-0000-000000000011', '82000000-0000-0000-0000-000000000003', '11000000-0000-0000-0000-000000000005', 'Aku buat versi pendeknya dulu untuk feed, versi panjang masuk blog.', NOW() - INTERVAL '35 minutes'),
  ('83000000-0000-0000-0000-000000000012', '82000000-0000-0000-0000-000000000003', '11000000-0000-0000-0000-000000000002', 'Sip. Judulnya jangan terlalu teknikal, biar member baru tetap nyaman baca.', NOW() - INTERVAL '21 minutes'),
  ('83000000-0000-0000-0000-000000000013', '82000000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000004', 'Oke, aku juga lihat spread sempat melebar di brokerku.', NOW() - INTERVAL '1 minute'),
  ('83000000-0000-0000-0000-000000000014', '82000000-0000-0000-0000-000000000002', '11000000-0000-0000-0000-000000000007', 'Kalau market sudah lebih tenang, saya update catatan komunitasnya.', NOW() - INTERVAL '4 minutes'),
  ('83000000-0000-0000-0000-000000000015', '82000000-0000-0000-0000-000000000003', '11000000-0000-0000-0000-000000000005', 'Draft blog selesai malam ini. Saya tag kamu untuk review.', NOW() - INTERVAL '8 minutes');

UPDATE hertz_conversations
SET last_message_id = latest.message_id,
    last_message_at = latest.created_at,
    updated_at = latest.created_at
FROM (
  SELECT DISTINCT ON (conversation_id) conversation_id, id AS message_id, created_at
  FROM hertz_messages
  WHERE id::text LIKE '83000000-0000-0000-0000-0000000000%'
  ORDER BY conversation_id, created_at DESC
) latest
WHERE hertz_conversations.id = latest.conversation_id;

INSERT INTO hertz_message_attachments (id, message_id, file_url, file_key, mime_type, file_size, width, height, created_at)
VALUES
  ('83200000-0000-0000-0000-000000000001', '83000000-0000-0000-0000-000000000004', '/images/hertz-seed/chart-mini.svg', 'seed/dm/liquidity-source.svg', 'image/png', 128000, 1200, 720, NOW() - INTERVAL '52 minutes');

INSERT INTO hertz_message_reports (id, message_id, reporter_user_id, reason, details, status, created_at)
VALUES
  ('83300000-0000-0000-0000-000000000001', '83000000-0000-0000-0000-000000000006', '11000000-0000-0000-0000-000000000002', 'other', 'Seed report untuk memastikan admin moderation DM memiliki data contoh.', 'resolved', NOW() - INTERVAL '30 minutes');

INSERT INTO hertz_blocks (id, blocker_user_id, blocked_user_id, created_at)
VALUES
  ('84000000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000006', '11000000-0000-0000-0000-000000000009', NOW() - INTERVAL '5 days');

INSERT INTO activity_logs (id, actor_id, actor_type, action, target_type, target_id, details, ip_address, created_at)
VALUES
  ('87000000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000010', 'admin', 'hertz.seed.loaded', 'seed', NULL, '{"surface":"all-navbar","version":"002"}', '127.0.0.1', NOW() - INTERVAL '2 minutes'),
  ('87000000-0000-0000-0000-000000000002', '11000000-0000-0000-0000-000000000001', 'member', 'tools.profitability.opened', 'tool', '51000000-0000-0000-0000-000000000007', '{"tool":"profitability","mode":"USD/USC"}', '127.0.0.1', NOW() - INTERVAL '20 minutes'),
  ('87000000-0000-0000-0000-000000000003', '11000000-0000-0000-0000-000000000007', 'member', 'tools.cftc_viewer.opened', 'tool', '51000000-0000-0000-0000-000000000007', '{"tool":"cftc-viewer","market":"gold"}', '127.0.0.1', NOW() - INTERVAL '1 hour');

INSERT INTO hertz_credit_ledger (id, user_id, event_type, entity_id, amount, created_at)
VALUES
  ('85000000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000004', 'telegram_post_published', '71000000-0000-0000-0000-000000000001', 10, NOW() - INTERVAL '9 minutes'),
  ('85000000-0000-0000-0000-000000000003', '11000000-0000-0000-0000-000000000007', 'hertz_post_published', '71000000-0000-0000-0000-000000000002', 10, NOW() - INTERVAL '45 minutes');

INSERT INTO credit_transactions (id, user_id, amount, transaction_type, source_type, source_id, description, created_at)
VALUES
  ('86000000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000004', 10, 'earned', 'hertz_post', '61000000-0000-0000-0000-000000000001', 'Seed reward: published Telegram HERTZ post', NOW() - INTERVAL '9 minutes'),
  ('86000000-0000-0000-0000-000000000003', '11000000-0000-0000-0000-000000000007', 10, 'earned', 'community_note', '63000000-0000-0000-0000-000000000001', 'Seed reward: sourced community note', NOW() - INTERVAL '4 minutes');

COMMIT;
