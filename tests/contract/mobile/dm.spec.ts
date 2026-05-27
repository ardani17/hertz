import { afterEach, describe, expect, it, vi } from 'vitest';
import { expectEnvelope, mockMemberSessionService, request, unmockCommon } from './helpers';

describe('mobile DM contract', () => {
  afterEach(unmockCommon);

  it('returns inbox items envelope', async () => {
    mockMemberSessionService();
    vi.doMock('@shared/services/hertzDmService', () => ({
      HertzDmService: vi.fn().mockImplementation(() => ({
        inbox: vi.fn(async () => [{ id: 'conv-1', lastMessageBody: 'hi', lastMessageAt: new Date('2026-05-15T00:00:00.000Z'), unreadCount: 0, peer: null, archivedAt: null, lastReadAt: null }]),
      })),
    }));
    const { GET } = await import('../../../frontend/src/app/api/mobile/v1/hertz/messages/inbox/route');
    const body = await expectEnvelope(await GET(request('/api/mobile/v1/hertz/messages/inbox', { headers: { authorization: 'Bearer valid-token' } })));
    expect(body.data.items[0].conversationId).toBe('conv-1');
  });

  it('creates or resumes conversation', async () => {
    mockMemberSessionService();
    vi.doMock('@shared/services/hertzDmService', () => ({
      HertzDmService: vi.fn().mockImplementation(() => ({
        createDirectResolved: vi.fn(async () => ({ conversation: { id: 'conv-1' }, existing: false })),
      })),
    }));
    const { POST } = await import('../../../frontend/src/app/api/mobile/v1/hertz/messages/conversations/route');
    const body = await expectEnvelope(await POST(request('/api/mobile/v1/hertz/messages/conversations', {
      method: 'POST',
      headers: { authorization: 'Bearer valid-token' },
      body: JSON.stringify({ recipientId: 'member-2' }),
    })), 201);
    expect(body.data.conversation.id).toBe('conv-1');
  });
});

