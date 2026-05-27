import { afterEach, describe, expect, it, vi } from 'vitest';
import { expectEnvelope, request, unmockCommon } from './helpers';

describe('mobile content contract', () => {
  afterEach(unmockCommon);

  it('returns gallery envelope', async () => {
    vi.doMock('@/lib/mobileContent', () => ({
      listMobileGallery: vi.fn(async () => ({ items: [{ id: 'g-1', fileUrl: 'https://cdn.test/a.jpg' }], nextOffset: null })),
    }));
    const { GET } = await import('../../../frontend/src/app/api/mobile/v1/gallery/route');
    const body = await expectEnvelope(await GET(request('/api/mobile/v1/gallery')));
    expect(body.data.items[0].id).toBe('g-1');
  });

  it('returns outlook slug envelope', async () => {
    vi.doMock('@/lib/mobileContent', () => ({
      getMobileArticle: vi.fn(async () => ({ article: { slug: 'weekly-outlook', title: 'Weekly Outlook' } })),
    }));
    const { GET } = await import('../../../frontend/src/app/api/mobile/v1/outlook/[slug]/route');
    const body = await expectEnvelope(await GET(request('/api/mobile/v1/outlook/weekly-outlook'), { params: Promise.resolve({ slug: 'weekly-outlook' }) }));
    expect(body.data.article.slug).toBe('weekly-outlook');
  });

  it('returns outlook list envelope', async () => {
    vi.doMock('@/lib/mobileContent', () => ({
      listMobileArticles: vi.fn(async () => ({ items: [{ slug: 'weekly-outlook', title: 'Weekly Outlook' }], nextOffset: null })),
    }));
    const { GET } = await import('../../../frontend/src/app/api/mobile/v1/outlook/route');
    const body = await expectEnvelope(await GET(request('/api/mobile/v1/outlook')));
    expect(body.data.items[0].slug).toBe('weekly-outlook');
  });
});
