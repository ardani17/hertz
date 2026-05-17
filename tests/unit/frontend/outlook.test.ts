import { describe, it, expect } from 'vitest';
import {
  buildOutlookCardModel,
  buildOutlookDetailModel,
  buildOutlookSnapshot,
  inferOutlookContentKind,
  isArticleContentBodyAllowed,
  normalizeOutlookMetadata,
  stripOutlookHtml,
} from '../../../frontend/src/lib/outlookContent';

// ---- Pure logic extracted from Outlook components for testing ----

// From OutlookCard.tsx
function getExcerpt(html: string, maxLength = 200): string {
  const text = html.replace(/<[^>]*>/g, '').trim();
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + '…';
}

// From ArticleMeta.tsx (reused in OutlookCard)
function estimateReadTime(html: string): number {
  const text = html.replace(/<[^>]*>/g, '').trim();
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(wordCount / 200));
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

// ---- Test data helpers ----

interface OutlookCardData {
  id: string;
  title: string | null;
  content_html: string;
  slug: string;
  created_at: string;
  author_name: string | null;
  cover_image: string | null;
}

function makeOutlookArticle(overrides: Partial<OutlookCardData> = {}): OutlookCardData {
  return {
    id: '1',
    title: 'Market Outlook Q1 2024',
    content_html: '<p>Analisa mendalam tentang pergerakan market di kuartal pertama 2024.</p>',
    slug: 'market-outlook-q1-2024-abc123',
    created_at: '2024-01-15T10:00:00Z',
    author_name: 'TraderPro',
    cover_image: 'https://r2.example.com/chart.jpg',
    ...overrides,
  };
}

// ---- Tests ----

describe('OutlookCard getExcerpt', () => {
  it('strips HTML tags and returns plain text', () => {
    const result = getExcerpt('<p>Analisa <strong>market</strong> mendalam</p>');
    expect(result).toBe('Analisa market mendalam');
  });

  it('truncates long text at 200 chars with ellipsis', () => {
    const longText = '<p>' + 'kata '.repeat(100) + '</p>';
    const result = getExcerpt(longText, 200);
    expect(result.length).toBeLessThanOrEqual(201);
    expect(result).toMatch(/…$/);
  });

  it('returns full text when shorter than maxLength', () => {
    const result = getExcerpt('<p>Short outlook</p>');
    expect(result).toBe('Short outlook');
  });

  it('handles empty HTML', () => {
    const result = getExcerpt('');
    expect(result).toBe('');
  });
});

describe('estimateReadTime', () => {
  it('returns 1 minute for short content', () => {
    const result = estimateReadTime('<p>Hello world</p>');
    expect(result).toBe(1);
  });

  it('estimates correctly for longer content', () => {
    // 400 words should be ~2 minutes
    const words = Array(400).fill('word').join(' ');
    const result = estimateReadTime(`<p>${words}</p>`);
    expect(result).toBe(2);
  });

  it('returns at least 1 minute for empty content', () => {
    const result = estimateReadTime('');
    expect(result).toBe(1);
  });
});

describe('formatDate for Outlook', () => {
  it('formats date in Indonesian locale', () => {
    const result = formatDate('2024-01-15T10:00:00Z');
    expect(result).toContain('2024');
    expect(result).toContain('15');
  });
});

describe('OutlookCardData structure', () => {
  it('creates a valid outlook article with all fields', () => {
    const article = makeOutlookArticle();
    expect(article.id).toBe('1');
    expect(article.title).toBe('Market Outlook Q1 2024');
    expect(article.cover_image).toBe('https://r2.example.com/chart.jpg');
    expect(article.slug).toContain('outlook');
  });

  it('handles article without cover image', () => {
    const article = makeOutlookArticle({ cover_image: null });
    expect(article.cover_image).toBeNull();
  });

  it('handles article without title', () => {
    const article = makeOutlookArticle({ title: null });
    expect(article.title).toBeNull();
    // Display title should fall back to excerpt
    const excerpt = getExcerpt(article.content_html);
    const displayTitle = article.title || excerpt.slice(0, 80);
    expect(displayTitle.length).toBeGreaterThan(0);
  });

  it('handles article without author', () => {
    const article = makeOutlookArticle({ author_name: null });
    expect(article.author_name).toBeNull();
  });
});

