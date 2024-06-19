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
} from "./rendering/shaft";

import GameState, {
  willBeOutsideOfShaft,
  willTouchFallenCube,
  willTouchFloor,
} from "./state/gameState";
import GameRenderer from "./rendering/gameRenderer";
import shapeDefinitions from "./shapeDefinitions";
import { SETTINGS_WIDTH } from "./config";
import GameAnimator from "./rendering/gameAnimator";
import GamePiece from "./state/gamePiece";
import Scheduler from "./scheduler";

const setup = (context: Context) => {
  const { renderer, settings, callbacks } = context;

  renderer.setup(settings, callbacks);

  renderContainer(renderer, settings);
  renderFloorGrid(renderer, settings);
  renderWallGridLongLines(renderer, settings);
  renderWallGridShortLines(renderer, settings);
};

const onKeyPress = (context: Context, key: string) => {
  console.log(`keyPress "${key}"`);
  const { state, animator, settings, schedulers } = context;
  const currentPiece = state.getCurrentPiece();

  if (key === " ") {
    let newPiece = currentPiece.clone();
    let lastValidPiece = newPiece;
    while (
      !willTouchFallenCube(newPiece, state.getFallenCubes()) &&
      !willBeOutsideOfShaft(newPiece, settings)
    ) {
      lastValidPiece = newPiece.clone();
      newPiece.move([0, -1, 0]);
    }

    if (lastValidPiece.position[1] !== currentPiece.position[1]) {
      // Stop falling down during the animation.
      // Otherwise we might end up with 2 pieces at the same time,
      // or have the piece reach the floor during the animation
      // Also, we need to reset the timer so that the new piece gets
      // the full interval before it starts falling down (instead of the
      // remainder of the last interval of the previous piece
      schedulers.falling.stop();

      const animationTrack = animator.getMoveTrack([
        0,
        -(currentPiece.position[1] - lastValidPiece.position[1]),
        0,
      ]);
      animator.playAnimation(animationTrack);
      state.setCurrentPiece(lastValidPiece);
      animator.onEventFinished(() => {
        handlePieceReachedFloor(context);
        schedulers.falling.start();
      });
    }
    return;
  }

  const updatedPiece = currentPiece.clone();
  let animationTrack: THREE.KeyframeTrack | undefined = undefined;

  // Moving a piece requires to update the position in the game state and
  // to set up the animation which visually moves the piece by moving the
  // three.js object.
  if (key === "ArrowLeft") {
    animationTrack = animator.getMoveTrack([-1, 0, 0]);
    updatedPiece.move([-1, 0, 0]);
  }
  if (key === "ArrowUp") {
    animationTrack = animator.getMoveTrack([0, 0, -1]);
    updatedPiece.move([0, 0, -1]);
  }
  if (key === "ArrowDown") {
    animationTrack = animator.getMoveTrack([0, 0, 1]);
    updatedPiece.move([0, 0, 1]);
  }
  if (key === "ArrowRight") {
    animationTrack = animator.getMoveTrack([1, 0, 0]);
    updatedPiece.move([1, 0, 0]);
  }

  // Rotating a piece requires to update the offsets in the game state and
  // to set up the animation which visually rotates the piece by rotating the
  // three.js object.
  // Note that offsets in the game state need to be adjusted after the rotation, so that
  // the logical position matches the visual position. Not sure why, somewhow the rotation
  // in the game state and the rotation in the three.js object are not in sync.
  if (key === "q") {
    updatedPiece.rotateXAxis(1);
    updatedPiece.move([0, -1, 0]);
    animationTrack = animator.getRotateTrack("x", 1);
  }
  if (key === "a") {
    updatedPiece.rotateXAxis(-1);
    updatedPiece.move([0, 0, -1]);
    animationTrack = animator.getRotateTrack("x", -1);
  }

  if (key === "w") {
    updatedPiece.rotateZAxis(-1);
    updatedPiece.move([0, -1, 0]);
    animationTrack = animator.getRotateTrack("z", -1);
  }
  if (key === "s") {
    updatedPiece.rotateZAxis(1);
    updatedPiece.move([-1, 0, 0]);
    animationTrack = animator.getRotateTrack("z", 1);
  }

  if (key === "e") {
    updatedPiece.rotateYAxis(-1);
    updatedPiece.move([0, 0, -1]);
    animationTrack = animator.getRotateTrack("y", 1);
  }
  if (key === "d") {
    updatedPiece.rotateYAxis(1);
    updatedPiece.move([-1, 0, 0]);
    animationTrack = animator.getRotateTrack("y", -1);
  }

  // Check of collision with fallen cubes and shaft walls
  if (
    !willTouchFallenCube(updatedPiece, state.getFallenCubes()) &&
    !willBeOutsideOfShaft(updatedPiece, settings) &&
    animationTrack
  ) {
    state.setCurrentPiece(updatedPiece);
    animator.playAnimation(animationTrack);
  }
};

