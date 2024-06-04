// Here we preper rendering the shape by
//    1. assembling the vertices and edges which will later be passed to THREE.BufferGeometry()
//    2. filtering out the edges that are shared by 2 cubes

// First we generate vertices and edges for all cubes. Important: The edges-array contains not coordinates
// but indices into the vertices array. Because ... three.js likes it this way?
// When cubes touch this will result in the touching vertices appearing multiple times in the verices-array.
// Note however, that the entries in the edges-array that describe the duplicate edges will not be the same,
// as they point to different coordinates in the vertices-array: The first edge will reference the vertex of
// the first cube, the second edge the vertex of the second cube, and so on.

export const getCubeGeometry = (
  vertices: number[],
  edges: number[],
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
  const newVertices = [
      -s+oX, -s+oY, -s+oZ, // 0
       s+oX, -s+oY, -s+oZ, // 1
       s+oX,  s+oY, -s+oZ, // 2
      -s+oX,  s+oY, -s+oZ, // 3
      -s+oX, -s+oY,  s+oZ, // 4
       s+oX, -s+oY,  s+oZ, // 5
       s+oX,  s+oY,  s+oZ, // 6
      -s+oX,  s+oY,  s+oZ  // 7
    ];

  // Define the edges for the 12 triangles that make up the cube
  const n = vertices.length / 3;
  console.log("n", n);
  // prettier-ignore
  edges.push(...[
      n+0,n+1,  n+3,n+0,  n+2,n+1,  n+2,n+3, // Top face
      n+4,n+5,  n+5,n+6,  n+6,n+7,  n+7,n+4, // Bottom face
      n+0,n+4,  n+1,n+5,  n+2,n+6,  n+3,n+7  // Sides
    ]);

  vertices.push(...newVertices);
};

const getKeyForVertex = (vertices: number[], index: number) =>
  `${vertices[index * 3]} | ${vertices[index * 3 + 1]} | ${
    vertices[index * 3 + 2]
  }`;

const getKeyForEdge = (s: [number, number]) => `${s[0]}|${s[1]}`;

type TouchedCubeCount = Record<
  string,
  { count: number; edges: [number, number][] }
>;

export const filterEdges = (vertices: number[], edges: number[]) => {
  // To detect duplicate edges we need to derive the actual coordinates of both vertices for each edge. We use
  // these stringified coordinates to group and count the edges.
  const touchedCubeCount: TouchedCubeCount = {};
  for (let i = 0; i < edges.length; i += 2) {
    // Sorting is necessary to make sure we get a stable key, independent of the order in which the vertices are indexed
    const coordinatesSorted = [
      getKeyForVertex(vertices, edges[i]),
      getKeyForVertex(vertices, edges[i + 1]),
    ].sort();

    const coordinatesStr = `${coordinatesSorted[0]} || ${coordinatesSorted[1]}`;
    if (!(coordinatesStr in touchedCubeCount)) {
      touchedCubeCount[coordinatesStr] = { count: 0, edges: [] };
    }
    touchedCubeCount[coordinatesStr].count += 1;
    // We need to remember the edges that belong to these coordinates, so we can filter them out later
    touchedCubeCount[coordinatesStr].edges.push([edges[i], edges[i + 1]]);
  }

  console.log(vertices);
  console.log(edges);
  console.log(touchedCubeCount);

  const edgesToRemove = Object.values(touchedCubeCount)
    .filter((count) => count.count === 2 || count.count === 4)
    .flatMap((count) => count.edges.map((edge) => getKeyForEdge(edge)));

  const filteredEdges = [];
  for (let i = 0; i < edges.length; i += 2) {
    const edgeKey = getKeyForEdge([edges[i], edges[i + 1]]);
    if (!edgesToRemove.includes(edgeKey)) {
      filteredEdges.push(edges[i]);
      filteredEdges.push(edges[i + 1]);
    } else {
      console.log("filter", getKeyForEdge([edges[i], edges[i + 1]]));
    }
  }

  return filteredEdges;
};
