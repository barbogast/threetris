import { CameraSettings, GameSettings, Settings, ShaftSettings } from "./types";

export const ASPECT_RATIO = 1.375;

export const COLORS = [
  "darkblue",
  "green",
  "lightblue",
  "red",
  "pink",
  "orange",
  "white",
  "darkblue",
  "green",
  "lightblue",
  "red",
];

export const getGameDefaults = (): GameSettings => ({
  shaftSizeX: 5,
  shaftSizeY: 12,
  shaftSizeZ: 5,
  fallingSpeed: 15,
  animationDuration: 0.3,
  paused: false,
  blockSet: "flat",
});

export const getCameraDefaults = (settings: ShaftSettings): CameraSettings => ({
  aspect: 1,
  fov: 50,
  zoom: 1,
  sceneScaleY: 1,
  positionX: settings.shaftSizeX / 2,
  positionY: settings.shaftSizeY + 5,
  positionZ: settings.shaftSizeZ / 2,
  lookAtX: settings.shaftSizeX / 2,
  lookAtY: 0,
  lookAtZ: settings.shaftSizeZ / 2,
  enableOrbitalControl: false,
  enableDebugRenderer: false,
});

export const getAllDefaults = (): Settings => {
  const gameDefaults = getGameDefaults();
  const cameraDefaults = getCameraDefaults(gameDefaults);
  return { ...gameDefaults, ...cameraDefaults };
};

export const gameModes: Record<string, Partial<Settings>> = {
  "flat-fun": {
    blockSet: "flat",
    shaftSizeX: 5,
    shaftSizeY: 12,
    shaftSizeZ: 5,
  },
  "3d-mania": {
    blockSet: "basic",
    shaftSizeX: 3,
    shaftSizeY: 10,
    shaftSizeZ: 3,
  },
  "out-of-control": {
    blockSet: "extended",
    shaftSizeX: 5,
    shaftSizeY: 10,
    shaftSizeZ: 5,
  },
  custom: {
    blockSet: "flat",
    shaftSizeX: 5,
    shaftSizeY: 12,
    shaftSizeZ: 5,
  },
};
