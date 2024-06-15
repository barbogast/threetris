import * as THREE from "three";
import { Vertex } from "./types";

class GameAnimator {
  #clock: THREE.Clock;
  #mixer?: THREE.AnimationMixer;

  constructor() {
    this.#clock = new THREE.Clock();
  }

  setTarget(mesh: THREE.Object3D<THREE.Object3DEventMap>) {
    this.#mixer = new THREE.AnimationMixer(mesh);
  }

  startMoveAnimation(offset: Vertex) {
    const positionKF = new THREE.VectorKeyframeTrack(
      ".position",
      [0, 0.3], // time
      [0, 0, 0, ...offset] // position
    );
    const clip = new THREE.AnimationClip("Action", -1, [positionKF]);
    const clipAction = this.#mixer!.clipAction(clip);
    clipAction.loop = THREE.LoopOnce;
    clipAction.clampWhenFinished = true;
    clipAction.blendMode = THREE.AdditiveAnimationBlendMode;
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