const addPiece = (context: Context) => {
  const { state, renderer, settings, animator } = context;
  state.removeCurrentPiece();
  renderer.removeCurrentPiece();

  // Tetris pieces are constructed from cubes aligned next to or on top of each other.
  // In addition to aligning the cubes we need to remove mesh-lines between cubes where
  // cubes touch and form a flat continuous surface. Mesh lines between cubes which form
  // a fold remain, hower.
  // To know which edges not to render we look at the amount of cubes touching an edge:

  // If an edge is touched by 2 cubes we assume it's part of a continuous surface, and the edge
  // is not rendered. If an edge is touched by 3 cubes we assume it is a fold and we render
  // it. Edges touched by 4 cubes are skipped however, they are in the middle of a bigger cube.

  const offsets = parseShapeDefinition(shapeDefinitions.shape2.shape);

  const position: Vertex = [
    Math.floor(settings.shaftSizeX / 2),
    settings.shaftSizeY,
    Math.floor(settings.shaftSizeZ / 2),
  ];
  const newPiece = new GamePiece(position, offsets);
  const mesh = renderer.renderCurrentPiece(newPiece);
  animator.setTarget(mesh);

  state.setCurrentPiece(newPiece);
};

const letCurrentPieceFallDown = (context: Context) => {
  const { state, animator } = context;

  const newPiece = state.getCurrentPiece().clone();
  newPiece.move([0, -1, 0]);
  if (
    willTouchFallenCube(newPiece, state.getFallenCubes()) ||
    willTouchFloor(state.getCurrentPiece())
  ) {
    handlePieceReachedFloor(context);
  } else {
    state.setCurrentPiece(newPiece);
    animator.playAnimation(animator.getMoveTrack([0, -1, 0]));
  }
};

const handlePieceReachedFloor = (context: Context) => {
  const { state, renderer: gameRenderer, settings } = context;

  const piece = state.getCurrentPiece();
  const cubes = piece.getCubes();
  state.getFallenCubes().addCubes(cubes);
  gameRenderer.renderFallenCubes(state.getFallenCubes());

  addPiece(context);

  const fallenCubes = state.getFallenCubes();
  const fullLevels = fallenCubes.findFullLevels(settings);
  for (const level of fullLevels) {
    fallenCubes.removeLevel(level);
    gameRenderer.removeFallenCubes();
    gameRenderer.renderFallenCubes(fallenCubes);
  }
};

// Needs to be a global since we can have only one THREE.WebGLRenderer()
const renderer = new GameRenderer();

const main = (
  settings: Settings,
  callbacks: StateUpdateCallbacks
): GameController => {
  const state = new GameState(callbacks);
  const animator = new GameAnimator(settings.animationDuration);

  const fallingScheduler = new Scheduler(settings.fallingSpeed, () =>
    letCurrentPieceFallDown(context)
  );

  const context: Context = {
    state,
    callbacks,
    renderer,
    animator,
    settings,
    schedulers: {
      falling: fallingScheduler,
    },
  };

  setup(context);

  addPiece(context);

  const keyPress = (e: KeyboardEvent) => {
    e.preventDefault();
    onKeyPress(context, e.key);
  };
  addEventListener("keydown", keyPress);

  let stop = false;

  const mainLoop = () => {
    fallingScheduler.tick();
    animator.update();
    renderer.renderScene();
    if (!stop) requestAnimationFrame(mainLoop);
  };

  mainLoop();

  return {
    stop: () => {
      stop = true;
      removeEventListener("keydown", keyPress);
    },
    togglePause: () => {
      fallingScheduler.isStopped()
        ? fallingScheduler.start()
        : fallingScheduler.stop();
    },
    updateSettings: (s: Settings) => {
      settings = s;
      animator.duration = settings.animationDuration;
      fallingScheduler.updateInterval(settings.fallingSpeed);
    },
    updateCamera: {
      fov: (...args) => renderer.updateCameraFov(...args),
      position: (...args) => renderer.updateCameraPosition(...args),
      lookAt: (...args) => renderer.updateCameraLookAt(...args),
    },
    forceRenderCurrentPiece: () => {
      const piece = state.getCurrentPiece();
      renderer.removeCurrentPiece();
      const mesh = renderer.renderCurrentPiece(piece);
      animator.setTarget(mesh);
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
