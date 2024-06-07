import * as THREE from "three";
import { Vertex } from "./types";

export const renderContainer = (
  scene: THREE.Scene,
  fieldSize: number,
  fieldDepth: number
) => {
  const cubeGeometry = new THREE.BoxGeometry(fieldSize, fieldDepth, fieldSize);
  const cubeMaterial = new THREE.LineBasicMaterial({ color: "0x00ff00" });
  const edges = new THREE.EdgesGeometry(cubeGeometry);
  const cube = new THREE.LineSegments(edges, cubeMaterial);
  cube.position.set(fieldSize / 2, fieldDepth / 2, fieldSize / 2);
  scene.add(cube);
};

export const renderWallGridLongLines = (
  scene: THREE.Scene,
  fieldSize: number,
  fieldDepth: number
) => {
  const geometry = new THREE.BufferGeometry();

  const vertices: Vertex[] = [];

  const s = fieldSize;
  const d = fieldDepth;

  for (let i = 1; i < s; i++) {
    // Left wall
    vertices.push([0, 0, i]);
    vertices.push([0, d, i]);

    // Right wall
    vertices.push([s, 0, i]);
    vertices.push([s, d, i]);

    // // Top
    vertices.push([i, 0, 0]);
    vertices.push([i, d, 0]);

    // // Bottom
    vertices.push([i, 0, s]);
    vertices.push([i, d, s]);
  }

  geometry.setAttribute(
    "position",
    new THREE.BufferAttribute(new Float32Array(vertices.flat()), 3)
  );

  const material = new THREE.LineBasicMaterial({ color: "0x00ff00" });
  const lines = new THREE.LineSegments(geometry, material);
  scene.add(lines);
};

export const renderWallGridShortLines = (
  scene: THREE.Scene,
  fieldSize: number,
  fieldDepth: number
) => {
  const geometry = new THREE.BufferGeometry();

  const vertices: Vertex[] = [];

  const s = fieldSize;
  const d = fieldDepth;

  for (let i = 1; i < d; i++) {
    // Left wall
    vertices.push([0, i, 0]);
    vertices.push([0, i, s]);

    // Right wall
    vertices.push([s, i, 0]);
    vertices.push([s, i, s]);

    // Top
    vertices.push([0, i, 0]);
    vertices.push([s, i, 0]);

    // Bottom
    vertices.push([0, i, s]);
    vertices.push([s, i, s]);
  }

  geometry.setAttribute(
    "position",
    new THREE.BufferAttribute(new Float32Array(vertices.flat()), 3)
  );

  const material = new THREE.LineBasicMaterial({ color: "0x00ff00" });
  const lines = new THREE.LineSegments(geometry, material);
  scene.add(lines);
};

export const renderFloorGrid = (scene: THREE.Scene, fieldSize: number) => {
  const geometry = new THREE.BufferGeometry();

  const vertices: Vertex[] = [];

  const s = fieldSize;
  for (let i = 0 + 1; i < s; i++) {
    // Horizontal
    vertices.push([0, 0, i]);
    vertices.push([s, 0, i]);

    // Vertical
    vertices.push([i, 0, 0]);
    vertices.push([i, 0, s]);
  }

  geometry.setAttribute(
    "position",
    new THREE.BufferAttribute(new Float32Array(vertices.flat()), 3)
  );

  const material = new THREE.LineBasicMaterial({ color: "0x00ff00" });
  const lines = new THREE.LineSegments(geometry, material);
  scene.add(lines);
};
