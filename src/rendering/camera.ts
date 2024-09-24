import * as THREE from "three";

import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { Context, Settings } from "../types";

class Camera {
  #camera?: THREE.PerspectiveCamera;
  #settings?: Settings;
  #cameraPerspectiveHelper?: THREE.CameraHelper;

  setup(context: Context) {
    const { settings, scene } = context;
    this.#settings = settings;
    this.#camera = new THREE.PerspectiveCamera(
      this.#settings.fov,
      this.#settings.aspect
    );
    this.#camera.zoom = this.#settings.zoom;

    const camera = this.#camera;

    // Calculate the y position of the camera so that the shaft fits into the frustum (visible area)
    // The camera is positioned on top of the shaft (settings.shaftSizeY). In
    // addition we might need to move the camera further away from the shaft
    // so that the whole shaft fits into the frustum. The offset is calculated
    // using a funky formula I found on the interwebs...
    // See https://discourse.threejs.org/t/is-it-possible-to-know-at-what-distance-of-the-camera-from-the-cube-the-height-of-the-perspective-projection-of-the-cube-will-be-equal-to-the-height-of-the-screen/40449/6
    // and https://jsfiddle.net/tfoller/yt9vLo6j/
    const box_h = settings.shaftSizeX;
    const box_w = settings.shaftSizeZ;
    const degToRad = Math.PI / 180;
    // Distance for height of shaft
    const d_h = box_h / (2 * Math.tan((degToRad * camera.fov) / 2));
    // Distance for width of shaft
    const d_w =
      box_w / (camera.aspect * 2 * Math.tan((degToRad * camera.fov) / 2));
    const posY = settings.shaftSizeY + Math.max(d_h, d_w);

    // position the camera on top of the scene
    this.#camera.position.set(
      this.#settings.positionX,
      posY + 0.02, // Add a bit of distance so that the shaft border is visible
      this.#settings.positionZ
    );

    // target the center at the bottom of the scene
    this.#camera.lookAt(
      this.#settings.lookAtX,
      this.#settings.lookAtY,
      this.#settings.lookAtZ
    );

    this.#camera.updateProjectionMatrix();

    if (settings.enableDebugRenderer) {
      this.#cameraPerspectiveHelper = new THREE.CameraHelper(this.#camera);
      scene.add(this.#cameraPerspectiveHelper);
    }
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
    this.#cameraPerspectiveHelper?.update();
  }

  updateFov(fov: number) {
    this.#camera!.fov = fov;
    this.#camera!.updateProjectionMatrix();
    this.#cameraPerspectiveHelper?.update();
  }

  updatePosition(position: THREE.Vector3) {
    this.#camera!.position.copy(position);
    this.#cameraPerspectiveHelper?.update();
  }

  updateLookAt(lookAt: THREE.Vector3) {
    this.#camera!.lookAt(lookAt.x, lookAt.y, lookAt.z);
    this.#cameraPerspectiveHelper?.update();
  }

  updateZoom(zoom: number) {
    this.#camera!.zoom = zoom;
    this.#camera!.updateProjectionMatrix();
    this.#cameraPerspectiveHelper?.update();
  }
}

export default Camera;
