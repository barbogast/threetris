import { useEffect } from "react";
import RangeSetting from "./RangeSetting";
import useAppStore, { updateSettings } from "../appStore";
import { getCameraDefaults, getGameDefaults } from "../config";
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
      <strong>Game Settings</strong>
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
      <button onClick={() => updateSettings(getGameDefaults())}>Reset</button>
      <br />
      <br />
      <strong>Camera Settings</strong>
      <RangeSetting name="aspect" min={0} max={5} step={0.1} type={"float"} />
      <RangeSetting name="fov" min={0} max={180} type={"int"} />
      <RangeSetting name="zoom" min={0} max={10.0} step={0.1} type={"float"} />
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
        max={30.0}
        step={0.1}
        type={"float"}
      />
      <RangeSetting
        name="positionZ"
        min={-2.0}
        max={10.0}
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
        min={-10.0}
        max={10.0}
        step={0.1}
        type={"float"}
      />
      <input
        type="checkbox"
        checked={settings.enableOrbitalControl}
        onChange={() =>
          updateSettings({
            enableOrbitalControl: !settings.enableOrbitalControl,
          })
        }
      />{" "}
      Orbital control
      <br />
      <button onClick={() => updateSettings(getCameraDefaults(settings))}>
        Reset
      </button>
    </>
  );
};

export default SettingsPanel;
