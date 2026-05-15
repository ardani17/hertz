-- ============================================
-- Horizon Trader Platform
-- Demo seed: HERTZ rich timeline
-- ============================================
-- Safe to run repeatedly. It only replaces records whose ids are in this file.

BEGIN;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Clean previous HERTZ review rows.
DELETE FROM post_reports
WHERE post_id::text LIKE '30000000-0000-0000-0000-0000000000%';

DELETE FROM community_note_ratings
WHERE note_id::text LIKE '50000000-0000-0000-0000-0000000000%';

DELETE FROM community_note_sources
WHERE note_id::text LIKE '50000000-0000-0000-0000-0000000000%';

DELETE FROM community_notes
WHERE id::text LIKE '50000000-0000-0000-0000-0000000000%';

DELETE FROM post_comments
WHERE id::text LIKE '60000000-0000-0000-0000-0000000000%';

DELETE FROM post_bookmarks
WHERE post_id::text LIKE '30000000-0000-0000-0000-0000000000%';

DELETE FROM post_reactions
WHERE post_id::text LIKE '30000000-0000-0000-0000-0000000000%';

DELETE FROM post_reposts
WHERE original_post_id::text LIKE '30000000-0000-0000-0000-0000000000%'
   OR repost_post_id::text LIKE '30000000-0000-0000-0000-0000000000%';

DELETE FROM post_views
WHERE post_id::text LIKE '30000000-0000-0000-0000-0000000000%';

DELETE FROM post_market_context
WHERE post_id::text LIKE '30000000-0000-0000-0000-0000000000%';

DELETE FROM feed_posts
WHERE id::text LIKE '30000000-0000-0000-0000-0000000000%';

DELETE FROM media
WHERE id::text LIKE '40000000-0000-0000-0000-0000000000%';

DELETE FROM credit_transactions
WHERE source_id::text LIKE '20000000-0000-0000-0000-0000000000%';

DELETE FROM articles
WHERE id::text LIKE '20000000-0000-0000-0000-0000000000%';

-- Seed member identities.
INSERT INTO users (
  id, telegram_id, username, display_name, avatar_url, role,
  credit_balance, telegram_first_name, telegram_last_name, verified_member_at, created_at
) VALUES
  ('10000000-0000-0000-0000-000000000001', 910000001, 'ardani_admin', 'Ardani Horizon', 'https://api.dicebear.com/8.x/initials/svg?seed=Ardani%20Horizon&backgroundColor=111827&textColor=10b981', 'admin', 180, 'Ardani', 'Horizon', NOW() - INTERVAL '40 days', NOW() - INTERVAL '60 days'),
  ('10000000-0000-0000-0000-000000000002', 910000002, 'mira_fx', 'Mira FX', 'https://api.dicebear.com/8.x/initials/svg?seed=Mira%20FX&backgroundColor=064e3b&textColor=ffffff', 'member', 96, 'Mira', 'FX', NOW() - INTERVAL '38 days', NOW() - INTERVAL '58 days'),
  ('10000000-0000-0000-0000-000000000003', 910000003, 'raka_gold', 'Raka Gold', 'https://api.dicebear.com/8.x/initials/svg?seed=Raka%20Gold&backgroundColor=172554&textColor=ffffff', 'member', 88, 'Raka', 'Gold', NOW() - INTERVAL '30 days', NOW() - INTERVAL '45 days'),
  ('10000000-0000-0000-0000-000000000004', 910000004, 'naya_macro', 'Naya Macro', 'https://api.dicebear.com/8.x/initials/svg?seed=Naya%20Macro&backgroundColor=581c87&textColor=ffffff', 'member', 74, 'Naya', 'Macro', NOW() - INTERVAL '26 days', NOW() - INTERVAL '39 days'),
  ('10000000-0000-0000-0000-000000000005', 910000005, 'dio_priceaction', 'Dio Price Action', 'https://api.dicebear.com/8.x/initials/svg?seed=Dio%20PA&backgroundColor=713f12&textColor=ffffff', 'member', 63, 'Dio', 'PA', NOW() - INTERVAL '21 days', NOW() - INTERVAL '34 days'),
  ('10000000-0000-0000-0000-000000000006', 910000006, 'salsa_journal', 'Salsa Journal', 'https://api.dicebear.com/8.x/initials/svg?seed=Salsa%20Journal&backgroundColor=9f1239&textColor=ffffff', 'member', 55, 'Salsa', 'Journal', NOW() - INTERVAL '18 days', NOW() - INTERVAL '31 days'),
  ('10000000-0000-0000-0000-000000000007', 910000007, 'bima_scalps', 'Bima Scalps', 'https://api.dicebear.com/8.x/initials/svg?seed=Bima%20Scalps&backgroundColor=0f766e&textColor=ffffff', 'member', 47, 'Bima', 'Scalps', NOW() - INTERVAL '12 days', NOW() - INTERVAL '26 days'),
  ('10000000-0000-0000-0000-000000000008', 910000008, 'intan_risk', 'Intan Risk', 'https://api.dicebear.com/8.x/initials/svg?seed=Intan%20Risk&backgroundColor=1e3a8a&textColor=ffffff', 'member', 39, 'Intan', 'Risk', NOW() - INTERVAL '9 days', NOW() - INTERVAL '20 days')
