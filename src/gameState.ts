export type GameState = "stopped" | "running" | "paused";

export type GameStateCallback = (data: {
  state: GameState;
  isGameOver: boolean;
}) => void;

class GameStateManager {
  #state: GameState;
  #callback: GameStateCallback;
  #isGameOver: boolean;

  constructor(callback: GameStateCallback) {
    this.#state = "stopped";
    this.#callback = callback;
    this.#isGameOver = false;
  }

  #changeState(state: GameState) {
    this.#state = state;
    this.#callback({ state, isGameOver: this.#isGameOver });
  }

  start() {
    this.#changeState("running");
    this.#isGameOver = false;
  }

  pause() {
    this.#changeState("paused");
  }

  stop(isGameOver: boolean) {
    this.#isGameOver = isGameOver;
    this.#changeState("stopped");
  }

  isRunning() {
    return this.#state === "running";
  }

  isStopped() {
    return this.#state === "stopped";
  }

  isPaused() {
    return this.#state === "paused";
  }

  isGameOver() {
    return this.#isGameOver;
  }
}

export default GameStateManager;
