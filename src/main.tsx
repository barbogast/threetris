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
  const { animator, settings, schedulers } = context;
  const currentObject = currentPiece.getThreeObject(context);

  if (key === " ") {
    let newPiece = currentObject.clone();

    while (
      !currentPiece.willBeOutsideOfShaft(
        currentPiece.getCurrentCubes(newPiece),
        settings
      ) &&
      !fallenCubes.pieceCollidesWithFallenCube(
        context,
        currentPiece.getCurrentCubes(newPiece)
      )
    ) {
      newPiece.position.y -= 1;
    }

    // The last position resulted in a collision, go one block back up
    newPiece.position.y += 1;

    if (newPiece.position.y + 1 !== currentObject.position.y) {
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
        handlePieceReachedFloor(
          context,
          currentPiece.getCurrentCubes(newPiece)
        );
        !settings.paused && schedulers.falling.start();
        disposeObject(newPiece);
      });
    }
    return;
  }

  const updatedPiece = currentObject.clone();
  let animationTrack: THREE.KeyframeTrack | undefined = undefined;

  const moveMap: Record<string, THREE.Vector3> = {
    ArrowLeft: new THREE.Vector3(-1, 0, 0),
    ArrowUp: new THREE.Vector3(0, 0, -1),
    ArrowDown: new THREE.Vector3(0, 0, 1),
    ArrowRight: new THREE.Vector3(1, 0, 0),
  };
  const move = moveMap[key];
  if (move) {
    updatedPiece.position.add(move);
    animationTrack = animator.getMoveTrack(move);
  }

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
  if (rotation) {
    const { axis, direction } = rotationMap[key];
    currentPiece.rotate(updatedPiece, axis, direction);
    animationTrack = animator.getRotateTrackQuaternion(axis, direction);
  }

  // Check of collision with fallen cubes and shaft walls
  const updatedCubes = currentPiece.getCurrentCubes(updatedPiece);
  if (
    !fallenCubes.pieceCollidesWithFallenCube(context, updatedCubes) &&
    !currentPiece.willBeOutsideOfShaft(updatedCubes, settings) &&
    animationTrack
  ) {
    animator.playAnimation(animationTrack);
  }
  disposeObject(updatedPiece);
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
};

const letCurrentPieceFallDown = (context: Context) => {
  const { animator, settings } = context;

  const newPiece = currentPiece.getThreeObject(context).clone();
  newPiece.position.y -= 1;
  const currentCubes = currentPiece.getCurrentCubes(newPiece);
  if (
    fallenCubes.pieceCollidesWithFallenCube(context, currentCubes) ||
    currentPiece.willBeOutsideOfShaft(currentCubes, settings)
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
  const scene = new THREE.Scene();
  const animator = new GameAnimator(settings.animationDuration);
  const camera = new Camera(settings);

  const fallingScheduler = new Scheduler(settings.fallingSpeed, () =>
    letCurrentPieceFallDown(context)
  );

  if (settings.paused) fallingScheduler.stop();

  const context: Context = {
    scene,
    callbacks,
    renderer,
    camera,
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
    renderer.renderScene(context);
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
  const [rendererInfo, setRendererInfo] = React.useState<{
    geometries: number;
  }>({ geometries: 0 });
  const [removedRows, setRemovedRows] = React.useState<number>(0);
  const settings = useAppStore().settings;

  const callbacks: StateUpdateCallbacks = {
    currentPiece: () => {},
    fallenCubes: setFallenCubes,
    rendererInfo: setRendererInfo,
    removeRow: () => setRemovedRows((prev) => prev + 1),
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
        Removed rows: {removedRows}
        <br />
        <br />
        Geometries: {rendererInfo.geometries}
        <br />
        <br />
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
