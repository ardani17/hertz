import { checkRateLimit } from '@/lib/rateLimit';
import type { NextRequest, NextResponse } from 'next/server';

export interface RedisRatePolicy {
  max: number;
  windowMs: number;
  prefix: string;
}

type RedisClient = import('ioredis').default;

let redisClient: RedisClient | null = null;
let redisInit: Promise<RedisClient | null> | null = null;
let redisUnavailable = false;

async function loadRedisClient(): Promise<RedisClient | null> {
  const url = process.env.REDIS_URL?.trim();
  if (!url || process.env.RATE_LIMITER_BACKEND === 'memory' || redisUnavailable) return null;
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

export class RedisRateLimiter {
  async consume(request: NextRequest, policy: RedisRatePolicy, identity?: string | null): Promise<NextResponse | null> {
    const redis = await loadRedisClient();
    if (!redis) return checkRateLimit(request, { ...policy, key: identity });

    const key = `${policy.prefix}:${identity || getClientIp(request)}`;
    const now = Date.now();
    const windowSeconds = Math.ceil(policy.windowMs / 1000);
    try {
      const count = await redis.incr(key);
      if (count === 1) await redis.expire(key, windowSeconds);
      if (count <= policy.max) return null;
      const ttl = await redis.ttl(key);
      return Response.json({
        success: false,
        error: {
          code: 'RATE_LIMITED',
          error_code: 'RATE_LIMIT_EXCEEDED',
          message: 'Terlalu banyak permintaan. Silakan coba lagi nanti.',
          details: { retry_after_seconds: Math.max(ttl, 1) },
          timestamp: new Date(now).toISOString(),
        },
      }, { status: 429, headers: { 'Retry-After': String(Math.max(ttl, 1)) } }) as NextResponse;
    } catch {
      redisUnavailable = true;
      return checkRateLimit(request, { ...policy, key: identity });
    }
  }
}

function getClientIp(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown';
}

