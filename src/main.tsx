import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

import { getPieceGeometry } from "./shape";
import SettingsPanel from "./components/SettingsPanel";
import { Settings, Vertex } from "./types";
import useAppStore from "./appStore";
import { renderContainer, renderFloorGrid, renderGridLine } from "./shaft";

const SETTINGS_WIDTH = 300;
const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer();
const camera = new THREE.PerspectiveCamera(
  50,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

type ThreePiece = THREE.LineSegments<
  THREE.BufferGeometry<THREE.NormalBufferAttributes>,
  THREE.LineBasicMaterial,
  THREE.Object3DEventMap
>;

type CurrentPiece = {
  position: Vertex;
  offsets: Vertex[];
  threeObject: ThreePiece;
};

const setup = (
  currentPiece: CurrentPiece,
  updateCurrentPiece: (CurrentPiece: Partial<CurrentPiece>) => void,
  fieldDepth: number,
  fieldSize: number
) => {
  camera.position.set(0, 10, 0); // position the camera on top of the scene
  camera.up.set(0, 0, -1); // point the camera towards the bottom of the scene
  camera.lookAt(0, 1, 0); // target the center of the scene

  // Adjust the camera's aspect ratio and fov to make the scene appear wider and taller
  // camera.aspect = 1.5;
  camera.fov = 750;
  camera.updateProjectionMatrix();

  // Create a renderer
  renderer.setSize(window.innerWidth - SETTINGS_WIDTH, window.innerHeight);
  document.getElementById("scene")?.appendChild(renderer.domElement);

  renderContainer(scene, fieldSize, fieldDepth);
  renderFloorGrid(scene, fieldSize, fieldDepth);
  renderGridLine(scene, fieldSize, fieldDepth);

  addEventListener("keypress", (e) => {
    console.log("event", e.key);
    if (!currentPiece) {
      return;
    }
    if (e.key === "a") {
      // currentPiece.threeObject.rotateOnAxis(
      //   new THREE.Vector3(0, 1, 0),
      //   Math.PI / 4
      // );
      movePiece(currentPiece, updateCurrentPiece, -1, 0, 0);
    }
    if (e.key === "w") {
      movePiece(currentPiece, updateCurrentPiece, 0, 0, -1);
    }
    if (e.key === "s") {
      movePiece(currentPiece, updateCurrentPiece, 0, 0, 1);
    }
    if (e.key === "d") {
      movePiece(currentPiece, updateCurrentPiece, 1, 0, 0);
    }
  });

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.maxPolarAngle = (0.9 * Math.PI) / 2;
  controls.enableZoom = false;
};

const movePiece = (
  currentPiece: CurrentPiece,
  updateCurrentPiece: (CurrentPiece: Partial<CurrentPiece>) => void,
  x: number,
  y: number,
  z: number
) => {
  if (!currentPiece) {
    return;
  }
  if (
    currentPiece.threeObject.position.x > -1 &&
    currentPiece.threeObject.position.x < 1
  ) {
    currentPiece.threeObject.position.x += x;
  }
  currentPiece.threeObject.position.y += y;
  if (
    currentPiece.threeObject.position.z > -1 &&
    currentPiece.threeObject.position.z < 1
  ) {
    currentPiece.threeObject.position.z += z;
  }

  updateCurrentPiece({
    position: [
      currentPiece.threeObject.position.x,
      currentPiece.threeObject.position.y,
      currentPiece.threeObject.position.z,
    ],
  });
};

const addPiece = (size: number) => {
  // Tetris pieces are constructed from cubes aligned next to or on top of each other.
  // In addition to aligning the cubes we need to remove mesh-lines between cubes where
  // cubes touch and form a flat continuous surface. Mesh lines between cubes which form
  // a fold remain, hower.
  // To know which edges not to render we look at the amount of cubes touching an edge:

  // If an edge is touched by 2 cubes we assume it's part of a continuous surface, and the edge
  // is not rendered. If an edge is touched by 3 cubes we assume it is a fold and we render
  // it. Edges touched by 4 cubes are skipped however, they are in the middle of a bigger cube.

  const { vertices, edges, offsets } = getPieceGeometry(size);
  console.log("vertices", vertices);
  const geometry = new THREE.BufferGeometry();

  // Add the vertices and edges to the geometry
  geometry.setAttribute(
    "position",
    new THREE.BufferAttribute(new Float32Array(vertices.flat()), 3)
  );
  geometry.setIndex(edges.flat());

  const material = new THREE.LineBasicMaterial({ color: 0x00ff00 });
  const lines = new THREE.LineSegments(geometry, material);

  scene.add(lines);

  return {
    threeObject: lines,
    offsets: offsets,
    position: [0, 0, 0] as Vertex,
  };
};

const mainLoop = (
  tick: number,
  currentPiece: CurrentPiece,
  updateCurrentPiece: (piece: Partial<CurrentPiece>) => void
) => {
  if (tick % 24 === 0) {
    movePiece(currentPiece, updateCurrentPiece, 0, -1, 0);
    // if (true || currentPiece.threeObject.position.y > -0.5) {
    //   // currentPiece.threeObject.position.y -= 1;
    // } else {
    //   // addShape(1);
    // }
  }

  renderer.render(scene, camera);
  // line.rotateX(0.05);

  tick += 1;
  requestAnimationFrame(() => mainLoop(tick, currentPiece, updateCurrentPiece));
};

const main = (
  settings: Settings,
  setCurrentPiece: (piece: CurrentPiece) => void
) => {
  let currentPiece: CurrentPiece;

  const updateCurrentPiece = (
    data: Partial<{
      threeObject: ThreePiece;
      position: Vertex;
      offsets: Vertex[];
    }>
  ) => {
    Object.assign(currentPiece, data);
    setCurrentPiece(currentPiece);
  };

  scene.remove.apply(scene, scene.children);
  currentPiece = addPiece(1);
  updateCurrentPiece(currentPiece);
  setup(
    currentPiece,
    updateCurrentPiece,
    settings.fieldDepth,
    settings.fieldSize
  );
  mainLoop(0, currentPiece, updateCurrentPiece);
};

const App = () => {
  const [currentPiece, setCurrentPiece] = React.useState<CurrentPiece>();
  const settings = useAppStore().settings;

  useEffect(() => {
    main(settings, (piece) => {
      setCurrentPiece({ ...piece });
    });
  }, [settings.fieldDepth, settings.fieldSize]);

  return (
    <div style={{ display: "flex", flexDirection: "row" }}>
      <div id="scene"></div>
      <div id="settings" style={{ width: SETTINGS_WIDTH }}>
        <pre>
          X1X{JSON.stringify(currentPiece?.position)}
          {JSON.stringify(currentPiece?.position[1])}
        </pre>
        {currentPiece?.offsets.map((off) => (
          <pre>{JSON.stringify(off)}</pre>
        ))}
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
