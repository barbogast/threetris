import EventManager from "./gameEvents";

export type GameState = {
  state: "stopped" | "running" | "paused";
  isGameOver: boolean;
};

export type GameScore = {
  removedRows: number;
  fallenCubes: number;
  fallenCubesHeight: number;
};

export type GameStateCallback = (state: GameState) => void;

const getInitialScore = (): GameScore => ({
  removedRows: 0,
  fallenCubes: 0,
  fallenCubesHeight: 0,
});

class GameStateManager {
  #state: GameState;
  #events: EventManager;
  #score: GameScore;

  constructor(events: EventManager) {
    this.#state = {
      state: "stopped",
      isGameOver: false,
    };
    this.#score = getInitialScore();
    this.#events = events;
  }

  #changeState(state: Partial<GameState>) {
    Object.assign(this.#state, state);
    this.#events.dispatch("gameStateChange", { gameState: this.#state });
  }

  #changeScore(score: Partial<GameScore>) {
    Object.assign(this.#score, score);
    this.#events.dispatch("pieceFellDown", {
      score: this.#score,
    });
  }

  start() {
    this.#changeState({ state: "running", isGameOver: false });
    this.#changeScore(getInitialScore());
  }

  pause() {
    this.#changeState({ state: "paused" });
  }

  stop(isGameOver: boolean) {
    this.#changeState({ state: "stopped", isGameOver });
  }

  removeRow(fallenCubesHeight: number) {
    this.#changeScore({
      removedRows: this.#score.removedRows + 1,
      fallenCubesHeight,
    });
  }

  pieceFellDown(numberOfCubes: number, fallenCubesHeight: number) {
    this.#changeScore({
      fallenCubes: this.#score.fallenCubes + numberOfCubes,
      fallenCubesHeight,
    });
  }

  getState() {
    return this.#state;
  }
}

export default GameStateManager;
