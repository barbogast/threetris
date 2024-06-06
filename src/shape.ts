// Here we preper rendering the shape by
//    1. assembling the vertices and edges which will later be passed to THREE.BufferGeometry()
//    2. filtering out the edges that are shared by 2 cubes

import { Edge, PieceOffset, Vertex } from "./types";
import shapeDefinitions from "./shapeDefinitions";

export const parseShapeDefinition = (shapes: string[]) => {
  const pieceOffsets: PieceOffset[] = [];

  for (const [level, shape] of shapes.entries()) {
    // Remove leading and trailing newlines. Note that we cannot use trim() here, as it would also trailing spaces
    // const trimmed = shape.replace(/^[\n]?|[\n]?$/g, "");

    const trimmed = shape
      .trim()
      .replace(/---------\n/, "")
      .replace(/\n---------/, "");

    for (const [lineNumber, line] of trimmed.split("\n").entries()) {
      for (let i = 0; i < line.length; i++) {
        if (line[i] === "▢") {
          pieceOffsets.push([i, lineNumber, level]);
        }
      }
    }
  }

  return pieceOffsets;
};

// First we generate vertices and edges for all cubes. Important: The edges-array contains not coordinates
// but indices into the vertices array. Because ... three.js likes it this way?
// When cubes touch this will result in the touching vertices appearing multiple times in the verices-array.
// Note however, that the entries in the edges-array that describe the duplicate edges will not be the same,
// as they point to different coordinates in the vertices-array: The first edge will reference the vertex of
// the first cube, the second edge the vertex of the second cube, and so on.

export const getCubeGeometry = (
  vertices: Vertex[],
  edges: Edge[],
  size: number,
  offsetX: number,
  offsetY: number,
  offsetZ: number
) => {
  const s = size;
  const oX = offsetX * size * 2;
  const oY = offsetY * size * 2;
  const oZ = offsetZ * size * 2;

  // Define the vertices of the cube
  // prettier-ignore
  const newVertices: Vertex[] = [
    [-s + oX, -s + oY, -s + oZ], // 0
    [ s + oX, -s + oY, -s + oZ], // 1
    [ s + oX,  s + oY, -s + oZ], // 2
    [-s + oX,  s + oY, -s + oZ], // 3
    [-s + oX, -s + oY,  s + oZ], // 4
    [ s + oX, -s + oY,  s + oZ], // 5
    [ s + oX,  s + oY,  s + oZ], // 6
    [-s + oX,  s + oY,  s + oZ], // 7
  ];

  // Define the edges for the 12 triangles that make up the cube
  const n = vertices.length;
  // prettier-ignore
  const newEdges: Edge[] = [
    [n+0,n+1], [n+3,n+0], [n+2,n+1], [n+2,n+3], // Top face
    [n+4,n+5], [n+5,n+6], [n+6,n+7], [n+7,n+4], // Bottom face
    [n+0,n+4], [n+1,n+5], [n+2,n+6], [n+3,n+7]  // Sides
  ]
  edges.push(...newEdges);

  vertices.push(...newVertices);
};

const getKeyForVertex = (vertex: Vertex) =>
  `${vertex[0]} | ${vertex[1]} | ${vertex[2]}`;

const getKeyForEdge = (s: [number, number]) => `${s[0]}|${s[1]}`;

type TouchedCubeCount = Record<
  string,
  { count: number; edges: [number, number][] }
>;

export const filterEdges = (vertices: Vertex[], edges: Edge[]) => {
  // To detect duplicate edges we need to derive the actual coordinates of both vertices for each edge. We use
  // these stringified coordinates to group and count the edges.
  const touchedCubeCount: TouchedCubeCount = {};
  for (const edge of edges) {
    // Sorting is necessary to make sure we get a stable key, independent of the order in which the vertices are indexed
    const coordinatesSorted = [
      getKeyForVertex(vertices[edge[0]]),
      getKeyForVertex(vertices[edge[1]]),
    ].sort();

    const coordinatesStr = `${coordinatesSorted[0]} || ${coordinatesSorted[1]}`;
    if (!(coordinatesStr in touchedCubeCount)) {
      touchedCubeCount[coordinatesStr] = { count: 0, edges: [] };
    }
    touchedCubeCount[coordinatesStr].count += 1;
    // We need to remember the edges that belong to these coordinates, so we can filter them out later
    touchedCubeCount[coordinatesStr].edges.push([edge[0], edge[1]]);
  }

  console.log(vertices);
  console.log(edges);
  console.log(touchedCubeCount);

  const edgesToRemove = Object.values(touchedCubeCount)
    .filter((count) => count.count === 2 || count.count === 4)
    .flatMap((count) => count.edges.map((edge) => getKeyForEdge(edge)));

  const filteredEdges = [];
  for (const edge of edges) {
    const edgeKey = getKeyForEdge(edge);
    if (!edgesToRemove.includes(edgeKey)) {
      filteredEdges.push(edge);
    } else {
      console.log("filter", getKeyForEdge(edge));
    }
  }

  return filteredEdges;
};

export const getPieceGeometry = (size: number) => {
  const pieceOffset = parseShapeDefinition(shapeDefinitions.shape1.shape);
  const vertices: Vertex[] = [];
  const allEdges: Edge[] = [];
  for (const offset of pieceOffset) {
    getCubeGeometry(vertices, allEdges, size, offset[0], offset[1], offset[2]);
  }

  const filteredEdges = filterEdges(vertices, allEdges);
  return { vertices, edges: filteredEdges };
};