ON CONFLICT (telegram_id) DO UPDATE SET
  username = EXCLUDED.username,
  display_name = EXCLUDED.display_name,
  avatar_url = EXCLUDED.avatar_url,
  role = EXCLUDED.role,
  credit_balance = EXCLUDED.credit_balance,
  telegram_first_name = EXCLUDED.telegram_first_name,
  telegram_last_name = EXCLUDED.telegram_last_name,
  verified_member_at = EXCLUDED.verified_member_at;

INSERT INTO hertz_membership_checks (user_id, telegram_id, group_id, is_member, checked_at, last_verified_at, raw_response)
SELECT id, telegram_id, -1001916607651, true, NOW(), NOW(), '{"isMember":true}'::jsonb
FROM users
WHERE telegram_id BETWEEN 910000001 AND 910000008
ON CONFLICT (telegram_id, group_id) DO UPDATE SET
  user_id = EXCLUDED.user_id,
  is_member = true,
  checked_at = NOW(),
  last_verified_at = NOW(),
  raw_response = EXCLUDED.raw_response;

-- Original articles backing the social posts.
INSERT INTO articles (id, author_id, content_html, title, category, source, status, slug, telegram_message_id, telegram_chat_id, created_at)
VALUES
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '<p>London session notes: XAUUSD masih menjaga higher low di atas 2331. Saya menunggu sweep kecil ke area 2334-2336 sebelum mencari rejection. Risk tetap 1%, invalid kalau candle M15 close di bawah 2328.</p>', 'London session notes: XAUUSD higher low', 'trading', 'web', 'published', 'signal-seed-xauusd-london-plan', NULL, NULL, NOW() - INTERVAL '8 minutes'),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', '<p>Jurnal pagi ini agak panjang. Saya mulai dari kebiasaan kecil: sebelum buka chart, saya tulis dulu kondisi emosi, kualitas tidur, dan apakah saya sedang ingin membalas loss kemarin. Ternyata ritual sederhana itu membuat entry lebih pelan. Hari ini saya menolak dua setup yang secara teknikal terlihat menarik, tapi tidak sesuai dengan rencana mingguan. Setelah itu saya baru ambil satu posisi kecil, bukan karena takut, tapi karena market memang belum memberi alasan untuk agresif. Pelajaran terbesar minggu ini: disiplin bukan cuma soal mengikuti entry, tapi juga berani membiarkan peluang lewat ketika kualitasnya tidak jelas. Kalau kebiasaan ini konsisten, saya rasa equity curve akan lebih sehat walaupun jumlah trade berkurang.</p><p>Saya simpan catatan ini supaya nanti bisa dibandingkan dengan hasil akhir minggu. Fokus utama: tidak menambah lot setelah satu loss, tidak entry saat berita merah, dan tetap pakai stop loss yang sudah ditentukan sejak awal.</p>', 'Jurnal pagi: disiplin sebelum entry', 'life_story', 'web', 'published', 'signal-seed-jurnal-pagi-disiplin', NULL, NULL, NOW() - INTERVAL '23 minutes'),
  ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003', '<p>Telegram recap: struktur BTC masih rapi selama 66.2K bertahan. Kalau ada reclaim 67K dengan volume, saya cari continuation kecil. Jangan lupa NFP malam ini, size wajib turun.</p>', 'BTC reclaim plan menjelang NFP', 'trading', 'telegram', 'published', 'signal-seed-btc-reclaim-nfp', 9103003, -1001916607651, NOW() - INTERVAL '41 minutes'),
  ('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000004', '<p>Macro watch: DXY masih menekan risk assets. Untuk hari ini saya lebih percaya reaksi setelah data daripada prediksi sebelum data. Simpan level, bukan opini.</p>', 'Macro watch DXY sebelum data', 'general', 'telegram', 'published', 'signal-seed-dxy-macro-watch', 9103004, -1001916607651, NOW() - INTERVAL '1 hour'),
  ('20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000005', '<p>Quote repost: setup XAUUSD dari Ardani masuk akal, tapi saya akan tunggu M5 displacement dulu. Kalau langsung FOMO di area tengah, RR jadi jelek.</p>', 'Quote repost XAUUSD plan', 'trading', 'web', 'published', 'signal-seed-quote-xauusd-plan', NULL, NULL, NOW() - INTERVAL '1 hour 15 minutes'),
  ('20000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000006', '<p>Checklist sebelum trading: 1) berita merah sudah dicek, 2) max loss harian sudah ditulis, 3) tidak entry kalau spread melebar, 4) screenshot sebelum dan sesudah trade.</p>', 'Checklist sebelum trading', 'general', 'web', 'published', 'signal-seed-checklist-sebelum-trading', NULL, NULL, NOW() - INTERVAL '2 hours'),
  ('20000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000007', '<p>Scalp idea EURUSD: tunggu pullback ke 1.0730-1.0738. Kalau rejection gagal, saya skip. Tidak ada averaging.</p>', 'EURUSD scalp idea', 'trading', 'telegram', 'published', 'signal-seed-eurusd-scalp', 9103007, -1001916607651, NOW() - INTERVAL '2 hours 40 minutes'),
  ('20000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000008', '<p>Catatan risk: kalau akun sedang sideways tiga hari, biasanya masalahnya bukan strategi, tapi kualitas seleksi setup. Saya turunkan frekuensi dulu.</p>', 'Catatan risk saat akun sideways', 'life_story', 'web', 'published', 'signal-seed-risk-sideways', NULL, NULL, NOW() - INTERVAL '3 hours 15 minutes'),
  ('20000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000001', '<p>Admin note: Market Pulse di right rail sekarang membaca data seed database. Jangan dipakai sebagai sinyal live sampai endpoint market resmi kita sambungkan.</p>', 'Admin note market pulse seed', 'general', 'admin', 'published', 'signal-seed-admin-market-pulse', NULL, NULL, NOW() - INTERVAL '4 hours'),
  ('20000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000004', '<p>GBPJPY sedang ekspansif. Untuk pair seperti ini, saya tidak mau entry tanpa candle close yang jelas karena wick bisa sangat mahal.</p>', 'GBPJPY ekspansif tunggu close', 'trading', 'web', 'published', 'signal-seed-gbpjpy-expansive', NULL, NULL, NOW() - INTERVAL '5 hours'),
  ('20000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000002', '<p>Telegram pending sample: ini contoh draft dari Telegram yang harus terlihat di admin queue dan belum muncul di feed publik sampai admin publish.</p>', 'Pending Telegram sample', 'general', 'telegram', 'draft', 'signal-seed-pending-telegram-sample', 9103011, -1001916607651, NOW() - INTERVAL '12 minutes'),
  ('20000000-0000-0000-0000-000000000012', '10000000-0000-0000-0000-000000000003', '<p>Hidden sample: post ini sengaja hidden untuk memastikan moderation path tidak bocor ke feed publik.</p>', 'Hidden moderation sample', 'general', 'web', 'published', 'signal-seed-hidden-sample', NULL, NULL, NOW() - INTERVAL '1 day');

