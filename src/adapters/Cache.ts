/**
 * Represents a cache that can store and retrieve data.
 * @interface
 */
export interface Cache {
    /**
     * Retrieves data from the cache.
     * @async
     * @method
     * @returns A Promise that resolves to the retrieved data as a Buffer, or null if the data is not found in the cache.
     */
    get(): Promise<Buffer | null>;

    /**
     * Stores data in the cache.
     * @method
     * @param {Buffer} data - The data to be stored in the cache as a Buffer.
     */
    set(data: Buffer): unknown;
}
