type CachedElement<T> = {
    timer: NodeJS.Timeout;
    data: T;
};

class Cache<T> {
    private cache: Record<string, CachedElement<T>> = {};

    public get(key: string): T | undefined {
        return this.cache[key]?.data;
    }

    public set(key: string, data: T, ttl: number): void {
        if (this.cache[key]) {
            clearTimeout(this.cache[key].timer);
        }

        const timer = setTimeout(() => {
            delete this.cache[key];
        }, ttl);

        this.cache[key] = { data, timer };
    }
}
