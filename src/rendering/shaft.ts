import * as THREE from "three";
import { Context } from "../types";

const SHAFT_LINES_ID = "shaft-lines";

const shaftMaterial = new THREE.LineBasicMaterial({ color: "0x00ff00" });

export const setup = (context: Context) => {
  const { scene } = context;
  const group1 = new THREE.Group();
  group1.name = SHAFT_LINES_ID;
  scene.add(group1);
};

const renderShaftCube = (
  context: Context,
  dimension: THREE.Vector3,
  position: THREE.Vector3
) => {
  const { scene } = context;
  const cubeGeometry = new THREE.BoxGeometry(...dimension);
  const edges = new THREE.EdgesGeometry(cubeGeometry);
  const cube = new THREE.LineSegments(edges, shaftMaterial);
  cube.position.copy(position);
  cube.name = "container";
  scene.add(cube);
};

const renderShaftLines = (
  context: Context,
  name: string,
  vertices: THREE.Vector3Tuple[]
) => {
  const { scene } = context;
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.BufferAttribute(new Float32Array(vertices.flat()), 3)
  );

  const lines = new THREE.LineSegments(geometry, shaftMaterial);
  lines.name = name;
  scene.getObjectByName(SHAFT_LINES_ID)!.add(lines);
};

export const renderContainer = (context: Context) => {
  const { settings } = context;
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
  renderShaftCube(context, dimensions, position);
};

export const renderWallGridLongLines = (context: Context) => {
  const { settings } = context;
  const { shaftSizeX: x, shaftSizeY: y, shaftSizeZ: z } = settings;
  const vectors: THREE.Vector3Tuple[] = [];

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

  renderShaftLines(context, "wall-long-lines", vectors);
};

export const renderWallGridShortLines = (context: Context) => {
  const { settings } = context;
  const { shaftSizeX: x, shaftSizeY: y, shaftSizeZ: z } = settings;
  const vectors: THREE.Vector3Tuple[] = [];

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

  renderShaftLines(context, "wall-short-lines", vectors);
};

export const renderFloorGrid = (context: Context) => {
  const { settings } = context;
  const { shaftSizeX: x, shaftSizeZ: z } = settings;
  const vectors: THREE.Vector3Tuple[] = [];

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

  renderShaftLines(context, "floor-lines", vectors);
};