INSERT INTO feed_posts (id, short_id, article_id, author_id, post_type, source, category, status, quoted_post_id, telegram_message_id, telegram_chat_id, pinned_at, created_at, updated_at)
VALUES
  ('30000000-0000-0000-0000-000000000001', 'hz_seed01', '20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'original', 'web', 'trading', 'published', NULL, NULL, NULL, NOW() - INTERVAL '7 minutes', NOW() - INTERVAL '8 minutes', NOW() - INTERVAL '8 minutes'),
  ('30000000-0000-0000-0000-000000000002', 'hz_seed02', '20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'original', 'web', 'life_story', 'published', NULL, NULL, NULL, NULL, NOW() - INTERVAL '23 minutes', NOW() - INTERVAL '23 minutes'),
  ('30000000-0000-0000-0000-000000000003', 'hz_seed03', '20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003', 'original', 'telegram', 'trading', 'published', NULL, 9103003, -1001916607651, NULL, NOW() - INTERVAL '41 minutes', NOW() - INTERVAL '41 minutes'),
  ('30000000-0000-0000-0000-000000000004', 'hz_seed04', '20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000004', 'original', 'telegram', 'general', 'published', NULL, 9103004, -1001916607651, NULL, NOW() - INTERVAL '1 hour', NOW() - INTERVAL '1 hour'),
  ('30000000-0000-0000-0000-000000000005', 'hz_seed05', '20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000005', 'quote', 'web', 'trading', 'published', '30000000-0000-0000-0000-000000000001', NULL, NULL, NULL, NOW() - INTERVAL '1 hour 15 minutes', NOW() - INTERVAL '1 hour 15 minutes'),
  ('30000000-0000-0000-0000-000000000006', 'hz_seed06', '20000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000006', 'original', 'web', 'general', 'published', NULL, NULL, NULL, NULL, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours'),
  ('30000000-0000-0000-0000-000000000007', 'hz_seed07', '20000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000007', 'original', 'telegram', 'trading', 'published', NULL, 9103007, -1001916607651, NULL, NOW() - INTERVAL '2 hours 40 minutes', NOW() - INTERVAL '2 hours 40 minutes'),
  ('30000000-0000-0000-0000-000000000008', 'hz_seed08', '20000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000008', 'original', 'web', 'life_story', 'published', NULL, NULL, NULL, NULL, NOW() - INTERVAL '3 hours 15 minutes', NOW() - INTERVAL '3 hours 15 minutes'),
  ('30000000-0000-0000-0000-000000000009', 'hz_seed09', '20000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000001', 'original', 'admin', 'general', 'published', NULL, NULL, NULL, NULL, NOW() - INTERVAL '4 hours', NOW() - INTERVAL '4 hours'),
  ('30000000-0000-0000-0000-000000000010', 'hz_seed10', '20000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000004', 'original', 'web', 'trading', 'published', NULL, NULL, NULL, NULL, NOW() - INTERVAL '5 hours', NOW() - INTERVAL '5 hours'),
  ('30000000-0000-0000-0000-000000000011', 'hz_seed11', '20000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000002', 'original', 'telegram', 'general', 'pending_review', NULL, 9103011, -1001916607651, NULL, NOW() - INTERVAL '12 minutes', NOW() - INTERVAL '12 minutes'),
  ('30000000-0000-0000-0000-000000000012', 'hz_seed12', '20000000-0000-0000-0000-000000000012', '10000000-0000-0000-0000-000000000003', 'original', 'web', 'general', 'hidden', NULL, NULL, NULL, NULL, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day');

INSERT INTO media (id, article_id, file_url, media_type, file_key, file_size, created_at)
VALUES
  ('40000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '/images/signal-seed/chart-xauusd.svg', 'image', 'seed/xauusd-chart.svg', 235000, NOW() - INTERVAL '8 minutes'),
  ('40000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', '/images/signal-seed/chart-mini.svg', 'image', 'seed/xauusd-depth.svg', 228000, NOW() - INTERVAL '8 minutes'),
  ('40000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000002', '/images/signal-seed/chart-mini.svg', 'image', 'seed/journal-desk.svg', 196000, NOW() - INTERVAL '23 minutes'),
  ('40000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000003', '/images/signal-seed/chart-mini.svg', 'image', 'seed/btc-1.svg', 210000, NOW() - INTERVAL '41 minutes'),
  ('40000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000003', '/images/signal-seed/chart-mini.svg', 'image', 'seed/btc-2.svg', 210000, NOW() - INTERVAL '41 minutes'),
  ('40000000-0000-0000-0000-000000000006', '20000000-0000-0000-0000-000000000003', '/images/signal-seed/chart-xauusd.svg', 'image', 'seed/btc-3.svg', 210000, NOW() - INTERVAL '41 minutes'),
  ('40000000-0000-0000-0000-000000000007', '20000000-0000-0000-0000-000000000003', '/images/signal-seed/chart-mini.svg', 'image', 'seed/btc-4.svg', 210000, NOW() - INTERVAL '41 minutes'),
  ('40000000-0000-0000-0000-000000000008', '20000000-0000-0000-0000-000000000007', '/images/signal-seed/chart-mini.svg', 'image', 'seed/eurusd.svg', 182000, NOW() - INTERVAL '2 hours 40 minutes'),
  ('40000000-0000-0000-0000-000000000009', '20000000-0000-0000-0000-000000000010', '/images/signal-seed/chart-mini.svg', 'image', 'seed/gbpjpy.svg', 191000, NOW() - INTERVAL '5 hours');

INSERT INTO post_market_context (
  post_id, pair, timeframe, risk_percent, direction, entry_price, entry_zone,
  stop_loss, take_profit, take_profit_1, take_profit_2, take_profit_3,
  setup_type, confidence_percent, broker_or_source
) VALUES
  ('30000000-0000-0000-0000-000000000001', 'XAUUSD', 'M15', 1.00, 'long', 2336.20, '2334-2336', 2328.00, 2352.00, 2342.00, 2348.00, 2352.00, 'Liquidity sweep + rejection', 72, 'Horizon seed'),
  ('30000000-0000-0000-0000-000000000003', 'BTCUSDT', 'H1', 0.75, 'long', 67020.00, '66800-67020', 66180.00, 68400.00, 67500.00, 67980.00, 68400.00, 'Break and retest', 64, 'Binance seed'),
  ('30000000-0000-0000-0000-000000000007', 'EURUSD', 'M5', 0.50, 'short', 1.0734, '1.0730-1.0738', 1.0752, 1.0698, 1.0718, 1.0706, 1.0698, 'Session scalp', 58, 'Horizon seed'),
  ('30000000-0000-0000-0000-000000000010', 'GBPJPY', 'M30', 0.75, 'watchlist', NULL, '191.20-191.55', 190.70, 192.80, 191.95, 192.35, 192.80, 'Volatility expansion', 61, 'Horizon seed');

INSERT INTO post_reactions (post_id, user_id, reaction_type, created_at)
SELECT post_id::uuid, user_id::uuid, 'pulse', NOW() - (rn || ' minutes')::interval
FROM (
  VALUES
    ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 2),
    ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 3),
    ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000004', 4),
    ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000005', 5),
    ('30000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 7),
    ('30000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000006', 8),
    ('30000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 11),
    ('30000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000007', 12),
    ('30000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000008', 18),
    ('30000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000002', 20),
    ('30000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000003', 24),
    ('30000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000004', 31),
    ('30000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000005', 37),
    ('30000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000006', 42)
) AS seed(post_id, user_id, rn);

INSERT INTO post_bookmarks (post_id, user_id, created_at)
VALUES
  ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000008', NOW() - INTERVAL '2 minutes'),
  ('30000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002', NOW() - INTERVAL '9 minutes'),
  ('30000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000003', NOW() - INTERVAL '20 minutes');

INSERT INTO post_reposts (id, original_post_id, repost_post_id, user_id, repost_type, created_at)
VALUES
  ('70000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', NULL, '10000000-0000-0000-0000-000000000006', 'repost', NOW() - INTERVAL '30 minutes'),
  ('70000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000003', NULL, '10000000-0000-0000-0000-000000000008', 'repost', NOW() - INTERVAL '55 minutes'),
  ('70000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000005', 'quote', NOW() - INTERVAL '1 hour 15 minutes');

INSERT INTO post_comments (id, post_id, user_id, content, status, created_at, updated_at)
VALUES
  ('60000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'Saya suka invalidation-nya jelas. Area 2328 itu juga dekat low Asia.', 'visible', NOW() - INTERVAL '6 minutes', NOW() - INTERVAL '6 minutes'),
  ('60000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000008', 'Risk 1% masuk akal. Kalau berita mendadak, lebih baik batal dulu.', 'visible', NOW() - INTERVAL '4 minutes', NOW() - INTERVAL '4 minutes'),
  ('60000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000004', 'Bagian cek emosi sebelum chart ini penting banget.', 'visible', NOW() - INTERVAL '19 minutes', NOW() - INTERVAL '19 minutes'),
  ('60000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 'Setuju turunkan size menjelang NFP.', 'visible', NOW() - INTERVAL '33 minutes', NOW() - INTERVAL '33 minutes'),
  ('60000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000007', 'Saya tambahkan satu: setelah TP jangan langsung cari trade baru.', 'visible', NOW() - INTERVAL '1 hour', NOW() - INTERVAL '1 hour');

INSERT INTO community_notes (id, post_id, author_id, content, helpful_count, not_helpful_count, status, created_at, updated_at)
VALUES
  ('50000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000004', 'Pembaca menambahkan konteks: XAUUSD biasanya melebar saat rilis data USD besar. Gunakan kalender ekonomi sebelum mengikuti setup intraday.', 5, 1, 'published', NOW() - INTERVAL '5 minutes', NOW() - INTERVAL '5 minutes'),
  ('50000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000008', 'BTC bisa bergerak tajam saat data tenaga kerja AS. Level teknikal tetap perlu dikombinasikan dengan jadwal rilis makro.', 3, 0, 'published', NOW() - INTERVAL '28 minutes', NOW() - INTERVAL '28 minutes'),
  ('50000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000002', 'Market Pulse di seed ini berasal dari tabel database review. Label data seed wajib tetap terlihat sampai endpoint live dibuat.', 4, 0, 'published', NOW() - INTERVAL '3 hours', NOW() - INTERVAL '3 hours');

INSERT INTO community_note_sources (id, note_id, source_url, source_title)
VALUES
  ('51000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', 'https://www.investing.com/economic-calendar/', 'Economic Calendar'),
  ('51000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000001', 'https://www.cmegroup.com/markets/metals/precious/gold.html', 'CME Gold Futures'),
  ('51000000-0000-0000-0000-000000000003', '50000000-0000-0000-0000-000000000002', 'https://www.bls.gov/schedule/news_release/empsit.htm', 'BLS Employment Situation'),
  ('51000000-0000-0000-0000-000000000004', '50000000-0000-0000-0000-000000000003', 'https://horizon.local/tools', 'Horizon Tools Roadmap');

INSERT INTO community_note_ratings (note_id, user_id, rating)
VALUES
  ('50000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'helpful'),
  ('50000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'helpful'),
  ('50000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'helpful'),
  ('50000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000005', 'not_helpful'),
  ('50000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'helpful'),
  ('50000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000006', 'helpful'),
  ('50000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000008', 'helpful')
ON CONFLICT (note_id, user_id) DO UPDATE SET rating = EXCLUDED.rating, updated_at = NOW();

INSERT INTO post_views (post_id, user_id, session_hash, ip_hash, user_agent_hash, viewed_at)
SELECT post_id::uuid, NULL, 'seed-session-' || post_id || '-' || n, 'seed-ip-' || n, 'seed-ua-' || n, NOW() - (n || ' minutes')::interval
FROM (
  VALUES
    ('30000000-0000-0000-0000-000000000001', 96),
    ('30000000-0000-0000-0000-000000000002', 72),
    ('30000000-0000-0000-0000-000000000003', 63),
    ('30000000-0000-0000-0000-000000000004', 48),
    ('30000000-0000-0000-0000-000000000005', 41),
    ('30000000-0000-0000-0000-000000000006', 32),
    ('30000000-0000-0000-0000-000000000007', 29),
    ('30000000-0000-0000-0000-000000000008', 24),
    ('30000000-0000-0000-0000-000000000009', 18),
    ('30000000-0000-0000-0000-000000000010', 16)
) AS totals(post_id, total)
CROSS JOIN LATERAL generate_series(1, totals.total) AS n;

INSERT INTO post_reports (post_id, reporter_user_id, reason, details, status, created_at)
VALUES
  ('30000000-0000-0000-0000-000000000012', '10000000-0000-0000-0000-000000000008', 'misleading', 'Seed report untuk mengetes moderation surface.', 'resolved', NOW() - INTERVAL '20 hours');

INSERT INTO credit_transactions (user_id, amount, transaction_type, source_type, source_id, description, created_at)
VALUES
  ('10000000-0000-0000-0000-000000000001', 10, 'earned', 'article', '20000000-0000-0000-0000-000000000001', '[seed hertz] Trading Room post reward', NOW() - INTERVAL '8 minutes'),
  ('10000000-0000-0000-0000-000000000002', 5, 'earned', 'article', '20000000-0000-0000-0000-000000000002', '[seed hertz] Life story post reward', NOW() - INTERVAL '23 minutes'),
  ('10000000-0000-0000-0000-000000000003', 10, 'earned', 'article', '20000000-0000-0000-0000-000000000003', '[seed hertz] Trading Room post reward', NOW() - INTERVAL '41 minutes'),
  ('10000000-0000-0000-0000-000000000004', 3, 'earned', 'article', '20000000-0000-0000-0000-000000000004', '[seed hertz] General post reward', NOW() - INTERVAL '1 hour');

INSERT INTO activity_logs (actor_id, actor_type, action, target_type, target_id, details, created_at)
VALUES
  ('10000000-0000-0000-0000-000000000001', 'admin', 'hertz.seed.loaded', 'post', '30000000-0000-0000-0000-000000000001', '{"seed":"hertz-review","records":"rich timeline"}'::jsonb, NOW());

COMMIT;

SELECT
  (SELECT COUNT(*) FROM feed_posts WHERE status = 'published' AND id::text LIKE '30000000-0000-0000-0000-0000000000%') AS published_posts,
  (SELECT COUNT(*) FROM feed_posts WHERE status = 'pending_review' AND id::text LIKE '30000000-0000-0000-0000-0000000000%') AS pending_posts,
  (SELECT COUNT(*) FROM media WHERE id::text LIKE '40000000-0000-0000-0000-0000000000%') AS media_items,
  (SELECT COUNT(*) FROM post_comments WHERE id::text LIKE '60000000-0000-0000-0000-0000000000%') AS comments,
  (SELECT COUNT(*) FROM community_notes WHERE id::text LIKE '50000000-0000-0000-0000-0000000000%') AS community_notes;
