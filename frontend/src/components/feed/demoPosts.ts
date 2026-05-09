import type { MemberSessionUser, SignalPost } from '@shared/types';

const now = new Date().toISOString();

function basePost(index: number, overrides: Partial<SignalPost>): SignalPost {
  return {
    id: `demo-${index}`,
    shortId: `hz_demo${index}`,
    articleId: `demo-article-${index}`,
    type: 'original',
    source: 'telegram',
    category: 'trading',
    status: 'published',
    author: {
      id: `demo-user-${index}`,
      name: 'Trader Rizky',
      username: 'trader_rizky',
      badge: 'verified_member',
      avatarUrl: null,
    },
    content: { html: '', text: 'Gold reject 2338. Tunggu retest, jangan kejar candle.', isTruncated: false },
    media: [{ id: `demo-media-${index}`, url: '/images/signal-seed/chart-xauusd.svg', type: 'image', alt: 'XAUUSD chart setup' }],
    market: { pair: 'XAUUSD', timeframe: '1h', riskPercent: 1, direction: 'long', entryZone: '2330 - 2326', stopLoss: 2318, takeProfit1: 2345, takeProfit2: 2355, confidencePercent: 72, brokerOrSource: 'OANDA' },
    quotedPost: null,
    viewer: { hasSignaled: false, hasPulsed: false, hasBookmarked: false, hasReposted: false, canEdit: false, canDelete: false },
    counts: { comments: 2, signals: 4, pulses: 4, reposts: 2, views: 96 },
    primaryCommunityNote: null,
    createdAt: now,
    updatedAt: now,
    editedAt: null,
    ...overrides,
  };
}

export function getHertzDemoPosts(): SignalPost[] {
  const note = {
    id: 'demo-note-1',
    postId: 'hz_demo1',
    authorId: 'demo-user-note',
    authorName: 'Catatan Komunitas',
    content: 'Data liquidity menunjukkan akumulasi buy limit di 2332-2335. Diskusi lengkap di komentar.',
    status: 'published' as const,
    helpfulCount: 12,
    notHelpfulCount: 1,
    viewerRating: null,
    sources: [
      { id: 'demo-source-1', noteId: 'demo-note-1', url: 'https://forexfactory.com/calendar', title: 'ForexFactory', createdAt: now },
      { id: 'demo-source-2', noteId: 'demo-note-1', url: 'https://babypips.com/news/nfp-guide', title: 'BabyPips', createdAt: now },
    ],
    createdAt: now,
    updatedAt: now,
    editedAt: null,
  };

  return [
    basePost(1, { primaryCommunityNote: note }),
    basePost(2, {
      author: { id: 'demo-user-lg', name: 'Langit Trading', username: 'langit_trading', badge: 'verified_member', avatarUrl: null },
      content: { html: '', text: 'Setuju dengan analisa ini. Struktur H1 masih bullish selama di atas 2326.', isTruncated: false },
      media: [],
      quotedPost: basePost(20, {
        id: 'demo-quote-ref',
        shortId: 'hz_ref20',
        content: { html: '', text: 'Alpha Charts · XAUUSD Long', isTruncated: false },
        media: [{ id: 'demo-media-2', url: '/images/signal-seed/chart-mini.svg', type: 'image', alt: 'Mini chart' }],
        primaryCommunityNote: null,
      }),
      counts: { comments: 2, signals: 4, pulses: 4, reposts: 2, views: 96 },
    }),
    basePost(3, {
      author: { id: 'demo-user-lc', name: 'Life & Coffee', username: 'life_coffee', badge: 'verified_member', avatarUrl: null },
      category: 'life_story',
      content: { html: '', text: 'Hari ini saya cut loss lebih cepat. Ternyata disiplin bukan soal berani, tapi berhenti saat invalid.', isTruncated: true },
      media: [],
      market: null,
    }),
  ];
}

export function getHertzDemoUser(): MemberSessionUser {
  return {
    id: 'demo-user-ardani',
    telegramId: 910000001,
    username: 'ardani_trader',
    displayName: 'Ardani Trader',
    role: 'member',
    badge: 'verified_member',
    avatarUrl: null,
    verifiedMemberAt: now,
  };
}
