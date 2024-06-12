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

export const rotateXAxis = (offsets: Vertex[], clockwise: number): Vertex[] =>
  offsets.map(([oX, oY, oZ]) => [oX, -oZ * clockwise, oY * clockwise]);

export const rotateYAxis = (offsets: Vertex[], clockwise: number): Vertex[] =>
  offsets.map(([oX, oY, oZ]) => [-oZ * clockwise, oY, oX * clockwise]);

export const rotateZAxis = (offsets: Vertex[], clockwise: number): Vertex[] =>
  offsets.map(([oX, oY, oZ]) => [-oY * clockwise, oX * clockwise, oZ]);

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

  getCurrentPiece() {
    if (!this.#state.currentPiece) throw new Error("No current piece");
    return this.#state.currentPiece;
  }

  setCurrentPiece(currentPiece: CurrentPiece) {
    this.#state.currentPiece = currentPiece;
    this.#callbacks.currentPieceOffsets(currentPiece.offsets);
  }

  setFallenCubes(fallenCubes: Vertex[]) {
    this.#state.fallenCubes = fallenCubes;
    this.#callbacks.fallenCubes(fallenCubes);
  }

  removeCurrentPiece() {
    this.#state.currentPiece = undefined;
  }

  willTouchFallenCube(newPosition: Vertex, newOffsets: Vertex[]) {
    const cubes = getCubesFromOffsets(newPosition, newOffsets);
    return cubes.some((cube) =>
      this.#state.fallenCubes.some(
        (fallenCube) =>
          fallenCube[0] === cube[0] &&
          fallenCube[1] === cube[1] &&
          fallenCube[2] === cube[2]
      )
    );
  }

  willBeOutsideOfShaft(newPosition: Vertex, newOffsets: Vertex[]) {
    const { shaftSizeX, shaftSizeY, shaftSizeZ } = this.#settings;
    const cubes = getCubesFromOffsets(newPosition, newOffsets);
    return cubes.some(
      (cube) =>
        cube[0] < 0 ||
        cube[0] >= shaftSizeX ||
        cube[1] < 0 ||
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
