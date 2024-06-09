import { Vertex } from "./types";
import GameRenderer from "./render";

export type CurrentPiece = {
  offsets: Vertex[];
};

export type StateUpdateCallbacks = {
  currentPiece: (currentPiece: CurrentPiece) => void;
  fallenCubes: (fallenCubes: [number, number, number][]) => void;
  rendererInfo: (info: { geometries: number }) => void;
};

const getCubesFromOffsets = (position: Vertex, offsets: Vertex[]): Vertex[] => {
  return offsets.map((offset) => [
    position[0] + offset[0],
    position[1] + offset[1],
    position[2] + offset[2],
  ]);
};

class GameState {
  #state: {
    currentPiece: CurrentPiece | undefined;
    fallenCubes: [number, number, number][];
  };
  #callbacks: StateUpdateCallbacks;
  #gameRenderer: GameRenderer;

  constructor(gameRenderer: GameRenderer, callbacks: StateUpdateCallbacks) {
    this.#state = {
      currentPiece: undefined,
      fallenCubes: [],
    };
    this.#gameRenderer = gameRenderer;
    this.#callbacks = callbacks;
  }

  #getCurrentPiece() {
    if (!this.#state.currentPiece) throw new Error("No current piece");
    return this.#state.currentPiece;
  }

  setCurrentPiece(currentPiece: CurrentPiece) {
    this.#state.currentPiece = currentPiece;
    this.#callbacks.currentPiece(currentPiece);
  }

  removeCurrentPiece() {
    this.#state.currentPiece = undefined;
  }

  willTouchFallenCube() {
    const position = this.#gameRenderer.getCurrentPiecePosition();
    const newPosition: Vertex = [position[0], position[1] - 1, position[2]];
    const cubes = getCubesFromOffsets(
      newPosition,
      this.#getCurrentPiece().offsets
    );
    return cubes.some((cube) =>
      this.#state.fallenCubes.some(
        (fallenCube) =>
          fallenCube[0] === cube[0] &&
          fallenCube[1] === cube[1] &&
          fallenCube[2] === cube[2]
      )
    );
  }

  willTouchFloor() {
    const position = this.#gameRenderer.getCurrentPiecePosition();
    const cubes = getCubesFromOffsets(
      position,
      this.#getCurrentPiece().offsets
    );
    return cubes.some((cube) => cube[1] === 0);
  }

  rotateCurrentPieceXAxis() {
    this.#state.currentPiece?.offsets.map((cube) =>
      cube.map((offset) => (offset = -offset))
    );
  }

  getFallenCubes() {
    return this.#state.fallenCubes;
  }

  addFallenPiece() {
    const position = this.#gameRenderer.getCurrentPiecePosition();
    const cubes = getCubesFromOffsets(
      position,
      this.#getCurrentPiece().offsets
    );

    this.#gameRenderer.renderFallenCubes(cubes);

    this.#state.fallenCubes.push(...cubes);
    this.#callbacks.fallenCubes(this.#state.fallenCubes);
  }
}

export default GameState;
