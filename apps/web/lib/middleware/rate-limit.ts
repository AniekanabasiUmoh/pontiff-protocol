import { redis } from '../redis';
import { NextResponse } from 'next/server';

interface RateLimitConfig {
    limit: number;
    windowMs: number;
}

const RATELIMIT_CONFIGS: Record<string, RateLimitConfig> = {
    'confess': { limit: 10, windowMs: 60 * 1000 }, // 10 per min
    'challenge': { limit: 5, windowMs: 60 * 1000 }, // 5 per min
    'default': { limit: 20, windowMs: 60 * 1000 }
};

export async function checkRateLimit(identifier: string, actionType: string = 'default'): Promise<{ success: boolean; remaining: number }> {
    if (!redis) {
        console.warn("Redis not available, skipping rate limit check.");
        return { success: true, remaining: 999 };
    }

    const config = RATELIMIT_CONFIGS[actionType] || RATELIMIT_CONFIGS['default'];
    const key = `ratelimit:${actionType}:${identifier}`;

    try {
        // Increment and get current count
        const currentUsage = await redis.incr(key);

        // If it's the first request, set expiry
        if (currentUsage === 1) {
            await redis.expire(key, config.windowMs / 1000);
        }

        if (currentUsage > config.limit) {
            return { success: false, remaining: 0 };
        }

        return { success: true, remaining: config.limit - currentUsage };
    } catch (error) {
        console.error("Rate limit error:", error);
        // Fail open to avoid blocking legitimate users on Redis error
        return { success: true, remaining: 1 };
    }
}
