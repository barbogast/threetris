import GameAnimator from "./rendering/gameAnimator";
import GameRenderer from "./rendering/gameRenderer";
import Scheduler from "./scheduler";
import GameState from "./state/gameState";

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

export type Vertex = [number, number, number];
export type PieceOffset = [number, number, number];
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
  state: GameState;
  callbacks: StateUpdateCallbacks;
  renderer: GameRenderer;
  animator: GameAnimator;
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
    position: (position: Vertex) => void;
    lookAt: (position: Vertex) => void;
  };
};
