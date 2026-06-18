import { z } from "zod";

export const cardTypeSchema = z.enum([
  "plain",
  "multiple_choice",
  "typed_answer",
]);
export type CardType = z.infer<typeof cardTypeSchema>;

export const ratingSchema = z.enum(["again", "hard", "good", "easy"]);
export type Rating = z.infer<typeof ratingSchema>;

export const cardStateSchema = z.enum([
  "new",
  "learning",
  "review",
  "relearning",
]);
export type CardState = z.infer<typeof cardStateSchema>;

const cardChoiceSchema = z.object({
  id: z.string(),
  text: z.string(),
});
export const plainCardContentSchema = z.object({});
export const multipleChoiceCardContentSchema = z.object({
  question: z.string().optional(),
  choices: z.array(cardChoiceSchema),
  correctChoiceId: z.string(),
});
export const typedAnswerCardContentSchema = z.object({
  prompt: z.string().optional(),
  acceptedAnswer: z.string(),
  aliases: z.array(z.string()).optional(),
  caseSensitive: z.boolean().optional(),
});

const jsonField = <T extends z.ZodType>(schema: T) =>
  z.preprocess((v) => (typeof v === "string" ? JSON.parse(v) : v), schema);

export const cardBaseSchema = z.object({
  id: z.string(),
  deckId: z.string(),
  type: cardTypeSchema,
  front: z.string(),
  back: z.string().nullable(),
  content: z.preprocess(
    (v) => (typeof v === "string" ? JSON.parse(v) : v),
    z.record(z.string(), z.unknown())
  ),
  hint: z.string().nullable(),
  explanation: z.string().nullable(),
  sourceExcerpt: z.string().nullable(),
  difficulty: z.enum(["easy", "medium", "hard"]).nullable(),
  tags: z.preprocess(
    (v) => (typeof v === "string" ? JSON.parse(v) : v),
    z.array(z.string())
  ),
  isSuspended: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const cardSchema = z.discriminatedUnion("type", [
  cardBaseSchema.extend({
    type: z.literal("plain"),
    content: jsonField(plainCardContentSchema),
  }),
  cardBaseSchema.extend({
    type: z.literal("multiple_choice"),
    content: jsonField(multipleChoiceCardContentSchema),
  }),
  cardBaseSchema.extend({
    type: z.literal("typed_answer"),
    content: jsonField(typedAnswerCardContentSchema),
  }),
]);

export type Card = z.infer<typeof cardSchema>;

export const cardScheduleSchema = z.object({
  cardId: z.string(),
  state: cardStateSchema,
  dueAt: z.string().nullable(),
  intervalDays: z.number(),
  easeFactor: z.number(),
  repetitionCount: z.number(),
  lapseCount: z.number(),
  lastReviewedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type CardSchedule = z.infer<typeof cardScheduleSchema>;

export const reviewLogSchema = z.object({
  id: z.string(),
  cardId: z.string(),
  deckId: z.string(),
  rating: ratingSchema,
  response: z.string().nullable(),
  wasCorrect: z.number().nullable(),
  reviewedAt: z.string(),
  previousDueAt: z.string().nullable(),
  nextDueAt: z.string().nullable(),
  elapsedMs: z.number().nullable(),
});
export type ReviewLog = z.infer<typeof reviewLogSchema>;

export type CardWithSchedule = Card & { schedule: CardSchedule };

export interface CreateCardPayload {
  deckId: string;
  type: CardType;
  front: string;
  back?: string;
  content?: Record<string, unknown>;
  hint?: string;
  explanation?: string;
  sourceExcerpt?: string;
  difficulty?: string;
  tags?: string[];
}

export interface UpdateCardPayload extends Partial<
  Omit<CreateCardPayload, "deckId">
> {
  id: string;
}

export interface SubmitReviewPayload {
  cardId: string;
  deckId: string;
  rating: Rating;
  response?: string;
  wasCorrect?: boolean;
  elapsedMs?: number;
}

export const toCard = (data: unknown): z.ZodSafeParseResult<Card> => {
  return cardSchema.safeParse(data);
};

export const toCardSchedule = (
  data: unknown
): z.ZodSafeParseResult<CardSchedule> => {
  return cardScheduleSchema.safeParse(data);
};

export const toReviewLog = (data: unknown): z.ZodSafeParseResult<ReviewLog> => {
  return reviewLogSchema.safeParse(data);
};
