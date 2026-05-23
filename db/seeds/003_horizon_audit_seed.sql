-- ============================================
-- Horizon Trader Platform
-- Audit seed: fills gaps for full product testing
-- Depends on 002_hertz_full_review_seed.sql (users 920000001–920000010)
-- Safe to re-run: only replaces rows with fixed UUID prefixes below.
-- ============================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- Cleanup (003 prefix only)
-- ---------------------------------------------------------------------------
DELETE FROM notification_events WHERE id::text LIKE '96500000-0000-0000-0000-0000000000%';
DELETE FROM device_tokens WHERE id::text LIKE '96000000-0000-0000-0000-0000000000%';
DELETE FROM challenge_ai_reviews WHERE id::text LIKE '95500000-0000-0000-0000-0000000000%';
DELETE FROM challenge_trades WHERE id::text LIKE '95400000-0000-0000-0000-0000000000%';
DELETE FROM challenge_personas WHERE id::text LIKE '95300000-0000-0000-0000-0000000000%';
DELETE FROM challenge_accounts WHERE id::text LIKE '95200000-0000-0000-0000-0000000000%';
DELETE FROM hertz_notifications WHERE id::text LIKE '90000000-0000-0000-0000-0000000000%';
DELETE FROM hertz_post_stats WHERE post_id::text LIKE '71000000-0000-0000-0000-0000000000%';
DELETE FROM hertz_reports WHERE id::text LIKE '75000000-0000-0000-0000-0000000000%';
DELETE FROM hertz_community_note_ratings WHERE note_id::text LIKE '73000000-0000-0000-0000-0000000000%';
DELETE FROM hertz_community_note_sources WHERE note_id::text LIKE '73000000-0000-0000-0000-0000000000%';
DELETE FROM hertz_community_notes WHERE id::text LIKE '73000000-0000-0000-0000-0000000000%';
DELETE FROM hertz_reposts WHERE id::text LIKE '74100000-0000-0000-0000-0000000000%';
DELETE FROM hertz_bookmarks WHERE id::text LIKE '74200000-0000-0000-0000-0000000000%';
DELETE FROM comments WHERE id::text LIKE '68000000-0000-0000-0000-0000000000%';
DELETE FROM likes WHERE id::text LIKE '68500000-0000-0000-0000-0000000000%';
DELETE FROM api_keys WHERE id::text LIKE '97000000-0000-0000-0000-0000000000%';
DELETE FROM wordpress_import_jobs WHERE id::text LIKE '88100000-0000-0000-0000-0000000000%';
DELETE FROM media WHERE id::text LIKE '54100000-0000-0000-0000-0000000000%';
DELETE FROM hertz_post_media WHERE post_id::text LIKE '71000000-0000-0000-0000-000000000008%';
DELETE FROM hertz_posts WHERE id::text LIKE '71000000-0000-0000-0000-000000000008%';
DELETE FROM articles WHERE id::text LIKE '51000000-0000-0000-0000-00000000002%'
   OR id::text LIKE '51000000-0000-0000-0000-00000000003%'
   OR id::text LIKE '51000000-0000-0000-0000-00000000004%'
   OR id::text LIKE '51000000-0000-0000-0000-00000000005%'
   OR id::text LIKE '51000000-0000-0000-0000-00000000006%';

DELETE FROM hertz_membership_checks
WHERE user_id::text IN (
  '11000000-0000-0000-0000-000000000011',
  '11000000-0000-0000-0000-000000000012',
  '11000000-0000-0000-0000-000000000013'
);

DELETE FROM users WHERE id::text IN (
  '11000000-0000-0000-0000-000000000011',
  '11000000-0000-0000-0000-000000000012',
  '11000000-0000-0000-0000-000000000013'
);

