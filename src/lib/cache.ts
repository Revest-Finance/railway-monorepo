type CacheValue<T> = {
    value: T;
    timestamp: number;
};

export class Cache<T> {
    #cache: Record<string, CacheValue<T>>;
    #duration: number;

    constructor(duration: number) {
        this.#duration = duration;
        this.#cache = {};
    }

    get(key: string): CacheValue<T> | undefined {
        const cache = this.#cache[key];

        if (cache && Date.now() - cache.timestamp < this.#duration) {
            return cache;
        }

        return undefined;
    }

    set(key: string, value: T): void {
        this.#cache[key] = {
            value,
            timestamp: Date.now(),
        };
    }
}
