export class Mutex {
    #isLocked = false;
    #queue: (() => void)[] = [];

    async lock(): Promise<void> {
        if (!this.#isLocked) {
            this.#isLocked = true;

            return;
        }

        return new Promise<void>(resolve => {
            this.#queue.push(resolve);
        });
    }

    unlock(): void {
        if (this.#queue.length === 0) {
            this.#isLocked = false;

            return;
        }

        const next = this.#queue.shift();

        next?.();
    }
}
