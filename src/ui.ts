import { getGameDefaults, getCameraDefaults, gameModes } from "./config";
import { ShaftSettings, Settings, BlockSet, GameController } from "./types";

const elements = {
  overlay: document.getElementById("overlay")!,
  gameOver: document.getElementById("game-over")!,
  shaftSizeX: document.getElementById("shaft-size-x") as HTMLSelectElement,
  shaftSizeY: document.getElementById("shaft-size-y") as HTMLSelectElement,
  shaftSizeZ: document.getElementById("shaft-size-z") as HTMLSelectElement,
  blockSet: document.getElementById("block-set") as HTMLSelectElement,
  scoreScore: document.getElementById("score-score")!,
  scoreHighScore: document.getElementById("score-high-score")!,
  scoreCubesPlayed: document.getElementById("score-cubes-played")!,
  scorePit: document.getElementById("score-pit")!,
  scoreBlockSet: document.getElementById("score-block-set")!,
};

const getInput = (name: string) => {
  const elements = document.querySelectorAll(`input[name=${name}]`);
  return elements as NodeListOf<HTMLInputElement>;
};

export const setup = (controller: GameController) => {
  document.getElementById("start")!.onclick = () => {
    const shaftSettings: ShaftSettings = {
      shaftSizeX: parseInt(elements.shaftSizeX.value!),
      shaftSizeY: parseInt(elements.shaftSizeY.value!),
      shaftSizeZ: parseInt(elements.shaftSizeZ.value!),
    };
    const settings: Settings = {
      ...getGameDefaults(),
      ...shaftSettings,
      blockSet: elements.blockSet.value as BlockSet,
      ...getCameraDefaults(shaftSettings),
    };

    const x = `<span class="small-x">x</span>`;
    elements.scorePit.innerHTML = `${settings.shaftSizeX}${x}${settings.shaftSizeZ}${x}${settings.shaftSizeY}`;
    elements.scoreBlockSet.textContent = settings.blockSet;
    controller.start(settings);
  };

  const updateGameMode = () => {
    const mode = (
      document.querySelector(
        `input[name=game-mode]:checked`
      ) as HTMLInputElement
    ).value;
    const values = gameModes[mode]!;
    elements.shaftSizeX.value = String(values.shaftSizeX);
    elements.shaftSizeY.value = String(values.shaftSizeY);
    elements.shaftSizeZ.value = String(values.shaftSizeZ);
    elements.blockSet.value = String(values.blockSet);
  };

  getInput("game-mode").forEach((el) =>
    el.addEventListener("change", updateGameMode)
  );

  // Apply the values the initially selected game mode
  updateGameMode();

  getInput("custom-game")[0].addEventListener("change", (event: Event) => {
    if ((event!.currentTarget as HTMLInputElement).checked) {
      document.getElementById("game-settings")?.classList.remove("hidden");
    } else {
      document.getElementById("game-settings")?.classList.add("hidden");
    }
  });

  controller.addEventListener("gameStateChange", ({ gameState }) => {
    switch (gameState.state) {
      case "running": {
        elements.overlay.classList.add("removed");
        break;
      }
      case "stopped": {
        elements.overlay.classList.remove("removed");
        if (gameState.isGameOver) {
          elements.gameOver.classList.remove("hidden");
        }
        break;
      }
    }
  });

  controller.addEventListener("scoreUpdate", ({ score }) => {
    elements.scoreScore.textContent = String(score.removedRows);
    elements.scoreCubesPlayed.textContent = String(score.fallenCubes);
  });
};
