import * as THREE from "three";
import { Vertex } from "../types";

class GameAnimator {
  #clock: THREE.Clock;
  #mixer?: THREE.AnimationMixer;
  duration: number;
  #eventFinishedCallback?: () => void;

  constructor(animationDuration: number) {
    this.#clock = new THREE.Clock();
    this.duration = animationDuration;
  }

  setTarget(mesh: THREE.Object3D<THREE.Object3DEventMap>) {
    this.#mixer = new THREE.AnimationMixer(mesh);
    this.#mixer.addEventListener("finished", () => {
      if (this.#eventFinishedCallback) {
        this.#eventFinishedCallback();
        this.#eventFinishedCallback = undefined;
      }
    });
  }

  onEventFinished(callback: () => void) {
    this.#eventFinishedCallback = callback;
  }

  getMoveTrack(offset: Vertex) {
    return new THREE.VectorKeyframeTrack(
      ".position",
      [0, this.duration], // time
      [0, 0, 0, ...offset] // position
    );
  }

  getRotateTrack(axis: "x" | "y" | "z", direction: 1 | -1) {
    return new THREE.NumberKeyframeTrack(
      `.rotation[${axis}]`,
      [0, this.duration], // time
      [0, (Math.PI / 2) * direction] // rotation
    );
  }

  playAnimation(track: THREE.KeyframeTrack) {
    const clip = new THREE.AnimationClip("Action", -1, [track]);
    const clipAction = this.#mixer!.clipAction(clip);

    // Run the animation only once
    clipAction.loop = THREE.LoopOnce;

    // Keep the piece at the last frame of the animation, don't reset it back to the beginning of the animation
    clipAction.clampWhenFinished = true;

    // For the move animation the animated values need to be treated as an offset, not an absolute value.
    clipAction.blendMode = THREE.AdditiveAnimationBlendMode;

    // Reset clock so the elapsed time is correct when this.update() is called the first time
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
