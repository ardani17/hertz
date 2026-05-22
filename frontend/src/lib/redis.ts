import {
  clearTypingStatus as clearTypingStatusMemory,
  listTypingStatuses as listTypingStatusesMemory,
  setTypingStatus as setTypingStatusMemory,
} from '@/lib/typing/typing-store';
import { RedisUnavailableError } from '@/lib/typing/redis-unavailable';
import { TYPING_TTL_MS, type TypingStatus } from '@/lib/typing/typing-utils';

const TYPING_KEY_TTL_SEC = Math.max(1, Math.ceil(TYPING_TTL_MS / 1000));

type TypingPayload = { displayName: string; lastTypingAt: number };

type RedisClient = import('ioredis').default;
let redisClient: RedisClient | null = null;
let redisInit: Promise<RedisClient | null> | null = null;
let redisUnavailable = false;

function typingKey(conversationId: string, userId: string) {
  return `typing:${conversationId}:${userId}`;
}

function useRedisFromEnv(): boolean {
  return Boolean(process.env.REDIS_URL?.trim()) && !redisUnavailable;
}

export function isRedisConfigured(): boolean {
  return Boolean(process.env.REDIS_URL?.trim());
}

// #region agent log
function debugLog(message: string, data: Record<string, unknown>, hypothesisId: string) {
  fetch('http://127.0.0.1:7626/ingest/0e68ac60-4b93-4daf-93a7-baf0152c1922', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '621627' },
    body: JSON.stringify({
      sessionId: '621627',
      location: 'redis.ts',
      message,
      data,
      hypothesisId,
      timestamp: Date.now(),
      runId: 'post-fix',
    }),
  }).catch(() => {});
}
// #endregion

function attachErrorHandler(client: RedisClient) {
  client.on('error', () => {
    redisUnavailable = true;
  });
}

async function loadRedisClient(): Promise<RedisClient | null> {
  const url = process.env.REDIS_URL?.trim();
  if (!url || redisUnavailable) return null;
  if (redisClient) return redisClient;
  if (!redisInit) {
    redisInit = (async () => {
      try {
        const { default: IORedis } = await import('ioredis');
        const client = new IORedis(url, {
          connectTimeout: 2_000,
          maxRetriesPerRequest: 1,
          enableOfflineQueue: false,
          lazyConnect: true,
        });
        attachErrorHandler(client);
        await client.connect();
        await client.ping();
        redisClient = client;
        // #region agent log
        debugLog('redis_connect_ok', { urlHost: url.split('@').pop()?.split('/')[0] ?? 'hidden' }, 'H1');
        // #endregion
        return client;
      } catch (error) {
        redisUnavailable = true;
        redisClient = null;
        // #region agent log
        debugLog('redis_connect_fail', { error: error instanceof Error ? error.message : 'unknown' }, 'H1');
        // #endregion
        return null;
      } finally {
        redisInit = null;
      }
    })();
  }
  return redisInit;
}

async function requireRedisClient(): Promise<RedisClient> {
  if (!process.env.REDIS_URL?.trim()) throw new RedisUnavailableError('REDIS_URL not set');
  const client = await loadRedisClient();
  if (!client) throw new RedisUnavailableError();
  return client;
}

export async function setTypingStatus(input: {
  conversationId: string;
  userId: string;
  displayName: string;
}): Promise<void> {
  if (!useRedisFromEnv()) {
    return setTypingStatusMemory(input);
  }
  const redis = await requireRedisClient();
  const payload: TypingPayload = { displayName: input.displayName, lastTypingAt: Date.now() };
  try {
    await redis.set(typingKey(input.conversationId, input.userId), JSON.stringify(payload), 'EX', TYPING_KEY_TTL_SEC);
  } catch {
    redisUnavailable = true;
    throw new RedisUnavailableError();
  }
}

export async function clearTypingStatus(conversationId: string, userId: string): Promise<void> {
  if (!useRedisFromEnv()) {
    return clearTypingStatusMemory(conversationId, userId);
  }
  const redis = await requireRedisClient();
  try {
    await redis.del(typingKey(conversationId, userId));
  } catch {
    redisUnavailable = true;
    throw new RedisUnavailableError();
  }
}

export async function listTypingStatuses(conversationId: string, selfUserId: string): Promise<TypingStatus[]> {
  if (!useRedisFromEnv()) {
    return listTypingStatusesMemory(conversationId, selfUserId);
  }
  const redis = await loadRedisClient();
  if (!redis) return [];

  try {
    const keyPrefix = `typing:${conversationId}:`;
    const matchPattern = `${keyPrefix}*`;
    const keys: string[] = [];
    let cursor = '0';
    do {
      const [nextCursor, batch] = await redis.scan(cursor, 'MATCH', matchPattern, 'COUNT', 100);
      cursor = nextCursor;
      keys.push(...batch);
    } while (cursor !== '0');

    if (keys.length === 0) return [];

    const values = await redis.mget(...keys);
    const now = Date.now();
    const rows: TypingStatus[] = [];
    for (let index = 0; index < keys.length; index += 1) {
      const key = keys[index];
      const raw = values[index];
      if (!raw || !key?.startsWith(keyPrefix)) continue;
      const userId = key.slice(keyPrefix.length);
      if (userId === selfUserId) continue;
      const parsed = JSON.parse(raw) as TypingPayload;
      if (now - parsed.lastTypingAt > TYPING_TTL_MS) continue;
      rows.push({ userId, displayName: parsed.displayName, lastTypingAt: parsed.lastTypingAt });
    }
    return rows;
  } catch {
    return [];
  }
}

export async function closeRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit().catch(() => undefined);
    redisClient = null;
  }
  redisUnavailable = false;
}
