import * as THREE from "three";

import { Vertex } from "./types";

type ThreePiece = THREE.LineSegments<
  THREE.BufferGeometry<THREE.NormalBufferAttributes>,
  THREE.LineBasicMaterial,
  THREE.Object3DEventMap
>;

export type CurrentPiece = {
  offsets: Vertex[];
  threeObject: ThreePiece;
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
    fallenPieces: [number, number, number][];
  };
  #callbacks: StateUpdateCallbacks;

  constructor(callbacks: StateUpdateCallbacks) {
    this.#state = {
      currentPiece: undefined,
      fallenPieces: [],
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
    if (this.#state.currentPiece) {
      this.#state.currentPiece.threeObject.remove();
      this.#state.currentPiece = undefined;
    }
  }

  getCurrentPiecePosition() {
    const { threeObject } = this.#getCurrentPiece();
    return [
      threeObject.position.x,
      threeObject.position.y,
      threeObject.position.z,
    ] as Vertex;
  }

  willTouchFallenPiece() {
    const position = this.getCurrentPiecePosition();
    const newPosition = [position[0], position[1] - 1, position[2]] as Vertex;
    const cubes = getCubesFromOffsets(
      newPosition,
      this.#getCurrentPiece().offsets
    );
    return cubes.some((cube) =>
      this.#state.fallenPieces.some(
        (fallenCube) =>
          fallenCube[0] === cube[0] &&
          fallenCube[1] === cube[1] &&
          fallenCube[2] === cube[2]
      )
    );
  }

  willTouchFloor() {
    const position = this.getCurrentPiecePosition();
    const cubes = getCubesFromOffsets(
      position,
      this.#getCurrentPiece().offsets
    );
    return cubes.some((cube) => cube[1] === 0);
  }

  moveCurrentPiece(offset: Vertex) {
    const { threeObject } = this.#getCurrentPiece();
    threeObject.position.x += offset[0];
    threeObject.position.y += offset[1];
    threeObject.position.z += offset[2];
    this.#callbacks.currentPiece(this.#getCurrentPiece());
  }

  getFallenPieces() {
    return this.#state.fallenPieces;
  }

  addFallenPiece(scene: THREE.Scene) {
    const position = this.getCurrentPiecePosition();
    const cubes = getCubesFromOffsets(
      position,
      this.#getCurrentPiece().offsets
    );

    for (const [x, y, z] of cubes) {
      const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
      const cubeMaterial = new THREE.MeshNormalMaterial();
      const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
      cube.position.set(x + 0.5, y + 0.5, z + 0.5);
      scene.add(cube);
    }

    this.#state.fallenPieces.push(...cubes);
    this.#callbacks.fallenCubes(this.#state.fallenPieces);
  }
}

export default GameState;
