type RedisClient = import('ioredis').default;

interface CacheEntry {
  expiresAt: number;
  value: string;
}

const memoryCache = new Map<string, CacheEntry>();
let redisClient: RedisClient | null = null;
let redisInit: Promise<RedisClient | null> | null = null;
let redisUnavailable = false;

function enabled(): boolean {
  return process.env.MOBILE_READ_CACHE === '1';
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

export class MobileReadCache {
  async get<T>(key: string): Promise<T | null> {
    if (!enabled()) return null;
    const redis = await loadRedisClient();
    if (redis) {
      try {
        const raw = await redis.get(`mobile:cache:${key}`);
        return raw ? JSON.parse(raw) as T : null;
      } catch {
        redisUnavailable = true;
      }
    }
    const entry = memoryCache.get(key);
    if (!entry || entry.expiresAt <= Date.now()) return null;
    return JSON.parse(entry.value) as T;
  }

  async set<T>(key: string, value: T, ttlSeconds = 60): Promise<void> {
    if (!enabled()) return;
    const serialized = JSON.stringify(value);
    const redis = await loadRedisClient();
    if (redis) {
      try {
        await redis.set(`mobile:cache:${key}`, serialized, 'EX', ttlSeconds);
        return;
      } catch {
        redisUnavailable = true;
      }
    }
    memoryCache.set(key, { value: serialized, expiresAt: Date.now() + ttlSeconds * 1000 });
  }

  async invalidatePrefix(prefix: string): Promise<void> {
    if (!enabled()) return;
    for (const key of [...memoryCache.keys()]) {
      if (key.startsWith(prefix)) memoryCache.delete(key);
    }
    const redis = await loadRedisClient();
    if (!redis) return;
    try {
      const keys = await redis.keys(`mobile:cache:${prefix}*`);
      if (keys.length > 0) await redis.del(...keys);
    } catch {
      redisUnavailable = true;
    }
  }
}
