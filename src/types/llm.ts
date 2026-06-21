import {
  cardDifficultySchema,
  cardTypeSchema,
  generatedCardPayloadSchema,
  type GeneratedCardPayload,
} from "@/types/card";
import { z } from "zod";

export const llmProviderIdSchema = z.enum(["openai"]);
export type LlmProviderId = z.infer<typeof llmProviderIdSchema>;

export interface LlmModelOption {
  label: string;
  value: string;
}

export type GeneratedCard = GeneratedCardPayload;

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

const optionalText = (value: unknown): string | undefined => {
  const trimmed = typeof value === "string" ? value.trim() : undefined;
  return trimmed ? trimmed : undefined;
};

const optionalTags = (value: unknown): string[] | undefined => {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const tags = value
    .map((tag) => (typeof tag === "string" ? tag.trim() : ""))
    .filter(Boolean);
  return tags.length > 0 ? tags : undefined;
};

const rawGeneratedCardSchema = z.object({
  type: cardTypeSchema,
  front: z.string(),
  back: z.string().nullable().optional(),
  content: z.record(z.string(), z.unknown()).nullable().optional(),
  hint: z.string().nullable().optional(),
  explanation: z.string().nullable().optional(),
  sourceExcerpt: z.string().nullable().optional(),
  difficulty: cardDifficultySchema.nullable().optional(),
  tags: z.array(z.string()).nullable().optional(),
});

const normalizeGeneratedCard = (
  card: z.infer<typeof rawGeneratedCardSchema>
): unknown => {
  const content = isRecord(card.content) ? card.content : {};
  const base = {
    type: card.type,
    front: card.front,
    back: optionalText(card.back),
    hint: optionalText(card.hint),
    explanation: optionalText(card.explanation),
    sourceExcerpt: optionalText(card.sourceExcerpt),
    difficulty: card.difficulty ?? undefined,
    tags: optionalTags(card.tags),
  };

  if (card.type === "plain") {
    return {
      ...base,
      back: card.back ?? "",
    };
  }

  if (card.type === "multiple_choice") {
    return {
      ...base,
      content: {
        question: optionalText(content.question) ?? card.front,
        choices: content.choices ?? [],
        correctChoiceId: content.correctChoiceId ?? "",
      },
    };
  }

  return {
    ...base,
    content: {
      prompt: optionalText(content.prompt) ?? card.front,
      acceptedAnswer: content.acceptedAnswer ?? "",
      aliases: optionalTags(content.aliases),
      caseSensitive: content.caseSensitive ?? false,
    },
  };
};

export const generatedCardSchema = rawGeneratedCardSchema
  .transform(normalizeGeneratedCard)
  .pipe(generatedCardPayloadSchema);

export const generatedCardsResponseSchema = z.object({
  cards: z.array(generatedCardSchema).min(1),
});
