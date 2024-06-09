import * as THREE from "three";

import { Vertex } from "./types";
import { getCurrentPiecePosition, renderFallenCubes } from "./render";

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

  constructor(callbacks: StateUpdateCallbacks) {
    this.#state = {
      currentPiece: undefined,
      fallenCubes: [],
    };
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

  willTouchFallenCube(scene: THREE.Scene) {
    const position = getCurrentPiecePosition(scene);
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

  willTouchFloor(scene: THREE.Scene) {
    const position = getCurrentPiecePosition(scene);
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

  addFallenPiece(scene: THREE.Scene) {
    const position = getCurrentPiecePosition(scene);
    const cubes = getCubesFromOffsets(
      position,
      this.#getCurrentPiece().offsets
    );

    renderFallenCubes(scene, cubes);

    this.#state.fallenCubes.push(...cubes);
    this.#callbacks.fallenCubes(this.#state.fallenCubes);
  }
}

export default GameState;
