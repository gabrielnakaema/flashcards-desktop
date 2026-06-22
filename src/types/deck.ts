import { z } from "zod";

const deckSchema = z.object({
  id: z.string(),
  title: z.string(),
  tags: z.preprocess(
    (value) => JSON.parse(value as string),
    z.array(z.string())
  ),
  category: z.object({
    id: z.string(),
    name: z.string().optional(),
  }),
});

export const toDeck = (data: unknown) => {
  const result = deckSchema.safeParse(data);
  return result;
};

export type Deck = z.infer<typeof deckSchema>;

const deckCategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  totalDecks: z.number().optional().default(0),
});

export type DeckCategory = z.infer<typeof deckCategorySchema>;

export const toDeckCategory = (data: unknown) => {
  const result = deckCategorySchema.safeParse(data);
  return result;
};

export interface CreateDeckPayload {
  title: string;
  tags: string[];
  categoryId: string;
}

export interface UpdateDeckPayload extends CreateDeckPayload {
  id: string;
}

export type DeckWithStats = z.infer<typeof deckWithStatsSchema>;

const deckWithStatsSchema = z.object({
  id: z.string(),
  title: z.string(),
  tags: z.preprocess(
    (value) => JSON.parse(value as string),
    z.array(z.string())
  ),
  category: z.object({
    id: z.string(),
    name: z.string(),
  }),
  cardsDue: z.number(),
  masteryPercentage: z.number(),
  totalCards: z.number(),
});

export const toDeckWithStats = (data: unknown) => {
  const result = deckWithStatsSchema.safeParse(data);
  return result;
};

export interface CreateDeckCategoryPayload {
  name: string;
}

export interface UpdateDeckCategoryPayload extends CreateDeckCategoryPayload {
  id: string;
}
