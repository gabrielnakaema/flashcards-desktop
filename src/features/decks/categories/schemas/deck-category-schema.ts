import { z } from "zod";

export const deckCategorySchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
});

export type DeckCategoryForm = z.infer<typeof deckCategorySchema>;
