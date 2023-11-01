import { Cache } from './adapters/Cache';

/**
 * Represents a tiered cache that allows storing and retrieving data through multiple cache tiers.
 * @class
 */
export class TieredCache {
    private tiers: Map<string, Cache> = new Map();
    private primaryDataSource?: () => Buffer | Promise<Buffer>;

    /**
     * Creates a new tiered cache.
     * @constructor
     */
    constructor() {}

    /**
     * Gets all cache tiers.
     * @method
     */
    public getTiers() {
        return this.tiers;
    }

    /**
     * Gets cache tier by its label.
     * @method
     * @param label - Tier label.
     */
    public getTier(label: string): Cache | undefined {
        return this.tiers.get(label);
    }

    /**
     * Appends a cache tier to the tiered cache using a provided cache adapter implementation.
     * @method
     * @param cache - The cache adapter instance.
     * @returns `TieredCache` instance.
     */
    public appendTier(cache: Cache): TieredCache;

    /**
     * Appends a cache tier to the tiered cache using a provided label and cache adapter implementation.
     * If the label is not a string, a numeric label will be automatically assigned.
     * @method
     * @param label - The cache label or a cache instance to be appended.
     * @param cache - The cache adapter instance.
     * @returns `TieredCache` instance.
     */
    public appendTier(label: string, cache: Cache): TieredCache;

    public appendTier(arg0: string | Cache, arg1?: Cache): TieredCache {
        if (typeof arg0 === 'string' && arg1) {
            if (this.tiers.has(arg0)) {
                throw new Error(`Cache tier label already exists: ${arg0}`);
            }

            this.tiers.set(arg0, arg1);
            return this;
        }

        return this.appendTier(this.tiers.size.toString(), arg0 as Cache);
    }

    private async getTiered(
        tierKeyIterator: IterableIterator<string>,
        currentTierKey: string,
        fn: () => Buffer | Promise<Buffer>
    ): Promise<Buffer | null> {
        const cache = this.tiers.get(currentTierKey);
        const cacheData = await cache?.get();

        if (!cacheData) {
            const nextKey = tierKeyIterator.next().value;

            if (!nextKey) {
                const result = await Promise.resolve(fn());
                if (result) await cache?.set(result);
                return result;
            }

            const result = await this.getTiered(tierKeyIterator, nextKey, fn);
            if (result) await cache?.set(result);
            return result;
        }

        return cacheData;
    }

    /**
     * Set the primary data source if the data is not found in any cache tier.
     * @method
     * @param fn - The function that retrieves data from the primary source if the data is not found in any cache tier.
     * @returns `TieredCache` instance.
     */
    public setPrimaryDataSource(fn: () => Buffer | Promise<Buffer>) {
        this.primaryDataSource = fn;
        return this;
    }

    private async _get() {
        if (!this.primaryDataSource) {
            throw new Error('Primary data source must be set.');
        }

        if (!this.tiers.size) {
            throw new Error('At least one cache tier must be set.');
        }

        const tierKeyIterator = this.tiers.keys();
        return await this.getTiered(tierKeyIterator, tierKeyIterator.next().value, this.primaryDataSource);
    }

    /**
     * Retrieves data from the cache.
     * If the data is not found in any cache tier, the provided function in `setPrimaryDataSource` will be invoked,
     * and the result is stored in the higher-tier cache(s).
     * @async
     * @method
     * @returns A Promise that resolves to the retrieved data as a Buffer.
     */
    public async get() {
        return await this._get();
    }
}
