import * as THREE from "three";
import { Vertex } from "./types";

class GameAnimator {
  #clock: THREE.Clock;
  #mixer?: THREE.AnimationMixer;

  constructor() {
    this.#clock = new THREE.Clock();
  }

  startAnimation(mesh: THREE.Object3D<THREE.Object3DEventMap>, offset: Vertex) {
    const positionKF = new THREE.VectorKeyframeTrack(
      ".position",
      [0, 0.15],
      [
        mesh.position.x,
        mesh.position.y,
        mesh.position.z,
        mesh.position.x + offset[0],
        mesh.position.y + offset[1],
        mesh.position.z + offset[2],
      ]
    );
    const clip = new THREE.AnimationClip("Action", -1, [positionKF]);
    this.#mixer = new THREE.AnimationMixer(mesh);
    const clipAction = this.#mixer.clipAction(clip);
    clipAction.loop = THREE.LoopOnce;
    clipAction.clampWhenFinished = true;
    this.#clock.getDelta();
    clipAction.play();
  }

  update() {
    if (this.#mixer) {
      this.#mixer.update(this.#clock.getDelta());
    }
  }
}

export default GameAnimator;
