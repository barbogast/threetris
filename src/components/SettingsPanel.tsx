import * as THREE from "three";

import { useEffect } from "react";
import RangeSetting from "./RangeSetting";
import useAppStore from "../appStore";
import { defaultSettings } from "../config";
import { GameController } from "../types";

type Props = {
  gameController: GameController;
};

const SettingsPanel = ({ gameController }: Props) => {
  const settings = useAppStore().settings;

  useEffect(() => {
    gameController.updateCamera.fov(settings.fov);
  }, [settings.fov]);

  useEffect(() => {
    gameController.updateCamera.position([
      settings.positionX,
      settings.positionY,
      settings.positionZ,
    ]);
  }, [settings.positionX, settings.positionY, settings.positionZ]);

  useEffect(() => {
    gameController.updateCamera.lookAt([
      settings.lookAtX,
      settings.lookAtY,
      settings.lookAtZ,
    ]);
  }, [settings.lookAtX, settings.lookAtY, settings.lookAtZ]);

  return (
    <>
      Settings
      <RangeSetting name="shaftSizeX" min={1} max={10} step={1} type={"int"} />
      <RangeSetting name="shaftSizeY" min={5} max={15} step={1} type={"int"} />
      <RangeSetting name="shaftSizeZ" min={1} max={10} step={1} type={"int"} />
      <RangeSetting
        name="fallingSpeed"
        min={1}
        max={400}
        step={1}
        type={"int"}
      />
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
        max={20.0}
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
        min={-10.0}
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
            settings: defaultSettings,
          });
        }}
      >
        Reset
      </button>
    </>
  );
};

export default SettingsPanel;
