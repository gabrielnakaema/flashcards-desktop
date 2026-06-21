import { cardDifficultySchema, cardTypeSchema, type Card } from "@/types/card";
import type { CreateCardPayload, UpdateCardPayload } from "@/types/card";
import { z } from "zod";

const tagsSchema = z
  .string()
  .optional()
  .superRefine((val, ctx) => {
    if (!val) return;
    const tags = val.split(",").map((t) => t.trim());
    tags.forEach((tag, index) => {
      if (tag.length === 0) {
        ctx.addIssue({
          code: "custom",
          message: `Tag at position ${index + 1} is empty. Remove trailing or consecutive commas.`,
        });
      }
    });
  });

const choiceSchema = z.object({
  id: z.string().min(1),
  text: z.string(),
});

export const cardFormSchema = z
  .object({
    type: cardTypeSchema,
    front: z.string().min(1, "Front is required"),
    back: z.string().optional(),
    hint: z.string().optional(),
    explanation: z.string().optional(),
    sourceExcerpt: z.string().optional(),
    difficulty: z.string().optional(),
    tags: tagsSchema,
    choices: z.array(choiceSchema).optional(),
    correctChoiceId: z.string().optional(),
    acceptedAnswer: z.string().optional(),
    aliases: z.string().optional(),
    caseSensitive: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (data.type === "plain" && !data.back?.trim()) {
      ctx.addIssue({
        code: "custom",
        message: "Back is required for plain cards",
        path: ["back"],
      });
    }

    if (data.type === "multiple_choice") {
      if (!data.choices || data.choices.length < 2) {
        ctx.addIssue({
          code: "custom",
          message: "At least two choices are required",
          path: ["choices"],
        });
      }

      data.choices?.forEach((choice, index) => {
        if (!choice.text.trim()) {
          ctx.addIssue({
            code: "custom",
            message: "Choice text is required",
            path: ["choices", index, "text"],
          });
        }
      });

      if (!data.correctChoiceId) {
        ctx.addIssue({
          code: "custom",
          message: "Select the correct choice",
          path: ["correctChoiceId"],
        });
      } else if (
        data.choices &&
        !data.choices.some((choice) => choice.id === data.correctChoiceId)
      ) {
        ctx.addIssue({
          code: "custom",
          message: "Correct choice must match one of the options",
          path: ["correctChoiceId"],
        });
      }
    }

    if (data.type === "typed_answer" && !data.acceptedAnswer?.trim()) {
      ctx.addIssue({
        code: "custom",
        message: "Accepted answer is required",
        path: ["acceptedAnswer"],
      });
    }
  });

export type CardFormValues = z.infer<typeof cardFormSchema>;

const DEFAULT_CHOICES: CardFormValues["choices"] = [
  { id: "a", text: "" },
  { id: "b", text: "" },
];

export const getDefaultCardFormValues = (): CardFormValues => ({
  type: "plain",
  front: "",
  back: "",
  hint: "",
  explanation: "",
  sourceExcerpt: "",
  difficulty: "",
  tags: "",
  choices: DEFAULT_CHOICES,
  correctChoiceId: "",
  acceptedAnswer: "",
  aliases: "",
  caseSensitive: false,
});

export const nextChoiceId = (
  choices: NonNullable<CardFormValues["choices"]>
): string => {
  const letters = "abcdefghijklmnopqrstuvwxyz";
  const used = new Set(choices.map((choice) => choice.id));

  for (const letter of letters) {
    if (!used.has(letter)) return letter;
  }

  return crypto.randomUUID().slice(0, 4);
};

const parseTags = (tags?: string): string[] | undefined => {
  const parsed =
    tags
      ?.split(",")
      .map((tag) => tag.trim())
      .filter(Boolean) ?? [];
  return parsed.length > 0 ? parsed : undefined;
};

const parseAliases = (aliases?: string): string[] | undefined => {
  const parsed =
    aliases
      ?.split(",")
      .map((alias) => alias.trim())
      .filter(Boolean) ?? [];
  return parsed.length > 0 ? parsed : undefined;
};

const optionalText = (value?: string): string | undefined => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

const optionalDifficulty = (
  value?: string
): CreateCardPayload["difficulty"] | undefined => {
  const result = cardDifficultySchema.safeParse(optionalText(value));
  return result.success ? result.data : undefined;
};

export const cardToFormValues = (card?: Card): CardFormValues => {
  if (!card) {
    return getDefaultCardFormValues();
  }

  const base: CardFormValues = {
    type: card.type,
    front: card.front,
    back: card.back ?? "",
    hint: card.hint ?? "",
    explanation: card.explanation ?? "",
    sourceExcerpt: card.sourceExcerpt ?? "",
    difficulty: card.difficulty ?? "",
    tags: card.tags.join(", "),
    choices: DEFAULT_CHOICES,
    correctChoiceId: "",
    acceptedAnswer: "",
    aliases: "",
    caseSensitive: false,
  };

  if (card.type === "multiple_choice") {
    const content = card.content as {
      choices?: CardFormValues["choices"];
      correctChoiceId?: string;
    };

    return {
      ...base,
      choices: content.choices?.length ? content.choices : DEFAULT_CHOICES,
      correctChoiceId: content.correctChoiceId ?? "",
    };
  }

  if (card.type === "typed_answer") {
    const content = card.content as {
      acceptedAnswer?: string;
      aliases?: string[];
      caseSensitive?: boolean;
    };

    return {
      ...base,
      acceptedAnswer: content.acceptedAnswer ?? "",
      aliases: content.aliases?.join(", ") ?? "",
      caseSensitive: content.caseSensitive ?? false,
    };
  }

  return base;
};

export const formValuesToCreatePayload = (
  deckId: string,
  values: CardFormValues
): CreateCardPayload => {
  const base = {
    deckId,
    front: values.front.trim(),
    hint: optionalText(values.hint),
    explanation: optionalText(values.explanation),
    sourceExcerpt: optionalText(values.sourceExcerpt),
    difficulty: optionalDifficulty(values.difficulty),
    tags: parseTags(values.tags),
  };

  if (values.type === "plain") {
    return {
      ...base,
      type: "plain",
      back: values.back!.trim(),
    };
  }

  if (values.type === "multiple_choice") {
    return {
      ...base,
      type: "multiple_choice",
      content: {
        question: values.front,
        choices: values.choices ?? [],
        correctChoiceId: values.correctChoiceId ?? "",
      },
    };
  }

  const aliases = parseAliases(values.aliases);
  return {
    ...base,
    type: "typed_answer",
    content: {
      prompt: values.front,
      acceptedAnswer: values.acceptedAnswer!.trim(),
      ...(aliases ? { aliases } : {}),
      caseSensitive: values.caseSensitive,
    },
  };
};

export const formValuesToUpdatePayload = (
  id: string,
  values: CardFormValues
): UpdateCardPayload => {
  const { deckId: _, ...createPayload } = formValuesToCreatePayload("", values);

  return {
    id,
    ...createPayload,
  };
};
