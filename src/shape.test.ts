import { describe, expect, test } from "vitest";
import { filterEdges, getCubeGeometry, parseShapeDefinition } from "./shape";
import { VectorArray, Edge } from "./types";

describe("test parseShapeDefinition()", () => {
  test("parses simple shape correctly", () => {
    const shapes = [
      `
---------
▢
▢▢▢
---------`,
    ];
    expect(parseShapeDefinition(shapes)).toEqual([
      [-1, -1, 0],
      [-1, 0, 0],
      [0, 0, 0],
      [1, 0, 0],
    ]);
  });

  test("parses shape with starting space correctly", () => {
    const shapes = [
      `
---------
 ▢▢
▢▢
---------`,
    ];
    expect(parseShapeDefinition(shapes)).toEqual([
      [0, -1, 0],
      [1, -1, 0],
      [-1, 0, 0],
      [0, 0, 0],
    ]);
  });

  test("parses shape multi-level shape correctly", () => {
    const shapes = [
      `
---------
 ▢▢
▢▢
---------`,
      `
---------
 ▢
 ▢
---------`,
    ];
    expect(parseShapeDefinition(shapes)).toEqual([
      [0, -1, -1],
      [1, -1, -1],
      [-1, 0, -1],
      [0, 0, -1],
      [0, -1, 0],
      [0, 0, 0],
    ]);
  });
});

describe("test getCubeGeometry", () => {
  test("make sure a cube has the right vertices / edges", () => {
    const vertices: VectorArray[] = [];
    const edges: Edge[] = [];
    getCubeGeometry(vertices, edges, 1, 0, 0, 0);

    // prettier-ignore
    const expectedVertices = [
    [0,   0, 0], // 0
    [ 1, 0, 0], // 1
    [ 1,  1, 0], // 2
    [0,  1, 0], // 3
    [0, 0,  1], // 4
    [ 1, 0,  1], // 5
    [ 1,  1,  1], // 6
    [0,  1,  1], // 7
  ];
    // prettier-ignore
    const expectedEdges = [
    [0, 1],   [3, 0],   [2, 1],   [2, 3], // Top face
    [4, 5],   [5, 6],   [6, 7],   [7, 4], // Bottom face
    [0, 4],   [1, 5],   [2, 6],   [3, 7], // Sides
  ];

    expect(vertices).toEqual(expectedVertices);
    expect(edges).toEqual(expectedEdges);
  });

  test("make sure a cub e with an offset has the right vertices / edges", () => {
    const vertices: VectorArray[] = [];
    const edges: Edge[] = [];
    getCubeGeometry(vertices, edges, 1, 1, 2, 3);

    const expectedVertices = [
      [1, 2, 3],
      [2, 2, 3],
      [2, 3, 3],
      [1, 3, 3],
      [1, 2, 4],
      [2, 2, 4],
      [2, 3, 4],
      [1, 3, 4],
    ];
    const expectedEdges = [
      [0, 1],
      [3, 0],
      [2, 1],
      [2, 3],
      [4, 5],
      [5, 6],
      [6, 7],
      [7, 4],
      [0, 4],
      [1, 5],
      [2, 6],
      [3, 7],
    ];
    expect(vertices).toEqual(expectedVertices);
    expect(edges).toEqual(expectedEdges);
  });

  test("make sure a cube with a size has the right vertices / edges", () => {
    const vertices: VectorArray[] = [];
    const edges: Edge[] = [];
    getCubeGeometry(vertices, edges, 0.1, 0, 0, 0);

    const expectedVertices = [
      [0, 0, 0],
      [0.1, 0, 0],
      [0.1, 0.1, 0],
      [0, 0.1, 0],
      [0, 0, 0.1],
      [0.1, 0, 0.1],
      [0.1, 0.1, 0.1],
      [0, 0.1, 0.1],
    ];
    // prettier-ignore
    const expectedEdges = [
    [0, 1],  [3, 0],   [2, 1],   [2, 3], // Top face
    [4, 5],  [5, 6],   [6, 7],   [7, 4], // Bottom face
    [0, 4],  [1, 5],   [2, 6],   [3, 7], // Sides
  ];
    expect(vertices).toEqual(expectedVertices);
    expect(edges).toEqual(expectedEdges);
  });
});

describe("test filterEdges", () => {
  test("make sure actual duplicate edges are filtered correctly", () => {
    const vertices: VectorArray[] = [
      [0, 0, 0],
      [1, 1, 1],
      [2, 2, 2],
      [3, 3, 3],
    ];
    const edges: Edge[] = [
      [0, 1],
      [1, 2], // ducplicate
      [1, 2], // ducplicate
      [1, 3],
    ];

    expect(filterEdges(vertices, edges)).toEqual([
      [0, 1],
      [1, 3],
    ]);
  });

  test("make sure edges pointing to the same vertices are filtered correctly", () => {
    // 2 vertices appear twice as it is shared between 2 shapes
    const vertices: VectorArray[] = [
      // shape 1
      [0, 0, 0], // 0
      [1, 1, 1], // 1
      [2, 2, 2], // 2

      // shape 2
      [1, 1, 1], // 3
      [2, 2, 2], // 4
      [3, 3, 3], // 5
    ];
    const edges: Edge[] = [
      [0, 1],
      [1, 2], // ducplicate
      [3, 4], // ducplicate
      [4, 5],
    ];

    expect(filterEdges(vertices, edges)).toEqual([
      [0, 1],
      [4, 5],
    ]);
  });
});
