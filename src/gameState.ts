import EventManager from "./gameEvents";

export type GameState = {
  state: "stopped" | "running" | "paused";
  isGameOver: boolean;
  removedRows: number;
  fallenCubes: number;
};

export type GameStateCallback = (state: GameState) => void;

class GameStateManager {
  #state: GameState;
  #events: EventManager;

  constructor(events: EventManager) {
    this.#state = {
      state: "stopped",
      isGameOver: false,
      removedRows: 0,
      fallenCubes: 0,
    };
    this.#events = events;
  }

  #changeState(state: Partial<GameState>) {
    Object.assign(this.#state, state);
    this.#events.dispatch("gameStateChange", { gameState: this.#state });
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

  pieceFellDown(numberOfCubes: number) {
    this.#changeState({ fallenCubes: this.#state.fallenCubes + numberOfCubes });
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
