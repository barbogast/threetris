export type Settings = {
  fieldSize: number;
  fieldDepth: number;
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
