import { Settings, StateUpdateCallbacks, Vertex } from "./types";
import GameRenderer from "./gameRenderer";

export type CurrentPiece = {
  offsets: Vertex[];
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
  #settings: Settings;

  constructor(
    settings: Settings,
    gameRenderer: GameRenderer,
    callbacks: StateUpdateCallbacks
  ) {
    this.#state = {
      currentPiece: undefined,
      fallenCubes: [],
    };
    this.#settings = settings;
    this.#gameRenderer = gameRenderer;
    this.#callbacks = callbacks;
  }

  #getCurrentPiece() {
    if (!this.#state.currentPiece) throw new Error("No current piece");
    return this.#state.currentPiece;
  }

  setCurrentPiece(currentPiece: CurrentPiece) {
    this.#state.currentPiece = currentPiece;
    this.#callbacks.currentPieceOffsets(currentPiece.offsets);
  }

  removeCurrentPiece() {
    this.#state.currentPiece = undefined;
  }

  willTouchFallenCube(newPosition: Vertex) {
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

  willBeOutsideOfShaft(newPosition: Vertex) {
    const { shaftSizeX, shaftSizeY, shaftSizeZ } = this.#settings;
    const cubes = getCubesFromOffsets(
      newPosition,
      this.#getCurrentPiece().offsets
    );
    return cubes.some(
      (cube) =>
        cube[0] < 0 ||
        cube[0] >= shaftSizeX ||
        cube[1] < 0 ||
        cube[1] >= shaftSizeY ||
        cube[2] < 0 ||
        cube[2] >= shaftSizeZ
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
