import * as THREE from "three";
// import { LineSegments2 } from "three/addons/lines/LineSegments2.js";
// import { LineSegmentsGeometry } from "three/addons/lines/LineSegmentsGeometry.js";
// import { LineMaterial } from "three/addons/lines/LineMaterial.js";

import { Axis, Context, Direction, Edge, Settings } from "../types";
import { filterEdges, getCubeGeometry } from "../shape";

const CURRENT_PIECE_ID = "current-piece";

const currentPieceMatieral = new THREE.LineBasicMaterial({ color: 0x00ff00 });
const shadowGeometry = new THREE.SphereGeometry(0.1);
const shadowMaterial = new THREE.MeshBasicMaterial({ visible: false });

export const renderCurrentPiece = (
  { scene, settings }: Context,
  offsets: THREE.Vector3[]
) => {
  const vectors: THREE.Vector3Tuple[] = [];
  const allEdges: Edge[] = [];
  for (const offset of offsets) {
    getCubeGeometry(vectors, allEdges, 1, offset.x, offset.y, offset.z);
  }

  const filteredEdges = filterEdges(vectors, allEdges);

  const geometry = new THREE.BufferGeometry();

  // Add the vertices and edges to the geometry
  geometry.setAttribute(
    "position",
    new THREE.BufferAttribute(new Float32Array(vectors.flat()), 3)
  );
  geometry.setIndex(filteredEdges.flat());

  const lines = new THREE.LineSegments(geometry, currentPieceMatieral);

  const { shaftSizeX, shaftSizeY, shaftSizeZ } = settings!;
  lines.position.set(
    Math.floor(shaftSizeX / 2),
    // Move the piece to the top of the shaft but push it down if it is too high
    shaftSizeY - 1 - Math.max(...offsets.map((o) => o.y)),
    Math.floor(shaftSizeZ / 2)
  );

  lines.name = CURRENT_PIECE_ID;
  lines.renderOrder = 1;

  // Add invisible objects and attach them as children to the mesh.
  // This allows us to determine the position of the individual cubes after rotation.
  for (const offset of offsets) {
    const point = new THREE.Mesh(shadowGeometry, shadowMaterial);
    point.name = `shadow-cube|${offset.x}/${offset.y}/${offset.z}`;

    // Move the point to the center of the cube, so that it stays in place when the cube is rotated
    point.position.copy(offset).addScalar(0.5);
    lines.add(point);
  }

  scene.add(lines);
  return lines;
};

export const getThreeObject = ({ scene }: Context) => {
  const currentPiece = scene.getObjectByName(CURRENT_PIECE_ID);
  if (!currentPiece) throw new Error("No current piece");
  return currentPiece as THREE.Mesh;
};

export const getCurrentCubes = (obj: THREE.Object3D) => {
  return obj.children.map((child) => {
    const v = new THREE.Vector3();
    child.getWorldPosition(v);

    // Move the point back to the edge of the cube so that we are aligned with the grid
    v.subScalar(0.5);

    v.round();
    return v;
  });
};

export const rotate = (
  obj: THREE.Object3D,
  axis: Axis,
  direction: Direction
) => {
  const angle = (Math.PI / 2) * direction;
  obj.rotateOnWorldAxis(
    new THREE.Vector3(
      axis === "x" ? 1 : 0,
      axis === "y" ? 1 : 0,
      axis === "z" ? 1 : 0
    ),
    angle
  );
};

// If moveTo is set, it is a vector pointing in the opposite direction of
// the wall that the piece is colliding with. moveTo will be undefined if
// the piece hits the bottom of the shaft.
export type CollisionResult =
  | { isCollision: false }
  | { isCollision: true; moveTo?: THREE.Vector3 };

export const getShaftCollision = (
  pieceCubes: THREE.Vector3[],
  settings: Settings
): CollisionResult => {
  const { shaftSizeX, shaftSizeY, shaftSizeZ } = settings;
  for (const cube of pieceCubes) {
    if (cube.x < 0)
      return { isCollision: true, moveTo: new THREE.Vector3(1, 0, 0) };

    if (cube.x >= shaftSizeX)
      return { isCollision: true, moveTo: new THREE.Vector3(-1, 0, 0) };

    if (cube.y < 0) return { isCollision: true };

    if (cube.y >= shaftSizeY)
      return { isCollision: true, moveTo: new THREE.Vector3(0, -1, 0) };

    if (cube.z < 0)
      return { isCollision: true, moveTo: new THREE.Vector3(0, 0, 1) };

    if (cube.z >= shaftSizeZ)
      return { isCollision: true, moveTo: new THREE.Vector3(0, 0, -1) };
  }
  return { isCollision: false };
};
