import * as THREE from "three";

// See https://discourse.threejs.org/t/how-to-convert-to-quaternion-to-axisangle/36975
export const getAxisAndAngelFromQuaternion = (q: THREE.Quaternion) => {
  const [x, y, z, angle] = new THREE.Vector4().setAxisAngleFromQuaternion(q);
  return { x, y, z, angle };
};

export const disposeObject = (object: THREE.Object3D) => {
  object.children.forEach(disposeObject);

  if (object instanceof THREE.Mesh || object instanceof THREE.Line) {
    if (object.geometry) object.geometry.dispose();
    if (object.material) object.material.dispose();
  }

  object.removeFromParent();
};
