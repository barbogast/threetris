import * as THREE from "three";
import GameAnimator from "./rendering/gameAnimator";
import GameRenderer from "./rendering/gameRenderer";
import Scheduler from "./scheduler";
import Camera from "./rendering/camera";
import AsyncFunctionQueue from "./AsyncFunctionQueue";
import GameStateManager, { GameState, GameStateCallback } from "./gameState";

export type BlockSet = "flat" | "basic" | "extended";

export type GameSettings = {
  shaftSizeX: number;
  shaftSizeY: number;
  shaftSizeZ: number;
  fallingSpeed: number;
  animationDuration: number;
  paused: boolean;
  blockSet: BlockSet;
};

export type CameraSettings = {
  aspect: number;
  fov: number;
  zoom: number;
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

export type StateUpdateCallbacks = {
  currentPiece: () => void;
  fallenCubes: (fallenCubes: [number, number, number][]) => void;
  rendererInfo: (info: { geometries: number }) => void;
  updateGameState: GameStateCallback;
};

export type Context = {
  scene: THREE.Scene;
  callbacks: StateUpdateCallbacks;
  gameState: GameStateManager;
  renderer: GameRenderer;
  animator: GameAnimator;
  camera: Camera;
  settings: Settings;
  eventQueue: AsyncFunctionQueue;
  schedulers: {
    falling: Scheduler;
  };
  onGameOver: () => void;
};

export type GameController = {
  start: () => void;
  stop: (isGameOver: boolean) => void;
  pause: () => void;
  resume: () => void;
  updateSettings: (s: Settings) => void;
  updateCamera: {
    fov: (fov: number) => void;
    position: (position: THREE.Vector3) => void;
    lookAt: (position: THREE.Vector3) => void;
  };
};
