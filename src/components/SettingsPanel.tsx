import * as THREE from "three";

import { useEffect } from "react";
import RangeSetting from "./RangeSetting";
import useAppStore from "../appStore";

type Props = {
  camera: THREE.PerspectiveCamera;
};

const SettingsPanel = ({ camera }: Props) => {
  const settings = useAppStore().settings;

  useEffect(() => {
    camera.fov = settings.fov;
    camera.updateProjectionMatrix();
  }, [settings.fov]);

  useEffect(() => {
    camera.position.set(
      settings.positionX,
      settings.positionY,
      settings.positionZ
    );
  }, [settings.positionX, settings.positionY, settings.positionZ]);

  useEffect(() => {
    camera.lookAt(settings.lookAtX, settings.lookAtY, settings.lookAtZ);
  }, [settings.lookAtX, settings.lookAtY, settings.lookAtZ]);

  return (
    <>
      Settings
      <RangeSetting name="fieldSize" min={1} max={10} step={1} type={"int"} />
      <RangeSetting name="fieldDepth" min={5} max={15} step={1} type={"int"} />
      <RangeSetting name="fov" min={0} max={1000} type={"int"} />
      <RangeSetting
        name="positionX"
        min={-10.0}
        max={10.0}
        step={0.1}
        type={"float"}
      />
      <RangeSetting
        name="positionY"
        min={-1.0}
        max={10.0}
        step={0.1}
        type={"float"}
      />
      <RangeSetting
        name="positionZ"
        min={-2.0}
        max={2.0}
        step={0.1}
        type={"float"}
      />
      <RangeSetting
        name="lookAtX"
        min={-5.0}
        max={5.0}
        step={0.1}
        type={"float"}
      />
      <RangeSetting
        name="lookAtY"
        min={-5.0}
        max={5.0}
        step={0.1}
        type={"float"}
      />
      <RangeSetting
        name="lookAtZ"
        min={-5.0}
        max={5.0}
        step={0.1}
        type={"float"}
      />
      <button
        onClick={() => {
          useAppStore.setState({
            settings: {
              fieldSize: 4,
              fieldDepth: 10,
              fov: 750,
              positionX: 0.0,
              positionY: 2.0,
              positionZ: 0.0,
              lookAtX: 0,
              lookAtY: 1,
              lookAtZ: 0,
            },
          });
        }}
      >
        Reset
      </button>
    </>
  );
};

export default SettingsPanel;
