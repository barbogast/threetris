import { describe, test, expect } from "vitest";
import { Vertex } from "../types";
import GamePiece from "./gamePiece";

describe("test rotateZAxis", () => {
  test("rotates the piece clockwise correctly", () => {
    const offsets: Vertex[] = [
      [0, -1, 0],
      [-1, 0, 0],
      [0, 0, 0],
      [1, 0, 0],
    ];
    const piece = new GamePiece([0, 0, 0], offsets, { x: 0, y: 0, z: 0 });
    piece.rotateZAxis(1);
    const expectedOffsets = [
      [1, 0, 0],
      [-0, -1, 0],
      [-0, 0, 0],
      [-0, 1, 0],
    ];
    expect(piece.offsets).toEqual(expectedOffsets);
  });

  test("rotates the piece counterclockwise correctly", () => {
    const offsets: Vertex[] = [
      [0, -1, 0],
      [-1, 0, 0],
      [0, 0, 0],
      [1, 0, 0],
    ];
    const piece = new GamePiece([0, 0, 0], offsets, { x: 0, y: 0, z: 0 });
    piece.rotateZAxis(-1);
    const expectedOffsets = [
      [-1, -0, 0],
      [0, 1, 0],
      [0, -0, 0],
      [0, -1, 0],
    ];
    expect(piece.offsets).toEqual(expectedOffsets);
  });
});
