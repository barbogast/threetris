import * as THREE from "three";
import GameAnimator from "./rendering/gameAnimator";
import GameRenderer from "./rendering/gameRenderer";
import Scheduler from "./scheduler";
import Camera from "./rendering/camera";
import AsyncFunctionQueue from "./AsyncFunctionQueue";
import GameStateManager from "./gameState";
import GameEvents from "./gameEvents";

export type BlockSet = "flat" | "basic" | "extended";

export type ShaftSettings = {
  shaftSizeX: number;
  shaftSizeY: number;
  shaftSizeZ: number;
};

export type GameSettings = ShaftSettings & {
  fallingSpeed: number;
  animationDuration: number;
  paused: boolean;
  blockSet: BlockSet;
};

export type CameraSettings = {
  aspect: number;
  fov: number;
  zoom: number;
  sceneScaleY: number;
  positionX: number;
  positionY: number;
  positionZ: number;
  lookAtX: number;
  lookAtY: number;
  lookAtZ: number;
  enableOrbitalControl: boolean;
};

export type Settings = GameSettings & CameraSettings;

export type AppState = {
  settings: Settings;
};

export type Edge = [number, number];
export type Axis = "x" | "y" | "z";
export type Direction = 1 | -1;

export type Context = {
  scene: THREE.Scene;
  gameEvents: GameEvents;
  gameState: GameStateManager;
  renderer: GameRenderer;
  animator: GameAnimator;
  camera: Camera;
  settings: Settings;
  eventQueue: AsyncFunctionQueue;
  fallingScheduler: Scheduler;
};

export type GameController = {
  start: (settings: Settings) => void;
  pause: () => void;
  resume: () => void;
  addEventListener: GameEvents["addListener"];
};
