import { Settings, Vertex } from "../types";

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
