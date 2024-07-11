import * as THREE from "three";
// import { LineSegments2 } from "three/addons/lines/LineSegments2.js";
// import { LineSegmentsGeometry } from "three/addons/lines/LineSegmentsGeometry.js";
// import { LineMaterial } from "three/addons/lines/LineMaterial.js";

import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { Axis, Direction, Edge, Settings, Vertex } from "../types";
import { StateUpdateCallbacks } from "../types";
import { filterEdges, getCubeGeometry } from "../shape";
import { SETTINGS_WIDTH } from "../config";

type CurrentPiece = THREE.LineSegments<
  THREE.BufferGeometry<THREE.NormalBufferAttributes>,
  THREE.LineBasicMaterial,
  THREE.Object3DEventMap
>;

const SHAFT_LINES_ID = "shaft-lines";
const CURRENT_PIECE_ID = "current-piece";

class GameRenderer {
  #scene: THREE.Scene;
  #callbacks?: StateUpdateCallbacks;
  #renderer: THREE.WebGLRenderer;
  #camera?: THREE.PerspectiveCamera;
  #settings?: Settings;

  constructor() {
    this.#scene = new THREE.Scene();
    this.#renderer = new THREE.WebGLRenderer();
  }

  getScene() {
    return this.#scene;
  }

  setup(settings: Settings, callbacks: StateUpdateCallbacks) {
    this.#settings = settings;
    this.#scene.clear();

    this.#callbacks = callbacks;

    const group1 = new THREE.Group();
    group1.name = SHAFT_LINES_ID;
    this.#scene.add(group1);

    this.#camera = new THREE.PerspectiveCamera(settings.fov, settings.aspect);
    this.#camera.zoom = settings.zoom;

    // position the camera on top of the scene
    this.#camera.position.set(
      settings.positionX,
      settings.positionY,
      settings.positionZ
    );

    // target the center at the bottom of the scene
    this.#camera.lookAt(settings.lookAtX, settings.lookAtY, settings.lookAtZ);

    this.#camera.updateProjectionMatrix();

    this.#renderer.setSize(
      window.innerWidth - SETTINGS_WIDTH,
      window.innerHeight
    );

    document.getElementById("scene")?.appendChild(this.#renderer.domElement);

    if (settings.enableOrbitalControl) {
      const controls = new OrbitControls(
        this.#camera,
        this.#renderer.domElement
      );
      controls.maxPolarAngle = (0.9 * Math.PI) / 2;
      controls.enableZoom = true;
      controls.target = new THREE.Vector3(
        settings.shaftSizeX / 2,
        1,
        settings.shaftSizeZ / 2
      );
    }
  }

  renderScene() {
    this.#renderer.render(this.#scene, this.#camera!);
    this.#callbacks!.rendererInfo({
      geometries: this.#renderer.info.memory.geometries,
    });
  }

  updateCameraFov(fov: number) {
    this.#camera!.fov = fov;
    this.#camera!.updateProjectionMatrix();
  }

  updateCameraPosition(position: THREE.Vector3) {
    this.#camera!.position.copy(position);
  }

  updateCameraLookAt(lookAt: THREE.Vector3) {
    this.#camera!.lookAt(lookAt.x, lookAt.y, lookAt.z);
  }

  renderShaftCube(dimension: THREE.Vector3, position: THREE.Vector3) {
    const cubeGeometry = new THREE.BoxGeometry(...dimension);
    const cubeMaterial = new THREE.LineBasicMaterial({ color: "0x00ff00" });
    const edges = new THREE.EdgesGeometry(cubeGeometry);
    const cube = new THREE.LineSegments(edges, cubeMaterial);
    cube.position.copy(position);
    cube.name = "container";
    this.#scene.add(cube);
  }

  renderShaftLines(name: string, vertices: Vertex[]) {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(vertices.flat()), 3)
    );

    const material = new THREE.LineBasicMaterial({ color: "0x00ff00" });

    const lines = new THREE.LineSegments(geometry, material);
    lines.name = name;
    this.#scene.getObjectByName(SHAFT_LINES_ID)!.add(lines);
  }

  renderCurrentPiece(offsets: THREE.Vector3[]) {
    const vertices: Vertex[] = [];
    const allEdges: Edge[] = [];
    for (const offset of offsets) {
      getCubeGeometry(vertices, allEdges, 1, offset.x, offset.y, offset.z);
    }

    const filteredEdges = filterEdges(vertices, allEdges);

    const geometry = new THREE.BufferGeometry();

    // Add the vertices and edges to the geometry
    geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(vertices.flat()), 3)
    );
    geometry.setIndex(filteredEdges.flat());

    const material = new THREE.LineBasicMaterial({ color: 0x00ff00 });
    const lines = new THREE.LineSegments(geometry, material);

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
      const pointGeometry = new THREE.SphereGeometry(0.1);
      const pointMaterial = new THREE.MeshBasicMaterial({ visible: false });
      const point = new THREE.Mesh(pointGeometry, pointMaterial);

      // Move the point to the center of the cube, so that it stays in place when the cube is rotated
      point.position.copy(offset.clone().addScalar(0.5));
      lines.add(point);
    }

    this.#scene.add(lines);
    return lines;
  }

  getCurrentPiece() {
    const currentPiece = this.#scene.getObjectByName(CURRENT_PIECE_ID);
    if (!currentPiece) throw new Error("No current piece");
    return currentPiece as CurrentPiece;
  }

  removeCurrentPiece() {
    const piece = this.getCurrentPiece();
    if (piece.geometry) piece.geometry.dispose();
    piece.removeFromParent();
  }
}

export default GameRenderer;

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
