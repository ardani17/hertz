import { afterEach, describe, expect, it, vi } from 'vitest';
import { expectEnvelope, mockMemberSessionService, request, unmockCommon } from './helpers';

describe('mobile DM contract', () => {
  afterEach(unmockCommon);

  it('returns inbox items envelope', async () => {
    mockMemberSessionService();
    vi.doMock('@shared/services/hertzDmService', () => ({
      HertzDmService: vi.fn().mockImplementation(() => ({
        inbox: vi.fn(async () => ({
          items: [{
            id: 'conv-1',
            lastMessageBody: 'hi',
            lastMessageAt: new Date('2026-05-15T00:00:00.000Z'),
            lastSenderId: 'member-1',
            unreadCount: 0,
            peer: null,
            archivedAt: null,
            lastReadAt: null,
          }],
          nextCursor: null,
        })),
      })),
    }));
    const { GET } = await import('../../../frontend/src/app/api/mobile/v1/hertz/messages/inbox/route');
    const body = await expectEnvelope(await GET(request('/api/mobile/v1/hertz/messages/inbox', { headers: { authorization: 'Bearer valid-token' } })));
    expect(body.data.items[0].conversationId).toBe('conv-1');
    expect(body.data.items[0].lastMessage.fromMe).toBe(true);
  });

  it('returns typing users envelope', async () => {
    mockMemberSessionService();
    vi.doMock('@/lib/redis', () => ({
      listTypingStatuses: vi.fn(async () => [{ userId: 'member-2', displayName: 'Peer', lastTypingAt: Date.now() - 1000 }]),
      setTypingStatus: vi.fn(async () => undefined),
      clearTypingStatus: vi.fn(async () => undefined),
    }));
    vi.doMock('@shared/repositories/hertzDmRepository', () => ({
      HertzDmRepository: vi.fn().mockImplementation(() => ({
        listMessages: vi.fn(async () => [{ id: 'msg-1' }]),
        listInbox: vi.fn(async () => []),
      })),
    }));
    const { GET } = await import('../../../frontend/src/app/api/mobile/v1/hertz/messages/conversations/[conversationId]/typing/route');
    const body = await expectEnvelope(await GET(request('/api/mobile/v1/hertz/messages/conversations/conv-1/typing', {
      headers: { authorization: 'Bearer valid-token' },
    }), { params: Promise.resolve({ conversationId: 'conv-1' }) }));
    expect(body.data.typingUserIds).toContain('member-2');
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

  it('returns conversation thread envelope', async () => {
    mockMemberSessionService();
    vi.doMock('@shared/services/hertzDmService', () => ({
      HertzDmService: vi.fn().mockImplementation(() => ({
        thread: vi.fn(async () => ({ messages: [{ id: 'msg-1', body: 'hello' }], hasMore: false })),
      })),
    }));
    const { GET } = await import('../../../frontend/src/app/api/mobile/v1/hertz/messages/conversations/[conversationId]/route');
    const body = await expectEnvelope(await GET(request('/api/mobile/v1/hertz/messages/conversations/conv-1', {
      headers: { authorization: 'Bearer valid-token' },
    }), { params: Promise.resolve({ conversationId: 'conv-1' }) }));
    expect(body.data.messages[0].id).toBe('msg-1');
  });

  it('sends message envelope', async () => {
    mockMemberSessionService();
    vi.doMock('@shared/services/hertzDmService', () => ({
      HertzDmService: vi.fn().mockImplementation(() => ({
        send: vi.fn(async () => ({ id: 'msg-2', body: 'reply' })),
      })),
    }));
    const { POST } = await import('../../../frontend/src/app/api/mobile/v1/hertz/messages/conversations/[conversationId]/route');
    const body = await expectEnvelope(await POST(request('/api/mobile/v1/hertz/messages/conversations/conv-1', {
      method: 'POST',
      headers: { authorization: 'Bearer valid-token' },
      body: JSON.stringify({ content: 'reply' }),
    }), { params: Promise.resolve({ conversationId: 'conv-1' }) }), 201);
    expect(body.data.message.id).toBe('msg-2');
  });

  it('sets typing indicator envelope', async () => {
    mockMemberSessionService();
    vi.doMock('@/lib/redis', () => ({
      listTypingStatuses: vi.fn(async () => []),
      setTypingStatus: vi.fn(async () => undefined),
      clearTypingStatus: vi.fn(async () => undefined),
    }));
    vi.doMock('@shared/repositories/hertzDmRepository', () => ({
      HertzDmRepository: vi.fn().mockImplementation(() => ({
        listMessages: vi.fn(async () => [{ id: 'msg-1' }]),
        listInbox: vi.fn(async () => []),
      })),
    }));
    const { POST } = await import('../../../frontend/src/app/api/mobile/v1/hertz/messages/conversations/[conversationId]/typing/route');
    const body = await expectEnvelope(await POST(request('/api/mobile/v1/hertz/messages/conversations/conv-1/typing', {
      method: 'POST',
      headers: { authorization: 'Bearer valid-token' },
      body: JSON.stringify({ typing: true }),
    }), { params: Promise.resolve({ conversationId: 'conv-1' }) }));
    expect(body.data.ok).toBe(true);
  });

  it('blocks user envelope', async () => {
    mockMemberSessionService();
    vi.doMock('@shared/services/hertzDmService', () => ({
      HertzDmService: vi.fn().mockImplementation(() => ({
        block: vi.fn(async () => undefined),
      })),
    }));
    const { POST } = await import('../../../frontend/src/app/api/mobile/v1/hertz/messages/blocks/[userId]/route');
    const body = await expectEnvelope(await POST(request('/api/mobile/v1/hertz/messages/blocks/member-2', {
      method: 'POST',
      headers: { authorization: 'Bearer valid-token' },
    }), { params: Promise.resolve({ userId: 'member-2' }) }));
    expect(body.data.blocked).toBe(true);
  });

  it('unblocks user envelope', async () => {
    mockMemberSessionService();
    vi.doMock('@shared/services/hertzDmService', () => ({
      HertzDmService: vi.fn().mockImplementation(() => ({
        block: vi.fn(async () => undefined),
      })),
    }));
    const { DELETE } = await import('../../../frontend/src/app/api/mobile/v1/hertz/messages/blocks/[userId]/route');
    const body = await expectEnvelope(await DELETE(request('/api/mobile/v1/hertz/messages/blocks/member-2', {
      method: 'DELETE',
      headers: { authorization: 'Bearer valid-token' },
    }), { params: Promise.resolve({ userId: 'member-2' }) }));
    expect(body.data.blocked).toBe(false);
  });

  it('archives conversation envelope', async () => {
    mockMemberSessionService();
    vi.doMock('@shared/services/hertzDmService', () => ({
      HertzDmService: vi.fn().mockImplementation(() => ({
        archive: vi.fn(async () => undefined),
      })),
    }));
    const { PATCH } = await import('../../../frontend/src/app/api/mobile/v1/hertz/messages/conversations/[conversationId]/route');
    const body = await expectEnvelope(await PATCH(request('/api/mobile/v1/hertz/messages/conversations/conv-1', {
      method: 'PATCH',
      headers: { authorization: 'Bearer valid-token' },
      body: JSON.stringify({ archived: true }),
    }), { params: Promise.resolve({ conversationId: 'conv-1' }) }));
    expect(body.data.archived).toBe(true);
  });

  it('reports message envelope', async () => {
    mockMemberSessionService();
    vi.doMock('@shared/services/hertzDmService', () => ({
      HertzDmService: vi.fn().mockImplementation(() => ({
        report: vi.fn(async () => undefined),
      })),
    }));
    const { POST } = await import('../../../frontend/src/app/api/mobile/v1/hertz/messages/messages/[messageId]/route');
    const body = await expectEnvelope(await POST(request('/api/mobile/v1/hertz/messages/messages/msg-1', {
      method: 'POST',
      headers: { authorization: 'Bearer valid-token' },
      body: JSON.stringify({ reason: 'harassment' }),
    }), { params: Promise.resolve({ messageId: 'msg-1' }) }), 201);
    expect(body.data.reported).toBe(true);
  });

  it('deletes message envelope', async () => {
    mockMemberSessionService();
    vi.doMock('@shared/services/hertzDmService', () => ({
      HertzDmService: vi.fn().mockImplementation(() => ({
        deleteMessage: vi.fn(async () => undefined),
      })),
    }));
    const { DELETE } = await import('../../../frontend/src/app/api/mobile/v1/hertz/messages/messages/[messageId]/route');
    const body = await expectEnvelope(await DELETE(request('/api/mobile/v1/hertz/messages/messages/msg-1', {
      method: 'DELETE',
      headers: { authorization: 'Bearer valid-token' },
    }), { params: Promise.resolve({ messageId: 'msg-1' }) }));
    expect(body.data.deleted).toBe(true);
  });
});

