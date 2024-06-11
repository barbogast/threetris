import { create } from "zustand";
import { persist } from "zustand/middleware";
import { AppState } from "./types";
import { defaultSettings } from "./config";

const useAppStore = create<AppState>()(
  persist(
    () => ({
      settings: defaultSettings,
    }),
    {
      name: "bear-storage",
    }
  )
);

export default useAppStore;
