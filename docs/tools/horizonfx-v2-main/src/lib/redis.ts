import { createClient } from 'redis';

// Redis client instance
let redisClient: ReturnType<typeof createClient> | null = null;

// Initialize Redis connection
export async function getRedisClient() {
  if (!redisClient) {
    redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });

    redisClient.on('error', (err: Error) => {
      console.error('Redis Client Error:', err);
    });

    redisClient.on('connect', () => {
      console.log('Redis Client Connected');
    });

    await redisClient.connect();
  }

  return redisClient;
}

// Cache duration: 2 hours (7200 seconds)
const CACHE_DURATION = 2 * 60 * 60; // 2 hours in seconds

// Get data from cache
export async function getFromCache<T>(key: string): Promise<T | null> {
  try {
    const client = await getRedisClient();
    const cachedData = await client.get(key);
    
    if (cachedData) {
      return JSON.parse(cachedData) as T;
    }
    
    return null;
  } catch (error) {
    console.error('Redis get error:', error);
    return null;
  }
}

// Set data to cache with 2 hour expiration
export async function setToCache<T>(key: string, data: T): Promise<void> {
  try {
    const client = await getRedisClient();
    await client.setEx(key, CACHE_DURATION, JSON.stringify(data));
  } catch (error) {
    console.error('Redis set error:', error);
  }
}

// Delete data from cache
export async function deleteFromCache(key: string): Promise<void> {
  try {
    const client = await getRedisClient();
    await client.del(key);
  } catch (error) {
    console.error('Redis delete error:', error);
  }
}

// Check if cache key exists
export async function cacheExists(key: string): Promise<boolean> {
  try {
    const client = await getRedisClient();
    const exists = await client.exists(key);
    return exists === 1;
  } catch (error) {
    console.error('Redis exists error:', error);
    return false;
  }
}

// Close Redis connection
export async function closeRedisConnection(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}

// Generate cache key for API endpoints
export function generateCacheKey(endpoint: string, params?: Record<string, string>): string {
  const baseKey = `api:${endpoint}`;
  
  if (params && Object.keys(params).length > 0) {
    const paramString = Object.entries(params)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}:${value}`)
      .join('|');
    return `${baseKey}:${paramString}`;
  }
  
  return baseKey;
}