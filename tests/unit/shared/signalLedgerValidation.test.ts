import { describe, expect, it } from 'vitest';
import { CommunityNoteService } from '../../../shared/services/communityNoteService';
import { FeedService, FeedValidationError } from '../../../shared/services/feedService';
import type { MemberSessionUser } from '../../../shared/types/membership';

const member: MemberSessionUser = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  telegramId: 5963323428,
  username: 'member',
  displayName: 'Verified Member',
  avatarUrl: null,
  role: 'member',
  badge: 'verified_member',
  verifiedMemberAt: '2026-05-08T00:00:00.000Z',
};

describe('Signal Ledger validation guards', () => {
  it('requires at least one source URL for community notes before touching storage', async () => {
    const service = new CommunityNoteService();

    await expect(service.create('post-1', member, {
      content: 'Perlu konteks tambahan.',
      sources: [],
    })).rejects.toThrow('Community note wajib memiliki minimal satu source URL');
  });

  it('requires http or https community note sources', async () => {
    const service = new CommunityNoteService();

    await expect(service.create('post-1', member, {
      content: 'Perlu konteks tambahan.',
      sources: [{ url: 'ftp://example.com/source' }],
    })).rejects.toThrow('Source URL tidak valid');
  });

  it('limits web post media to four files before touching storage', async () => {
    const service = new FeedService();

    await expect(service.createWebPost(member, {
      category: 'general',
      content: 'Update komunitas Horizon.',
      mediaIds: ['1', '2', '3', '4', '5'],
    })).rejects.toThrow(FeedValidationError);
  });

  it('rejects unsupported feed categories before touching storage', async () => {
    const service = new FeedService();

    await expect(service.createWebPost(member, {
      category: 'outlook' as never,
      content: 'Outlook tetap di modul terpisah.',
    })).rejects.toThrow('Kategori tidak valid');
  });
});
