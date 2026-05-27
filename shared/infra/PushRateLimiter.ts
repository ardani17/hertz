interface PushLimitState {
  count: number;
  expiresAt: number;
}

type RedisClient = import('ioredis').default;

const memoryLimits = new Map<string, PushLimitState>();
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

export class PushRateLimiter {
  async consume(userId: string, max = 30, windowSeconds = 60 * 60): Promise<boolean> {
    const redis = await loadRedisClient();
    const key = `push:user:${userId}`;
    if (redis) {
      try {
        const count = await redis.incr(key);
        if (count === 1) await redis.expire(key, windowSeconds);
        return count <= max;
      } catch {
        redisUnavailable = true;
      }
    }

    const now = Date.now();
    const existing = memoryLimits.get(key);
    if (!existing || existing.expiresAt <= now) {
      memoryLimits.set(key, { count: 1, expiresAt: now + windowSeconds * 1000 });
      return true;
    }
    existing.count += 1;
    return existing.count <= max;
  }
}

