import * as THREE from "three";

import { Context, StateUpdateCallbacks } from "../types";
import { SETTINGS_WIDTH } from "../config";

class GameRenderer {
  #callbacks?: StateUpdateCallbacks;
  #renderer: THREE.WebGLRenderer;

  constructor() {
    this.#renderer = new THREE.WebGLRenderer();
  }

  setup(context: Context) {
    const { callbacks } = context;
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

  renderScene(context: Context) {
    const { scene, camera } = context;
    this.#renderer.render(scene, camera.getCamera());
    this.#callbacks!.rendererInfo({
      geometries: this.#renderer.info.memory.geometries,
    });
  }
}

export default GameRenderer;
