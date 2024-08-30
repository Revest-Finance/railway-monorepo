export class Cache<T> {
    #cache: Record<string, T> = {};

    has(key: string): boolean {
        return !!this.#cache[key];
    }

    get(key: string): T | undefined {
        return this.#cache[key];
    }

    set(key: string, value: T, duration: number): void {
        this.#cache[key] = value;

        setTimeout(() => {
            delete this.#cache[key];
        }, duration);
    }
}
