import type { Redis } from 'ioredis';
import { Cache } from './Cache';

export class RedisCache implements Cache {
    constructor(
        private readonly redisInstance: Redis,
        private readonly cacheKey: string,
        private readonly cacheTtl: number,
        private readonly resetTtl: boolean = false
    ) {}

    public async get() {
        const data = await this.redisInstance.getBuffer(this.cacheKey);

        if (data && this.resetTtl) {
            await this.redisInstance.expire(this.cacheKey, this.cacheTtl);
        }

        return data;
    }

    public set(data: Buffer) {
        return this.redisInstance.setex(this.cacheKey, this.cacheTtl, data);
    }
}
