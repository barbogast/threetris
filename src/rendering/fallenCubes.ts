import * as THREE from "three";
import { Settings } from "../types";

const FALLEN_CUBES_ID = "fallen-cubes";

const COLORS = [
  "darkblue",
  "green",
  "lightblue",
  "red",
  "pink",
  "organe",
  "white",
  "darkblue",
];

class FallenCubes {
  #scene: THREE.Scene;
  #settings?: Settings;

  constructor(scene: THREE.Scene) {
    this.#scene = scene;
  }

  #getAllLayers() {
    return this.#scene.getObjectByName(FALLEN_CUBES_ID)!.children;
  }

  #getLayer(y: number) {
    const layer = this.#getAllLayers().find((layer) => layer.position.y === y);
    if (!layer) {
      throw new Error(`Layer ${y} not found`);
    }
    return layer;
  }

  #addLayer(y: number) {
    const group = this.#scene.getObjectByName(FALLEN_CUBES_ID)!;
    const layer = new THREE.Object3D();
    layer.position.y = y;
    group.add(layer);
  }

  setup(settings: Settings) {
    this.#settings = settings;
    const group = new THREE.Group();
    group.name = FALLEN_CUBES_ID;
    this.#scene.add(group);
    for (let i = 0; i < settings.shaftSizeY; i++) {
      this.#addLayer(i);
    }
  }

  addPiece(cubes: THREE.Vector3[]) {
    for (const [x, y, z] of cubes) {
      const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
      const cubeMaterial = new THREE.MeshBasicMaterial({ color: COLORS[y] });
      const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);

      var edges = new THREE.EdgesGeometry(cubeGeometry);
      var lineMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
      var wireframe = new THREE.LineSegments(edges, lineMaterial);
      cube.add(wireframe);

      cube.position.set(x + 0.5, 0.5, z + 0.5);
      this.#getLayer(y).add(cube);
    }
  }

  #getCubesOfLayer(y: number) {
    return this.#getLayer(y).children.map((child) => {
      const position = child.position.clone();
      position.subScalar(0.5);
      position.y += y;
      return position;
    });
  }

  pieceCollidesWithFallenCube = (pieceCubes: THREE.Vector3[]) => {
    return pieceCubes.some((pieceCube) => {
      return this.#getCubesOfLayer(pieceCube.y).some(
        (fallenCube) =>
          fallenCube.x === pieceCube.x && fallenCube.z === pieceCube.z
      );
    });
  };

  findFullLevels() {
    const { shaftSizeY, shaftSizeX, shaftSizeZ } = this.#settings!;
    const fullLevels = [];
    for (let y = 0; y < shaftSizeY; y++) {
      if (this.#getLayer(y).children.length === shaftSizeX * shaftSizeZ) {
        fullLevels.push(y);
      }
    }
    return fullLevels;
  }

  removeLevel(y: number) {
    // Remove cubes of this level
    this.#getLayer(y).removeFromParent();

    // Move all layers which are above the removed layer one level down
    this.#getAllLayers().map((layer) => {
      if (layer.position.y > y) {
        layer.position.y = layer.position.y - 1;
        const color = new THREE.Color(COLORS[layer.position.y]);
        layer.children.forEach((child) => {
          // Recalulate the color of each cube
          ((child as THREE.Mesh).material as THREE.MeshBasicMaterial).color =
            color;
        });
      }
    });

    // Add a new layer at the top
    this.#addLayer(this.#settings!.shaftSizeY - 1);
  }
}

export default FallenCubes;