-- ---------------------------------------------------------------------------
-- Edge-case users (moderation / onboarding audit)
-- ---------------------------------------------------------------------------
INSERT INTO users (
  id, telegram_id, username, display_name, avatar_url, role,
  credit_balance, telegram_first_name, telegram_last_name,
  verified_member_at, muted_until, banned_at, created_at
) VALUES
  (
    '11000000-0000-0000-0000-000000000011', 920000011, 'pending_member', 'Pending Member',
    'https://api.dicebear.com/8.x/initials/svg?seed=Pending&backgroundColor=374151&textColor=d1d5db',
    'member', 0, 'Pending', 'Member', NULL, NULL, NULL, NOW() - INTERVAL '3 days'
  ),
  (
    '11000000-0000-0000-0000-000000000012', 920000012, 'muted_trader', 'Muted Trader',
    'https://api.dicebear.com/8.x/initials/svg?seed=Muted&backgroundColor=78350f&textColor=fde68a',
    'member', 42, 'Muted', 'Trader', NOW() - INTERVAL '40 days', NOW() + INTERVAL '2 days', NULL, NOW() - INTERVAL '50 days'
  ),
  (
    '11000000-0000-0000-0000-000000000013', 920000013, 'banned_spam', 'Banned Spam',
    'https://api.dicebear.com/8.x/initials/svg?seed=Banned&backgroundColor=450a0a&textColor=fca5a5',
    'member', 0, 'Banned', 'Spam', NOW() - INTERVAL '60 days', NULL, NOW() - INTERVAL '1 day', NOW() - INTERVAL '70 days'
  )
ON CONFLICT (id) DO UPDATE SET
  telegram_id = EXCLUDED.telegram_id,
  username = EXCLUDED.username,
  display_name = EXCLUDED.display_name,
  role = EXCLUDED.role,
  verified_member_at = EXCLUDED.verified_member_at,
  muted_until = EXCLUDED.muted_until,
  banned_at = EXCLUDED.banned_at;

INSERT INTO hertz_membership_checks (id, user_id, telegram_id, group_id, is_member, checked_at, last_verified_at, raw_response, created_at, updated_at)
VALUES
  ('12000000-0000-0000-0000-000000000011', '11000000-0000-0000-0000-000000000011', 920000011, -1001916607651, false, NOW() - INTERVAL '10 minutes', NULL, '{"isMember":false,"source":"seed"}'::jsonb, NOW(), NOW()),
  ('12000000-0000-0000-0000-000000000012', '11000000-0000-0000-0000-000000000012', 920000012, -1001916607651, true, NOW() - INTERVAL '8 minutes', NOW() - INTERVAL '8 minutes', '{"isMember":true,"source":"seed"}'::jsonb, NOW(), NOW()),
  ('12000000-0000-0000-0000-000000000013', '11000000-0000-0000-0000-000000000013', 920000013, -1001916607651, false, NOW() - INTERVAL '6 minutes', NULL, '{"isMember":false,"source":"seed"}'::jsonb, NOW(), NOW())
ON CONFLICT (telegram_id, group_id) DO UPDATE SET
  is_member = EXCLUDED.is_member,
  checked_at = EXCLUDED.checked_at,
  last_verified_at = EXCLUDED.last_verified_at,
  updated_at = NOW();

