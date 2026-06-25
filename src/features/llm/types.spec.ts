import { describe, expect, it } from "vitest";
import { generatedCardsResponseSchema } from "./types";

const baseGeneratedCard = {
  hint: null,
  explanation: null,
  sourceExcerpt: null,
  difficulty: null,
  tags: null,
};

describe("generatedCardsResponseSchema", () => {
  it("normalizes provider nulls into generated card payloads", () => {
    const result = generatedCardsResponseSchema.safeParse({
      cards: [
        {
          ...baseGeneratedCard,
          type: "plain",
          front: " What is gravity? ",
          back: " A force that attracts mass. ",
          content: {
            question: null,
            choices: null,
            correctChoiceId: null,
            prompt: null,
            acceptedAnswer: null,
            aliases: null,
            caseSensitive: null,
          },
        },
      ],
    });

    expect(result.success).toBe(true);
    expect(result.data?.cards).toEqual([
      {
        type: "plain",
        front: "What is gravity?",
        back: "A force that attracts mass.",
      },
    ]);
  });

  it("rejects generated plain cards without an answer", () => {
    const result = generatedCardsResponseSchema.safeParse({
      cards: [
        {
          ...baseGeneratedCard,
          type: "plain",
          front: "What is gravity?",
          back: "   ",
          content: null,
        },
      ],
    });

    expect(result.success).toBe(false);
  });

  it("rejects generated multiple choice cards with fewer than two choices", () => {
    const result = generatedCardsResponseSchema.safeParse({
      cards: [
        {
          ...baseGeneratedCard,
          type: "multiple_choice",
          front: "Which planet is largest?",
          back: null,
          content: {
            choices: [{ id: "a", text: "Earth" }],
            correctChoiceId: "a",
          },
        },
      ],
    });

    expect(result.success).toBe(false);
  });

  it("rejects generated multiple choice cards with an invalid correct choice", () => {
    const result = generatedCardsResponseSchema.safeParse({
      cards: [
        {
          ...baseGeneratedCard,
          type: "multiple_choice",
          front: "Which planet is largest?",
          back: null,
          content: {
            choices: [
              { id: "a", text: "Earth" },
              { id: "b", text: "Jupiter" },
            ],
            correctChoiceId: "c",
          },
        },
      ],
    });

    expect(result.success).toBe(false);
  });

  it("rejects generated typed-answer cards without an accepted answer", () => {
    const result = generatedCardsResponseSchema.safeParse({
      cards: [
        {
          ...baseGeneratedCard,
          type: "typed_answer",
          front: "Capital of France?",
          back: null,
          content: {
            acceptedAnswer: "   ",
          },
        },
      ],
    });

    expect(result.success).toBe(false);
  });
});
