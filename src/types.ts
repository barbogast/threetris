import * as THREE from "three";
import FallenCubes from "./rendering/fallenCubes";
import GameAnimator from "./rendering/gameAnimator";
import GameRenderer from "./rendering/gameRenderer";
import Scheduler from "./scheduler";
import CurrentPiece from "./rendering/currentPiece";
import Camera from "./rendering/camera";

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

export type VectorArray = [number, number, number];
export type Edge = [number, number];
export type Axis = "x" | "y" | "z";
export type Direction = 1 | -1;

export type StateUpdateCallbacks = {
  currentPiece: () => void;
  fallenCubes: (fallenCubes: [number, number, number][]) => void;
  rendererInfo: (info: { geometries: number }) => void;
  removeRow: () => void;
};

export type Context = {
  currentPiece: CurrentPiece;
  callbacks: StateUpdateCallbacks;
  renderer: GameRenderer;
  fallenCubes: FallenCubes;
  animator: GameAnimator;
  camera: Camera;
  settings: Settings;
  schedulers: {
    falling: Scheduler;
  };
};

export type GameController = {
  stop: () => void;
  togglePause: () => void;
  updateSettings: (s: Settings) => void;
  updateCamera: {
    fov: (fov: number) => void;
    position: (position: THREE.Vector3) => void;
    lookAt: (position: THREE.Vector3) => void;
  };
};
