import { Cache } from './adapters/Cache';

export enum TierStatus {
    UNTOUCHED = 'untouched',
    HIT = 'hit',
    MISS = 'miss',
}

/**
 * Represents a tiered cache that allows storing and retrieving data through multiple cache tiers.
 * @class
 */
export class TieredCache<T extends Buffer | string> {
    private tiers: Map<string, Cache<T>> = new Map();
    private origin?: () => T | Promise<T>;
    private tierStatus: Map<string, TierStatus> = new Map();

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
    public getTier(label: string): Cache<T> | undefined {
        return this.tiers.get(label);
    }

    /**
     * Appends a cache tier to the tiered cache using a provided cache adapter implementation.
     * @method
     * @param cache - The cache adapter instance.
     * @returns `TieredCache` instance.
     */
    public appendTier(cache: Cache<T>): TieredCache<T>;

    /**
     * Appends a cache tier to the tiered cache using a provided label and cache adapter implementation.
     * If the label is not a string, a numeric label will be automatically assigned.
     * @method
     * @param label - The cache label or a cache instance to be appended.
     * @param cache - The cache adapter instance.
     * @returns `TieredCache` instance.
     */
    public appendTier(label: string, cache: Cache<T>): TieredCache<T>;

    public appendTier(arg0: string | Cache<T>, arg1?: Cache<T>): TieredCache<T> {
        if (typeof arg0 === 'string' && arg1) {
            if (this.tiers.has(arg0)) {
                throw new Error(`Cache tier label already exists: ${arg0}`);
            }

            this.tiers.set(arg0, arg1);
            return this;
        }

        return this.appendTier(this.tiers.size.toString(), arg0 as Cache<T>);
    }

    private async getTiered(
        tierKeyIterator: IterableIterator<string>,
        currentTierKey: string,
        fn: () => T | Promise<T>,
        withStatus: boolean
    ): Promise<T | null> {
        const cache = this.tiers.get(currentTierKey);
        const cacheData = await cache?.get();

        if (!cacheData) {
            if (withStatus) {
                this.tierStatus.set(currentTierKey, TierStatus.MISS);
            }

            const nextKey = tierKeyIterator.next().value;

            if (!nextKey) {
                const result = await Promise.resolve(fn());
                if (result) await cache?.set(result as T);
                return result as T;
            }

            const result = await this.getTiered(tierKeyIterator, nextKey, fn, withStatus);
            if (result) await cache?.set(result as T);
            return result;
        }

        if (withStatus) {
            this.tierStatus.set(currentTierKey, TierStatus.HIT);
        }

        return cacheData as T;
    }

    /**
     * Set the primary data source if the data is not found in any cache tier.
     * @method
     * @param fn - The function that retrieves data from the primary source if the data is not found in any cache tier.
     * @returns `TieredCache` instance.
     */
    public setOrigin(fn: () => T | Promise<T>) {
        this.origin = fn;
        return this;
    }

    private async _get(withStatus = false) {
        if (!this.origin) {
            throw new Error('Primary data source must be set.');
        }

        if (!this.tiers.size) {
            throw new Error('At least one cache tier must be set.');
        }

        const tierKeyIterator = this.tiers.keys();

        if (withStatus) {
            this.tierStatus = new Map([...this.tiers.keys()].map((tierKey) => [tierKey, TierStatus.UNTOUCHED]));
        }

        return await this.getTiered(tierKeyIterator, tierKeyIterator.next().value, this.origin, withStatus);
    }

    /**
     * Retrieves data from the cache, from the lower-tier to the upper-tier.
     * If the data is not available in any cache tier, the provided function in `setOrigin` will be invoked
     * and the result will be stored in all lower-tier caches.
     * @async
     * @method
     * @returns A Promise that resolves to the retrieved data as a Buffer.
     */
    public async get() {
        return await this._get();
    }

    public async getWithStatus(): Promise<[T | null, Map<string, TierStatus>]> {
        return [await this._get(true), this.tierStatus];
    }
}
