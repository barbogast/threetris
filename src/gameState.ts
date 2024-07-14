export type GameState = {
  state: "stopped" | "running" | "paused";
  isGameOver: boolean;
};

export type GameStateCallback = (state: GameState) => void;

class GameStateManager {
  #state: GameState;
  #callback: GameStateCallback;

  constructor(callback: GameStateCallback) {
    this.#state = { state: "stopped", isGameOver: false };
    this.#callback = callback;
  }

  #changeState(state: GameState) {
    this.#state = state;
    this.#callback(this.#state);
  }

  start() {
    this.#changeState({ state: "running", isGameOver: false });
  }

  pause() {
    this.#changeState({ state: "paused", isGameOver: false });
  }

  stop(isGameOver: boolean) {
    this.#changeState({ state: "stopped", isGameOver });
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
}

export default GameStateManager;
