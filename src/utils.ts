import * as THREE from "three";

// See https://discourse.threejs.org/t/how-to-convert-to-quaternion-to-axisangle/36975
export const getAxisAndAngelFromQuaternion = (q: THREE.Quaternion) => {
  const [x, y, z, angle] = new THREE.Vector4().setAxisAngleFromQuaternion(q);
  return { x, y, z, angle };
};
