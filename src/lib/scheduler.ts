export class TaskScheduler {
    static #tasks: { [name: string]: NodeJS.Timeout } = {};

    static isRunning(name: string): boolean {
        return !!this.#tasks[name];
    }

    static addTask(name: string, cadence: number, task: () => void): void {
        if (this.#tasks[name]) {
            clearInterval(this.#tasks[name]);
        }

        task();

        this.#tasks[name] = setInterval(() => {
            task();
        }, cadence);
    }

    static removeTask(name: string): void {
        if (this.#tasks[name]) {
            clearInterval(this.#tasks[name]);
            delete this.#tasks[name];
        }
    }
}
