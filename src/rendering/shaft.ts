import * as THREE from "three";
import { Settings, VectorArray } from "../types";
import GameRenderer from "./gameRenderer";

export const renderContainer = (
  gameRenderer: GameRenderer,
  settings: Settings
) => {
  const dimensions = new THREE.Vector3(
    settings.shaftSizeX,
    settings.shaftSizeY,
    settings.shaftSizeZ
  );
  const position = new THREE.Vector3(
    settings.shaftSizeX / 2,
    settings.shaftSizeY / 2,
    settings.shaftSizeZ / 2
  );
  gameRenderer.renderShaftCube(dimensions, position);
};

export const renderWallGridLongLines = (
  gameRenderer: GameRenderer,
  settings: Settings
) => {
  const { shaftSizeX: x, shaftSizeY: y, shaftSizeZ: z } = settings;
  const vectors: VectorArray[] = [];

  for (let i = 1; i < z; i++) {
    // Left wall
    vectors.push([0, 0, i]);
    vectors.push([0, y, i]);

    // Right wall
    vectors.push([x, 0, i]);
    vectors.push([x, y, i]);
  }

  for (let i = 1; i < x; i++) {
    // Top wall
    vectors.push([i, 0, 0]);
    vectors.push([i, y, 0]);

    // Bottom wall
    vectors.push([i, 0, z]);
    vectors.push([i, y, z]);
  }

  gameRenderer.renderShaftLines("wall-long-lines", vectors);
};

export const renderWallGridShortLines = (
  gameRenderer: GameRenderer,
  settings: Settings
) => {
  const { shaftSizeX: x, shaftSizeY: y, shaftSizeZ: z } = settings;
  const vectors: VectorArray[] = [];

  for (let i = 1; i < y; i++) {
    // Left wall
    vectors.push([0, i, 0]);
    vectors.push([0, i, z]);

    // Right wall
    vectors.push([x, i, 0]);
    vectors.push([x, i, z]);

    // Top wall
    vectors.push([0, i, 0]);
    vectors.push([x, i, 0]);

    // Bottom wall
    vectors.push([0, i, z]);
    vectors.push([x, i, z]);
  }

  gameRenderer.renderShaftLines("wall-short-lines", vectors);
};

export const renderFloorGrid = (
  gameRenderer: GameRenderer,
  settings: Settings
) => {
  const { shaftSizeX: x, shaftSizeZ: z } = settings;
  const vectors: VectorArray[] = [];

  for (let i = 0 + 1; i < z; i++) {
    // Horizontal
    vectors.push([0, 0, i]);
    vectors.push([x, 0, i]);
  }

  for (let i = 0 + 1; i < x; i++) {
    // Vertical
    vectors.push([i, 0, 0]);
    vectors.push([i, 0, z]);
  }

  gameRenderer.renderShaftLines("floor-lines", vectors);
};
