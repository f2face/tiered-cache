# Tiered-Cache

## Example

```javascript
import { TieredCache, adapters } from 'tiered-cache';
import { Redis } from 'ioredis';

(async () => {
    const redisInstance = new Redis('redis://localhost:6379');
    const redisCacheKey = 'test:cache1';
    const redisCacheTtl = 60;
    const redisCacheResetTtl = true; // This will reset cache TTL every time it is retrieved. (Default: false)

    const data = await new TieredCache()
        .appendTier(new adapters.RedisCache(redisInstance, redisCacheKey, redisCacheTtl, redisCacheResetTtl)) // 1st tier
        .appendTier(new adapters.FileCache('./cache-file.txt')) // 2nd tier
        .execute(() => {
            // Primary data source
            return Buffer.from('Lorem ipsum dolor sit amet');
        });

    console.log(data?.toString());

    await redisInstance.quit();
})();
```
