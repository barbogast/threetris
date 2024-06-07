import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

import { getPieceGeometry } from "./shape";
import SettingsPanel from "./components/SettingsPanel";
import { Settings, Vertex } from "./types";
import useAppStore from "./appStore";
import {
  renderContainer,
  renderFloorGrid,
  renderWallGridLongLines,
  renderWallGridShortLines,
} from "./shaft";

const SETTINGS_WIDTH = 300;
const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer();
const camera = new THREE.PerspectiveCamera(
  50,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

type ThreePiece = THREE.LineSegments<
  THREE.BufferGeometry<THREE.NormalBufferAttributes>,
  THREE.LineBasicMaterial,
  THREE.Object3DEventMap
>;

type CurrentPiece = {
  position: Vertex;
  offsets: Vertex[];
  threeObject: ThreePiece;
};

const setup = (
  currentPiece: CurrentPiece,
  updateCurrentPiece: (CurrentPiece: Partial<CurrentPiece>) => void,
  fieldDepth: number,
  fieldSize: number
) => {
  camera.position.set(fieldSize / 2, fieldDepth + 2, fieldSize / 2); // position the camera on top of the scene
  // camera.up.set(0, 0, -1); // point the camera towards the bottom of the scene
  camera.lookAt(0, 0, fieldSize / 2); // target the center of the scene

  // Adjust the camera's aspect ratio and fov to make the scene appear wider and taller
  // camera.aspect = 1.5;
  camera.fov = 780;
  camera.updateProjectionMatrix();

  // Create a renderer
  renderer.setSize(window.innerWidth - SETTINGS_WIDTH, window.innerHeight);
  document.getElementById("scene")?.appendChild(renderer.domElement);

  renderContainer(scene, fieldSize, fieldDepth);
  renderFloorGrid(scene, fieldSize);
  renderWallGridLongLines(scene, fieldSize, fieldDepth);
  renderWallGridShortLines(scene, fieldSize, fieldDepth);

  addEventListener("keypress", (e) => {
    console.log("event", e.key);
    if (!currentPiece) {
      return;
    }
    // if (e.key === "a") {
    //   rotatePiece(currentPiece, updateCurrentPiece);
    // }
    if (e.key === "a") {
      movePiece(currentPiece, updateCurrentPiece, -1, 0, 0);
    }
    if (e.key === "w") {
      movePiece(currentPiece, updateCurrentPiece, 0, 0, -1);
    }
    if (e.key === "s") {
      movePiece(currentPiece, updateCurrentPiece, 0, 0, 1);
    }
    if (e.key === "d") {
      movePiece(currentPiece, updateCurrentPiece, 1, 0, 0);
    }
  });

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.maxPolarAngle = (0.9 * Math.PI) / 2;
  controls.enableZoom = false;
};

const renderFallenPieces = () => {
  const cubes = [
    [2, 2],
    [4, 4],
  ];

  for (const [x, z] of cubes) {
    const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
    const cubeMaterial = new THREE.MeshNormalMaterial();
    const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
    cube.position.set(x - 0.5, 0 + 0.5, z - 0.5);
    scene.add(cube);
  }
};

const movePiece = (
  currentPiece: CurrentPiece,
  updateCurrentPiece: (CurrentPiece: Partial<CurrentPiece>) => void,
  x: number,
  y: number,
  z: number
) => {
  if (!currentPiece) {
    return;
  }
  currentPiece.threeObject.position.x += x;
  currentPiece.threeObject.position.y += y;
  currentPiece.threeObject.position.z += z;

  updateCurrentPiece({
    position: [
      currentPiece.threeObject.position.x,
      currentPiece.threeObject.position.y,
      currentPiece.threeObject.position.z,
    ],
  });
};

const rotatePiece = (
  currentPiece: CurrentPiece,
  updateCurrentPiece: (CurrentPiece: Partial<CurrentPiece>) => void
) => {
  currentPiece.threeObject.rotateOnAxis(
    new THREE.Vector3(0, 1, 0),
    Math.PI / 4
  );
};

const addPiece = (fieldDepth: number, size: number) => {
  // Tetris pieces are constructed from cubes aligned next to or on top of each other.
  // In addition to aligning the cubes we need to remove mesh-lines between cubes where
  // cubes touch and form a flat continuous surface. Mesh lines between cubes which form
  // a fold remain, hower.
  // To know which edges not to render we look at the amount of cubes touching an edge:

  // If an edge is touched by 2 cubes we assume it's part of a continuous surface, and the edge
  // is not rendered. If an edge is touched by 3 cubes we assume it is a fold and we render
  // it. Edges touched by 4 cubes are skipped however, they are in the middle of a bigger cube.

  const { vertices, edges, offsets } = getPieceGeometry(size);
  console.log("vertices", vertices);
  const geometry = new THREE.BufferGeometry();

  // Add the vertices and edges to the geometry
  geometry.setAttribute(
    "position",
    new THREE.BufferAttribute(new Float32Array(vertices.flat()), 3)
  );
  geometry.setIndex(edges.flat());

  const material = new THREE.LineBasicMaterial({ color: 0x00ff00 });
  const lines = new THREE.LineSegments(geometry, material);
  lines.position.set(0, fieldDepth, 0);

  scene.add(lines);

  return {
    threeObject: lines,
    offsets: offsets,
    position: [0, fieldDepth, 0] as Vertex,
  };
};

const mainLoop = (
  tick: number,
  currentPiece: CurrentPiece,
  updateCurrentPiece: (piece: Partial<CurrentPiece>) => void,
  fieldDepth: number
) => {
  if (tick % 24 === 0) {
    if (currentPiece.threeObject.position.y > 0) {
      currentPiece.threeObject.position.y -= 1;
    } else {
      const newPiece = addPiece(fieldDepth, 1);
      updateCurrentPiece(newPiece);
    }
  }

  renderFallenPieces();
  renderer.render(scene, camera);
  // line.rotateX(0.05);

  tick += 1;
  requestAnimationFrame(() =>
    mainLoop(tick, currentPiece, updateCurrentPiece, fieldDepth)
  );
};

const main = (
  settings: Settings,
  setCurrentPiece: (piece: CurrentPiece) => void
) => {
  let currentPiece: CurrentPiece;

  const updateCurrentPiece = (
    data: Partial<{
      threeObject: ThreePiece;
      position: Vertex;
      offsets: Vertex[];
    }>
  ) => {
    Object.assign(currentPiece, data);
    setCurrentPiece(currentPiece);
  };

  scene.remove.apply(scene, scene.children);
  currentPiece = addPiece(settings.fieldDepth, 1);
  updateCurrentPiece(currentPiece);
  setup(
    currentPiece,
    updateCurrentPiece,
    settings.fieldDepth,
    settings.fieldSize
  );
  mainLoop(0, currentPiece, updateCurrentPiece, settings.fieldDepth);
};

const App = () => {
  const [currentPiece, setCurrentPiece] = React.useState<CurrentPiece>();
  const settings = useAppStore().settings;

  useEffect(() => {
    main(settings, (piece) => {
      setCurrentPiece({ ...piece });
    });
  }, [settings.fieldDepth, settings.fieldSize]);

  return (
    <div style={{ display: "flex", flexDirection: "row" }}>
      <div id="scene"></div>
      <div id="settings" style={{ width: SETTINGS_WIDTH }}>
        <pre>{JSON.stringify(currentPiece?.position)}</pre>
        {currentPiece?.offsets.map((off, i) => (
          <pre key={i}>{JSON.stringify(off)}</pre>
        ))}
        <SettingsPanel camera={camera} />
      </div>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById("app")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
