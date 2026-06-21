import { llmProviderIdSchema } from "@/types/llm";
import { z } from "zod";

export const settingsFormSchema = z.object({
  devMode: z.enum(["off", "on"]),
  saveApiSettings: z.boolean().default(false).optional().nullable(),
  defaultProvider: llmProviderIdSchema,
  defaultModel: z.string(),
  apiKey: z.string(),
});

export type SettingsFormValues = z.infer<typeof settingsFormSchema>;
