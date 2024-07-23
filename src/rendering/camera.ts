import * as THREE from "three";

import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { Context, Settings } from "../types";

class Camera {
  #camera?: THREE.PerspectiveCamera;
  #settings?: Settings;

  setup(context: Context) {
    const { settings } = context;
    this.#settings = settings;
    this.#camera = new THREE.PerspectiveCamera(
      this.#settings.fov,
      this.#settings.aspect
    );
    this.#camera.zoom = this.#settings.zoom;

    // position the camera on top of the scene
    this.#camera.position.set(
      this.#settings.positionX,
      this.#settings.positionY,
      this.#settings.positionZ
    );

    // target the center at the bottom of the scene
    this.#camera.lookAt(
      this.#settings.lookAtX,
      this.#settings.lookAtY,
      this.#settings.lookAtZ
    );

    this.#camera.updateProjectionMatrix();
  }

  getCamera() {
    const c = this.#camera;
    if (!c) throw new Error("Camera is undefined");
    return c;
  }

  enableOrbitalControl(domElement: HTMLCanvasElement) {
    const controls = new OrbitControls(this.#camera!, domElement);
    controls.maxPolarAngle = (0.9 * Math.PI) / 2;
    controls.enableZoom = true;
    controls.target = new THREE.Vector3(
      this.#settings!.shaftSizeX / 2,
      1,
      this.#settings!.shaftSizeZ / 2
    );
  }

  updateAspect(aspect: number) {
    this.#camera!.aspect = aspect;
    this.#camera!.updateProjectionMatrix();
  }

  updateFov(fov: number) {
    this.#camera!.fov = fov;
    this.#camera!.updateProjectionMatrix();
  }

  updatePosition(position: THREE.Vector3) {
    this.#camera!.position.copy(position);
  }

  updateLookAt(lookAt: THREE.Vector3) {
    this.#camera!.lookAt(lookAt.x, lookAt.y, lookAt.z);
  }

  updateZoom(zoom: number) {
    this.#camera!.zoom = zoom;
    this.#camera!.updateProjectionMatrix();
  }
}

export default Camera;