-- ---------------------------------------------------------------------------
-- Blog articles (WordPress-style)
-- ---------------------------------------------------------------------------
INSERT INTO articles (id, author_id, content_html, title, category, source, status, slug, created_at)
VALUES
  (
    '51000000-0000-0000-0000-000000000021',
    '11000000-0000-0000-0000-000000000005',
    '<p>Disiplin risk management bukan soal menghindari loss, melainkan menjaga ukuran posisi tetap konsisten saat market bergerak cepat. Artikel ini merangkum checklist pre-trade yang saya pakai sebelum sesi London.</p><p>Pertama, tentukan invalidasi sebelum entry. Kedua, catat alasan entry dalam satu kalimat. Ketiga, batasi jumlah trade aktif agar decision fatigue tidak menumpuk.</p>',
    'Checklist Risk Management untuk Sesi London',
    'blog', 'wordpress', 'published', 'checklist-risk-management-sesi-london',
    NOW() - INTERVAL '2 days'
  ),
  (
    '51000000-0000-0000-0000-000000000022',
    '11000000-0000-0000-0000-000000000006',
    '<p>Community note seed: artikel blog tentang jurnal trading psikologi. Fokus pada proses review, bukan hasil PnL harian.</p>',
    'Jurnal Trading: Proses Review yang Konsisten',
    'blog', 'wordpress', 'published', 'jurnal-trading-proses-review-konsisten',
    NOW() - INTERVAL '4 days'
  ),
  (
    '51000000-0000-0000-0000-000000000023',
    '11000000-0000-0000-0000-000000000008',
    '<p>Prop firm challenge sering gagal bukan karena strategi, tapi karena overtrading di hari ketiga. Artikel ini membahas batas trade harian dan aturan news trading.</p>',
    'Prop Firm Challenge: Hindari Overtrading Hari Ketiga',
    'blog', 'wordpress', 'published', 'prop-firm-challenge-hindari-overtrading',
    NOW() - INTERVAL '6 days'
  ),
  (
    '51000000-0000-0000-0000-000000000024',
    '11000000-0000-0000-0000-000000000003',
    '<p>Draft blog untuk audit admin — belum dipublish.</p>',
    'Draft: Macro Week Ahead (internal)',
    'blog', 'wordpress', 'draft', 'draft-macro-week-ahead-internal',
    NOW() - INTERVAL '12 hours'
  ),
  (
    '51000000-0000-0000-0000-000000000025',
    '11000000-0000-0000-0000-000000000009',
    '<p>Outlook draft tanpa metadata — untuk audit fallback UI.</p>',
    'Draft Outlook tanpa metadata',
    'outlook', 'web', 'draft', 'draft-outlook-tanpa-metadata',
    NOW() - INTERVAL '8 hours'
  ),
  (
    '51000000-0000-0000-0000-000000000026',
    '11000000-0000-0000-0000-000000000010',
    '<p>Hidden outlook untuk audit status filter.</p>',
    'Hidden outlook audit',
    'outlook', 'web', 'hidden', 'hidden-outlook-audit',
    NOW() - INTERVAL '1 day'
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO media (id, article_id, file_url, media_type, file_key, file_size, created_at)
VALUES
  ('54100000-0000-0000-0000-000000000001', '51000000-0000-0000-0000-000000000021', '/images/hertz-seed/chart-mini.svg', 'image', 'seed/audit/blog-risk.svg', 142000, NOW() - INTERVAL '2 days'),
  ('54100000-0000-0000-0000-000000000002', '51000000-0000-0000-0000-000000000022', '/images/hertz-seed/chart-depth.svg', 'image', 'seed/audit/blog-journal.svg', 156000, NOW() - INTERVAL '4 days'),
  ('54100000-0000-0000-0000-000000000003', '51000000-0000-0000-0000-000000000023', '/images/hertz-seed/chart-xauusd.svg', 'image', 'seed/audit/blog-prop.svg', 168000, NOW() - INTERVAL '6 days');

INSERT INTO comments (id, article_id, user_id, display_name, content, is_anonymous, status, created_at)
VALUES
  ('68000000-0000-0000-0000-000000000001', '51000000-0000-0000-0000-000000000021', '11000000-0000-0000-0000-000000000001', 'Mira FX', 'Checklist ini membantu banget sebelum London open.', false, 'visible', NOW() - INTERVAL '1 day'),
  ('68000000-0000-0000-0000-000000000002', '51000000-0000-0000-0000-000000000021', NULL, 'Anonim', 'Bisa ditambah contoh invalidasi untuk XAUUSD?', true, 'visible', NOW() - INTERVAL '20 hours'),
  ('68000000-0000-0000-0000-000000000003', '51000000-0000-0000-0000-000000000023', '11000000-0000-0000-0000-000000000004', 'Sena Scalper', 'Overtrading hari ketiga memang jebakan klasik.', false, 'visible', NOW() - INTERVAL '3 days');

INSERT INTO likes (id, article_id, fingerprint, created_at)
VALUES
  ('68500000-0000-0000-0000-000000000001', '51000000-0000-0000-0000-000000000021', 'seed-fp-mira-blog-21', NOW() - INTERVAL '1 day'),
  ('68500000-0000-0000-0000-000000000002', '51000000-0000-0000-0000-000000000021', 'seed-fp-langit-blog-21', NOW() - INTERVAL '22 hours'),
  ('68500000-0000-0000-0000-000000000003', '51000000-0000-0000-0000-000000000022', 'seed-fp-deka-blog-22', NOW() - INTERVAL '2 days');

-- ---------------------------------------------------------------------------
-- HERTZ: pending post + community note post
-- ---------------------------------------------------------------------------
INSERT INTO articles (id, author_id, content_html, title, category, source, status, slug, created_at)
VALUES
  ('51000000-0000-0000-0000-000000000027', '11000000-0000-0000-0000-000000000010', '<p>Pending HERTZ post untuk admin queue.</p>', 'GBPUSD wait confirmation', 'trading', 'telegram', 'pending_review', 'hertz-pending-gbpusd-audit', NOW() - INTERVAL '25 minutes')
ON CONFLICT (id) DO NOTHING;

INSERT INTO hertz_posts (id, short_id, article_id, author_id, type, source, category, status, content, telegram_message_id, telegram_chat_id, published_at, created_at, updated_at)
VALUES
  (
    '71000000-0000-0000-0000-000000000008', 'hzx_audit01', '51000000-0000-0000-0000-000000000027',
    '11000000-0000-0000-0000-000000000010', 'original', 'telegram', 'trading_room', 'pending_review',
    'GBPUSD masih menunggu konfirmasi M15. Draft seed untuk admin publish queue.',
    9203999, -1001916607651, NULL, NOW() - INTERVAL '25 minutes', NOW() - INTERVAL '25 minutes'
  )
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Bookmarks & reposts
-- ---------------------------------------------------------------------------
INSERT INTO hertz_bookmarks (id, post_id, user_id, created_at)
VALUES
  ('74200000-0000-0000-0000-000000000001', '71000000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000002', NOW() - INTERVAL '4 minutes'),
  ('74200000-0000-0000-0000-000000000002', '71000000-0000-0000-0000-000000000005', '11000000-0000-0000-0000-000000000001', NOW() - INTERVAL '30 minutes'),
  ('74200000-0000-0000-0000-000000000003', '71000000-0000-0000-0000-000000000003', '11000000-0000-0000-0000-000000000008', NOW() - INTERVAL '2 hours')
ON CONFLICT DO NOTHING;

INSERT INTO hertz_reposts (id, original_post_id, repost_post_id, user_id, repost_type, created_at)
VALUES
  ('74100000-0000-0000-0000-000000000001', '71000000-0000-0000-0000-000000000001', NULL, '11000000-0000-0000-0000-000000000003', 'repost', NOW() - INTERVAL '15 minutes'),
  ('74100000-0000-0000-0000-000000000002', '71000000-0000-0000-0000-000000000004', NULL, '11000000-0000-0000-0000-000000000005', 'repost', NOW() - INTERVAL '40 minutes')
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- Community notes
-- ---------------------------------------------------------------------------
INSERT INTO hertz_community_notes (id, post_id, author_id, content, status, helpful_count, not_helpful_count, created_at, updated_at)
VALUES
  (
    '73000000-0000-0000-0000-000000000001',
    '71000000-0000-0000-0000-000000000002',
    '11000000-0000-0000-0000-000000000006',
    'Konteks liquidity ini selaras dengan data kalender USD 14:30. Sumber BLS dan CME FedWatch menunjukkan volatilitas meningkat 20 menit sebelum rilis.',
    'published', 3, 0, NOW() - INTERVAL '20 minutes', NOW() - INTERVAL '20 minutes'
  ),
  (
    '73000000-0000-0000-0000-000000000002',
    '71000000-0000-0000-0000-000000000001',
    '11000000-0000-0000-0000-000000000007',
    'Catatan: area 2326 sudah di-test tiga kali minggu ini. Pertimbangkan invalidasi lebih ketat jika spread melebar.',
    'published', 1, 1, NOW() - INTERVAL '8 minutes', NOW() - INTERVAL '8 minutes'
  );

INSERT INTO hertz_community_note_sources (id, note_id, source_url, source_title, created_at)
VALUES
  ('73100000-0000-0000-0000-000000000001', '73000000-0000-0000-0000-000000000001', 'https://www.bls.gov/', 'BLS Economic Releases', NOW() - INTERVAL '20 minutes'),
  ('73100000-0000-0000-0000-000000000002', '73000000-0000-0000-0000-000000000001', 'https://www.cmegroup.com/markets/interest-rates/cme-fedwatch-tool.html', 'CME FedWatch', NOW() - INTERVAL '20 minutes');

INSERT INTO hertz_community_note_ratings (id, note_id, user_id, rating, created_at, updated_at)
VALUES
  ('73200000-0000-0000-0000-000000000001', '73000000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000001', 'helpful', NOW() - INTERVAL '18 minutes', NOW() - INTERVAL '18 minutes'),
  ('73200000-0000-0000-0000-000000000002', '73000000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000004', 'helpful', NOW() - INTERVAL '17 minutes', NOW() - INTERVAL '17 minutes'),
  ('73200000-0000-0000-0000-000000000003', '73000000-0000-0000-0000-000000000002', '11000000-0000-0000-0000-000000000002', 'not_helpful', NOW() - INTERVAL '7 minutes', NOW() - INTERVAL '7 minutes');

-- ---------------------------------------------------------------------------
-- Open moderation reports
-- ---------------------------------------------------------------------------
INSERT INTO hertz_reports (id, target_type, target_id, reporter_user_id, reason, details, status, created_at)
VALUES
  ('75000000-0000-0000-0000-000000000001', 'post', '71000000-0000-0000-0000-000000000002', '11000000-0000-0000-0000-000000000009', 'misleading', 'Seed report: perlu review konteks liquidity.', 'open', NOW() - INTERVAL '12 minutes'),
  ('75000000-0000-0000-0000-000000000002', 'comment', '74600000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000008', 'spam', 'Seed report komentar untuk admin queue.', 'reviewing', NOW() - INTERVAL '9 minutes'),
  ('75000000-0000-0000-0000-000000000003', 'community_note', '73000000-0000-0000-0000-000000000002', '11000000-0000-0000-0000-000000000004', 'other', 'Community note perlu verifikasi sumber.', 'open', NOW() - INTERVAL '6 minutes');

-- ---------------------------------------------------------------------------
-- Post stats cache (synced from 002 engagement)
-- ---------------------------------------------------------------------------
INSERT INTO hertz_post_stats (post_id, comment_count, pulse_count, repost_count, view_count, updated_at)
SELECT
  p.id,
  COALESCE(c.cnt, 0),
  COALESCE(r.cnt, 0),
  COALESCE(rp.cnt, 0),
  COALESCE(v.cnt, 0),
  NOW()
FROM hertz_posts p
LEFT JOIN (SELECT post_id, COUNT(*)::int AS cnt FROM hertz_comments WHERE status = 'visible' GROUP BY post_id) c ON c.post_id = p.id
LEFT JOIN (SELECT post_id, COUNT(*)::int AS cnt FROM hertz_reactions GROUP BY post_id) r ON r.post_id = p.id
LEFT JOIN (SELECT original_post_id AS post_id, COUNT(*)::int AS cnt FROM hertz_reposts GROUP BY original_post_id) rp ON rp.post_id = p.id
LEFT JOIN (SELECT post_id, COUNT(*)::int AS cnt FROM hertz_views GROUP BY post_id) v ON v.post_id = p.id
WHERE p.id::text LIKE '71000000-0000-0000-0000-0000000000%'
ON CONFLICT (post_id) DO UPDATE SET
  comment_count = EXCLUDED.comment_count,
  pulse_count = EXCLUDED.pulse_count,
  repost_count = EXCLUDED.repost_count,
  view_count = EXCLUDED.view_count,
  updated_at = NOW();

-- ---------------------------------------------------------------------------
-- In-app notifications (bell + unread badge)
-- ---------------------------------------------------------------------------
INSERT INTO hertz_notifications (id, user_id, actor_user_id, type, target_type, target_id, post_id, conversation_id, metadata, read_at, created_at)
VALUES
  ('90000000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000004', 'pulse', 'post', '71000000-0000-0000-0000-000000000001', '71000000-0000-0000-0000-000000000001', NULL, '{"seed":true}'::jsonb, NULL, NOW() - INTERVAL '3 minutes'),
  ('90000000-0000-0000-0000-000000000002', '11000000-0000-0000-0000-000000000007', '11000000-0000-0000-0000-000000000006', 'comment', 'comment', '74600000-0000-0000-0000-000000000002', '71000000-0000-0000-0000-000000000002', NULL, '{"preview":"Sumber liquidity-nya bagus"}'::jsonb, NULL, NOW() - INTERVAL '5 minutes'),
  ('90000000-0000-0000-0000-000000000003', '11000000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000004', 'dm', 'conversation', '82000000-0000-0000-0000-000000000001', NULL, '82000000-0000-0000-0000-000000000001', '{"preview":"Oke, aku juga lihat spread..."}'::jsonb, NULL, NOW() - INTERVAL '1 minute'),
  ('90000000-0000-0000-0000-000000000004', '11000000-0000-0000-0000-000000000004', '11000000-0000-0000-0000-000000000003', 'repost', 'post', '71000000-0000-0000-0000-000000000001', '71000000-0000-0000-0000-000000000001', NULL, '{"seed":true}'::jsonb, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '3 hours'),
  ('90000000-0000-0000-0000-000000000005', '11000000-0000-0000-0000-000000000010', '11000000-0000-0000-0000-000000000009', 'pulse', 'post', '71000000-0000-0000-0000-000000000002', '71000000-0000-0000-0000-000000000002', NULL, '{"seed":true}'::jsonb, NULL, NOW() - INTERVAL '10 minutes');

-- ---------------------------------------------------------------------------
-- Challenge tracker
-- ---------------------------------------------------------------------------
INSERT INTO challenge_accounts (
  id, user_id, name, account_currency, initial_balance, current_balance, current_equity,
  profit_target_percent, profit_target_amount, max_daily_loss_percent, max_daily_loss_amount,
  max_overall_drawdown_percent, max_overall_drawdown_amount, min_trading_days,
  start_date, end_date, account_type, drawdown_mode,
  news_trading_allowed, hold_overnight_allowed, hold_weekend_allowed,
  consistency_rule_percent, max_lot, max_risk_per_trade_percent, max_trades_per_day,
  preset_id, created_at, updated_at
) VALUES
  (
    '95200000-0000-0000-0000-000000000001',
    '11000000-0000-0000-0000-000000000004',
    'FTMO 100K Phase 1',
    'USD', 100000, 102350, 102100,
    10, 10000, 5, 5000, 10, 10000, 4,
    CURRENT_DATE - 12, CURRENT_DATE + 18, 'evaluation', 'static',
    false, true, false, 30, 5, 1, 3,
    'ftmo-100k', NOW() - INTERVAL '12 days', NOW()
  ),
  (
    '95200000-0000-0000-0000-000000000002',
    '11000000-0000-0000-0000-000000000001',
    'Personal 10K Journal',
    'USD', 10000, 9875, 9875,
    NULL, NULL, NULL, NULL, NULL, NULL, 0,
    CURRENT_DATE - 30, NULL, 'personal', 'balance_based',
    true, true, true, NULL, NULL, 2, NULL,
    NULL, NOW() - INTERVAL '30 days', NOW()
  );

INSERT INTO challenge_trades (
  id, challenge_account_id, user_id, trade_date, symbol, session, direction,
  entry_price, stop_loss, take_profit, exit_price, lot_size, risk_amount, risk_percent,
  result, pnl_amount, pnl_percent, rr_planned, rr_realized, setup_name, entry_reason, exit_reason,
  emotional_state, mistake_category, confidence_level, discipline_input_score, trade_quality,
  followed_plan, discipline_score, created_at, updated_at
) VALUES
  ('95400000-0000-0000-0000-000000000001', '95200000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000004', CURRENT_DATE - 1, 'XAUUSD', 'london', 'buy', 2328.5, 2318.0, 2345.0, 2338.2, 0.50, 500, 0.5, 'win', 485, 0.485, 2.0, 1.6, 'Retest rejection', 'Sweep + M15 reclaim', 'TP1 partial', 'calm', 'no_mistake', 4, 5, 'a', true, 100, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
  ('95400000-0000-0000-0000-000000000002', '95200000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000004', CURRENT_DATE - 2, 'EURUSD', 'london', 'sell', 1.0865, 1.0895, 1.0810, 1.0895, 1.00, 600, 0.6, 'loss', -600, -0.6, 1.8, -1.0, 'Failed breakdown', 'Chased momentum', 'SL hit', 'fomo', 'late_entry', 2, 2, 'c', false, 55, NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
  ('95400000-0000-0000-0000-000000000003', '95200000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000004', CURRENT_DATE - 3, 'BTCUSDT', 'new_york', 'buy', 66400, 65780, 67200, 66880, 0.20, 400, 0.4, 'win', 320, 0.32, 1.5, 1.2, 'Range reclaim', 'H1 close above 66400', 'Manual partial', 'calm', 'no_mistake', 4, 4, 'b', true, 92, NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
  ('95400000-0000-0000-0000-000000000004', '95200000-0000-0000-0000-000000000002', '11000000-0000-0000-0000-000000000001', CURRENT_DATE - 1, 'NAS100', 'new_york', 'buy', 18250, 18190, 18380, 18210, 0.10, 120, 1.2, 'loss', -125, -1.25, 2.0, -0.8, 'Opening drive', 'Premature entry', 'Cut early', 'hesitant', 'early_entry', 3, 3, 'c', false, 70, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day');

INSERT INTO challenge_personas (id, user_id, name, description, content, is_default, created_at, updated_at)
VALUES
  (
    '95300000-0000-0000-0000-000000000001',
    '11000000-0000-0000-0000-000000000004',
    'Strict Risk Coach',
    'Persona seed untuk AI review challenge tracker.',
    'You are a strict prop-firm risk coach. Focus on rule breaches, overtrading, and emotional entries. Respond in Indonesian with bullet points.',
    true, NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'
  );

INSERT INTO challenge_ai_reviews (
  id, challenge_account_id, user_id, persona_id, provider, review_scope, review_style,
  user_message, system_prompt, context_prompt, user_prompt, assistant_response, created_at
) VALUES
  (
    '95500000-0000-0000-0000-000000000001',
    '95200000-0000-0000-0000-000000000001',
    '11000000-0000-0000-0000-000000000004',
    '95300000-0000-0000-0000-000000000001',
    'seed', 'last_7_days', 'strict',
    'Review performa challenge saya minggu ini.',
    'Strict risk coach system prompt (seed).',
    'Account FTMO 100K, 3 trades, 1 loss FOMO EURUSD.',
    'Berikan evaluasi disiplin dan saran konkret.',
    '- Loss EURUSD disebabkan late entry / FOMO. Kurangi trade setelah 2 loss berturut.\n- XAUUSD dan BTC menunjukkan eksekusi lebih baik.\n- Pertahankan max 3 trade/hari sesuai rules seed.',
    NOW() - INTERVAL '2 hours'
  );

-- ---------------------------------------------------------------------------
-- Mobile push tokens & delivery log
-- ---------------------------------------------------------------------------
INSERT INTO device_tokens (id, user_id, platform, token, device_id, app_version, enabled, created_at, updated_at, last_seen_at)
VALUES
  ('96000000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000001', 'android', 'seed-fcm-token-mira-android', 'seed-pixel-8', '1.0.0', true, NOW() - INTERVAL '3 days', NOW() - INTERVAL '1 hour', NOW() - INTERVAL '1 hour'),
  ('96000000-0000-0000-0000-000000000002', '11000000-0000-0000-0000-000000000001', 'ios', 'seed-fcm-token-mira-ios', 'seed-iphone-15', '1.0.0', true, NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours'),
  ('96000000-0000-0000-0000-000000000003', '11000000-0000-0000-0000-000000000004', 'android', 'seed-fcm-token-sena-android', 'seed-s23', '1.0.0', false, NOW() - INTERVAL '10 days', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days');

INSERT INTO notification_events (id, user_id, device_token_id, event_type, title, body, payload, provider, status, created_at, sent_at, failed_at)
VALUES
  ('96500000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000001', '96000000-0000-0000-0000-000000000001', 'hertz.pulse', 'Pulse baru', 'Sena Scalper memberi pulse pada postingan Gold reject 2338', '{"postId":"71000000-0000-0000-0000-000000000001"}'::jsonb, 'fcm', 'sent', NOW() - INTERVAL '3 minutes', NOW() - INTERVAL '3 minutes', NULL),
  ('96500000-0000-0000-0000-000000000002', '11000000-0000-0000-0000-000000000001', '96000000-0000-0000-0000-000000000002', 'hertz.dm', 'Pesan baru', 'Sena: Oke, aku juga lihat spread sempat melebar', '{"conversationId":"82000000-0000-0000-0000-000000000001"}'::jsonb, 'fcm', 'pending', NOW() - INTERVAL '1 minute', NULL, NULL),
  ('96500000-0000-0000-0000-000000000003', '11000000-0000-0000-0000-000000000004', '96000000-0000-0000-0000-000000000003', 'hertz.comment', 'Komentar baru', 'Mira FX: Saya tandai 2326 sebagai invalidasi utama', '{"postId":"71000000-0000-0000-0000-000000000001"}'::jsonb, 'fcm', 'failed', NOW() - INTERVAL '20 minutes', NULL, NOW() - INTERVAL '19 minutes');

UPDATE notification_events SET error_message = 'Seed: device token disabled' WHERE id = '96500000-0000-0000-0000-000000000003';

-- ---------------------------------------------------------------------------
-- API keys (admin audit)
-- ---------------------------------------------------------------------------
INSERT INTO api_keys (id, key_hash, key_prefix, app_name, created_by, allowed_origins, is_active, last_used_at, created_at)
VALUES
  (
    '97000000-0000-0000-0000-000000000001',
    crypt('hz_seed_active_key_2026', gen_salt('bf')),
    'hz_actv',
    'Horizon Mobile (seed)',
    '11000000-0000-0000-0000-000000000010',
    'https://horizon.cloudnexify.com,http://localhost:3000',
    true,
    NOW() - INTERVAL '2 hours',
    NOW() - INTERVAL '30 days'
  ),
  (
    '97000000-0000-0000-0000-000000000002',
    crypt('hz_seed_revoked_key_2026', gen_salt('bf')),
    'hz_rev',
    'Legacy Widget (revoked seed)',
    '11000000-0000-0000-0000-000000000010',
    '*',
    false,
    NOW() - INTERVAL '40 days',
    NOW() - INTERVAL '90 days'
  );

-- ---------------------------------------------------------------------------
-- WordPress import jobs
-- ---------------------------------------------------------------------------
INSERT INTO wordpress_import_jobs (id, status, started_at, completed_at, total_fetched, total_imported, total_skipped, total_failed, error_message, triggered_by)
VALUES
  ('88100000-0000-0000-0000-000000000001', 'completed', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days' + INTERVAL '4 minutes', 48, 45, 2, 1, NULL, '11000000-0000-0000-0000-000000000010'),
  ('88100000-0000-0000-0000-000000000002', 'failed', NOW() - INTERVAL '6 hours', NOW() - INTERVAL '6 hours' + INTERVAL '90 seconds', 12, 0, 0, 12, 'Seed: WordPress API timeout (audit example)', '11000000-0000-0000-0000-000000000010');

DELETE FROM activity_logs WHERE id = '87000000-0000-0000-0000-000000000010';

INSERT INTO activity_logs (id, actor_id, actor_type, action, target_type, target_id, details, ip_address, created_at)
VALUES
  ('87000000-0000-0000-0000-000000000010', '11000000-0000-0000-0000-000000000010', 'admin', 'hertz.audit_seed.loaded', 'seed', NULL, '{"version":"003","surfaces":["blog","notifications","challenge","moderation"]}', '127.0.0.1', NOW() - INTERVAL '1 minute');

COMMIT;
