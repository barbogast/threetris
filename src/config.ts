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
  aspect: 0.8,
  fov: 50,
  zoom: 0.3,
  positionX: settings.shaftSizeX / 2,
  positionY: settings.shaftSizeY + 2.1,
  positionZ: settings.shaftSizeZ / 2,
  lookAtX: settings.shaftSizeX / 2,
  lookAtY: 1,
  lookAtZ: settings.shaftSizeZ / 2,
  enableOrbitalControl: false,
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
};
