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

const setup = (context: Context) => {
  const { state, renderer: gameRenderer, settings } = context;
  const { shaftSizeX, shaftSizeY, shaftSizeZ } = settings;

  camera.position.set(shaftSizeX / 2, shaftSizeY + 2, shaftSizeZ / 2); // position the camera on top of the scene
  // camera.up.set(0, 0, -1); // point the camera towards the bottom of the scene
  camera.lookAt(0, 0, shaftSizeX / 2); // target the center of the scene

  // Adjust the camera's aspect ratio and fov to make the scene appear wider and taller
  // camera.aspect = 1.5;
  camera.fov = 780;
  camera.updateProjectionMatrix();

  // Create a renderer
  renderer.setSize(window.innerWidth - SETTINGS_WIDTH, window.innerHeight);
  document.getElementById("scene")?.appendChild(renderer.domElement);

  gameRenderer.setup();

  renderContainer(scene, settings);
  renderFloorGrid(gameRenderer, settings);
  renderWallGridLongLines(gameRenderer, settings);
  renderWallGridShortLines(gameRenderer, settings);

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

const addPiece = (context: Context, size: number) => {
  const { state, renderer: gameRenderer, settings } = context;
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
  const position: Vertex = [0, settings.shaftSizeY, 0];
  gameRenderer.renderCurrentPiece(vertices, edges, position);
  const newPiece = { offsets: offsets };

  state.setCurrentPiece(newPiece);
  return newPiece;
};
type GameController = {
  stop: () => void;
  togglePause: () => void;
  updateSettings: (s: Settings) => void;
};

const main = (context: Context): GameController => {
  const { state, callbacks, renderer: gameRenderer } = context;
  let { settings } = context;
  scene.clear();
  addPiece(context, 1);

  setup(context);

  let stop = false;
  let pause = false;

  const mainLoop = (tick: number) => {
    if (!pause && tick % settings.fallingSpeed === 0) {
      if (state.willTouchFallenCube() || state.willTouchFloor()) {
        state.addFallenPiece();
        addPiece(context, 1);
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
    updateSettings: (s: Settings) => {
      settings = s;
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
    settings,
  };

  const gameController = useRef<GameController>();

  useEffect(() => {
    const c = main(context);
    gameController.current = c;
    return c.stop;
  }, [settings.shaftSizeX, settings.shaftSizeY, settings.shaftSizeZ]);

  // Some settings can be updated while the game is running.
  useEffect(() => {
    gameController.current!.updateSettings(settings);
  }, [settings.fallingSpeed]);

  return (
    <div style={{ display: "flex", flexDirection: "row" }}>
      <div id="scene"></div>
      <div id="settings" style={{ width: SETTINGS_WIDTH }}>
        <button onClick={() => gameController.current!.togglePause()}>
          Pause
        </button>
        <br />
        Geometries: {rendererInfo.geometries}
        <br />
        currentPiecePosition<pre>{JSON.stringify(currentPiecePosition)}</pre>
        currentPieceOffsets
        {currentPieceOffsets.map((off, i) => (
          <pre key={i}>{JSON.stringify(off)}</pre>
        ))}
        Fallen cubes: {fallenCubes.length}
        <br />
        <br />
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
