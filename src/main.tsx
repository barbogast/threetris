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

import GameState, { CurrentPiece, StateUpdateCallbacks } from "./gameState";
import { setupGroups } from "./render";

const SETTINGS_WIDTH = 300;
const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer();
const camera = new THREE.PerspectiveCamera(
  50,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

const setup = (state: GameState, fieldDepth: number, fieldSize: number) => {
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

  setupGroups(scene);

  renderContainer(scene, fieldSize, fieldDepth);
  renderFloorGrid(scene, fieldSize);
  renderWallGridLongLines(scene, fieldSize, fieldDepth);
  renderWallGridShortLines(scene, fieldSize, fieldDepth);

  addEventListener("keypress", (e) => {
    console.log("event", e.key);

    // if (e.key === "a") {
    //   rotatePiece(currentPiece, updateCurrentPiece);
    // }
    if (e.key === "a") {
      state.moveCurrentPiece([-1, 0, 0]);
    }
    if (e.key === "w") {
      state.moveCurrentPiece([0, 0, -1]);
    }
    if (e.key === "s") {
      state.moveCurrentPiece([0, 0, 1]);
    }
    if (e.key === "d") {
      state.moveCurrentPiece([1, 0, 0]);
    }
  });

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.maxPolarAngle = (0.9 * Math.PI) / 2;
  controls.enableZoom = true;
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

const addPiece = (state: GameState, fieldDepth: number, size: number) => {
  state.removeCurrentPiece(scene);

  // Tetris pieces are constructed from cubes aligned next to or on top of each other.
  // In addition to aligning the cubes we need to remove mesh-lines between cubes where
  // cubes touch and form a flat continuous surface. Mesh lines between cubes which form
  // a fold remain, hower.
  // To know which edges not to render we look at the amount of cubes touching an edge:

  // If an edge is touched by 2 cubes we assume it's part of a continuous surface, and the edge
  // is not rendered. If an edge is touched by 3 cubes we assume it is a fold and we render
  // it. Edges touched by 4 cubes are skipped however, they are in the middle of a bigger cube.

  const { vertices, edges, offsets } = getPieceGeometry(size);
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

  const newPiece = {
    threeObject: lines,
    offsets: offsets,
    position: [0, fieldDepth, 0] as Vertex,
    threeGeometry: geometry,
  };
  state.setCurrentPiece(newPiece);
  return newPiece;
};

const mainLoop = (
  state: GameState,
  callbacks: StateUpdateCallbacks,
  tick: number,
  fieldDepth: number,
  fallingSpeed: number
) => {
  if (tick % fallingSpeed === 0) {
    if (state.willTouchFallenCube() || state.willTouchFloor()) {
      state.addFallenPiece(scene);
      addPiece(state, fieldDepth, 1);
    } else {
      state.moveCurrentPiece([0, -1, 0]);
    }
  }

  renderer.render(scene, camera);
  callbacks.rendererInfo({ geometries: renderer.info.memory.geometries });

  tick += 1;
  requestAnimationFrame(() =>
    mainLoop(state, callbacks, tick, fieldDepth, fallingSpeed)
  );
};

const main = (settings: Settings, callbacks: StateUpdateCallbacks) => {
  scene.clear();
  const state = new GameState(callbacks);
  addPiece(state, settings.fieldDepth, 1);

  setup(state, settings.fieldDepth, settings.fieldSize);
  mainLoop(state, callbacks, 0, settings.fieldDepth, settings.fallingSpeed);
};

const App = () => {
  const [currentPiece, setCurrentPiece] = React.useState<CurrentPiece>();
  const [fallenCubes, setFallenCubes] = React.useState<
    [number, number, number][]
  >([]);
  const [rendererInfo, setRendererInfo] = React.useState<{
    geometries: number;
  }>({ geometries: 0 });
  const settings = useAppStore().settings;

  const callbacks = {
    currentPiece: setCurrentPiece,
    fallenCubes: setFallenCubes,
    rendererInfo: setRendererInfo,
  };

  useEffect(() => {
    main(settings, callbacks);
  }, [settings.fieldDepth, settings.fieldSize, settings.fallingSpeed]);

  return (
    <div style={{ display: "flex", flexDirection: "row" }}>
      <div id="scene"></div>
      <div id="settings" style={{ width: SETTINGS_WIDTH }}>
        Geometries: {rendererInfo.geometries}
        <br />
        <pre>{JSON.stringify(currentPiece?.threeObject.position)}</pre>
        {currentPiece?.offsets.map((off, i) => (
          <pre key={i}>{JSON.stringify(off)}</pre>
        ))}
        <br />
        Fallen cubes: {fallenCubes.length}
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
