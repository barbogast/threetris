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
  scene.add(cube);
};

export const renderWallGridLongLines = (
  scene: THREE.Scene,
  fieldSize: number,
  fieldDepth: number
) => {
  const geometry = new THREE.BufferGeometry();

  const vertices: Vertex[] = [];

  const s = fieldSize / 2;
  const d = fieldDepth / 2;

  for (let i = -s + 1; i < s; i++) {
    // Left wall
    vertices.push([-s, -d, i]);
    vertices.push([-s, d, i]);

    // Right wall
    vertices.push([s, -d, i]);
    vertices.push([s, d, i]);

    // Top
    vertices.push([i, -d, -s]);
    vertices.push([i, d, -s]);

    // Bottom
    vertices.push([i, -d, s]);
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

  const s = fieldSize / 2;
  const d = fieldDepth / 2;

  for (let i = -d + 1; i < d; i++) {
    // Left wall
    vertices.push([-s, i, -s]);
    vertices.push([-s, i, s]);

    // // Right wall
    vertices.push([s, i, -s]);
    vertices.push([s, i, s]);

    // // Top
    vertices.push([-s, i, -s]);
    vertices.push([s, i, -s]);

    // // Bottom
    vertices.push([-s, i, s]);
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

export const renderFloorGrid = (
  scene: THREE.Scene,
  fieldSize: number,
  fieldDepth: number
) => {
  const geometry = new THREE.BufferGeometry();

  const vertices: Vertex[] = [];

  const s = fieldSize / 2;
  const y = -fieldDepth / 2;

  for (let i = -s + 1; i < s; i++) {
    // Horizontal
    vertices.push([-s, y, i]);
    vertices.push([s, y, i]);

    // Vertical
    vertices.push([i, y, -s]);
    vertices.push([i, y, s]);
  }

  geometry.setAttribute(
    "position",
    new THREE.BufferAttribute(new Float32Array(vertices.flat()), 3)
  );

  const material = new THREE.LineBasicMaterial({ color: "0x00ff00" });
  const lines = new THREE.LineSegments(geometry, material);
  scene.add(lines);
};
