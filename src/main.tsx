import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

import { getCubeGeometry, filterEdges } from "./shape";
import SettingsPanel from "./components/SettingsPanel";
import { Vertex, Edge } from "./types";

const SETTINGS_WIDTH = 300;
const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer();
const camera = new THREE.PerspectiveCamera(
  50,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

let currentBlock: THREE.LineSegments<
  THREE.EdgesGeometry<THREE.BoxGeometry>,
  THREE.LineBasicMaterial,
  THREE.Object3DEventMap
>;

const setup = () => {
  camera.position.set(0, 2, 0); // position the camera on top of the scene
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
  const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
  const cubeMaterial = new THREE.LineBasicMaterial({ color: "0x00ff00" });
  const edges = new THREE.EdgesGeometry(cubeGeometry);
  const cube = new THREE.LineSegments(edges, cubeMaterial);
  scene.add(cube);

  addEventListener("keypress", (e) => {
    console.log("event", e.key);
    if (!currentBlock) {
      return;
    }
    if (e.key === "a") {
      moveBlock(-0.1, 0);
    }
    if (e.key === "w") {
      moveBlock(0, -0.1);
    }
    if (e.key === "s") {
      moveBlock(0, 0.1);
    }
    if (e.key === "d") {
      moveBlock(0.1, 0);
    }
  });

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.maxPolarAngle = (0.9 * Math.PI) / 2;
  controls.enableZoom = false;
};

const moveBlock = (x: number, z: number) => {
  if (!currentBlock) {
    return;
  }
  if (currentBlock.position.x > -1 && currentBlock.position.x < 1) {
    currentBlock.position.x += x;
  }
  if (currentBlock.position.z > -1 && currentBlock.position.z < 1) {
    currentBlock.position.z += z;
  }
};

const addBlock = () => {
  const cubeGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
  const cubeMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00 });
  const edges = new THREE.EdgesGeometry(cubeGeometry);
  const cube = new THREE.LineSegments(edges, cubeMaterial);
  cube.position.set(0, 0.5, 0);
  scene.add(cube);
  currentBlock = cube;
};

const addShape = (size: number) => {
  // Tetris pieces are constructed from cubes aligned next to or on top of each other.
  // In addition to aligning the cubes we need to remove mesh-lines between cubes where
  // cubes touch and form a flat continuous surface. Mesh lines between cubes which form
  // a fold remain, hower.
  // To know which edges not to render we look at the amount of cubes touching an edge:

  // If an edge is touched by 2 cubes we assume it's part of a continuous surface, and the edge
  // is not rendered. If an edge is touched by 3 cubes we assume it is a fold and we render
  // it. Edges touched by 4 cubes are skipped however, they are in the middle of a bigger cube.

  const vertices: Vertex[] = [];
  const allEdges: Edge[] = [];
  getCubeGeometry(vertices, allEdges, size, 0, 1, 0);
  getCubeGeometry(vertices, allEdges, size, 0, 0, 0);
  getCubeGeometry(vertices, allEdges, size, 1, 0, 0);
  getCubeGeometry(vertices, allEdges, size, -1, 0, 0);

  const filteredEdges = filterEdges(vertices, allEdges);
  // const filteredEdges = allEdges;
  const geometry = new THREE.BufferGeometry();

  // Add the vertices and edges to the geometry
  geometry.setAttribute(
    "position",
    new THREE.BufferAttribute(new Float32Array(vertices.flat()), 3)
  );
  geometry.setIndex(filteredEdges.flat());

  const material = new THREE.LineBasicMaterial({ color: 0x00ff00 });
  const lines = new THREE.LineSegments(geometry, material);
  scene.add(lines);
};

addShape(0.1);

const tick = () => {
  // Move the cube
  if (currentBlock.position.y > -0.5) {
    currentBlock.position.y -= 0.01;
  } else {
    addBlock();
  }

  renderer.render(scene, camera);
  // line.rotateX(0.05);

  requestAnimationFrame(tick);
};

const App = () => {
  useEffect(() => {
    setup();
    addBlock();
    tick();
  }, []);

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
