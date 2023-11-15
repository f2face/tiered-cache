# Tiered-Cache

## Example

> You will need `ioredis` package to use `adapters.RedisCache`.

```javascript
import { TieredCache, adapters } from 'tiered-cache';
import { Redis } from 'ioredis';

(async () => {
    const redisInstance = new Redis('redis://localhost:6379');
    const redisCacheKey = 'test:cache1';
    const redisCacheTtl = 60;
    const redisCacheResetTtl = true; // This will reset cache TTL every time the cached data is retrieved. (Default: false)

    const cache = new TieredCache()
        .appendTier(
            // 1st tier (lower-tier)
            new adapters.RedisCache({
                redis: redisInstance,
                cacheKey: redisCacheKey,
                cacheTtl: redisCacheTtl,
                resetTtl: redisCacheResetTtl,
            })
        )
        .appendTier(new adapters.FileCache('./cache-file.txt')) // 2nd tier (upper-tier)
        .setOrigin(() => {
            // Primary data source
            return Buffer.from('Lorem ipsum dolor sit amet');
        });

    const data = await cache.get();

    console.log(data?.toString());

    await redisInstance.quit();
})();
```

## Custom adapter

This library includes built-in `FileCache` and `RedisCache` adapters.

If you need to work with a different type of cache, you can create your own custom adapter by implementing the `Cache` interface with `get` and `set` methods.

```javascript
const cache = new TieredCache()
    .appendTier({
        // Custom adapter
        get: async () => {
            // Retrieve data from the database.
        },
        set: async (data) => {
            // Store data into the database.
        },
    })
    .setOrigin(() => {
        // Primary data source
        return 'Lorem ipsum dolor sit amet';
    });

const data = await cache.get();

console.log(data);
```
