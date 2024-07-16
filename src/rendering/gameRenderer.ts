import * as THREE from "three";

import { Context, StateUpdateCallbacks } from "../types";
import { ASPECT_RATIO } from "../config";

class GameRenderer {
  #callbacks?: StateUpdateCallbacks;
  #renderer: THREE.WebGLRenderer;

  constructor() {
    this.#renderer = new THREE.WebGLRenderer();
  }

  setup(context: Context) {
    const { callbacks } = context;
    this.#callbacks = callbacks;

    const el = document.getElementById("scene");

    let height = el!.offsetHeight;
    let width = el!.offsetHeight * ASPECT_RATIO;

    if (width > el!.offsetWidth) {
      width = el!.offsetWidth;
      height = el!.offsetWidth / ASPECT_RATIO;
    }

    el!.appendChild(this.#renderer.domElement);

    this.#renderer.setSize(width, height);
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

  removeDOMElement(context: Context) {
    const { gameState } = context;
    const el = document.getElementById("scene");
    const children = el?.children;
    if (children) {
      for (let i = 0; i < children.length; i++) {
        children[i].remove();
      }
    }
    gameState.stop(false);
  }
}

export default GameRenderer;
