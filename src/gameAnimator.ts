import * as THREE from "three";

class GameAnimator {
  #clock: THREE.Clock;
  #mixer?: THREE.AnimationMixer;

  constructor() {
    this.#clock = new THREE.Clock();
  }

  startAnimation(mesh: THREE.Object3D<THREE.Object3DEventMap>) {
    const positionKF = new THREE.VectorKeyframeTrack(
      ".position",
      [0, 0.2],
      [
        mesh.position.x,
        mesh.position.y,
        mesh.position.z,
        mesh.position.x,
        mesh.position.y,
        mesh.position.z + 1,
      ]
    );
    const clip = new THREE.AnimationClip("Action", -1, [positionKF]);
    this.#mixer = new THREE.AnimationMixer(mesh);
    const clipAction = this.#mixer.clipAction(clip);
    clipAction.loop = THREE.LoopOnce;
    clipAction.clampWhenFinished = true;
    clipAction.play();
  }

  update() {
    if (this.#mixer) {
      this.#mixer.update(this.#clock.getDelta());
    }
  }
}

export default GameAnimator;
