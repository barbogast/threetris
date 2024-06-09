import GameRenderer from "./gameRenderer";
import GameState, { StateUpdateCallbacks } from "./gameState";

export type Settings = {
  fieldSize: number;
  fieldDepth: number;
  fallingSpeed: number;
  fov: number;
  positionX: number;
  positionY: number;
  positionZ: number;
  lookAtX: number;
  lookAtY: number;
  lookAtZ: number;
};

export type AppState = {
  settings: Settings;
};

export type Vertex = [number, number, number];
export type PieceOffset = [number, number, number];
export type Edge = [number, number];

export type Context = {
  state: GameState;
  callbacks: StateUpdateCallbacks;
  renderer: GameRenderer;
};
