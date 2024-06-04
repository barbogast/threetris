export type Settings = {
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
