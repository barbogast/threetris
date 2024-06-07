import * as THREE from "three";
import { Vertex } from "./types";

export const renderGridLine = (
  scene: THREE.Scene,
  fieldDepth: number,
  fieldSize: number
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

  // Add the vertices and edges to the geometry
  geometry.setAttribute(
    "position",
    new THREE.BufferAttribute(new Float32Array(vertices.flat()), 3)
  );

  const material = new THREE.LineBasicMaterial({ color: "0x00ff00" });
  const lines = new THREE.LineSegments(geometry, material);
  scene.add(lines);
};
