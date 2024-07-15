import { CameraSettings, GameSettings, Settings } from "./types";

export const ASPECT_RATIO = 1.375;
export const getGameDefaults = (): GameSettings => ({
  shaftSizeX: 5,
  shaftSizeY: 12,
  shaftSizeZ: 5,
  fallingSpeed: 15,
  animationDuration: 0.3,
  paused: false,
  blockSet: "flat",
});

export const getCameraDefaults = (settings: GameSettings): CameraSettings => ({
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
