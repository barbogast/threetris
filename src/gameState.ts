export type GameState = {
  state: "stopped" | "running" | "paused";
  isGameOver: boolean;
  removedRows: number;
};

export type GameStateCallback = (state: GameState) => void;

class GameStateManager {
  #state: GameState;
  #callback: GameStateCallback;

  constructor(callback: GameStateCallback) {
    this.#state = { state: "stopped", isGameOver: false, removedRows: 0 };
    this.#callback = callback;
  }

  #changeState(state: Partial<GameState>) {
    Object.assign(this.#state, state);
    this.#callback(this.#state);
  }

  start() {
    this.#changeState({ state: "running", isGameOver: false, removedRows: 0 });
  }

  pause() {
    this.#changeState({ state: "paused" });
  }

  stop(isGameOver: boolean) {
    this.#changeState({ state: "stopped", isGameOver });
  }

  removeRow() {
    this.#changeState({ removedRows: this.#state.removedRows + 1 });
  }

  isRunning() {
    return this.#state.state === "running";
  }

  isStopped() {
    return this.#state.state === "stopped";
  }

  isPaused() {
    return this.#state.state === "paused";
  }

  isGameOver() {
    return this.#state.isGameOver;
  }

  removedRows() {
    return this.#state.removedRows;
  }
}

export default GameStateManager;
