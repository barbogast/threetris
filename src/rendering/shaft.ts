import { Settings, Vertex } from "../types";
import GameRenderer from "./gameRenderer";

export const renderContainer = (
  gameRenderer: GameRenderer,
  settings: Settings
) => {
  const dimensions: Vertex = [
    settings.shaftSizeX,
    settings.shaftSizeY,
    settings.shaftSizeZ,
  ];
  const position: Vertex = [
    settings.shaftSizeX / 2,
    settings.shaftSizeY / 2,
    settings.shaftSizeZ / 2,
  ];
  gameRenderer.renderShaftCube(dimensions, position);
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
    // Top wall
    vertices.push([i, 0, 0]);
    vertices.push([i, y, 0]);

    // Bottom wall
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

    // Top wall
    vertices.push([0, i, 0]);
    vertices.push([x, i, 0]);

    // Bottom wall
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
