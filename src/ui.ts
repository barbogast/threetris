import {
  getGameDefaults,
  getCameraDefaults,
  gameModes,
  COLORS,
} from "./config";
import { GameState } from "./gameState";
import { ShaftSettings, Settings, BlockSet, GameController } from "./types";

const elements = {
  overlay: document.getElementById("overlay")!,
  newGame: document.getElementById("new-game")!,
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

const startGame = (controller: GameController) => {
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
    document.querySelector(`input[name=game-mode]:checked`) as HTMLInputElement
  ).value;

  // Show/hide custom settings
  const gameSettings = document.getElementById("game-settings");
  if (mode === "custom") {
    gameSettings?.classList.remove("hidden");
  } else {
    gameSettings?.classList.add("hidden");
    // Only update values for preset modes
    const values = gameModes[mode]!;
    elements.shaftSizeX.value = String(values.shaftSizeX);
    elements.shaftSizeY.value = String(values.shaftSizeY);
    elements.shaftSizeZ.value = String(values.shaftSizeZ);
    elements.blockSet.value = String(values.blockSet);
  }
};

const onGameStateChange = ({ gameState }: { gameState: GameState }) => {
  switch (gameState.state) {
    case "running": {
      elements.overlay.classList.add("removed");
      break;
    }
    case "stopped": {
      elements.overlay.classList.remove("removed");
      if (gameState.isGameOver) {
        elements.newGame.classList.add("hidden");
        elements.gameOver.classList.remove("hidden");
      }
      break;
    }
  }
};

export const setup = (controller: GameController) => {
  document.getElementById("start")!.onclick = () => startGame(controller);
  document.getElementById("again")!.onclick = () => {
    elements.newGame.classList.remove("hidden");
    elements.gameOver.classList.add("hidden");
  };

  // Mode card selection handling
  const modeCards = document.querySelectorAll(".mode-card");
  getInput("game-mode").forEach((el) => {
    el.addEventListener("change", () => {
      // Update selected card styling
      modeCards.forEach((card) => card.classList.remove("selected"));
      const selectedCard = el.closest(".mode-card");
      if (selectedCard) {
        selectedCard.classList.add("selected");
      }
      updateGameMode();
    });
  });

  // Apply the values the initially selected game mode
  updateGameMode();

  controller.addEventListener("gameStateChange", onGameStateChange);

  controller.addEventListener("pieceFellDown", ({ score }) => {
    elements.scoreScore.textContent = String(score.removedRows);
    elements.scoreCubesPlayed.textContent = String(score.fallenCubes);

    const coloredBlocks = Array.from<HTMLElement>(
      document.querySelectorAll("#left-column-colored-blocks > div")
    );
    coloredBlocks.reverse(); // Apply color from bottom to top
    for (let i = 0; i < coloredBlocks.length; i++) {
      coloredBlocks[i].style.backgroundColor =
        i < score.fallenCubesHeight ? COLORS[i] : "transparent";
    }
  });
};
