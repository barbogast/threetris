import { create } from "zustand";
import { persist } from "zustand/middleware";
import { AppState } from "./types";
import { getAllDefaults } from "./config";

const useAppStore = create<AppState>()(
  persist(
    () => ({
      settings: getAllDefaults(),
    }),
    {
      name: "bear-storage",
    }
  )
);

export const updateSettings = (settings: Partial<AppState["settings"]>) => {
  useAppStore.setState((state) => ({
    settings: {
      ...state.settings,
      ...settings,
    },
  }));
};

export default useAppStore;
