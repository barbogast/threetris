import { Vertex } from "../types";

export type Axis = "x" | "y" | "z";
export type Angle = 0 | 90 | 180 | 270;
export type Direction = 1 | -1;
export type Rotation = { x: Angle; y: Angle; z: Angle };
export type AxisMap = { x: Axis; y: Axis; z: Axis };

const rotate = (angle: Angle, clockwise: number): Angle => {
  if (angle === 0 && clockwise === -1) return 270;
  if (angle === 270 && clockwise === 1) return 0;
  return (angle + clockwise * 90) as Angle;
};

class GamePiece {
  position: Vertex;
  offsets: Vertex[];
  rotation: Rotation;
  axisMap: AxisMap;

  constructor(
    position: Vertex,
    offsets: Vertex[],
    rotation: Rotation,
    axisMap: AxisMap
  ) {
    this.position = position;
    this.offsets = offsets;
    this.rotation = rotation;
    this.axisMap = axisMap;
  }

  clone() {
    return new GamePiece(
      this.position,
      this.offsets,
      this.rotation,
      this.axisMap
    );
  }

  #flipAxis(axisA: Axis, axisB: Axis) {
    const temp = this.axisMap[axisA];
    this.axisMap[axisA] = this.axisMap[axisB];
    this.axisMap[axisB] = temp;
  }

  move(offset: Vertex) {
    this.position = [
      this.position[0] + offset[0],
      this.position[1] + offset[1],
      this.position[2] + offset[2],
    ];
  }

  rotateXAxis(clockwise: number) {
    this.offsets = this.offsets.map(([oX, oY, oZ]) => [
      oX,
      -oZ * clockwise,
      oY * clockwise,
    ]);
    this.rotation.x = rotate(this.rotation.x, clockwise);
    this.#flipAxis("y", "z");
  }

  rotateYAxis(clockwise: number) {
    this.offsets = this.offsets.map(([oX, oY, oZ]) => [
      oZ * clockwise,
      oY,
      -oX * clockwise,
    ]);
    this.rotation.y = rotate(this.rotation.y, clockwise);
    this.#flipAxis("x", "z");
  }

  rotateZAxis(clockwise: number) {
    this.offsets = this.offsets.map(([oX, oY, oZ]) => [
      -oY * clockwise,
      oX * clockwise,
      oZ,
    ]);
    this.rotation.z = rotate(this.rotation.z, clockwise);
    this.#flipAxis("x", "y");
  }

  getCubes(): Vertex[] {
    return this.offsets.map((offset) => [
      this.position[0] + offset[0],
      this.position[1] + offset[1],
      this.position[2] + offset[2],
    ]);
  }

  fixPositionAfterRotation(axis: Axis, direction: Direction) {
    const map3: Record<Axis, Record<Direction, Record<Angle, Vertex>>> = {
      x: {
        "1": {
          90: [0, -1, 0],
          180: [0, 0, -1],
          270: [0, -1, 0],
          0: [0, 0, 1],
        },
        "-1": {
          90: [0, 0, 1],
          180: [0, -1, 0],
          270: [0, 0, -1],
          0: [0, 1, 0],
        },
      },
      y: {
        "1": {
          90: [0, 0, -1],
          180: [-1, 0, 0],
          270: [0, 0, 1],
          0: [1, 0, 0],
        },
        "-1": {
          0: [0, 0, 1],
          90: [1, 0, 0],
          180: [0, 0, -1],
          270: [-1, 0, 0],
        },
      },
      z: {
        "1": {
          90: [-1, 0, 0],
          180: [0, -1, 0],
          270: [1, 0, 0],
          0: [0, 1, 0],
        },
        "-1": {
          0: [1, 0, 0],
          90: [0, 1, 0],
          180: [-1, 0, 0],
          270: [0, -1, 0],
        },
      },
    };

    const localAxis = this.axisMap[axis];
    const offset = map3[axis][direction][this.rotation[localAxis]];
    if (offset) {
      this.move(offset);
    }
  }
}

export default GamePiece;
