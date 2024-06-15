import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { Edge, Settings, Vertex } from "./types";
import { StateUpdateCallbacks } from "./types";
import { filterEdges, getCubeGeometry } from "./shape";
import { SETTINGS_WIDTH } from "./config";

type CurrentPiece = THREE.LineSegments<
  THREE.BufferGeometry<THREE.NormalBufferAttributes>,
  THREE.LineBasicMaterial,
  THREE.Object3DEventMap
>;

const SHAFT_LINES_ID = "shaft-lines";
const CURRENT_PIECE_ID = "current-piece";
const FALLEN_CUBES_ID = "fallen-cubes";

class GameRenderer {
  #scene: THREE.Scene;
  #callbacks?: StateUpdateCallbacks;
  #renderer: THREE.WebGLRenderer;
  #camera?: THREE.PerspectiveCamera;

  constructor() {
    this.#scene = new THREE.Scene();
    this.#renderer = new THREE.WebGLRenderer();
  }

  setup(settings: Settings, callbacks: StateUpdateCallbacks) {
    this.#scene.clear();

    this.#callbacks = callbacks;

    const group1 = new THREE.Group();
    group1.name = SHAFT_LINES_ID;
    this.#scene.add(group1);

    const group2 = new THREE.Group();
    group2.name = FALLEN_CUBES_ID;
    this.#scene.add(group2);

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

  updateCameraPosition(position: Vertex) {
    this.#camera!.position.set(...position);
  }

  updateCameraLookAt(lookAt: Vertex) {
    this.#camera!.lookAt(...lookAt);
  }

  renderShaftCube(dimension: Vertex, position: Vertex) {
    const cubeGeometry = new THREE.BoxGeometry(...dimension);
    const cubeMaterial = new THREE.LineBasicMaterial({ color: "0x00ff00" });
    const edges = new THREE.EdgesGeometry(cubeGeometry);
    const cube = new THREE.LineSegments(edges, cubeMaterial);
    cube.position.set(...position);
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

  renderCurrentPiece(offsets: Vertex[], position: Vertex) {
    const vertices: Vertex[] = [];
    const allEdges: Edge[] = [];
    for (const offset of offsets) {
      getCubeGeometry(vertices, allEdges, 1, offset[0], offset[1], offset[2]);
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
    lines.position.set(...position);
    lines.name = CURRENT_PIECE_ID;
    lines.renderOrder = 1;

    this.#scene.add(lines);
    return lines;
  }

  getCurrentPiece() {
    const currentPiece = this.#scene.getObjectByName(CURRENT_PIECE_ID);
    if (!currentPiece) throw new Error("No current piece");
    return currentPiece as CurrentPiece;
  }

  getCurrentPieceMaybe() {
    return this.#scene.getObjectByName(CURRENT_PIECE_ID) as
      | CurrentPiece
      | undefined;
  }

  removeCurrentPiece() {
    const piece = this.getCurrentPieceMaybe();
    if (piece) {
      if (piece.geometry) piece.geometry.dispose();
      this.#scene.remove(piece);
    }
    this.#callbacks!.currentPiecePosition(undefined);
  }

  setCurrentPiecePosition(position: Vertex) {
    const piece = this.getCurrentPiece();
    piece.position.set(...position);
  }

  renderFallenCubes(cubes: Vertex[]) {
    for (const [x, y, z] of cubes) {
      const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
      const cubeMaterial = new THREE.MeshNormalMaterial();
      const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
      cube.position.set(x + 0.5, y + 0.5, z + 0.5);
      this.#scene.getObjectByName(FALLEN_CUBES_ID)!.add(cube);
    }
  }

  removeFallenCubes() {
    const fallenCubes = this.#scene.getObjectByName(FALLEN_CUBES_ID);
    if (fallenCubes) fallenCubes.clear();
  }
}

export default GameRenderer;
