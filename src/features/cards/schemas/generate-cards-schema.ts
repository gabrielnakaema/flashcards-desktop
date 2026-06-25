import { llmProviderIdSchema } from "@/features/llm";
import { z } from "zod";

export const generateCardsSchema = z.object({
  provider: llmProviderIdSchema,
  model: z.string().min(1),
  systemPrompt: z.string().min(1),
  prompt: z.string().min(1),
  apiKey: z.string().min(1),
});

export type GenerateCardsSchema = z.infer<typeof generateCardsSchema>;
