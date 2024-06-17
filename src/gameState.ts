import GamePiece from "./gamePiece";
import { Settings, StateUpdateCallbacks, Vertex } from "./types";

const isLevelFull = (settings: Settings, fallenCubes: Vertex[], y: number) => {
  const { shaftSizeX, shaftSizeZ } = settings;

  for (let x = 0; x < shaftSizeX; x++) {
    for (let z = 0; z < shaftSizeZ; z++) {
      if (
        !fallenCubes.some(([cX, cY, cZ]) => cX === x && cY === y && cZ === z)
      ) {
        return false;
      }
    }
  }
  return true;
};

export const findFullLevels = (settings: Settings, fallenCubes: Vertex[]) => {
  const { shaftSizeY } = settings;
  const fullLevels = [];
  for (let y = 0; y < shaftSizeY; y++) {
    if (isLevelFull(settings, fallenCubes, y)) {
      fullLevels.push(y);
    }
  }
  return fullLevels;
};

export const removeLevel = (fallenCubes: Vertex[], y: number): Vertex[] => {
  // Remove cubes of this level
  const newFallenCubes = fallenCubes.filter(([_, cY, __]) => cY !== y);

  return newFallenCubes.map(([cX, cY, cZ]) => {
    if (cY > y) {
      // Move all cubes which are above the removed level down
      return [cX, cY - 1, cZ];
    }
    return [cX, cY, cZ];
  });
};

export const willTouchFallenCube = (
  piece: GamePiece,
  fallenCubes: Vertex[]
) => {
  const cubes = piece.getCubesFromOffsets();
  return cubes.some((cube) =>
    fallenCubes.some(
      (fallenCube) =>
        fallenCube[0] === cube[0] &&
        fallenCube[1] === cube[1] &&
        fallenCube[2] === cube[2]
    )
  );
};

export const willBeOutsideOfShaft = (piece: GamePiece, settings: Settings) => {
  const { shaftSizeX, shaftSizeZ } = settings;
  const cubes = piece.getCubesFromOffsets();
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
  const cubes = piece.getCubesFromOffsets();
  return cubes.some((cube) => cube[1] === 0);
};

class GameState {
  #state: {
    currentPiece: GamePiece | undefined;
    fallenCubes: [number, number, number][];
  };
  #callbacks: StateUpdateCallbacks;

  constructor(callbacks: StateUpdateCallbacks) {
    this.#state = {
      currentPiece: undefined,
      fallenCubes: [],
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

  setFallenCubes(fallenCubes: Vertex[]) {
    this.#state.fallenCubes = fallenCubes;
    this.#callbacks.fallenCubes(fallenCubes);
  }

  removeCurrentPiece() {
    this.#state.currentPiece = undefined;
  }

  getFallenCubes() {
    return this.#state.fallenCubes;
  }
}

export default GameState;
