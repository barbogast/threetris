import * as THREE from "three";
// import { LineSegments2 } from "three/addons/lines/LineSegments2.js";
// import { LineSegmentsGeometry } from "three/addons/lines/LineSegmentsGeometry.js";
// import { LineMaterial } from "three/addons/lines/LineMaterial.js";

import { Axis, Direction, Edge, Settings, VectorArray } from "../types";
import { filterEdges, getCubeGeometry } from "../shape";

const CURRENT_PIECE_ID = "current-piece";

const currentPieceMatieral = new THREE.LineBasicMaterial({ color: 0x00ff00 });
const shadowGeometry = new THREE.SphereGeometry(0.1);
const shadowMaterial = new THREE.MeshBasicMaterial({ visible: false });

class CurrentPiece {
  #scene: THREE.Scene;
  #settings: Settings;
  constructor(settings: Settings, scene: THREE.Scene) {
    this.#settings = settings;
    this.#scene = scene;
  }

  renderCurrentPiece(offsets: THREE.Vector3[]) {
    const vectors: VectorArray[] = [];
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

    const { shaftSizeX, shaftSizeY, shaftSizeZ } = this.#settings!;
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
      point.position.copy(offset.clone().addScalar(0.5));
      lines.add(point);
    }

    this.#scene.add(lines);
    return lines;
  }

  getThreeObject() {
    const currentPiece = this.#scene.getObjectByName(CURRENT_PIECE_ID);
    if (!currentPiece) throw new Error("No current piece");
    return currentPiece as THREE.Mesh;
  }
}

export default CurrentPiece;

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

export const willBeOutsideOfShaft = (
  pieceCubes: THREE.Vector3[],
  settings: Settings
) => {
  const { shaftSizeX, shaftSizeZ } = settings;
  return pieceCubes.some(
    (cube) =>
      cube.x < 0 ||
      cube.x >= shaftSizeX ||
      cube.y < 0 ||
      cube.z < 0 ||
      cube.z >= shaftSizeZ
  );
};
