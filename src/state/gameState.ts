import FallenCubes from "./fallenCubes";
import GamePiece from "./gamePiece";
import { Settings, StateUpdateCallbacks } from "../types";

export const willTouchFallenCube = (
  piece: GamePiece,
  fallenCubes: FallenCubes
) => {
  const cubes = piece.getCubes();
  return cubes.some((cube) =>
    fallenCubes
      .getCubes()
      .some(
        (fallenCube) =>
          fallenCube[0] === cube[0] &&
          fallenCube[1] === cube[1] &&
          fallenCube[2] === cube[2]
      )
  );
};

export const willBeOutsideOfShaft = (piece: GamePiece, settings: Settings) => {
  const { shaftSizeX, shaftSizeZ } = settings;
  const cubes = piece.getCubes();
  return cubes.some(
    (cube) =>
      cube[0] < 0 ||
      cube[0] >= shaftSizeX ||
      cube[1] < 0 ||
      cube[2] < 0 ||
      cube[2] >= shaftSizeZ
  );
};

export const willTouchFloor = (piece: GamePiece) => {
  const cubes = piece.getCubes();
  return cubes.some((cube) => cube[1] === 0);
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
    this.#callbacks.currentPieceOffsets(currentPiece.offsets);
    this.#callbacks.currentPiecePosition(currentPiece.position);
  }

  removeCurrentPiece() {
    this.#state.currentPiece = undefined;
  }

  getFallenCubes() {
    return this.#state.fallenCubes;
  }
}

export default GameState;
