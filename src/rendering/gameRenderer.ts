import * as THREE from "three";

import { StateUpdateCallbacks } from "../types";
import { SETTINGS_WIDTH } from "../config";

class GameRenderer {
  #scene: THREE.Scene;
  #callbacks?: StateUpdateCallbacks;
  #renderer: THREE.WebGLRenderer;

  constructor() {
    this.#scene = new THREE.Scene();
    this.#renderer = new THREE.WebGLRenderer();
  }

  getScene() {
    return this.#scene;
  }

  setup(callbacks: StateUpdateCallbacks) {
    this.#scene.clear();

    this.#callbacks = callbacks;

    this.#renderer.setSize(
      window.innerWidth - SETTINGS_WIDTH,
      window.innerHeight
    );

    document.getElementById("scene")?.appendChild(this.#renderer.domElement);
  }

  getDomElement() {
    return this.#renderer.domElement;
  }

  renderScene(camera: THREE.Camera) {
    this.#renderer.render(this.#scene, camera);
    this.#callbacks!.rendererInfo({
      geometries: this.#renderer.info.memory.geometries,
    });
  }
}

export default GameRenderer;
