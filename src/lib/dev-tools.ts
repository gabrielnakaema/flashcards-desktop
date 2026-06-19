const DEV_TOOLS_STORAGE_KEY = "flashcards:dev-mode";

export const isDevToolsEnabled = (): boolean => {
  if (!import.meta.env.DEV) {
    return false;
  }

  try {
    return globalThis.localStorage?.getItem(DEV_TOOLS_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
};
