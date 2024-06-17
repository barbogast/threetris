import { Vertex } from "./types";

class GamePiece {
  position: Vertex;
  offsets: Vertex[];

  constructor(position: Vertex, offsets: Vertex[]) {
    this.position = position;
    this.offsets = offsets;
  }

  clone() {
    return new GamePiece(this.position, this.offsets);
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
  }

  rotateYAxis(clockwise: number) {
    this.offsets = this.offsets.map(([oX, oY, oZ]) => [
      -oZ * clockwise,
      oY,
      oX * clockwise,
    ]);
  }

  rotateZAxis(clockwise: number) {
    this.offsets = this.offsets.map(([oX, oY, oZ]) => [
      -oY * clockwise,
      oX * clockwise,
      oZ,
    ]);
  }

  getCubesFromOffsets(): Vertex[] {
    return this.offsets.map((offset) => [
      this.position[0] + offset[0],
      this.position[1] + offset[1],
      this.position[2] + offset[2],
    ]);
  }
}

export default GamePiece;
