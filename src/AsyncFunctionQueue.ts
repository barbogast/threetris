export type OnFinish = () => void;
type Func = (onFinish: OnFinish) => void;

class AsyncFunctionQueue {
  #queuedFunctions: Func[];
  #isRunning: boolean;

  constructor() {
    this.#queuedFunctions = [];
    this.#isRunning = false;
  }

  #runNext = () => {
    const next = this.#queuedFunctions.shift();
    if (next) {
      this.#isRunning = true;
      next(this.#runNext);
    } else {
      this.#isRunning = false;
    }
  };

  queueFunc(func: Func) {
    this.#queuedFunctions.push(func);
    if (!this.#isRunning) {
      this.#runNext();
    }
  }
}

export default AsyncFunctionQueue;
