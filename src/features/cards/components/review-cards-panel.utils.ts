import type { CardFormValues } from "@/features/cards/schemas/card-form-schema";
import type { GeneratedCard } from "@/features/llm";

export interface GeneratedCardDraft {
  id: string;
  approved: boolean;
  values: CardFormValues;
}

const generatedCardToFormValues = (card: GeneratedCard): CardFormValues => {
  const base: CardFormValues = {
    type: card.type,
    front: card.front,
    back: card.back ?? "",
    hint: card.hint ?? "",
    explanation: card.explanation ?? "",
    sourceExcerpt: card.sourceExcerpt ?? "",
    difficulty: card.difficulty ?? "",
    tags: card.tags?.join(", ") ?? "",
    choices: [
      { id: "a", text: "" },
      { id: "b", text: "" },
    ],
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
      choices: content.choices?.length ? content.choices : base.choices,
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

export const getGeneratedCardDraftId = (index: number): string =>
  `generated-card-${index}`;

const generatedCardToDraft = (
  card: GeneratedCard,
  index: number
): GeneratedCardDraft => ({
  id: getGeneratedCardDraftId(index),
  approved: true,
  values: generatedCardToFormValues(card),
});

const areGeneratedCardsEqual = (
  first: GeneratedCard,
  second: GeneratedCard
): boolean => JSON.stringify(first) === JSON.stringify(second);

export const doGeneratedCardsExtendPrevious = (
  previousCards: GeneratedCard[],
  cards: GeneratedCard[]
): boolean =>
  cards.length >= previousCards.length &&
  previousCards.every((card, index) =>
    areGeneratedCardsEqual(card, cards[index])
  );

export const reconcileGeneratedCardDrafts = (
  currentDrafts: GeneratedCardDraft[],
  previousCards: GeneratedCard[],
  cards: GeneratedCard[]
): GeneratedCardDraft[] => {
  if (!doGeneratedCardsExtendPrevious(previousCards, cards)) {
    return cards.map(generatedCardToDraft);
  }

  const currentById = new Map(
    currentDrafts.map((draft) => [draft.id, draft])
  );

  return cards.flatMap((card, index) => {
    const existingDraft = currentById.get(getGeneratedCardDraftId(index));

    if (existingDraft) {
      return [existingDraft];
    }

    return index < previousCards.length
      ? []
      : [generatedCardToDraft(card, index)];
  });
};
