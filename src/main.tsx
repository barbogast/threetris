import React, { useEffect, useRef } from "react";
import ReactDOM from "react-dom/client";
import * as THREE from "three";

import { parseShapeDefinition } from "./shape";
import SettingsPanel from "./components/SettingsPanel";
import {
  Axis,
  Context,
  GameController,
  Settings,
  StateUpdateCallbacks,
} from "./types";
import useAppStore from "./appStore";
import * as shaft from "./rendering/shaft";

import GameRenderer from "./rendering/gameRenderer";
import { getRandomShape } from "./shapeDefinitions";
import { SETTINGS_WIDTH } from "./config";
import GameAnimator from "./rendering/gameAnimator";
import Scheduler from "./scheduler";
import * as fallenCubes from "./rendering/fallenCubes";
import * as currentPiece from "./rendering/currentPiece";
import { disposeObject } from "./utils";
import Camera from "./rendering/camera";
import AsyncFunctionQueue, { OnFinish } from "./AsyncFunctionQueue";
import GameStateManager, { GameState } from "./gameState";

const setup = (context: Context) => {
  const { renderer, settings, camera } = context;

  camera.setup();
  renderer.setup(context);

  if (settings.enableOrbitalControl)
    camera.enableOrbitalControl(renderer.getDomElement());

  fallenCubes.setup(context);
  shaft.setup(context);

  shaft.renderContainer(context);
  shaft.renderFloorGrid(context);
  shaft.renderWallGridLongLines(context);
  shaft.renderWallGridShortLines(context);
};

const onKeyPress = (context: Context, key: string) => {
  console.log(`keyPress "${key}"`);

  const { eventQueue } = context;
  if (key === " ") {
    eventQueue.queueFunc((done) => onSpacebar(context, done));
  } else if (key.startsWith("Arrow")) {
    eventQueue.queueFunc((done) => onArrowKey(context, key, done));
  } else if (["q", "a", "w", "s", "e", "d"].includes(key)) {
    eventQueue.queueFunc((done) => onRotationKey(context, key, done));
  } else {
    return true;
  }
};

const onSpacebar = (context: Context, done: OnFinish) => {
  const { animator, settings, schedulers } = context;
  const currentObject = currentPiece.getThreeObject(context);

  let newPiece = currentObject.clone();

  while (
    !currentPiece.getShaftCollision(
      currentPiece.getCurrentCubes(newPiece),
      settings
    ).isCollision &&
    !fallenCubes.pieceCollidesWithFallenCube(
      context,
      currentPiece.getCurrentCubes(newPiece)
    )
  ) {
    newPiece.position.y -= 1;
  }

  // The last position resulted in a collision, go one block back up
  newPiece.position.y += 1;

  if (newPiece.position.y === currentObject.position.y) {
    handlePieceReachedFloor(context, currentPiece.getCurrentCubes(newPiece));
    schedulers.falling.start();
    done();
  } else {
    // Stop falling down during the animation.
    // Otherwise we might end up with 2 pieces at the same time,
    // or have the piece reach the floor during the animation
    // Also, we need to reset the timer so that the new piece gets
    // the full interval before it starts falling down (instead of the
    // remainder of the last interval of the previous piece
    schedulers.falling.stop();

    const moveDownY = -(currentObject.position.y - newPiece.position.y);
    const animationTrack = animator.getMoveTrack(
      new THREE.Vector3(0, moveDownY, 0)
    );
    animator.playAnimation(animationTrack);
    animator.onEventFinished(() => {
      handlePieceReachedFloor(context, currentPiece.getCurrentCubes(newPiece));
      !settings.paused && schedulers.falling.start();
      disposeObject(newPiece);
      done();
    });
  }
};

const onArrowKey = (context: Context, key: string, done: OnFinish) => {
  console.log("onArrowKey", key);
  const { animator, settings } = context;
  const currentObject = currentPiece.getThreeObject(context);
  const updatedPiece = currentObject.clone();

  const moveMap: Record<string, THREE.Vector3> = {
    ArrowLeft: new THREE.Vector3(-1, 0, 0),
    ArrowUp: new THREE.Vector3(0, 0, -1),
    ArrowDown: new THREE.Vector3(0, 0, 1),
    ArrowRight: new THREE.Vector3(1, 0, 0),
  };
  const move = moveMap[key];
  if (!move) return done();

  updatedPiece.position.add(move);
  const animationTrack = animator.getMoveTrack(move);
  const updatedCubes = currentPiece.getCurrentCubes(updatedPiece);
  if (
    !currentPiece.getShaftCollision(updatedCubes, settings).isCollision &&
    !fallenCubes.pieceCollidesWithFallenCube(context, updatedCubes)
  ) {
    animator.playAnimation(animationTrack);
    animator.onEventFinished(done);
  } else {
    done();
  }
  disposeObject(updatedPiece);
};

