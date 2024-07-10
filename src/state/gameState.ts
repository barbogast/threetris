import FallenCubes from "./fallenCubes";
import { Settings, Vertex } from "../types";

export const collidesWithFallenCube = (
  pieceCubes: Vertex[],
  fallenCubesObj: FallenCubes
) => {
  const fallenCubes = fallenCubesObj.getCubes();
  return pieceCubes.some((cube) => {
    return fallenCubes.some(
      (fallenCube) =>
        fallenCube[0] === cube[0] &&
        fallenCube[1] === cube[1] &&
        fallenCube[2] === cube[2]
    );
  });
};

export const willBeOutsideOfShaft = (
  pieceCubes: Vertex[],
  settings: Settings
) => {
  const { shaftSizeX, shaftSizeZ } = settings;
  return pieceCubes.some(
    (cube) =>
      cube[0] < 0 ||
      cube[0] >= shaftSizeX ||
      cube[1] < 0 ||
      cube[2] < 0 ||
      cube[2] >= shaftSizeZ
  );
};

export const collidesWithFloor = (pieceCubes: Vertex[]) => {
  return pieceCubes.some((cube) => cube[1] < 0);
};
