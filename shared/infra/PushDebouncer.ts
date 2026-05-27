interface PushDebounceState {
  expiresAt: number;
}

type RedisClient = import('ioredis').default;

const memoryDebounces = new Map<string, PushDebounceState>();
let redisClient: RedisClient | null = null;
let redisInit: Promise<RedisClient | null> | null = null;
let redisUnavailable = false;

async function loadRedisClient(): Promise<RedisClient | null> {
  const url = process.env.REDIS_URL?.trim();
  if (!url || redisUnavailable) return null;
  if (redisClient) return redisClient;
  if (!redisInit) {
    redisInit = (async () => {
      try {
        const { default: IORedis } = await import('ioredis');
        const client = new IORedis(url, {
          connectTimeout: 1_500,
          maxRetriesPerRequest: 1,
          enableOfflineQueue: false,
          lazyConnect: true,
        });
        client.on('error', () => {
          redisUnavailable = true;
        });
        await client.connect();
        await client.ping();
        redisClient = client;
        return client;
      } catch {
        redisUnavailable = true;
        return null;
      } finally {
        redisInit = null;
      }
    })();
  }
  return redisInit;
}

export class PushDebouncer {
  async shouldSend(key: string, windowSeconds = 60): Promise<boolean> {
    const redis = await loadRedisClient();
    if (redis) {
      try {
        const result = await redis.set(key, '1', 'EX', windowSeconds, 'NX');
        return result === 'OK';
      } catch {
        redisUnavailable = true;
      }
    }

    const now = Date.now();
    const existing = memoryDebounces.get(key);
    if (existing && existing.expiresAt > now) return false;
    memoryDebounces.set(key, { expiresAt: now + windowSeconds * 1000 });
    return true;
  }
}
