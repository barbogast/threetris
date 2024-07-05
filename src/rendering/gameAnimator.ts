import * as THREE from "three";
import { Vertex } from "../types";

class GameAnimator {
  #clock: THREE.Clock;
  #mixer?: THREE.AnimationMixer;
  duration: number;
  #target: THREE.Object3D<THREE.Object3DEventMap> | undefined;
  #eventFinishedCallback?: () => void;

  constructor(animationDuration: number) {
    this.#clock = new THREE.Clock();
    this.duration = animationDuration;
  }

  setTarget(mesh: THREE.Object3D<THREE.Object3DEventMap>) {
    this.#target = mesh;
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

  getRotateTrackEuler(axis: "x" | "y" | "z", direction: number) {
    console.log(`getRotateTrackEuler() .rotation[${axis}]`, direction);
    return new THREE.NumberKeyframeTrack(
      `.rotation[${axis}]`,
      [0, this.duration], // time
      [0, (Math.PI / 2) * direction] // rotation
    );
  }

  getRotateTrackQuaternion(axis: "x" | "y" | "z", direction: number) {
    console.log(`getRotateTrackQuaternion() .rotation[${axis}]`, direction);
    const current = this.#target!.quaternion.clone();

    const from = new THREE.Quaternion();
    const target = current.clone();

    // Rotate along world axis
    const axisVector = new THREE.Vector3(
      axis === "x" ? 1 : 0,
      axis === "y" ? 1 : 0,
      axis === "z" ? 1 : 0
    );
    const offset = new THREE.Quaternion().setFromAxisAngle(
      axisVector,
      (Math.PI / 2) * direction
    );
    target.premultiply(offset);

    // Since we are using AdditiveAnimationBlendMode we need to only add the difference between the current and the target
    // See https://stackoverflow.com/a/22167097
    target.premultiply(current.invert());

    return new THREE.QuaternionKeyframeTrack(
      `.quaternion`,
      [0, this.duration],
      [...from, ...target]
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
