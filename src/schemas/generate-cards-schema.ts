import { z } from "zod";

export const generateCardsSchema = z.object({
  provider: z.string().min(1),
  systemPrompt: z.string().min(1),
  prompt: z.string().min(1),
  apiKey: z.string().min(1),
});

export type GenerateCardsSchema = z.infer<typeof generateCardsSchema>;
