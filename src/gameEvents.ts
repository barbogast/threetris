import { GameScore, GameState } from "./gameState";
import { Settings } from "./types";

type Events = {
  settingsUpdate: {
    settings: Settings;
  };
  gameStateChange: {
    gameState: GameState;
  };
  scoreUpdate: {
    score: GameScore;
  };
  rendererUpdate: {
    geometries: number;
  };
};

class GameEvents {
  #domElement: Element;
  constructor(domElement: Element) {
    this.#domElement = domElement;
  }

  addListener = <Name extends keyof Events>(
    name: Name,
    callback: (detail: Events[Name]) => void
  ) => {
    this.#domElement.addEventListener(name, (event) =>
      callback((event as CustomEvent).detail)
    );
  };

  dispatch = <Name extends keyof Events>(name: Name, detail: Events[Name]) => {
    this.#domElement.dispatchEvent(new CustomEvent(name, { detail }));
  };
}

export default GameEvents;
