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

export const renderGridLine = (
  scene: THREE.Scene,
  fieldSize: number,
  fieldDepth: number
) => {
  const geometry = new THREE.BufferGeometry();

  const vertices: Vertex[] = [];

  const s = fieldSize / 2;
  const d = fieldDepth / 2;
  for (let i = -s + 1; i < s; i++) {
    vertices.push([-s, -d, i]);
    vertices.push([-s, d, i]);
  }

  for (let i = -s + 1; i < s; i++) {
    vertices.push([s, -d, i]);
    vertices.push([s, d, i]);
  }

  for (let i = -s + 1; i < s; i++) {
    vertices.push([i, -d, -s]);
    vertices.push([i, d, -s]);
  }

  for (let i = -s + 1; i < s; i++) {
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
    vertices.push([-s, y, i]);
    vertices.push([s, y, i]);
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
