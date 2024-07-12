// Here we preper rendering the shape by
//    1. assembling the vertices and edges which will later be passed to THREE.BufferGeometry()
//    2. filtering out the edges that are shared by 2 cubes

import * as THREE from "three";
import { Edge } from "./types";

export const parseShapeDefinition = (shapes: string[]) => {
  const pieceOffsets: THREE.Vector3[] = [];

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
          pieceOffsets.push(new THREE.Vector3(i, level, lineNumber));
        }
      }
    }
  }

  // Center pieces around 0,0,0 so that they get rotated around their center
  const maxX = Math.max(...pieceOffsets.map((offset) => offset.x)) + 1;
  const maxY = Math.max(...pieceOffsets.map((offset) => offset.y)) + 1;
  const maxZ = Math.max(...pieceOffsets.map((offset) => offset.z)) + 1;
  for (const offset of pieceOffsets) {
    offset.x -= Math.floor(maxX / 2);
    offset.y -= Math.floor(maxY / 2);
    offset.z -= Math.floor(maxZ / 2);
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
  vertices: THREE.Vector3Tuple[],
  edges: Edge[],
  size: number,
  offsetX: number,
  offsetY: number,
  offsetZ: number
) => {
  const s = size;

  // Define the vertices of the cube
  // prettier-ignore
  const newVectors: THREE.Vector3Tuple[] = [
    [0, 0, 0 ], // 0
    [s, 0, 0 ], // 1
    [s, s, 0 ], // 2
    [0, s, 0 ], // 3
    [0, 0, s ], // 4
    [s, 0, s ], // 5
    [s, s, s ], // 6
    [0, s, s ], // 7
  ];

  // Apply offsets
  for (const vector of newVectors) {
    vector[0] += offsetX * size;
    vector[1] += offsetY * size;
    vector[2] += offsetZ * size;
  }

  // Define the edges for the 12 triangles that make up the cube
  const n = vertices.length;
  // prettier-ignore
  const newEdges: Edge[] = [
    [n+0,n+1], [n+3,n+0], [n+2,n+1], [n+2,n+3], // Top face
    [n+4,n+5], [n+5,n+6], [n+6,n+7], [n+7,n+4], // Bottom face
    [n+0,n+4], [n+1,n+5], [n+2,n+6], [n+3,n+7]  // Sides
  ]

  edges.push(...newEdges);
  vertices.push(...newVectors);
};

const getKeyForVector = (vector: THREE.Vector3Tuple) =>
  `${vector[0]} | ${vector[1]} | ${vector[2]}`;

const getKeyForEdge = (s: [number, number]) => `${s[0]}|${s[1]}`;

type TouchedCubeCount = Record<
  string,
  { count: number; edges: [number, number][] }
>;

export const filterEdges = (vertices: THREE.Vector3Tuple[], edges: Edge[]) => {
  // To detect duplicate edges we need to derive the actual coordinates of both vertices for each edge. We use
  // these stringified coordinates to group and count the edges.
  const touchedCubeCount: TouchedCubeCount = {};
  for (const edge of edges) {
    // Sorting is necessary to make sure we get a stable key, independent of the order in which the vertices are indexed
    const coordinatesSorted = [
      getKeyForVector(vertices[edge[0]]),
      getKeyForVector(vertices[edge[1]]),
    ].sort();

    const coordinatesStr = `${coordinatesSorted[0]} || ${coordinatesSorted[1]}`;
    if (!(coordinatesStr in touchedCubeCount)) {
      touchedCubeCount[coordinatesStr] = { count: 0, edges: [] };
    }
    touchedCubeCount[coordinatesStr].count += 1;
    // We need to remember the edges that belong to these coordinates, so we can filter them out later
    touchedCubeCount[coordinatesStr].edges.push([edge[0], edge[1]]);
  }

  const edgesToRemove = Object.values(touchedCubeCount)
    .filter((count) => count.count === 2 || count.count === 4)
    .flatMap((count) => count.edges.map((edge) => getKeyForEdge(edge)));

  const filteredEdges = [];
  for (const edge of edges) {
    const edgeKey = getKeyForEdge(edge);
    if (!edgesToRemove.includes(edgeKey)) {
      filteredEdges.push(edge);
    } else {
      // console.log("filter", getKeyForEdge(edge));
    }
  }

  return filteredEdges;
};
