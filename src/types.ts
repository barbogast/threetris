import GameAnimator from "./gameAnimator";
import GameRenderer from "./gameRenderer";
import GameState from "./gameState";

export type GameSettings = {
  shaftSizeX: number;
  shaftSizeY: number;
  shaftSizeZ: number;
  fallingSpeed: number;
  animationDuration: number;
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

export type StateUpdateCallbacks = {
  currentPiecePosition: (position: Vertex | undefined) => void;
  currentPieceOffsets: (offsets: Vertex[]) => void;
  fallenCubes: (fallenCubes: [number, number, number][]) => void;
  rendererInfo: (info: { geometries: number }) => void;
};

export type Context = {
  state: GameState;
  callbacks: StateUpdateCallbacks;
  renderer: GameRenderer;
  animator: GameAnimator;
  settings: Settings;
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
  forceRenderCurrentPiece: () => void;
};
