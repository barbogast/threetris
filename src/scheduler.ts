import * as THREE from "three";

class Scheduler {
  #clock: THREE.Clock;
  #interval: number;
  #callback: () => any;
  #stopped: boolean;
  #elapsed: number;

  constructor(interval: number, callback: () => any) {
    this.#clock = new THREE.Clock();
    this.#interval = interval;
    this.#callback = callback;
    this.#stopped = false;
    this.#elapsed = 0;
  }

  updateInterval(interval: number) {
    this.#interval = interval;
  }

  start() {
    this.#stopped = false;
    this.#elapsed = 0;
    this.#clock.getDelta();
  }

  stop() {
    this.#stopped = true;
  }

  tick() {
    if (this.#stopped) return;

    this.#elapsed += this.#clock.getDelta();

    if (this.#elapsed > this.#interval) {
      this.#callback();
      this.#elapsed = 0;
    }
  }
}

export default Scheduler;
