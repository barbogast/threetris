import * as THREE from "three";
import { Vertex } from "./types";

const SHAFT_LINES_ID = "shaft-lines";

export const setupGroups = (scene: THREE.Scene) => {
  const group = new THREE.Group();
  group.name = SHAFT_LINES_ID;
  scene.add(group);
};

export const renderShaftLines = (
  scene: THREE.Scene,
  name: string,
  vertices: Vertex[]
) => {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.BufferAttribute(new Float32Array(vertices.flat()), 3)
  );

  const material = new THREE.LineBasicMaterial({ color: "0x00ff00" });

  const lines = new THREE.LineSegments(geometry, material);
  lines.name = name;
  scene.getObjectByName(SHAFT_LINES_ID)!.add(lines);
};
