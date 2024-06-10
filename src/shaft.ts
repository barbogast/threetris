import * as THREE from "three";
import { Settings, Vertex } from "./types";
import GameRenderer from "./gameRenderer";

export const renderContainer = (scene: THREE.Scene, settings: Settings) => {
  const cubeGeometry = new THREE.BoxGeometry(
    settings.shaftSizeX,
    settings.shaftSizeY,
    settings.shaftSizeZ
  );
  const cubeMaterial = new THREE.LineBasicMaterial({ color: "0x00ff00" });
  const edges = new THREE.EdgesGeometry(cubeGeometry);
  const cube = new THREE.LineSegments(edges, cubeMaterial);
  cube.position.set(
    settings.shaftSizeX / 2,
    settings.shaftSizeY / 2,
    settings.shaftSizeZ / 2
  );
  scene.add(cube);
};

export const renderWallGridLongLines = (
  gameRenderer: GameRenderer,
  settings: Settings
) => {
  const { shaftSizeX: x, shaftSizeY: y, shaftSizeZ: z } = settings;
  const vertices: Vertex[] = [];

  for (let i = 1; i < z; i++) {
    // Left wall
    vertices.push([0, 0, i]);
    vertices.push([0, y, i]);

    // Right wall
    vertices.push([x, 0, i]);
    vertices.push([x, y, i]);
  }

  for (let i = 1; i < x; i++) {
    // // // Top
    vertices.push([i, 0, 0]);
    vertices.push([i, y, 0]);

    // // // Bottom
    vertices.push([i, 0, z]);
    vertices.push([i, y, z]);
  }

  gameRenderer.renderShaftLines("wall-long-lines", vertices);
};

export const renderWallGridShortLines = (
  gameRenderer: GameRenderer,
  settings: Settings
) => {
  const { shaftSizeX: x, shaftSizeY: y, shaftSizeZ: z } = settings;
  const vertices: Vertex[] = [];

  for (let i = 1; i < y; i++) {
    // Left wall
    vertices.push([0, i, 0]);
    vertices.push([0, i, z]);

    // Right wall
    vertices.push([x, i, 0]);
    vertices.push([x, i, z]);

    // // Top
    vertices.push([0, i, 0]);
    vertices.push([x, i, 0]);

    // // Bottom
    vertices.push([0, i, z]);
    vertices.push([x, i, z]);
  }

  gameRenderer.renderShaftLines("wall-short-lines", vertices);
};

export const renderFloorGrid = (
  gameRenderer: GameRenderer,
  settings: Settings
) => {
  const { shaftSizeX: x, shaftSizeZ: z } = settings;
  const vertices: Vertex[] = [];

  for (let i = 0 + 1; i < z; i++) {
    // Horizontal
    vertices.push([0, 0, i]);
    vertices.push([x, 0, i]);
  }

  for (let i = 0 + 1; i < x; i++) {
    // Vertical
    vertices.push([i, 0, 0]);
    vertices.push([i, 0, z]);
  }

  gameRenderer.renderShaftLines("floor-lines", vertices);
};
