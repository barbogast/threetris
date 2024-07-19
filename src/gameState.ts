import EventManager from "./gameEvents";

export type GameState = {
  state: "stopped" | "running" | "paused";
  isGameOver: boolean;
};

export type GameScore = { removedRows: number; fallenCubes: number };

export type GameStateCallback = (state: GameState) => void;

class GameStateManager {
  #state: GameState;
  #events: EventManager;
  #score: GameScore;

  constructor(events: EventManager) {
    this.#state = {
      state: "stopped",
      isGameOver: false,
    };
    this.#score = { removedRows: 0, fallenCubes: 0 };
    this.#events = events;
  }

  #changeState(state: Partial<GameState>) {
    Object.assign(this.#state, state);
    this.#events.dispatch("gameStateChange", { gameState: this.#state });
  }

  #changeScore(score: Partial<GameScore>) {
    Object.assign(this.#score, score);
    this.#events.dispatch("scoreUpdate", { score: this.#score });
  }

  start() {
    this.#changeState({ state: "running", isGameOver: false });
    this.#changeScore({ removedRows: 0, fallenCubes: 0 });
  }

  pause() {
    this.#changeState({ state: "paused" });
  }

  stop(isGameOver: boolean) {
    this.#changeState({ state: "stopped", isGameOver });
  }

  removeRow() {
    this.#changeScore({ removedRows: this.#score.removedRows + 1 });
  }

  pieceFellDown(numberOfCubes: number) {
    this.#changeScore({ fallenCubes: this.#score.fallenCubes + numberOfCubes });
  }

  getState() {
    return this.#state;
  }
}

export default GameStateManager;
