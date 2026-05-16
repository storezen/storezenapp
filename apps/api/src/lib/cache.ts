import Redis from "ioredis";

// Redis client for caching
const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  enableOfflineQueue: false,
});

// Cache durations
export const CACHE_TTL = {
  products: 60 * 5, // 5 minutes
  stores: 60 * 60, // 1 hour
  categories: 60 * 30, // 30 minutes
  settings: 60 * 15, // 15 minutes
  userSessions: 60 * 60 * 24, // 24 hours
};

export async function getCached<T>(key: string): Promise<T | null> {
  try {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export async function setCache(key: string, data: unknown, ttl: number): Promise<void> {
  try {
    await redis.setex(key, ttl, JSON.stringify(data));
  } catch {
    // Silent fail - cache is optional
  }
}

export async function invalidateCache(pattern: string): Promise<void> {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch {
    // Silent fail
  }
}

export { redis };

// Cache helpers for specific endpoints
export const cacheHelpers = {
  products: {
    key: (storeId: string, page = 1) => `products:${storeId}:${page}`,
    ttl: CACHE_TTL.products,
  },
  store: {
    key: (slug: string) => `store:${slug}`,
    ttl: CACHE_TTL.stores,
  },
  categories: {
    key: (storeId: string) => `categories:${storeId}`,
    ttl: CACHE_TTL.categories,
  },
};