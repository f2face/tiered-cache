import { Cache } from './adapters/Cache';

/**
 * Represents a tiered cache that allows storing and retrieving data through multiple cache tiers.
 * @class
 */
export class TieredCache {
    private tiers: Map<string, Cache> = new Map();

    /**
     * Creates a new tiered cache.
     * @constructor
     */
    constructor() {}

    /**
     * Appends a cache tier to the tiered cache using a provided cache adapter implementation.
     * @method
     * @param {Cache} cache - The cache instance to be appended if a label is provided.
     * @returns `TieredCache` instance.
     */
    appendTier(cache: Cache): TieredCache;

    /**
     * Appends a cache tier to the tiered cache using a provided label and cache adapter implementation.
     * If the label is not a string, a numeric label will be automatically assigned.
     * @method
     * @param {string} label - The cache label or a cache instance to be appended.
     * @param {Cache} cache - The cache adapter instance.
     * @returns `TieredCache` instance.
     */
    appendTier(label: string, cache: Cache): TieredCache;

    public appendTier(arg0: string | Cache, arg1?: Cache): TieredCache {
        if (typeof arg0 === 'string' && arg1) {
            if (this.tiers.has(arg0)) {
                throw new Error('Cache label already exists.');
            }

            this.tiers.set(arg0, arg1);
            return this;
        }

        return this.appendTier(this.tiers.size.toString(), arg0 as Cache);
    }

    private async getTiered(
        keyIterator: IterableIterator<string>,
        currentKey: string,
        fn: () => Buffer | Promise<Buffer>
    ): Promise<Buffer | null> {
        const cache = this.tiers.get(currentKey);
        const cacheData = await cache?.get();

        if (!cacheData) {
            const nextKey = keyIterator.next().value;

            if (!nextKey) {
                const result = await Promise.resolve(fn());
                if (result) await cache?.set(result);
                return result;
            }

            const result = await this.getTiered(keyIterator, nextKey, fn);
            if (result) await cache?.set(result);
            return result;
        }

        return cacheData;
    }

    /**
     * Retrieve data from the cache.
     * If the data is not found in any cache tier, the provided function is executed, and the result is stored in the higeher-tier cache.
     * @async
     * @method
     * @param {Function} fn - The function to execute if the data is not found in any cache tier.
     * @returns A Promise that resolves to the retrieved data as a Buffer.
     */
    public async execute(fn: () => Buffer | Promise<Buffer>) {
        if (!this.tiers.size) {
            throw new Error('At least one cache tier must be set.');
        }

        const keyIterator = this.tiers.keys();
        return await this.getTiered(keyIterator, keyIterator.next().value, fn);
    }
}
