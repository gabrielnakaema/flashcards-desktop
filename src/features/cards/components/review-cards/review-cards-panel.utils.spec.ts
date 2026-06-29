import { describe, expect, it } from "vitest";
import type { GeneratedCard } from "@/features/llm";
import {
  doGeneratedCardsExtendPrevious,
  getGeneratedCardDraftId,
  reconcileGeneratedCardDrafts,
} from "./review-cards-panel.utils";

const plainCard: GeneratedCard = {
  type: "plain",
  front: "What is gravity?",
  back: "A force",
};

const multipleChoiceCard: GeneratedCard = {
  type: "multiple_choice",
  front: "Which planet is largest?",
  hint: "It is a gas giant.",
  explanation: "Jupiter is the largest planet.",
  sourceExcerpt: "Jupiter has the greatest mass.",
  difficulty: "easy",
  tags: ["space", "planets"],
  content: {
    question: "Which planet is largest?",
    choices: [
      { id: "a", text: "Earth" },
      { id: "b", text: "Jupiter" },
    ],
    correctChoiceId: "b",
  },
};

const typedAnswerCard: GeneratedCard = {
  type: "typed_answer",
  front: "Capital of France?",
  content: {
    prompt: "Capital of France?",
    acceptedAnswer: "Paris",
    aliases: ["City of Light", "Paris, France"],
    caseSensitive: true,
  },
};

describe("review-cards-panel.utils", () => {
  it("initializes drafts with stable IDs, approval, defaults, and type-specific values", () => {
    const drafts = reconcileGeneratedCardDrafts(
      [],
      [],
      [plainCard, multipleChoiceCard, typedAnswerCard]
    );

    expect(drafts).toEqual([
      {
        id: "generated-card-0",
        approved: true,
        values: {
          type: "plain",
          front: "What is gravity?",
          back: "A force",
          hint: "",
          explanation: "",
          sourceExcerpt: "",
          difficulty: "",
          tags: "",
          choices: [
            { id: "a", text: "" },
            { id: "b", text: "" },
          ],
          correctChoiceId: "",
          acceptedAnswer: "",
          aliases: "",
          caseSensitive: false,
        },
      },
      {
        id: "generated-card-1",
        approved: true,
        values: {
          type: "multiple_choice",
          front: "Which planet is largest?",
          back: "",
          hint: "It is a gas giant.",
          explanation: "Jupiter is the largest planet.",
          sourceExcerpt: "Jupiter has the greatest mass.",
          difficulty: "easy",
          tags: "space, planets",
          choices: [
            { id: "a", text: "Earth" },
            { id: "b", text: "Jupiter" },
          ],
          correctChoiceId: "b",
          acceptedAnswer: "",
          aliases: "",
          caseSensitive: false,
        },
      },
      {
        id: "generated-card-2",
        approved: true,
        values: {
          type: "typed_answer",
          front: "Capital of France?",
          back: "",
          hint: "",
          explanation: "",
          sourceExcerpt: "",
          difficulty: "",
          tags: "",
          choices: [
            { id: "a", text: "" },
            { id: "b", text: "" },
          ],
          correctChoiceId: "",
          acceptedAnswer: "Paris",
          aliases: "City of Light, Paris, France",
          caseSensitive: true,
        },
      },
    ]);
    expect(getGeneratedCardDraftId(12)).toBe("generated-card-12");
  });

  it("preserves edited values, approval, and object identity when cards append", () => {
    const [initialDraft] = reconcileGeneratedCardDrafts([], [], [plainCard]);
    const editedDraft = {
      ...initialDraft,
      approved: false,
      values: {
        ...initialDraft.values,
        front: "Edited question",
        back: "Edited answer",
      },
    };

    const reconciled = reconcileGeneratedCardDrafts(
      [editedDraft],
      [plainCard],
      [plainCard, typedAnswerCard]
    );

    expect(reconciled).toHaveLength(2);
    expect(reconciled[0]).toBe(editedDraft);
    expect(reconciled[0].approved).toBe(false);
    expect(reconciled[0].values.front).toBe("Edited question");
    expect(reconciled[1]).toMatchObject({
      id: "generated-card-1",
      approved: true,
    });
  });

  it("preserves discarded historical indexes as tombstones while appending", () => {
    const initialDrafts = reconcileGeneratedCardDrafts(
      [],
      [],
      [plainCard, multipleChoiceCard]
    );

    const reconciled = reconcileGeneratedCardDrafts(
      [initialDrafts[0]],
      [plainCard, multipleChoiceCard],
      [plainCard, multipleChoiceCard, typedAnswerCard]
    );

    expect(reconciled.map((draft) => draft.id)).toEqual([
      "generated-card-0",
      "generated-card-2",
    ]);
    expect(reconciled[0]).toBe(initialDrafts[0]);
  });

  it("rebuilds and re-approves every draft for a non-prefix replacement", () => {
    const [initialDraft] = reconcileGeneratedCardDrafts([], [], [plainCard]);
    const editedDraft = {
      ...initialDraft,
      approved: false,
      values: { ...initialDraft.values, front: "Edited question" },
    };

    const reconciled = reconcileGeneratedCardDrafts(
      [editedDraft],
      [plainCard],
      [typedAnswerCard]
    );

    expect(reconciled).toHaveLength(1);
    expect(reconciled[0]).not.toBe(editedDraft);
    expect(reconciled[0]).toMatchObject({
      id: "generated-card-0",
      approved: true,
      values: {
        type: "typed_answer",
        front: "Capital of France?",
        acceptedAnswer: "Paris",
      },
    });
  });

  it("does not duplicate serialization-identical final cards and retains draft identity", () => {
    const streamedCards = [plainCard, multipleChoiceCard];
    const currentDrafts = reconcileGeneratedCardDrafts([], [], streamedCards);
    const finalCards = JSON.parse(
      JSON.stringify(streamedCards)
    ) as GeneratedCard[];

    const reconciled = reconcileGeneratedCardDrafts(
      currentDrafts,
      streamedCards,
      finalCards
    );

    expect(reconciled).toHaveLength(2);
    expect(reconciled[0]).toBe(currentDrafts[0]);
    expect(reconciled[1]).toBe(currentDrafts[1]);
  });

  it("uses current JSON serialization semantics, including property order", () => {
    const first: GeneratedCard = {
      type: "plain",
      front: "Question",
      back: "Answer",
    };
    const sameOrder: GeneratedCard = {
      type: "plain",
      front: "Question",
      back: "Answer",
    };
    const differentOrder: GeneratedCard = {
      front: "Question",
      type: "plain",
      back: "Answer",
    };

    expect(doGeneratedCardsExtendPrevious([first], [sameOrder])).toBe(true);
    expect(doGeneratedCardsExtendPrevious([first], [differentOrder])).toBe(
      false
    );
  });
});
