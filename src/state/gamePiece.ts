import { Vertex } from "../types";

export type Axis = "x" | "y" | "z";
export type Rotation = { x: number; y: number; z: number };

class GamePiece {
  position: Vertex;
  offsets: Vertex[];
  rotation: Rotation;

  constructor(position: Vertex, offsets: Vertex[], rotation: Rotation) {
    this.position = position;
    this.offsets = offsets;
    this.rotation = rotation;
  }

  clone() {
    return new GamePiece(this.position, this.offsets, this.rotation);
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
    this.rotation.x = (this.rotation.x + clockwise * 90) % 360;
  }

  rotateYAxis(clockwise: number) {
    this.offsets = this.offsets.map(([oX, oY, oZ]) => [
      oZ * clockwise,
      oY,
      -oX * clockwise,
    ]);
    this.rotation.y = (this.rotation.y + clockwise * 90) % 360;
  }

  rotateZAxis(clockwise: number) {
    this.offsets = this.offsets.map(([oX, oY, oZ]) => [
      -oY * clockwise,
      oX * clockwise,
      oZ,
    ]);
    this.rotation.z = (this.rotation.z + clockwise * 90) % 360;
  }

  getCubes(): Vertex[] {
    return this.offsets.map((offset) => [
      this.position[0] + offset[0],
      this.position[1] + offset[1],
      this.position[2] + offset[2],
    ]);
  }
}

export default GamePiece;
