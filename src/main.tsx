import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

import { getPieceGeometry } from "./shape";
import SettingsPanel from "./components/SettingsPanel";
import { Vertex } from "./types";
import useAppStore from "./appStore";

const SETTINGS_WIDTH = 300;
const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer();
const camera = new THREE.PerspectiveCamera(
  50,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

let currentPiece: {
  position: Vertex;
  offsets: Vertex[];
  threeObject: THREE.LineSegments<
    THREE.BufferGeometry<THREE.NormalBufferAttributes>,
    THREE.LineBasicMaterial,
    THREE.Object3DEventMap
  >;
};

const renderGridLine = (fieldDepth: number, fieldSize: number) => {
  const geometry = new THREE.BufferGeometry();

  const vertices: Vertex[] = [];

  const s = fieldSize / 2;
  const d = fieldDepth / 2;
  for (let i = -s + 1; i < s; i++) {
    vertices.push([-s, -d, i]);
    vertices.push([-s, d, i]);
  }

  for (let i = -s + 1; i < s; i++) {
    vertices.push([s, -d, i]);
    vertices.push([s, d, i]);
  }

  for (let i = -s + 1; i < s; i++) {
    vertices.push([i, -d, -s]);
    vertices.push([i, d, -s]);
  }

  for (let i = -s + 1; i < s; i++) {
    vertices.push([i, -d, s]);
    vertices.push([i, d, s]);
  }

  // Add the vertices and edges to the geometry
  geometry.setAttribute(
    "position",
    new THREE.BufferAttribute(new Float32Array(vertices.flat()), 3)
  );

  const material = new THREE.LineBasicMaterial({ color: "0x00ff00" });
  const lines = new THREE.LineSegments(geometry, material);
  scene.add(lines);
};

const setup = (fieldDepth: number, fieldSize: number) => {
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

  // Container
  const cubeGeometry = new THREE.BoxGeometry(fieldSize, fieldDepth, fieldSize);
  const cubeMaterial = new THREE.LineBasicMaterial({ color: "0x00ff00" });
  const edges = new THREE.EdgesGeometry(cubeGeometry);
  const cube = new THREE.LineSegments(edges, cubeMaterial);
  scene.add(cube);

  renderGridLine(fieldDepth, fieldSize);

  addEventListener("keypress", (e) => {
    console.log("event", e.key);
    if (!currentPiece) {
      return;
    }
    if (e.key === "a") {
      currentPiece.threeObject.rotateOnAxis(
        new THREE.Vector3(0, 1, 0),
        Math.PI / 4
      );
    }
    if (e.key === "w") {
      movePiece(0, -1);
    }
    if (e.key === "s") {
      movePiece(0, 1);
    }
    if (e.key === "d") {
      movePiece(1, 0);
    }
  });

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.maxPolarAngle = (0.9 * Math.PI) / 2;
  controls.enableZoom = false;
};

const movePiece = (x: number, z: number) => {
  if (!currentPiece) {
    return;
  }
  if (
    currentPiece.threeObject.position.x > -1 &&
    currentPiece.threeObject.position.x < 1
  ) {
    currentPiece.threeObject.position.x += x;
  }
  if (
    currentPiece.threeObject.position.z > -1 &&
    currentPiece.threeObject.position.z < 1
  ) {
    currentPiece.threeObject.position.z += z;
  }
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
  currentPiece = { threeObject: lines, offsets: offsets, position: [0, 0, 0] };
  scene.add(lines);
};

const tick = () => {
  // Move the cube
  if (currentPiece.threeObject.position.y > -0.5) {
    currentPiece.threeObject.position.y -= 0.01;
  } else {
    // addShape(1);
  }

  renderer.render(scene, camera);
  // line.rotateX(0.05);

  requestAnimationFrame(tick);
};

const App = () => {
  const settings = useAppStore().settings;
  useEffect(() => {
    scene.remove.apply(scene, scene.children);
    setup(settings.fieldDepth, settings.fieldSize);
    addPiece(1);
    tick();
  }, [settings.fieldDepth, settings.fieldSize]);

  return (
    <div style={{ display: "flex", flexDirection: "row" }}>
      <div id="scene"></div>
      <div id="settings" style={{ width: SETTINGS_WIDTH }}>
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
