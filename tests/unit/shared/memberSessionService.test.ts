import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SESSION_IDLE_MS } from '../../../shared/constants';

const mockCreate = vi.fn();
const mockFindByTokenHash = vi.fn();
const mockTouchAndExtend = vi.fn();
const mockDeleteByTokenHash = vi.fn();
const mockFindUserById = vi.fn();
const mockEnsureMembershipFresh = vi.fn();

vi.mock('../../../shared/repositories/memberSessionRepository', () => ({
  MemberSessionRepository: vi.fn().mockImplementation(() => ({
    create: mockCreate,
    findByTokenHash: mockFindByTokenHash,
    touchAndExtend: mockTouchAndExtend,
    deleteByTokenHash: mockDeleteByTokenHash,
  })),
}));

vi.mock('../../../shared/repositories/membershipRepository', () => ({
  MembershipRepository: vi.fn().mockImplementation(() => ({
    findUserById: mockFindUserById,
  })),
}));

vi.mock('../../../shared/services/membershipService', () => ({
  MembershipService: vi.fn().mockImplementation(() => ({
    ensureMembershipFresh: mockEnsureMembershipFresh,
  })),
  toMemberSessionUser: vi.fn((user: { id: string; telegram_id: number; username: string | null }) => ({
    id: user.id,
    telegramId: user.telegram_id,
    username: user.username,
    displayName: user.username,
    avatarUrl: null,
    role: 'member',
    badge: 'verified_member',
    verifiedMemberAt: '2026-05-15T00:00:00.000Z',
  })),
}));

import { MemberSessionService } from '../../../shared/services/memberSessionService';

describe('MemberSessionService sliding idle timeout', () => {
  const service = new MemberSessionService();
  const dbUser = {
    id: 'user-1',
    telegram_id: 123,
    username: 'member',
    banned_at: null,
    role: 'member',
  };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-15T12:00:00.000Z'));
    mockCreate.mockReset();
    mockFindByTokenHash.mockReset();
    mockTouchAndExtend.mockReset();
    mockDeleteByTokenHash.mockReset();
    mockFindUserById.mockReset();
    mockEnsureMembershipFresh.mockReset();
    mockFindUserById.mockResolvedValue(dbUser);
    mockEnsureMembershipFresh.mockResolvedValue(true);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('creates sessions with a 24-hour initial expiry', async () => {
    mockCreate.mockResolvedValue(undefined);

    const session = await service.createSession('user-1');

    expect(session.expiresAt.getTime()).toBe(Date.now() + SESSION_IDLE_MS);
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        expiresAt: session.expiresAt,
      }),
    );
  });

  it('extends expires_at on successful validation', async () => {
    mockFindByTokenHash.mockResolvedValue({
      id: 'session-1',
      user_id: 'user-1',
      token_hash: 'hash',
      expires_at: new Date('2026-05-15T18:00:00.000Z'),
      created_at: new Date('2026-05-14T12:00:00.000Z'),
      last_used_at: new Date('2026-05-15T11:00:00.000Z'),
    });
    mockTouchAndExtend.mockResolvedValue(undefined);

    const validated = await service.validateToken('member-token');

    expect(validated?.expiresAt.getTime()).toBe(Date.now() + SESSION_IDLE_MS);
    expect(mockTouchAndExtend).toHaveBeenCalledWith('session-1', validated?.expiresAt);
  });

  it('rejects and deletes expired sessions', async () => {
    mockFindByTokenHash.mockResolvedValue({
      id: 'session-1',
      user_id: 'user-1',
      token_hash: 'hash',
      expires_at: new Date('2026-05-14T12:00:00.000Z'),
      created_at: new Date('2026-05-13T12:00:00.000Z'),
      last_used_at: new Date('2026-05-14T11:00:00.000Z'),
    });
    mockDeleteByTokenHash.mockResolvedValue(undefined);

    await expect(service.validateToken('expired-token')).resolves.toBeNull();
    expect(mockDeleteByTokenHash).toHaveBeenCalledTimes(1);
    expect(mockTouchAndExtend).not.toHaveBeenCalled();
  });

  it('refreshSession reuses the same token and returns the extended expiry', async () => {
    mockFindByTokenHash.mockResolvedValue({
      id: 'session-1',
      user_id: 'user-1',
      token_hash: 'hash',
      expires_at: new Date('2026-05-15T18:00:00.000Z'),
      created_at: new Date('2026-05-14T12:00:00.000Z'),
      last_used_at: new Date('2026-05-15T11:00:00.000Z'),
    });
    mockTouchAndExtend.mockResolvedValue(undefined);

    const refreshed = await service.refreshSession('member-token');

    expect(refreshed).toMatchObject({
      token: 'member-token',
      user: expect.objectContaining({ id: 'user-1' }),
    });
    expect(refreshed?.expiresAt.getTime()).toBe(Date.now() + SESSION_IDLE_MS);
  });
});
