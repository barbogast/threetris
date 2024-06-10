import React, { useEffect, useRef } from "react";
import ReactDOM from "react-dom/client";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

import { parseShapeDefinition } from "./shape";
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
import shapeDefinitions from "./shapeDefinitions";

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
  const { renderer: gameRenderer, settings } = context;
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

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.maxPolarAngle = (0.9 * Math.PI) / 2;
  controls.enableZoom = true;
};

const onKeyPress = (context: Context, key: string) => {
  console.log("keyPress", key);
  const { state, renderer: gameRenderer } = context;

  let [posX, posY, posZ] = gameRenderer.getCurrentPiecePosition();

  if (key === "ArrowLeft") {
    posX -= 1;
  }
  if (key === "ArrowUp") {
    posZ -= 1;
  }
  if (key === "ArrowDown") {
    posZ += 1;
  }
  if (key === "ArrowRight") {
    posX += 1;
  }

  if (key === "q") {
    state.rotateCurrentPieceYAxis(-1);
  }
  if (key === "a") {
    state.rotateCurrentPieceYAxis(1);
  }

  if (key === "w") {
    state.rotateCurrentPieceXAxis(-1);
  }
  if (key === "s") {
    state.rotateCurrentPieceXAxis(1);
  }

  if (key === "e") {
    state.rotateCurrentPieceZAxis(-1);
  }
  if (key === "d") {
    state.rotateCurrentPieceZAxis(1);
  }

  if (
    !state.willTouchFallenCube([posX, posY, posZ]) &&
    !state.willBeOutsideOfShaft([posX, posY, posZ])
  ) {
    gameRenderer.setCurrentPiecePosition([posX, posY, posZ]);
  }
};

const addPiece = (context: Context) => {
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

  const pieceOffset = parseShapeDefinition(shapeDefinitions.shape2.shape);

  const position: Vertex = [
    Math.floor(settings.shaftSizeX / 2),
    settings.shaftSizeY,
    Math.floor(settings.shaftSizeZ / 2),
  ];
  gameRenderer.renderCurrentPiece(pieceOffset, position);

  const newPiece = { offsets: pieceOffset };
  state.setCurrentPiece(newPiece);
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
  addPiece(context);

  setup(context);

  const keyPress = (e: KeyboardEvent) => {
    e.preventDefault();
    onKeyPress(context, e.key);
  };
  addEventListener("keydown", keyPress);

  let stop = false;
  let pause = false;

  const mainLoop = (tick: number) => {
    if (!pause && tick % settings.fallingSpeed === 0) {
      const [posX, posY, posZ] = gameRenderer.getCurrentPiecePosition();
      const newPosition: Vertex = [posX, posY - 1, posZ];
      if (state.willTouchFallenCube(newPosition) || state.willTouchFloor()) {
        state.addFallenPiece();
        addPiece(context);
      } else {
        gameRenderer.setCurrentPiecePosition(newPosition);
      }
    }

    const position = gameRenderer.getCurrentPiecePosition();
    gameRenderer.removeCurrentPiece();
    gameRenderer.renderCurrentPiece(state.getCurrentPiece().offsets, position);

    renderer.render(scene, camera);
    callbacks.rendererInfo({ geometries: renderer.info.memory.geometries });

    if (!stop) requestAnimationFrame(() => mainLoop(tick + 1));
  };

  mainLoop(0);

  return {
    stop: () => {
      stop = true;
      removeEventListener("keydown", keyPress);
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
    state: new GameState(settings, gameRenderer, callbacks),
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
