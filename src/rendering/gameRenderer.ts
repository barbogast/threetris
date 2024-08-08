import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

import { Context } from "../types";
import { ASPECT_RATIO } from "../config";
import EventManager from "../gameEvents";
import { removeChildElements } from "../utils";

class GameRenderer {
  #renderer: THREE.WebGLRenderer;
  #events?: EventManager;
  #debugRenderer?: THREE.WebGLRenderer;
  #debugCamera?: THREE.PerspectiveCamera;

  constructor() {
    this.#renderer = new THREE.WebGLRenderer();
  }

  setup(context: Context) {
    this.#events = context.gameEvents;

    const el = document.getElementById("scene");

    let height = el!.offsetHeight;
    let width = el!.offsetHeight * ASPECT_RATIO;

    if (width > el!.offsetWidth) {
      width = el!.offsetWidth;
      height = el!.offsetWidth / ASPECT_RATIO;
    }

    el!.appendChild(this.#renderer.domElement);

    this.#renderer.setSize(width, height);

    if (context.settings.enableDebugRenderer) {
      this.#debugRenderer = new THREE.WebGLRenderer();

      const elDebug = document.getElementById("scene-debug")!;
      elDebug.appendChild(this.#debugRenderer.domElement);

      this.#debugRenderer.setSize(500, 500);

      this.#debugCamera = new THREE.PerspectiveCamera(50, 1, 1, 10000);
      this.#debugCamera.position.z = 50;
      this.#debugCamera.position.x = 5;
      this.#debugCamera.position.y = 5;

      const controlshelper = new OrbitControls(this.#debugCamera, elDebug);
      controlshelper.maxPolarAngle = (0.9 * Math.PI) / 2;
      controlshelper.enableZoom = true;
    }
  }

  getDomElement() {
    return this.#renderer.domElement;
  }

  renderScene(context: Context) {
    const { scene, camera, settings } = context;
    this.#renderer.render(scene, camera.getCamera());
    if (settings.enableDebugRenderer) {
      this.#debugRenderer!.render(scene, this.#debugCamera!);
    }
    this.#events!.dispatch("rendererUpdate", {
      geometries: this.#renderer.info.memory.geometries,
    });
  }

  removeDOMElement() {
    removeChildElements(document.getElementById("scene")!);
    removeChildElements(document.getElementById("scene-debug")!);
  }
}

export default GameRenderer;
