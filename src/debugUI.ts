import GUI from "lil-gui";
import * as THREE from "three";
import { Axis, Context, GameController, Settings } from "./types";
import * as shaft from "./rendering/shaft";
import { getCameraDefaults, getGameDefaults } from "./config";
import { main } from "./main";
import { saveSettings } from "./persist";

// Apply default values to obj by calling controller.setValue() for each prop
// and invoking each onChange handler
const applyDefaults = <O extends Record<string, unknown>>(
  gui: GUI,
  obj: O,
  defaults: Partial<O>
) => {
  const newSettings = Object.assign(obj, defaults);

  // Since the controllers aren't actively listening we need to tell them
  // that their values changed
  gui.controllersRecursive().forEach((c) => {
    const key = c.property;
    if (key in defaults) {
      c.setValue(newSettings[key as keyof Settings]);
      // @ts-expect-error According to https://lil-gui.georgealways.com/#Controller#setValue the onChange handler is called by controller.setValue() but apparently it isn't
      c._callOnChange();
    }
  });
};

let gui: GUI;
export const setup = (context: Context, controller: GameController) => {
  const {
    settings,
    fallingScheduler,
    animator,
    camera,
    renderer,
    scene,
    gameState,
  } = context;

  controller.addEventListener("settingsUpdate", ({ settings: newSettings }) => {
    Object.assign(settings, newSettings);
    gui.controllersRecursive().forEach((c) => c.updateDisplay());
  });

  const reinitialize = () => {
    gameState.stop(false);
    scene.clear();
    renderer.removeDOMElement(context);
    main();
    controller.start(settings);
  };

  const rerenderShaft = () => {
    // Restart game to avoid having pieces outside the shaft
    gameState.stop(false);
    scene.clear();
    shaft.setup(context);
    shaft.renderAll(context);
    controller.start(settings);
  };

  // We'll be calling this function multiple times in case we reinitialize the game
  if (gui) gui.destroy();
  gui = new GUI();
  gui.close();
  gui.onFinishChange(() => saveSettings(settings));

  const gameFolder = gui.addFolder("Game");
  gameFolder.add(settings, "paused").onChange((paused: boolean) => {
    if (paused) {
      controller.pause();
    } else {
      controller.resume();
    }
  });
  gameFolder.add(settings, "blockSet", ["flat", "basic", "extended"]);
  gameFolder.add(settings, "shaftSizeX", 1, 10, 1).onChange(rerenderShaft);
  gameFolder.add(settings, "shaftSizeY", 5, 15, 1).onChange(rerenderShaft);
  gameFolder.add(settings, "shaftSizeZ", 1, 10, 1).onChange(rerenderShaft);
  gameFolder
    .add(settings, "fallingSpeed", 0, 3, 0.01)
    .onChange((v: number) => fallingScheduler.updateInterval(v));
  gameFolder
    .add(settings, "animationDuration", 0, 1, 0.01)
    .onChange((v: number) => {
      animator.duration = v;
    });

  gameFolder.add(
    {
      reset: () => {
        applyDefaults(gameFolder, settings, getGameDefaults());
        saveSettings(settings);
      },
    },
    "reset"
  );

  const cameraFolder = gui.addFolder("Camera");

  cameraFolder.add(settings, "aspect", 0, 5, 0.1);
  cameraFolder
    .add(settings, "fov", 0, 180, 1)
    .onChange((v: number) => camera.updateFov(v));
  cameraFolder
    .add(settings, "zoom", 0, 10, 0.1)
    .onChange((v: number) => camera.updateZoom(v));

  cameraFolder
    .add(settings, "sceneScaleY", 0.01, 2, 0.01)
    .onChange((v: number) => (scene.scale.y = v));

  const positionFolder = cameraFolder.addFolder("Position");
  positionFolder.add(settings, "positionX", -10, 10, 0.1);
  positionFolder.add(settings, "positionY", -1, 30, 0.1);
  positionFolder.add(settings, "positionZ", -2, 10, 0.1);
  positionFolder.onChange((e) => {
    const axis = e.property.charAt(-1).toLowerCase() as Axis;
    const newPos = new THREE.Vector3(
      settings.positionX,
      settings.positionY,
      settings.positionZ
    );
    newPos[axis] = e.value;
    camera.updatePosition(newPos);
  });

  const lookAtFolder = cameraFolder.addFolder("Position");
  lookAtFolder.add(settings, "lookAtX", -5, 5, 0.1);
  lookAtFolder.add(settings, "lookAtY", -10, 5, 0.1);
  lookAtFolder.add(settings, "lookAtZ", -10, 10, 0.1);
  lookAtFolder.onChange((e) => {
    const axis = e.property.charAt(-1).toLowerCase() as Axis;
    const newPos = new THREE.Vector3(
      settings.lookAtX,
      settings.lookAtY,
      settings.lookAtZ
    );
    newPos[axis] = e.value;
    camera.updateLookAt(newPos);
  });

  cameraFolder.add(settings, "enableOrbitalControl").onChange(reinitialize);

  cameraFolder.add(
    {
      reset: () => {
        applyDefaults(cameraFolder, settings, getCameraDefaults(settings));
        saveSettings(settings);
      },
    },
    "reset"
  );
};
