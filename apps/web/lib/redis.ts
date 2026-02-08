import Redis from 'ioredis';
// @ts-ignore
import RedisMock from 'ioredis-mock';

const getRedisUrl = () => {
    if (process.env.REDIS_URL) {
        return process.env.REDIS_URL;
    }
    return 'redis://localhost:6379';
};

const useMock = true; // process.env.MOCK_REDIS === 'true' || process.env.NODE_ENV === 'test';

console.log(`[Redis] Using Mock: ${useMock} (Env: ${process.env.MOCK_REDIS})`);

export const redis = useMock ? new RedisMock() : new Redis(getRedisUrl());
export const redisSub = useMock ? new RedisMock() : new Redis(getRedisUrl());
