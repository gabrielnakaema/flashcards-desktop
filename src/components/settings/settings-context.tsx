import { createContext, useEffect, useState } from "react";
import { clearDevClock, initializeDevClock } from "@/lib/dev-clock";
import { z } from "zod";
import { llmProviderIdSchema } from "@/types/llm";

const SETTINGS_STORAGE_KEY = "flashcards:settings";

const settingsSchema = z.object({
  devMode: z.enum(["off", "on"]).default("off"),
  apiKey: z.string().optional().nullable(),
  saveApiSettings: z.boolean().default(false),
  defaultProvider: llmProviderIdSchema.default("openai"),
  defaultModel: z.string().default("gpt-4.1-mini").optional().nullable(),
});

type SettingsData = z.infer<typeof settingsSchema>;

interface SettingsContextType {
  data: SettingsData;
  setData: (data: SettingsData) => void;
}

const defaults = settingsSchema.parse({});

const loadSettings = (): SettingsData => {
  try {
    const raw = globalThis.localStorage?.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return defaults;
    const result = settingsSchema.safeParse(JSON.parse(raw));
    const data = result.success ? result.data : defaults;
    if (!import.meta.env.DEV) {
      data.devMode = "off";
    }
    return data;
  } catch {
    return defaults;
  }
};

const saveSettings = (data: SettingsData): void => {
  try {
    globalThis.localStorage?.setItem(
      SETTINGS_STORAGE_KEY,
      JSON.stringify(data)
    );
  } catch {
    // ignore
  }
};

const clearSettings = (): void => {
  try {
    globalThis.localStorage?.removeItem(SETTINGS_STORAGE_KEY);
  } catch {
    // ignore
  }
};

export const SettingsContext = createContext<SettingsContextType>({
  data: defaults,
  setData: () => {},
});

export const SettingsProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [data, setDataState] = useState<SettingsData>(loadSettings);

  const setData = (next: SettingsData) => {
    if (next.saveApiSettings) {
      saveSettings(next);
    } else {
      clearSettings();
    }
    setDataState(next);
  };

  useEffect(() => {
    if (data.devMode === "on") {
      initializeDevClock();
    } else {
      clearDevClock();
    }
  }, [data.devMode]);

  return (
    <SettingsContext.Provider value={{ data, setData }}>
      {children}
    </SettingsContext.Provider>
  );
};
