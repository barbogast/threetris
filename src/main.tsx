import React, { useEffect, useRef } from "react";
import ReactDOM from "react-dom/client";
import * as THREE from "three";

import { parseShapeDefinition } from "./shape";
import SettingsPanel from "./components/SettingsPanel";
import {
  Context,
  GameController,
  Settings,
  StateUpdateCallbacks,
  Vertex,
} from "./types";
import useAppStore from "./appStore";
import {
  renderContainer,
  renderFloorGrid,
  renderWallGridLongLines,
  renderWallGridShortLines,
} from "./shaft";

import GameState, {
  findFullLevels,
  removeLevel,
  rotateXAxis,
  rotateYAxis,
  rotateZAxis,
} from "./gameState";
import GameRenderer from "./gameRenderer";
import shapeDefinitions from "./shapeDefinitions";
import { SETTINGS_WIDTH } from "./config";

const setup = (context: Context) => {
  const { renderer: gameRenderer, settings, callbacks } = context;

  gameRenderer.setup(settings, callbacks);

  renderContainer(gameRenderer, settings);
  renderFloorGrid(gameRenderer, settings);
  renderWallGridLongLines(gameRenderer, settings);
  renderWallGridShortLines(gameRenderer, settings);
};

let mixer: THREE.AnimationMixer;

const onKeyPress = (context: Context, key: string) => {
  console.log("keyPress", key);
  const { state, renderer: gameRenderer } = context;

  let [posX, posY, posZ] = state.getCurrentPiece().position;
  let offsets = state.getCurrentPiece().offsets;

  if (key === "ArrowLeft") {
    posX -= 1;
  }
  if (key === "ArrowUp") {
    posZ -= 1;
  }
  if (key === "ArrowDown") {
    const piece = context.renderer.getCurrentPiece();
    const positionKF = new THREE.VectorKeyframeTrack(
      ".position",
      [0, 0.2],
      [
        piece.position.x,
        piece.position.y,
        piece.position.z,
        piece.position.x,
        piece.position.y,
        piece.position.z + 1,
      ]
    );
    const clip = new THREE.AnimationClip("Action", -1, [positionKF]);
    mixer = new THREE.AnimationMixer(piece);
    const clipAction = mixer.clipAction(clip);
    clipAction.loop = THREE.LoopOnce;
    clipAction.clampWhenFinished = true;
    clipAction.play();

    posZ += 1;
  }
  if (key === "ArrowRight") {
    posX += 1;
    gameRenderer.startAnimation();
  }

  if (key === "q") {
    offsets = rotateXAxis(offsets, 1);
  }
  if (key === "a") {
    offsets = rotateXAxis(offsets, -1);
  }

  if (key === "w") {
    offsets = rotateZAxis(offsets, -1);
  }
  if (key === "s") {
    offsets = rotateZAxis(offsets, 1);
  }

  if (key === "e") {
    offsets = rotateYAxis(offsets, -1);
  }
  if (key === "d") {
    offsets = rotateYAxis(offsets, 1);
  }

  const newPosition: Vertex = [posX, posY, posZ];
  if (
    !state.willTouchFallenCube(newPosition, offsets) &&
    !state.willBeOutsideOfShaft(newPosition, offsets)
  ) {
    state.setCurrentPiece({ position: newPosition, offsets });
    gameRenderer.setCurrentPiecePosition(newPosition);
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

  const newPiece = { offsets: pieceOffset, position };
  state.setCurrentPiece(newPiece);
};

const gameRenderer = new GameRenderer();

const main = (
  settings: Settings,
  callbacks: StateUpdateCallbacks
): GameController => {
  const state = new GameState(settings, gameRenderer, callbacks);
  const context: Context = {
    state,
    callbacks,
    renderer: gameRenderer,
    settings,
  };

  setup(context);

  addPiece(context);

  const keyPress = (e: KeyboardEvent) => {
    e.preventDefault();
    onKeyPress(context, e.key);
  };
  addEventListener("keydown", keyPress);

  let stop = false;
  let pause = false;
  const clock = new THREE.Clock();

  const mainLoop = (tick: number) => {
    const {
      offsets,
      position: [posX, posY, posZ],
    } = state.getCurrentPiece();
    if (!pause && tick % settings.fallingSpeed === 0) {
      const newPosition: Vertex = [posX, posY - 1, posZ];
      if (
        state.willTouchFallenCube(newPosition, offsets) ||
        state.willTouchFloor()
      ) {
        state.addFallenPiece();
        addPiece(context);

        let fallenCubes = state.getFallenCubes();
        const fullLevels = findFullLevels(settings, fallenCubes);
        for (const level of fullLevels) {
          fallenCubes = removeLevel(fallenCubes, level);
          gameRenderer.removeFallenCubes();
          gameRenderer.renderFallenCubes(fallenCubes);
        }
        state.setFallenCubes(fallenCubes);
      } else {
        gameRenderer.setCurrentPiecePosition(newPosition);
        state.setCurrentPiece({ position: newPosition, offsets });
      }
    }

    const delta = clock.getDelta();
    mixer?.update(delta);

    gameRenderer.removeCurrentPiece();
    gameRenderer.renderCurrentPiece(offsets, [posX, posY, posZ]);

    gameRenderer.renderScene();
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
    updateCamera: {
      fov: (...args) => gameRenderer.updateCameraFov(...args),
      position: (...args) => gameRenderer.updateCameraPosition(...args),
      lookAt: (...args) => gameRenderer.updateCameraLookAt(...args),
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

  const gameController = useRef<GameController>();

  useEffect(() => {
    const controller = main(settings, callbacks);
    gameController.current = controller;
    return controller.stop;
  }, [
    settings.shaftSizeX,
    settings.shaftSizeY,
    settings.shaftSizeZ,
    settings.aspect,
    settings.zoom,
    settings.enableOrbitalControl,
  ]);

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
        {gameController.current && (
          <SettingsPanel gameController={gameController.current} />
        )}
      </div>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById("app")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
