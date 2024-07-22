import * as THREE from "three";
import { Context } from "../types";
import { disposeObject } from "../threeUtils";
import { COLORS } from "../config";

const FALLEN_CUBES_ID = "fallen-cubes";

const MATERIALS = COLORS.map((color) => new THREE.MeshBasicMaterial({ color }));

const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);

const cubeWireGeometry = new THREE.EdgesGeometry(cubeGeometry);
const cubeWireMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });

const getAllLayers = (context: Context) => {
  const { scene } = context;
  return scene.getObjectByName(FALLEN_CUBES_ID)!.children;
};

const getLayer = (context: Context, y: number) => {
  const layer = getAllLayers(context).find((layer) => layer.position.y === y);
  if (!layer) {
    throw new Error(`Layer ${y} not found`);
  }
  return layer;
};

const addLayer = (context: Context, y: number) => {
  const { scene } = context;
  const group = scene.getObjectByName(FALLEN_CUBES_ID)!;
  const layer = new THREE.Object3D();
  layer.name = `layer|${y}`;
  layer.position.y = y;
  group.add(layer);
};

export const setup = (context: Context) => {
  const { settings, scene } = context;
  const group = new THREE.Group();
  group.name = FALLEN_CUBES_ID;
  scene.add(group);
  for (let i = 0; i < settings.shaftSizeY; i++) {
    addLayer(context, i);
  }
};

export const addPiece = (context: Context, cubes: THREE.Vector3[]) => {
  for (const [x, y, z] of cubes) {
    const cubeMaterial = new THREE.MeshBasicMaterial({ color: COLORS[y] });
    const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);

    const wireframe = new THREE.LineSegments(
      cubeWireGeometry,
      cubeWireMaterial
    );
    wireframe.name = `fallen-cube-wire|${x}/${y}/${z}`;
    cube.add(wireframe);

    cube.position.set(x + 0.5, 0.5, z + 0.5);
    cube.name = `fallen-cube|${x}/${y}/${z}`;
    getLayer(context, y).add(cube);
  }
};

const getCubesOfLayer = (context: Context, y: number) => {
  return getLayer(context, y).children.map((child) => {
    const position = child.position.clone();
    position.subScalar(0.5);
    position.y += y;
    return position;
  });
};

export const pieceCollidesWithFallenCube = (
  context: Context,
  pieceCubes: THREE.Vector3[]
) => {
  return pieceCubes.some((pieceCube) => {
    return getCubesOfLayer(context, pieceCube.y).some(
      (fallenCube) =>
        fallenCube.x === pieceCube.x && fallenCube.z === pieceCube.z
    );
  });
};

export const findFullLevels = (context: Context) => {
  const { shaftSizeY, shaftSizeX, shaftSizeZ } = context.settings;
  const fullLevels = [];
  for (let y = 0; y < shaftSizeY; y++) {
    if (getLayer(context, y).children.length === shaftSizeX * shaftSizeZ) {
      fullLevels.push(y);
    }
  }
  return fullLevels;
};

export const removeLevel = (context: Context, y: number) => {
  const { shaftSizeY } = context.settings;
  // Remove cubes of this level
  disposeObject(getLayer(context, y));

  // Move all layers which are above the removed layer one level down
  getAllLayers(context).map((layer) => {
    if (layer.position.y > y) {
      layer.position.y = layer.position.y - 1;
      layer.children.forEach((child) => {
        // Recalulate the color of each cube
        (child as THREE.Mesh).material = MATERIALS[layer.position.y];
      });
    }
  });

  // Add a new layer at the top
  addLayer(context, shaftSizeY - 1);
};

export const getHeight = (context: Context) => {
  const { settings } = context;
  const lowestEmptyLayer = getAllLayers(context).find(
    (layer) => layer.children.length === 0
  );

  return lowestEmptyLayer ? lowestEmptyLayer.position.y : settings.shaftSizeY;
};