const onRotationKey = (context: Context, key: string, done: OnFinish) => {
  console.log("onRotationKey", key);
  const { animator, settings } = context;
  // Rotating a piece requires to update the offsets in the game state and
  // to set up the animation which visually rotates the piece by rotating the
  // three.js object.
  // Note that offsets in the game state need to be adjusted after the rotation, so that
  // the logical position matches the visual position. Not sure why, somewhow the rotation
  // in the game state and the rotation in the three.js object are not in sync.
  const rotationMap: Record<string, { axis: Axis; direction: 1 | -1 }> = {
    q: { axis: "x", direction: 1 },
    a: { axis: "x", direction: -1 },
    w: { axis: "z", direction: -1 },
    s: { axis: "z", direction: 1 },
    e: { axis: "y", direction: 1 },
    d: { axis: "y", direction: -1 },
  };

  const rotation = rotationMap[key];
  if (!rotation) return done();

  const currentObject = currentPiece.getThreeObject(context);
  const updatedPiece = currentObject.clone();
  const { axis, direction } = rotationMap[key];
  currentPiece.rotate(updatedPiece, axis, direction);
  const animationTrack = animator.getRotateTrackQuaternion(axis, direction);

  // Check of collision with fallen cubes and shaft walls
  const updatedCubes = currentPiece.getCurrentCubes(updatedPiece);
  const shaftCollision = currentPiece.getShaftCollision(updatedCubes, settings);
  if (
    !shaftCollision.isCollision &&
    !fallenCubes.pieceCollidesWithFallenCube(context, updatedCubes) &&
    animationTrack
  ) {
    animator.playAnimation(animationTrack);
    animator.onEventFinished(done);
  } else if (rotation && shaftCollision.isCollision && shaftCollision.moveTo) {
    const moveTrack = handleShaftCollision(
      context,
      updatedPiece,
      shaftCollision
    );
    if (moveTrack) {
      // Let's rotate and move in parallel
      animator.playAnimation(moveTrack);
      animator.playAnimation(animationTrack!);
      animator.onEventFinished(done);
    } else {
      done();
    }
  } else {
    done();
  }
  disposeObject(updatedPiece);
};

const handleShaftCollision = (
  context: Context,
  updatedPiece: THREE.Object3D,
  originalShaftCollision: currentPiece.CollisionResult
) => {
  // The user tried to rotate the piece and collided with a wall or the ceiling. Let's
  // try to move the piece to the opposite direction. Until we hit the opposite wall or
  // or another fallen piece
  const { animator, settings } = context;

  // Type guard
  if (!originalShaftCollision.isCollision || !originalShaftCollision.moveTo)
    return;

  let counter = 0; // Guard against infinite loops

  // We might need to move the piece multiple blocks
  const totalMove = new THREE.Vector3();

  while (true) {
    // Let's try to move the piece away from the wall
    updatedPiece.position.add(originalShaftCollision.moveTo);
    totalMove.add(originalShaftCollision.moveTo);
    const movedCubes = currentPiece.getCurrentCubes(updatedPiece);

    const newShaftCollision = currentPiece.getShaftCollision(
      movedCubes,
      settings
    );

    if (
      newShaftCollision.isCollision &&
      newShaftCollision.moveTo &&
      !originalShaftCollision.moveTo.equals(newShaftCollision.moveTo)
    ) {
      return; // Piece hit the opposite wall, we cannot rotate
    }

    if (fallenCubes.pieceCollidesWithFallenCube(context, movedCubes)) {
      return; // Now the piece collides with another piece. Looks like we cannot rotate
    }

    if (!newShaftCollision.isCollision) {
      // No collision
      return animator.getMoveTrack(totalMove);
    }

    counter += 1;
    if (counter > 100) {
      throw new Error("Infinite loop");
    }
  }
};

const addPiece = (context: Context) => {
  const { settings, animator } = context;

  // Tetris pieces are constructed from cubes aligned next to or on top of each other.
  // In addition to aligning the cubes we need to remove mesh-lines between cubes where
  // cubes touch and form a flat continuous surface. Mesh lines between cubes which form
  // a fold remain, hower.
  // To know which edges not to render we look at the amount of cubes touching an edge:

  // If an edge is touched by 2 cubes we assume it's part of a continuous surface, and the edge
  // is not rendered. If an edge is touched by 3 cubes we assume it is a fold and we render
  // it. Edges touched by 4 cubes are skipped however, they are in the middle of a bigger cube.

  const shape = getRandomShape(settings.blockSet);
  const offsets = parseShapeDefinition(shape);
  const mesh = currentPiece.renderCurrentPiece(context, offsets);
  animator.setTarget(mesh);

  const currentCubes = currentPiece.getCurrentCubes(mesh);
  if (fallenCubes.pieceCollidesWithFallenCube(context, currentCubes)) {
    context.onGameOver();
  }
};

