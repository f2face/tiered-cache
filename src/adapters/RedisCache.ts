import type { Redis } from 'ioredis';
import { Cache } from './Cache';

type RedisCacheConfig = {
    redis: Redis;
    cacheKey: string;
    cacheTtl: number;
    resetTtl?: boolean;
};

export class RedisCache implements Cache<Buffer> {
    private readonly redis: Redis;
    private readonly cacheKey: string;
    private readonly cacheTtl: number;
    private readonly resetTtl: boolean = false;

    constructor(config: RedisCacheConfig) {
        this.redis = config.redis;
        this.cacheKey = config.cacheKey;
        this.cacheTtl = config.cacheTtl;
        this.resetTtl = config.resetTtl || false;
    }

    public async get() {
        const data = await this.redis.getBuffer(this.cacheKey);

        if (data && this.resetTtl) {
            await this.redis.expire(this.cacheKey, this.cacheTtl);
        }

        return data;
    }

    public set(data: Buffer) {
        return this.redis.setex(this.cacheKey, this.cacheTtl, data);
    }
}
