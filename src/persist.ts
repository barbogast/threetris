import { getAllDefaults } from "./config";
import { Settings } from "./types";

const LCOAL_STORAGE_NAME = "threetris-test1";

export const saveSettings = (settings: Settings) =>
  localStorage.setItem(LCOAL_STORAGE_NAME, JSON.stringify(settings));

export const loadSettings = () =>
  JSON.parse(localStorage.getItem(LCOAL_STORAGE_NAME) || '""') ||
  getAllDefaults();
