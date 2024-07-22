import "./style.css";

import * as THREE from "three";

import { parseShapeDefinition } from "./shape";
import { Axis, Context, GameController, Settings } from "./types";
import * as shaft from "./rendering/shaft";

import GameRenderer from "./rendering/gameRenderer";
import { getRandomShape } from "./shapeDefinitions";
import GameAnimator from "./rendering/gameAnimator";
import Scheduler from "./scheduler";
import * as fallenCubes from "./rendering/fallenCubes";
import * as currentPiece from "./rendering/currentPiece";
import * as debugUI from "./debugUI";
import { disposeObject } from "./threeUtils";
import Camera from "./rendering/camera";
import AsyncFunctionQueue, { OnFinish } from "./AsyncFunctionQueue";
import GameStateManager from "./gameState";
import { loadSettings } from "./persist";
import * as ui from "./ui";
import EventManager from "./gameEvents";

const setup = (context: Context) => {
  const { renderer, settings, camera } = context;

  camera.setup();
  renderer.setup(context);

  if (settings.enableOrbitalControl)
    camera.enableOrbitalControl(renderer.getDomElement());

  fallenCubes.setup(context);
  shaft.setup(context);
  shaft.renderAll(context);
};

const onKeyPress = (context: Context, key: string) => {
  console.log(`keyPress "${key}"`);

  const { eventQueue, gameState } = context;
  if (key === " ") {
    eventQueue.queueFunc((done) => onSpacebar(context, done));
  } else if (key.startsWith("Arrow")) {
    eventQueue.queueFunc((done) => onArrowKey(context, key, done));
  } else if (["q", "a", "w", "s", "e", "d"].includes(key)) {
    eventQueue.queueFunc((done) => onRotationKey(context, key, done));
  } else if (key === "Escape") {
    gameState.stop(false);
  } else {
    return true;
  }
};

const onSpacebar = (context: Context, done: OnFinish) => {
  const { animator, settings, fallingScheduler } = context;
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
    fallingScheduler.start();
    done();
  } else {
    // Stop falling down during the animation.
    // Otherwise we might end up with 2 pieces at the same time,
    // or have the piece reach the floor during the animation
    // Also, we need to reset the timer so that the new piece gets
    // the full interval before it starts falling down (instead of the
    // remainder of the last interval of the previous piece
    fallingScheduler.stop();

    const moveDownY = -(currentObject.position.y - newPiece.position.y);
    const animationTrack = animator.getMoveTrack(
      new THREE.Vector3(0, moveDownY, 0)
    );
    animator.playAnimation(animationTrack);
    animator.onEventFinished(() => {
      handlePieceReachedFloor(context, currentPiece.getCurrentCubes(newPiece));
      !settings.paused && fallingScheduler.start();
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
  const { settings, animator, gameState } = context;

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
    gameState.stop(true);
  }
};

const letCurrentPieceFallDown = (context: Context) => {
  const { animator, settings } = context;

  const newPiece = currentPiece.getThreeObject(context).clone();
  newPiece.position.y -= 1;
  const currentCubes = currentPiece.getCurrentCubes(newPiece);
  if (
    currentPiece.getShaftCollision(currentCubes, settings).isCollision ||
    fallenCubes.pieceCollidesWithFallenCube(context, currentCubes)
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
  const { gameState } = context;

  fallenCubes.addPiece(context, currentCubes);
  gameState.pieceFellDown(currentCubes.length);

  disposeObject(currentPiece.getThreeObject(context));
  addPiece(context);

  const fullLevels = fallenCubes.findFullLevels(context);
  for (const level of fullLevels) {
    fallenCubes.removeLevel(context, level);
    gameState.removeRow();
  }
};

const createContext = () => {
  const settings = loadSettings();
  const gameEvents = new EventManager(renderer.getDomElement());
  const gameState = new GameStateManager(gameEvents);
  const scene = new THREE.Scene();
  const animator = new GameAnimator(settings.animationDuration);
  const camera = new Camera(settings);
  const eventQueue = new AsyncFunctionQueue();

  const fallingScheduler = new Scheduler(settings.fallingSpeed, () =>
    letCurrentPieceFallDown(context)
  );

  const context: Context = {
    scene,
    gameState,
    renderer,
    camera,
    animator,
    settings,
    eventQueue,
    fallingScheduler,
    gameEvents,
  };

  return context;
};

// Needs to be a global since we can have only one THREE.WebGLRenderer()
const renderer = new GameRenderer();

export const main = () => {
  const context = createContext();

  const keyPress = (e: KeyboardEvent) => {
    const unhandled = onKeyPress(context, e.key);
    if (!unhandled) {
      e.preventDefault();
    }
  };

  context.gameEvents.addListener("gameStateChange", ({ gameState }) => {
    if (gameState.state === "stopped") {
      removeEventListener("keydown", keyPress);
      context.fallingScheduler.stop();
    }
  });

  const mainLoop = () => {
    context.fallingScheduler.tick();
    context.animator.update();
    renderer.renderScene(context);
    if (context.gameState.getState().state === "running")
      requestAnimationFrame(mainLoop);
  };

  const controller: GameController = {
    start: (newSettings: Settings) => {
      context.settings = newSettings;
      context.gameEvents.dispatch("settingsUpdate", { settings: newSettings });
      context.scene.clear();
      setup(context);
      addPiece(context);
      if (!context.settings.paused) context.fallingScheduler.start();
      addEventListener("keydown", keyPress);
      context.gameState.start();
      mainLoop();
    },
    pause: () => {
      context.gameState.pause();
      context.fallingScheduler.stop();
    },
    resume: () => {
      context.fallingScheduler.start();
      context.gameState.start();
      mainLoop();
    },
    addEventListener: context.gameEvents.addListener,
  };

  debugUI.setup(context, controller);
  ui.setup(controller);
};

main();
