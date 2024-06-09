import React, { useEffect, useRef } from "react";
import ReactDOM from "react-dom/client";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

import { getPieceGeometry } from "./shape";
import SettingsPanel from "./components/SettingsPanel";
import { Context, Settings, Vertex } from "./types";
import useAppStore from "./appStore";
import {
  renderContainer,
  renderFloorGrid,
  renderWallGridLongLines,
  renderWallGridShortLines,
} from "./shaft";

import GameState, { CurrentPiece } from "./gameState";
import GameRenderer from "./gameRenderer";

const SETTINGS_WIDTH = 300;
const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer();
const camera = new THREE.PerspectiveCamera(
  50,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

const setup = (context: Context, fieldDepth: number, fieldSize: number) => {
  const { state, renderer: gameRenderer } = context;
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

  gameRenderer.setup();

  renderContainer(scene, fieldSize, fieldDepth);
  renderFloorGrid(gameRenderer, fieldSize);
  renderWallGridLongLines(gameRenderer, fieldSize, fieldDepth);
  renderWallGridShortLines(gameRenderer, fieldSize, fieldDepth);

  addEventListener("keypress", (e) => {
    console.log("event", e.key);

    // if (e.key === "a") {
    //   rotatePiece(currentPiece, updateCurrentPiece);
    // }
    if (e.key === "a") {
      gameRenderer.moveCurrentPiece([-1, 0, 0]);
    }
    if (e.key === "w") {
      gameRenderer.moveCurrentPiece([0, 0, -1]);
    }
    if (e.key === "s") {
      gameRenderer.moveCurrentPiece([0, 0, 1]);
    }
    if (e.key === "d") {
      gameRenderer.moveCurrentPiece([1, 0, 0]);
    }
    if (e.key === "q") {
      state.rotateCurrentPieceXAxis();
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
  // currentPiece.threeObject.rotateOnAxis(
  //   new THREE.Vector3(0, 1, 0),
  //   Math.PI / 4
  // );
};

const addPiece = (context: Context, fieldDepth: number, size: number) => {
  const { state, renderer: gameRenderer } = context;
  state.removeCurrentPiece();
  gameRenderer.removeCurrentPiece();

  // Tetris pieces are constructed from cubes aligned next to or on top of each other.
  // In addition to aligning the cubes we need to remove mesh-lines between cubes where
  // cubes touch and form a flat continuous surface. Mesh lines between cubes which form
  // a fold remain, hower.
  // To know which edges not to render we look at the amount of cubes touching an edge:

  // If an edge is touched by 2 cubes we assume it's part of a continuous surface, and the edge
  // is not rendered. If an edge is touched by 3 cubes we assume it is a fold and we render
  // it. Edges touched by 4 cubes are skipped however, they are in the middle of a bigger cube.

  const { vertices, edges, offsets } = getPieceGeometry(size);
  gameRenderer.renderCurrentPiece(vertices, edges, [
    0,
    fieldDepth,
    0,
  ] as Vertex);
  const newPiece = { offsets: offsets };

  state.setCurrentPiece(newPiece);
  return newPiece;
};
type GameController = {
  stop: () => void;
  togglePause: () => void;
};

const main = (context: Context, settings: Settings): GameController => {
  scene.clear();
  addPiece(context, settings.fieldDepth, 1);

  setup(context, settings.fieldDepth, settings.fieldSize);

  let stop = false;
  let pause = false;

  const mainLoop = (tick: number) => {
    const { state, callbacks, renderer: gameRenderer } = context;
    if (!pause && tick % settings.fallingSpeed === 0) {
      if (state.willTouchFallenCube() || state.willTouchFloor()) {
        state.addFallenPiece();
        addPiece(context, settings.fieldDepth, 1);
      } else {
        gameRenderer.moveCurrentPiece([0, -1, 0]);
      }
    }

    renderer.render(scene, camera);
    callbacks.rendererInfo({ geometries: renderer.info.memory.geometries });

    if (!stop) requestAnimationFrame(() => mainLoop(tick + 1));
  };

  mainLoop(0);

  return {
    stop: () => {
      stop = true;
    },
    togglePause: () => {
      pause = !pause;
    },
  };
};

const App = () => {
  const [currentPieceOffsets, setCurrentPieceOffsets] = React.useState<
    Vertex[]
  >([]);
  const [currentPiecePosition, setCurrentPiecePosition] =
    React.useState<Vertex>();
  const [fallenCubes, setFallenCubes] = React.useState<
    [number, number, number][]
  >([]);
  const [rendererInfo, setRendererInfo] = React.useState<{
    geometries: number;
  }>({ geometries: 0 });
  const settings = useAppStore().settings;

  const callbacks = {
    currentPiecePosition: setCurrentPiecePosition,
    currentPieceOffsets: setCurrentPieceOffsets,
    fallenCubes: setFallenCubes,
    rendererInfo: setRendererInfo,
  };

  const gameRenderer = new GameRenderer(scene, callbacks);
  const context: Context = {
    state: new GameState(gameRenderer, callbacks),
    callbacks: callbacks,
    renderer: gameRenderer,
  };

  const gameController = useRef<GameController>();

  useEffect(() => {
    const c = main(context, settings);
    gameController.current = c;
    return c.stop;
  }, [settings.fieldDepth, settings.fieldSize, settings.fallingSpeed]);

  return (
    <div style={{ display: "flex", flexDirection: "row" }}>
      <div id="scene"></div>
      <div id="settings" style={{ width: SETTINGS_WIDTH }}>
        <button onClick={() => gameController.current!.togglePause()}>
          Pause
        </button>
        Geometries: {rendererInfo.geometries}
        <br />
        <pre>{JSON.stringify(currentPiecePosition)}</pre>
        {currentPieceOffsets.map((off, i) => (
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
