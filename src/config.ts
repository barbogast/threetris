import { CameraSettings, GameSettings, Settings } from "./types";

export const getGameDefaults = (): GameSettings => ({
  shaftSizeX: 4,
  shaftSizeY: 10,
  shaftSizeZ: 4,
  fallingSpeed: 15,
  animationDuration: 0.3,
  paused: false,
});

export const getCameraDefaults = (settings: GameSettings): CameraSettings => ({
  aspect: 0.5,
  fov: 50,
  zoom: 0.7,
  positionX: settings.shaftSizeX / 2,
  positionY: settings.shaftSizeY + 5,
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

export const SETTINGS_WIDTH = 300;
