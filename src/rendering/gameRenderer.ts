import * as THREE from "three";

import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { Settings } from "../types";
import { StateUpdateCallbacks } from "../types";
import { SETTINGS_WIDTH } from "../config";

class GameRenderer {
  #scene: THREE.Scene;
  #callbacks?: StateUpdateCallbacks;
  #renderer: THREE.WebGLRenderer;
  #camera?: THREE.PerspectiveCamera;

  constructor() {
    this.#scene = new THREE.Scene();
    this.#renderer = new THREE.WebGLRenderer();
  }

  getScene() {
    return this.#scene;
  }

  setup(settings: Settings, callbacks: StateUpdateCallbacks) {
    this.#scene.clear();

    this.#callbacks = callbacks;

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
}

export default GameRenderer;
