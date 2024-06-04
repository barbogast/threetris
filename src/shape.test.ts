import { describe, expect, test } from "vitest";
import { getCubeGeometry } from "./shape";
import { Vertex, Edge } from "./types";

describe("test getCubeGeometry", () => {
  test("make sure a cube has the right vertices / edges", () => {
    const vertices: Vertex[] = [];
    const edges: Edge[] = [];
    getCubeGeometry(vertices, edges, 1, 0, 0, 0);

    // prettier-ignore
    const expectedVertices = [
    [-1, -1, -1], // 0
    [ 1, -1, -1], // 1
    [ 1,  1, -1], // 2
    [-1,  1, -1], // 3
    [-1, -1,  1], // 4
    [ 1, -1,  1], // 5
    [ 1,  1,  1], // 6
    [-1,  1,  1], // 7
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

  test("make sure a cube with an offset has the right vertices / edges", () => {
    const vertices: Vertex[] = [];
    const edges: Edge[] = [];
    getCubeGeometry(vertices, edges, 1, 1, 2, 3);

    const expectedVertices = [
      [1, 3, 5],
      [3, 3, 5],
      [3, 5, 5],
      [1, 5, 5],
      [1, 3, 7],
      [3, 3, 7],
      [3, 5, 7],
      [1, 5, 7],
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
    const vertices: Vertex[] = [];
    const edges: Edge[] = [];
    getCubeGeometry(vertices, edges, 0.1, 0, 0, 0);

    const expectedVertices = [
      [-0.1, -0.1, -0.1],
      [0.1, -0.1, -0.1],
      [0.1, 0.1, -0.1],
      [-0.1, 0.1, -0.1],
      [-0.1, -0.1, 0.1],
      [0.1, -0.1, 0.1],
      [0.1, 0.1, 0.1],
      [-0.1, 0.1, 0.1],
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
