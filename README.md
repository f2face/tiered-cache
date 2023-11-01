# Tiered-Cache

## Example

```javascript
import { TieredCache, adapters } from 'tiered-cache';
import { Redis } from 'ioredis';

(async () => {
    const redisInstance = new Redis('redis://localhost:6379');
    const redisCacheKey = 'test:cache1';
    const redisCacheTtl = 60;

    const data = await new TieredCache()
        .appendTier(
            new adapters.RedisCache(redisInstance, redisCacheKey, redisCacheTtl)
        )
        .appendTier(new adapters.FileCache('./cache-file.txt'))
        .execute(() => {
            return Buffer.from('Lorem ipsum dolor sit amet');
        });

    console.log(data?.toString());

    await redisInstance.quit();
})();
```
