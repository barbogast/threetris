import * as THREE from "three";
import { Edge, Vertex } from "./types";
import { StateUpdateCallbacks } from "./types";

const SHAFT_LINES_ID = "shaft-lines";
const CURRENT_PIECE_ID = "current-piece";

class GameRenderer {
  #scene: THREE.Scene;
  #callbacks: StateUpdateCallbacks;

  constructor(scene: THREE.Scene, callbacks: StateUpdateCallbacks) {
    this.#scene = scene;
    this.#callbacks = callbacks;
  }

  setup() {
    const group = new THREE.Group();
    group.name = SHAFT_LINES_ID;
    this.#scene.add(group);
  }

  renderShaftLines(name: string, vertices: Vertex[]) {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(vertices.flat()), 3)
    );

    const material = new THREE.LineBasicMaterial({ color: "0x00ff00" });

    const lines = new THREE.LineSegments(geometry, material);
    lines.name = name;
    this.#scene.getObjectByName(SHAFT_LINES_ID)!.add(lines);
  }

  renderCurrentPiece(vertices: Vertex[], edges: Edge[], position: Vertex) {
    const geometry = new THREE.BufferGeometry();

    // Add the vertices and edges to the geometry
    geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(vertices.flat()), 3)
    );
    geometry.setIndex(edges.flat());

    const material = new THREE.LineBasicMaterial({ color: 0x00ff00 });
    const lines = new THREE.LineSegments(geometry, material);
    lines.position.set(...position);
    lines.name = CURRENT_PIECE_ID;

    this.#scene.add(lines);

    this.#callbacks.currentPiecePosition(this.getCurrentPiecePosition());
  }

  getCurrentPiece() {
    const currentPiece = this.#scene.getObjectByName(CURRENT_PIECE_ID);
    if (!currentPiece) throw new Error("No current piece");
    return currentPiece;
  }

  getCurrentPieceMaybe() {
    return this.#scene.getObjectByName(CURRENT_PIECE_ID);
  }

  getCurrentPiecePosition(): Vertex {
    return this.getCurrentPiece().position.toArray();
  }

  removeCurrentPiece() {
    const piece = this.getCurrentPieceMaybe();
    if (piece) this.#scene.remove(piece);
    this.#callbacks.currentPiecePosition(undefined);
  }

  moveCurrentPiece(offset: Vertex) {
    const piece = this.getCurrentPiece();
    piece.position.x += offset[0];
    piece.position.y += offset[1];
    piece.position.z += offset[2];
    this.#callbacks.currentPiecePosition(this.getCurrentPiecePosition());
  }

  renderFallenCubes(cubes: Vertex[]) {
    for (const [x, y, z] of cubes) {
      const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
      const cubeMaterial = new THREE.MeshNormalMaterial();
      const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
      cube.position.set(x + 0.5, y + 0.5, z + 0.5);
      this.#scene.add(cube);
    }
  }
}

export default GameRenderer;
