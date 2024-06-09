import * as THREE from "three";
import { Edge, Vertex } from "./types";

const SHAFT_LINES_ID = "shaft-lines";
const CURRENT_PIECE_ID = "current-piece";

export const setupGroups = (scene: THREE.Scene) => {
  const group = new THREE.Group();
  group.name = SHAFT_LINES_ID;
  scene.add(group);
};

export const renderShaftLines = (
  scene: THREE.Scene,
  name: string,
  vertices: Vertex[]
) => {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.BufferAttribute(new Float32Array(vertices.flat()), 3)
  );

  const material = new THREE.LineBasicMaterial({ color: "0x00ff00" });

  const lines = new THREE.LineSegments(geometry, material);
  lines.name = name;
  scene.getObjectByName(SHAFT_LINES_ID)!.add(lines);
};

export const renderCurrentPiece = (
  scene: THREE.Scene,
  vertices: Vertex[],
  edges: Edge[],
  position: Vertex
) => {
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

  scene.add(lines);
};

const getCurrentPiece = (scene: THREE.Scene) => {
  const currentPiece = scene.getObjectByName(CURRENT_PIECE_ID);
  if (!currentPiece) throw new Error("No current piece");
  return currentPiece;
};

const getCurrentPieceMaybe = (scene: THREE.Scene) => {
  return scene.getObjectByName(CURRENT_PIECE_ID);
};

export const getCurrentPiecePosition = (scene: THREE.Scene): Vertex => {
  return getCurrentPiece(scene).position.toArray();
};

export const removeCurrentPiece = (scene: THREE.Scene) => {
  const piece = getCurrentPieceMaybe(scene);
  if (piece) scene.remove(piece);
};

export const moveCurrentPiece = (scene: THREE.Scene, offset: Vertex) => {
  const piece = getCurrentPiece(scene);
  piece.position.x += offset[0];
  piece.position.y += offset[1];
  piece.position.z += offset[2];
  // this.#callbacks.currentPiece(this.#getCurrentPiece());
};

export const renderFallenCubes = (scene: THREE.Scene, cubes: Vertex[]) => {
  for (const [x, y, z] of cubes) {
    const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
    const cubeMaterial = new THREE.MeshNormalMaterial();
    const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
    cube.position.set(x + 0.5, y + 0.5, z + 0.5);
    scene.add(cube);
  }
};
