import * as THREE from "three";

// See https://discourse.threejs.org/t/how-to-convert-to-quaternion-to-axisangle/36975
export const toAxisAngle = (q: THREE.Quaternion) => {
  const angle = 2 * Math.acos(q.w);

  const s = Math.sqrt(1 - q.w * q.w);

  const x = q.x / s;
  const y = q.y / s;
  const z = q.z / s;

  return { x, y, z, angle };
};