describe('Outlook listing sort order', () => {
  it('articles should be sortable in reverse chronological order', () => {
    const articles = [
      makeOutlookArticle({ id: '1', created_at: '2024-01-10T10:00:00Z' }),
      makeOutlookArticle({ id: '2', created_at: '2024-01-15T10:00:00Z' }),
      makeOutlookArticle({ id: '3', created_at: '2024-01-12T10:00:00Z' }),
    ];

    const sorted = [...articles].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    expect(sorted[0].id).toBe('2');
    expect(sorted[1].id).toBe('3');
    expect(sorted[2].id).toBe('1');
  });
});

describe('Outlook metadata contract', () => {
  it('infers article when metadata and media are missing', () => {
    expect(inferOutlookContentKind({
      metadata: normalizeOutlookMetadata(null),
      media: [],
      contentHtml: '<p>Market masih menunggu breakout.</p>',
    })).toBe('article');
  });

  it('infers video from external video URL', () => {
    expect(inferOutlookContentKind({
      metadata: { videoUrl: 'https://example.com/recording.mp4' },
      media: [],
      contentHtml: '',
    })).toBe('video');
  });

  it('infers video from uploaded video media', () => {
    expect(inferOutlookContentKind({
      metadata: {},
      media: [{ id: 'm1', file_url: '/recording.mp4', media_type: 'video' }],
      contentHtml: '<p>US session prep.</p>',
    })).toBe('video');
  });

  it('infers chart from image media with short body', () => {
    expect(inferOutlookContentKind({
      metadata: {},
      media: [{ id: 'm1', file_url: '/chart.png', media_type: 'image' }],
      contentHtml: '<p>XAUUSD retest demand.</p>',
    })).toBe('chart');
  });

  it('keeps long body with image as article', () => {
    const longBody = `<p>${'market context '.repeat(40)}</p>`;
    expect(inferOutlookContentKind({
      metadata: {},
      media: [{ id: 'm1', file_url: '/chart.png', media_type: 'image' }],
      contentHtml: longBody,
    })).toBe('article');
  });

  it('builds snapshot chips without empty fields', () => {
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
  });

  it('handles empty Outlook body as empty plain text', () => {
    expect(stripOutlookHtml('')).toBe('');
    expect(stripOutlookHtml('<p> </p>')).toBe('');
  });

  it('normalizes admin metadata payload while keeping all fields optional', () => {
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
  });

  it('allows empty content body only for Outlook articles', () => {
    expect(isArticleContentBodyAllowed({ category: 'outlook', contentHtml: '' })).toBe(true);
    expect(isArticleContentBodyAllowed({ category: 'outlook', contentHtml: '<p> </p>' })).toBe(true);
    expect(isArticleContentBodyAllowed({ category: 'general', contentHtml: '' })).toBe(false);
    expect(isArticleContentBodyAllowed({ category: 'trading', contentHtml: '<p>Setup valid.</p>' })).toBe(true);
  });
});

describe('Outlook card model', () => {
  it('builds chart card model with image preview, summary, snapshot, and handle', () => {
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
    expect(card.mediaPreview?.url).toBe('/chart.png');
    expect(card.summary).toBe('Wait candle confirmation.');
    expect(card.authorHandle).toBe('@trader');
    expect(card.snapshot).toEqual([
      { label: 'Bias', value: 'Watch' },
      { label: 'Market', value: 'XAUUSD' },
    ]);
  });
});

describe('Outlook detail model', () => {
  it('builds video detail model with external primary media and optional body', () => {
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
    expect(detail.summary).toBe('Watch liquidity above previous high.');
    expect(detail.snapshot).toEqual([{ label: 'Bias', value: 'Neutral Bullish' }]);
  });
});
