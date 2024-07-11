import * as THREE from "three";
import { Settings, VectorArray } from "../types";

const SHAFT_LINES_ID = "shaft-lines";

const shaftMaterial = new THREE.LineBasicMaterial({ color: "0x00ff00" });

class Shaft {
  #scene: THREE.Scene;
  #settings: Settings;
  constructor(settings: Settings, scene: THREE.Scene) {
    this.#settings = settings;
    this.#scene = scene;
  }

  setup() {
    const group1 = new THREE.Group();
    group1.name = SHAFT_LINES_ID;
    this.#scene.add(group1);
  }

  #renderShaftCube(dimension: THREE.Vector3, position: THREE.Vector3) {
    const cubeGeometry = new THREE.BoxGeometry(...dimension);
    const edges = new THREE.EdgesGeometry(cubeGeometry);
    const cube = new THREE.LineSegments(edges, shaftMaterial);
    cube.position.copy(position);
    cube.name = "container";
    this.#scene.add(cube);
  }

  #renderShaftLines(name: string, vertices: VectorArray[]) {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(vertices.flat()), 3)
    );

    const lines = new THREE.LineSegments(geometry, shaftMaterial);
    lines.name = name;
    this.#scene.getObjectByName(SHAFT_LINES_ID)!.add(lines);
  }

  renderContainer() {
    const dimensions = new THREE.Vector3(
      this.#settings.shaftSizeX,
      this.#settings.shaftSizeY,
      this.#settings.shaftSizeZ
    );
    const position = new THREE.Vector3(
      this.#settings.shaftSizeX / 2,
      this.#settings.shaftSizeY / 2,
      this.#settings.shaftSizeZ / 2
    );
    this.#renderShaftCube(dimensions, position);
  }

  renderWallGridLongLines() {
    const { shaftSizeX: x, shaftSizeY: y, shaftSizeZ: z } = this.#settings;
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

    this.#renderShaftLines("wall-long-lines", vectors);
  }

  renderWallGridShortLines() {
    const { shaftSizeX: x, shaftSizeY: y, shaftSizeZ: z } = this.#settings;
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

    this.#renderShaftLines("wall-short-lines", vectors);
  }

  renderFloorGrid() {
    const { shaftSizeX: x, shaftSizeZ: z } = this.#settings;
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

    this.#renderShaftLines("floor-lines", vectors);
  }
}

export default Shaft;