const letCurrentPieceFallDown = (context: Context) => {
  const { animator, settings } = context;

  const newPiece = currentPiece.getThreeObject(context).clone();
  newPiece.position.y -= 1;
  const currentCubes = currentPiece.getCurrentCubes(newPiece);
  if (
    fallenCubes.pieceCollidesWithFallenCube(context, currentCubes) ||
    currentPiece.getShaftCollision(currentCubes, settings).isCollision
  ) {
    handlePieceReachedFloor(
      context,
      currentPiece.getCurrentCubes(currentPiece.getThreeObject(context))
    );
  } else {
    animator.playAnimation(animator.getMoveTrack(new THREE.Vector3(0, -1, 0)));
  }
};

const handlePieceReachedFloor = (
  context: Context,
  currentCubes: THREE.Vector3[]
) => {
  const { callbacks } = context;

  fallenCubes.addPiece(context, currentCubes);

  disposeObject(currentPiece.getThreeObject(context));
  addPiece(context);

  const fullLevels = fallenCubes.findFullLevels(context);
  for (const level of fullLevels) {
    fallenCubes.removeLevel(context, level);
    callbacks.removeRow();
  }
};

// Needs to be a global since we can have only one THREE.WebGLRenderer()
const renderer = new GameRenderer();

const main = (
  settings: Settings,
  callbacks: StateUpdateCallbacks
): GameController => {
  const gameState = new GameStateManager(callbacks.updateGameState);
  const scene = new THREE.Scene();
  const animator = new GameAnimator(settings.animationDuration);
  const camera = new Camera(settings);
  const eventQueue = new AsyncFunctionQueue();

  const fallingScheduler = new Scheduler(settings.fallingSpeed, () =>
    letCurrentPieceFallDown(context)
  );

  const context: Context = {
    scene,
    callbacks,
    renderer,
    camera,
    animator,
    settings,
    eventQueue,
    schedulers: {
      falling: fallingScheduler,
    },
    onGameOver: () => {
      gameState.stop(true);
      removeEventListener("keydown", keyPress);
      fallingScheduler.stop();
    },
  };

  const keyPress = (e: KeyboardEvent) => {
    const unhandled = onKeyPress(context, e.key);
    if (!unhandled) {
      e.preventDefault();
    }
  };

  const mainLoop = () => {
    fallingScheduler.tick();
    animator.update();
    renderer.renderScene(context);
    if (gameState.isRunning()) requestAnimationFrame(mainLoop);
  };

  return {
    start: () => {
      scene.clear();
      setup(context);
      addPiece(context);
      if (!settings.paused) fallingScheduler.start();
      addEventListener("keydown", keyPress);
      gameState.start();
      mainLoop();
    },
    stop: (isGameOver: boolean) => {
      gameState.stop(isGameOver);
      removeEventListener("keydown", keyPress);
      fallingScheduler.stop();
      scene.clear();
    },
    pause: () => {
      gameState.pause();
      fallingScheduler.stop();
    },
    resume: () => {
      fallingScheduler.start();
      gameState.start();
      mainLoop();
    },
    updateSettings: (s: Settings) => {
      settings = s;
      context.settings = s;
      animator.duration = settings.animationDuration;
      fallingScheduler.updateInterval(settings.fallingSpeed);
    },
    updateCamera: {
      fov: (...args) => camera.updateFov(...args),
      position: (...args) => camera.updatePosition(...args),
      lookAt: (...args) => camera.updateLookAt(...args),
    },
  };
};

const App = () => {
  const [fallenCubes, setFallenCubes] = React.useState<
    [number, number, number][]
  >([]);
  const [geometries, setGeometries] = React.useState<number>(0);
  const [removedRows, setRemovedRows] = React.useState<number>(0);
  const settings = useAppStore().settings;

  const [gameState, setGameState] = React.useState<GameState>({
    state: "stopped",
    isGameOver: false,
  });

  const callbacks: StateUpdateCallbacks = {
    currentPiece: () => {},
    fallenCubes: setFallenCubes,
    rendererInfo: (rendererInfo) => setGeometries(rendererInfo.geometries),
    removeRow: () => setRemovedRows((prev) => prev + 1),
    updateGameState: setGameState,
  };

  const gameController = useRef<GameController>();

  useEffect(() => {
    const controller = main(settings, callbacks);
    gameController.current = controller;
    return () => controller.stop(false);
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
  }, [settings.fallingSpeed, settings.animationDuration, settings.blockSet]);

  return (
    <div style={{ display: "flex", flexDirection: "row" }}>
      <div id="scene"></div>
      <div id="settings" style={{ width: SETTINGS_WIDTH }}>
        {gameState.state === "stopped" && (
          <button onClick={() => gameController.current?.start()}>
            {gameState.isGameOver ? "Restart" : "Start"}
          </button>
        )}
        <br />
        {gameState.state}
        <br />
        Removed rows: {removedRows}
        <br />
        <br />
        Geometries: {geometries}
        <br />
        <br />
        Fallen cubes: {fallenCubes.length}
        <br />
        <br />
        {["running", "paused"].includes(gameState.state) &&
          gameController.current && (
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
