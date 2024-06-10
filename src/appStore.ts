import { create } from "zustand";
import { persist } from "zustand/middleware";
import { AppState } from "./types";

const useAppStore = create<AppState>()(
  persist(
    () => ({
      settings: {
        shaftSizeX: 4,
        shaftSizeY: 10,
        shaftSizeZ: 4,
        fallingSpeed: 15,
        fov: 750,
        positionX: 0.0,
        positionY: 2.0,
        positionZ: 0.0,
        lookAtX: 0,
        lookAtY: 1,
        lookAtZ: 0,
      },
    }),
    {
      name: "bear-storage",
    }
  )
);

export default useAppStore;
