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

  getMoveTrack(offset: Vertex) {
    return new THREE.VectorKeyframeTrack(
      ".position",
      [0, 0.3], // time
      [0, 0, 0, ...offset] // position
    );
  }

  getRotateTrack(axis: "x" | "y" | "z", direction: 1 | -1) {
    return new THREE.NumberKeyframeTrack(
      `.rotation[${axis}]`,
      [0, 0.3], // time
      [0, (Math.PI / 2) * direction] // rotation
    );
  }

  playAnimation(track: THREE.KeyframeTrack) {
    const clip = new THREE.AnimationClip("Action", -1, [track]);
    const clipAction = this.#mixer!.clipAction(clip);
    clipAction.loop = THREE.LoopOnce;
    clipAction.clampWhenFinished = true;
    clipAction.blendMode = THREE.AdditiveAnimationBlendMode;
    this.#clock.getDelta(); // Reset clock so the elapsed time calculation is correct
    clipAction.play();
  }

  update() {
    if (this.#mixer) {
      this.#mixer.update(this.#clock.getDelta());
    }
  }
}

export default GameAnimator;
