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

const onKeyPress = (context: Context, key: string) => {
  console.log("keyPress", key);
  const { state, animator } = context;

  let [posX, posY, posZ] = state.getCurrentPiece().position;
  let offsets = state.getCurrentPiece().offsets;
  let animationTrack: THREE.KeyframeTrack | undefined = undefined;

  if (key === " ") {
    let newPosition: Vertex = [posX, posY - 1, posZ];
    let lastValidPosition = newPosition;
    while (
      !state.willTouchFallenCube(newPosition, offsets) &&
      !state.willBeOutsideOfShaft(newPosition, offsets)
    ) {
      lastValidPosition = newPosition;
      newPosition = [newPosition[0], newPosition[1] - 1, newPosition[2]];
    }

    if (lastValidPosition[1] !== posY) {
      animationTrack = animator.getMoveTrack([
        0,
        -(posY - lastValidPosition[1]),
        0,
      ]);
      animator.playAnimation(animationTrack);
      state.setCurrentPiece({ position: lastValidPosition, offsets });
      animator.onEventFinished(() => handlePieceReachedFloor(context));
      return;
    }
  }

  // Moving a piece requires to update the position in the game state and
  // to set up the animation which visually moves the piece by moving the
  // three.js object.
  if (key === "ArrowLeft") {
    animationTrack = animator.getMoveTrack([-1, 0, 0]);
    posX -= 1;
  }
  if (key === "ArrowUp") {
    animationTrack = animator.getMoveTrack([0, 0, -1]);
    posZ -= 1;
  }
  if (key === "ArrowDown") {
    animationTrack = animator.getMoveTrack([0, 0, 1]);
    posZ += 1;
  }
  if (key === "ArrowRight") {
    animationTrack = animator.getMoveTrack([1, 0, 0]);
    posX += 1;
  }

  // Rotating a piece requires to update the offsets in the game state and
  // to set up the animation which visually rotates the piece by rotating the
  // three.js object.
  // Note that offsets in the game state need to be adjusted after the rotation, so that
  // the logical position matches the visual position. Not sure why, somewhow the rotation
  // in the game state and the rotation in the three.js object are not in sync.
  if (key === "q") {
    offsets = rotateXAxis(offsets, 1);
    offsets = offsets.map(([x, y, z]) => [x, y - 1, z]);
    animationTrack = animator.getRotateTrack("x", 1);
  }
  if (key === "a") {
    offsets = rotateXAxis(offsets, -1);
    offsets = offsets.map(([x, y, z]) => [x, y, z - 1]);
    animationTrack = animator.getRotateTrack("x", -1);
  }

  if (key === "w") {
    offsets = rotateZAxis(offsets, -1);
    offsets = offsets.map(([x, y, z]) => [x, y - 1, z]);
    animationTrack = animator.getRotateTrack("z", -1);
  }
  if (key === "s") {
    offsets = rotateZAxis(offsets, 1);
    offsets = offsets.map(([x, y, z]) => [x - 1, y, z]);
    animationTrack = animator.getRotateTrack("z", 1);
  }

  if (key === "e") {
    offsets = rotateYAxis(offsets, -1);
    offsets = offsets.map(([x, y, z]) => [x, y, z - 1]);
    animationTrack = animator.getRotateTrack("y", 1);
  }
  if (key === "d") {
    offsets = rotateYAxis(offsets, 1);
    offsets = offsets.map(([x, y, z]) => [x - 1, y, z]);
    animationTrack = animator.getRotateTrack("y", -1);
  }

  // Check of collision with fallen cubes and shaft walls
  const newPosition: Vertex = [posX, posY, posZ];
  if (
    !state.willTouchFallenCube(newPosition, offsets) &&
    !state.willBeOutsideOfShaft(newPosition, offsets) &&
    animationTrack
  ) {
    state.setCurrentPiece({ position: newPosition, offsets });
    animator.playAnimation(animationTrack);
  }
};

const addPiece = (context: Context) => {
  const { state, renderer: gameRenderer, settings, animator } = context;
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
  const piece = gameRenderer.renderCurrentPiece(pieceOffset, position);
  animator.setTarget(piece);

  const newPiece = { offsets: pieceOffset, position };
  state.setCurrentPiece(newPiece);
};

const letCurrentPieceFallDown = (context: Context) => {
  const { state, animator } = context;
  const {
    offsets,
    position: [posX, posY, posZ],
  } = state.getCurrentPiece();

  const newPosition: Vertex = [posX, posY - 1, posZ];
  if (
    state.willTouchFallenCube(newPosition, offsets) ||
    state.willTouchFloor()
  ) {
    handlePieceReachedFloor(context);
  } else {
    state.setCurrentPiece({ position: newPosition, offsets });
    animator.playAnimation(animator.getMoveTrack([0, -1, 0]));
  }
};

const handlePieceReachedFloor = (context: Context) => {
  const { state, renderer: gameRenderer, settings } = context;

  state.addFallenPiece();
  gameRenderer.renderFallenCubes(state.getFallenCubes());

  addPiece(context);

  let fallenCubes = state.getFallenCubes();
  const fullLevels = findFullLevels(settings, fallenCubes);
  for (const level of fullLevels) {
    fallenCubes = removeLevel(fallenCubes, level);
    gameRenderer.removeFallenCubes();
    gameRenderer.renderFallenCubes(fallenCubes);
  }
  state.setFallenCubes(fallenCubes);
};

const gameRenderer = new GameRenderer();

const main = (
  settings: Settings,
  callbacks: StateUpdateCallbacks
): GameController => {
  const state = new GameState(settings, callbacks);
  const animator = new GameAnimator(settings.animationDuration);
  const context: Context = {
    state,
    callbacks,
    renderer: gameRenderer,
    animator,
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

  const mainLoop = (tick: number) => {
    if (!pause && tick % settings.fallingSpeed === 0) {
      letCurrentPieceFallDown(context);
    }

    animator.update();
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
      animator.duration = settings.animationDuration;
    },
    updateCamera: {
      fov: (...args) => gameRenderer.updateCameraFov(...args),
      position: (...args) => gameRenderer.updateCameraPosition(...args),
      lookAt: (...args) => gameRenderer.updateCameraLookAt(...args),
    },
    forceRenderCurrentPiece: () => {
      const { offsets, position } = state.getCurrentPiece();
      gameRenderer.removeCurrentPiece();
      const piece = gameRenderer.renderCurrentPiece(offsets, position);
      animator.setTarget(piece);
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
  }, [settings.fallingSpeed, settings.animationDuration]);

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
        <br />
        {gameController.current && (
          <button onClick={gameController.current.forceRenderCurrentPiece}>
            Update current piece{" "}
          </button>
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
