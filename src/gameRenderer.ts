import * as THREE from "three";
import { Edge, Settings, Vertex } from "./types";
import { StateUpdateCallbacks } from "./types";
import { filterEdges, getCubeGeometry } from "./shape";

const SHAFT_LINES_ID = "shaft-lines";
const CURRENT_PIECE_ID = "current-piece";
const FALLEN_CUBES_ID = "fallen-cubes";

class GameRenderer {
  #scene: THREE.Scene;
  #callbacks: StateUpdateCallbacks;

  constructor(scene: THREE.Scene, callbacks: StateUpdateCallbacks) {
    this.#scene = scene;
    this.#callbacks = callbacks;
  }

  setup() {
    const group1 = new THREE.Group();
    group1.name = SHAFT_LINES_ID;
    this.#scene.add(group1);

    const group2 = new THREE.Group();
    group2.name = FALLEN_CUBES_ID;
    this.#scene.add(group2);
  }

  renderShaftCube(dimension: Vertex, position: Vertex) {
    const cubeGeometry = new THREE.BoxGeometry(...dimension);
    const cubeMaterial = new THREE.LineBasicMaterial({ color: "0x00ff00" });
    const edges = new THREE.EdgesGeometry(cubeGeometry);
    const cube = new THREE.LineSegments(edges, cubeMaterial);
    cube.position.set(...position);
    cube.name = "container";
    this.#scene.add(cube);
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

  renderCurrentPiece(offsets: Vertex[], position: Vertex) {
    const vertices: Vertex[] = [];
    const allEdges: Edge[] = [];
    for (const offset of offsets) {
      getCubeGeometry(vertices, allEdges, 1, offset[0], offset[1], offset[2]);
    }

    const filteredEdges = filterEdges(vertices, allEdges);

    const geometry = new THREE.BufferGeometry();

    // Add the vertices and edges to the geometry
    geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(vertices.flat()), 3)
    );
    geometry.setIndex(filteredEdges.flat());

    const material = new THREE.LineBasicMaterial({ color: 0x00ff00 });
    const lines = new THREE.LineSegments(geometry, material);
    lines.position.set(...position);
    lines.name = CURRENT_PIECE_ID;
    lines.renderOrder = 1;

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

  setCurrentPiecePosition(position: Vertex) {
    const piece = this.getCurrentPiece();
    piece.position.set(...position);
    this.#callbacks.currentPiecePosition(this.getCurrentPiecePosition());
  }

  renderFallenCubes(cubes: Vertex[]) {
    for (const [x, y, z] of cubes) {
      const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
      const cubeMaterial = new THREE.MeshNormalMaterial();
      const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
      cube.position.set(x + 0.5, y + 0.5, z + 0.5);
      this.#scene.getObjectByName(FALLEN_CUBES_ID)!.add(cube);
    }
  }

  removeFallenCubes() {
    const fallenCubes = this.#scene.getObjectByName(FALLEN_CUBES_ID);
    if (fallenCubes) fallenCubes.clear();
  }
}

export default GameRenderer;
