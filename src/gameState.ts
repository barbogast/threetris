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
};

class GameState {
  #state: {
    currentPiece: CurrentPiece | undefined;
    fallenPieces: [number, number][];
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

  addFallenPiece() {
    const position = this.getCurrentPiecePosition();
    const cubes = this.#getCurrentPiece().offsets.map((offset) => [
      position[0] + offset[0],
      position[1] + offset[1],
      position[2] + offset[2],
    ]);
    this.#state.fallenPieces.push(
      ...cubes.map((cube) => [cube[0], cube[2]] as [number, number])
    );
  }
}

export default GameState;