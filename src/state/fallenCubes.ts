import { Settings, StateUpdateCallbacks, Vertex } from "../types";

class FallenCubes {
  #cubes: Vertex[];
  #callbacks: StateUpdateCallbacks;

  constructor(callbacks: StateUpdateCallbacks) {
    this.#cubes = [];
    this.#callbacks = callbacks;
  }

  #isLevelFull(settings: Settings, y: number) {
    const { shaftSizeX, shaftSizeZ } = settings;

    for (let x = 0; x < shaftSizeX; x++) {
      for (let z = 0; z < shaftSizeZ; z++) {
        if (
          !this.#cubes.some(([cX, cY, cZ]) => cX === x && cY === y && cZ === z)
        ) {
          return false;
        }
      }
    }
    return true;
  }

  getCubes() {
    return this.#cubes;
  }

  addCubes(cubes: Vertex[]) {
    this.#cubes.push(...cubes);
    this.#callbacks.fallenCubes(this.#cubes);
  }

  findFullLevels(settings: Settings) {
    const { shaftSizeY } = settings;
    const fullLevels = [];
    for (let y = 0; y < shaftSizeY; y++) {
      if (this.#isLevelFull(settings, y)) {
        fullLevels.push(y);
      }
    }
    return fullLevels;
  }

  removeLevel(y: number): Vertex[] {
    // Remove cubes of this level
    const newFallenCubes = this.#cubes.filter(([_, cY, __]) => cY !== y);

    return newFallenCubes.map(([cX, cY, cZ]) => {
      if (cY > y) {
        // Move all cubes which are above the removed level down
        return [cX, cY - 1, cZ];
      }
      return [cX, cY, cZ];
    });
  }
}

export default FallenCubes;
