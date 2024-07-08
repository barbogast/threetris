import FallenCubes from "./fallenCubes";
import GamePiece from "./gamePiece";
import { Settings, StateUpdateCallbacks, Vertex } from "../types";

export const collidesWithFallenCube = (
  pieceCubes: Vertex[],
  fallenCubes: FallenCubes
) => {
  return pieceCubes.some((cube) => {
    return fallenCubes
      .getCubes()
      .some(
        (fallenCube) =>
          fallenCube[0] === cube[0] &&
          fallenCube[1] === cube[1] &&
          fallenCube[2] === cube[2]
      );
  });
};

export const willBeOutsideOfShaft = (
  pieceCubes: Vertex[],
  settings: Settings
) => {
  const { shaftSizeX, shaftSizeZ } = settings;
  return pieceCubes.some(
    (cube) =>
      cube[0] < 0 ||
      cube[0] >= shaftSizeX ||
      cube[1] < 0 ||
      cube[2] < 0 ||
      cube[2] >= shaftSizeZ
  );
};

export const collidesWithFloor = (pieceCubes: Vertex[]) => {
  return pieceCubes.some((cube) => cube[1] < 0);
};

class GameState {
  #state: {
    currentPiece: GamePiece | undefined;
    fallenCubes: FallenCubes;
  };
  #callbacks: StateUpdateCallbacks;

  constructor(callbacks: StateUpdateCallbacks) {
    this.#state = {
      currentPiece: undefined,
      fallenCubes: new FallenCubes(callbacks),
    };
    this.#callbacks = callbacks;
  }

  getCurrentPiece() {
    if (!this.#state.currentPiece) throw new Error("No current piece");
    return this.#state.currentPiece;
  }

  setCurrentPiece(currentPiece: GamePiece) {
    this.#state.currentPiece = currentPiece;
    this.#callbacks.currentPiece(currentPiece);
  }

  removeCurrentPiece() {
    this.#state.currentPiece = undefined;
  }

  getFallenCubes() {
    return this.#state.fallenCubes;
  }
}

export default GameState;
