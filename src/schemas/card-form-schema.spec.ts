import { describe, expect, it } from "vitest";
import type { Card } from "@/types/card";
import {
  cardFormSchema,
  cardToFormValues,
  formValuesToCreatePayload,
  formValuesToUpdatePayload,
  getDefaultCardFormValues,
  nextChoiceId,
} from "./card-form-schema";

const baseValid = {
  type: "plain" as const,
  front: "What is the capital of France?",
  back: "Paris",
  caseSensitive: false,
};

describe("cardFormSchema", () => {
  describe("front", () => {
    it("accepts a non-empty front", () => {
      const result = cardFormSchema.safeParse(baseValid);
      expect(result.success).toBe(true);
    });

    it("rejects an empty front", () => {
      const result = cardFormSchema.safeParse({ ...baseValid, front: "" });
      expect(result.success).toBe(false);
      const paths = result.error?.issues.map((i) => i.path).flat();
      expect(paths).toContain("front");
    });
  });

  describe("tags", () => {
    it("accepts when tags is omitted", () => {
      const result = cardFormSchema.safeParse(baseValid);
      expect(result.success).toBe(true);
    });

    it("accepts an empty string for tags", () => {
      const result = cardFormSchema.safeParse({ ...baseValid, tags: "" });
      expect(result.success).toBe(true);
    });

    it("accepts multiple comma-separated tags", () => {
      const result = cardFormSchema.safeParse({
        ...baseValid,
        tags: "vocab, n5",
      });
      expect(result.success).toBe(true);
    });

    it("rejects a trailing comma", () => {
      const result = cardFormSchema.safeParse({
        ...baseValid,
        tags: "vocab,",
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toMatch(
        /tag at position 2 is empty/i,
      );
    });

    it("rejects a leading comma", () => {
      const result = cardFormSchema.safeParse({
        ...baseValid,
        tags: ",vocab",
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toMatch(
        /tag at position 1 is empty/i,
      );
    });

    it("rejects consecutive commas", () => {
      const result = cardFormSchema.safeParse({
        ...baseValid,
        tags: "vocab,,n5",
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toMatch(
        /tag at position 2 is empty/i,
      );
    });
  });

  describe("plain type", () => {
    it("accepts a valid plain card", () => {
      const result = cardFormSchema.safeParse(baseValid);
      expect(result.success).toBe(true);
    });

    it("rejects when back is empty", () => {
      const result = cardFormSchema.safeParse({ ...baseValid, back: "" });
      expect(result.success).toBe(false);
      const paths = result.error?.issues.map((i) => i.path).flat();
      expect(paths).toContain("back");
    });

    it("rejects when back is whitespace only", () => {
      const result = cardFormSchema.safeParse({ ...baseValid, back: "   " });
      expect(result.success).toBe(false);
      const paths = result.error?.issues.map((i) => i.path).flat();
      expect(paths).toContain("back");
    });
  });

  describe("multiple_choice type", () => {
    const validMultipleChoice = {
      type: "multiple_choice" as const,
      front: "Which planet is largest?",
      caseSensitive: false,
      choices: [
        { id: "a", text: "Earth" },
        { id: "b", text: "Jupiter" },
      ],
      correctChoiceId: "b",
    };

    it("accepts a fully valid multiple_choice card", () => {
      const result = cardFormSchema.safeParse(validMultipleChoice);
      expect(result.success).toBe(true);
    });

    it("rejects fewer than 2 choices", () => {
      const result = cardFormSchema.safeParse({
        ...validMultipleChoice,
        choices: [{ id: "a", text: "Earth" }],
      });
      expect(result.success).toBe(false);
      const msg = result.error?.issues.find((i) =>
        i.message.match(/at least two choices/i),
      );
      expect(msg).toBeDefined();
    });

    it("rejects when a choice has empty text", () => {
      const result = cardFormSchema.safeParse({
        ...validMultipleChoice,
        choices: [
          { id: "a", text: "Earth" },
          { id: "b", text: "   " },
        ],
      });
      expect(result.success).toBe(false);
      const msg = result.error?.issues.find((i) =>
        i.message.match(/choice text is required/i),
      );
      expect(msg).toBeDefined();
    });

    it("rejects when correctChoiceId is missing", () => {
      const result = cardFormSchema.safeParse({
        ...validMultipleChoice,
        correctChoiceId: "",
      });
      expect(result.success).toBe(false);
      const msg = result.error?.issues.find((i) =>
        i.message.match(/select the correct choice/i),
      );
      expect(msg).toBeDefined();
    });

    it("rejects when correctChoiceId does not match any choice", () => {
      const result = cardFormSchema.safeParse({
        ...validMultipleChoice,
        correctChoiceId: "z",
      });
      expect(result.success).toBe(false);
      const msg = result.error?.issues.find((i) =>
        i.message.match(/correct choice must match one of the options/i),
      );
      expect(msg).toBeDefined();
    });
  });

  describe("typed_answer type", () => {
    const validTypedAnswer = {
      type: "typed_answer" as const,
      front: "Capital of France?",
      caseSensitive: false,
      acceptedAnswer: "Paris",
    };

    it("accepts a valid typed_answer card", () => {
      const result = cardFormSchema.safeParse(validTypedAnswer);
      expect(result.success).toBe(true);
    });

    it("rejects when acceptedAnswer is empty", () => {
      const result = cardFormSchema.safeParse({
        ...validTypedAnswer,
        acceptedAnswer: "",
      });
      expect(result.success).toBe(false);
      const paths = result.error?.issues.map((i) => i.path).flat();
      expect(paths).toContain("acceptedAnswer");
    });

    it("rejects when acceptedAnswer is whitespace only", () => {
      const result = cardFormSchema.safeParse({
        ...validTypedAnswer,
        acceptedAnswer: "   ",
      });
      expect(result.success).toBe(false);
      const paths = result.error?.issues.map((i) => i.path).flat();
      expect(paths).toContain("acceptedAnswer");
    });
  });
});

describe("nextChoiceId", () => {
  it("returns 'a' when choices is empty", () => {
    expect(nextChoiceId([])).toBe("a");
  });

  it("returns 'c' when a and b are already used", () => {
    expect(
      nextChoiceId([
        { id: "a", text: "one" },
        { id: "b", text: "two" },
      ]),
    ).toBe("c");
  });

  it("skips used letters and returns the first available one", () => {
    const choices = [
      { id: "a", text: "one" },
      { id: "b", text: "two" },
      { id: "c", text: "three" },
    ];
    expect(nextChoiceId(choices)).toBe("d");
  });
});

const makeCard = (overrides: Partial<Card> = {}): Card => ({
  id: "card-1",
  deckId: "deck-1",
  type: "plain",
  front: "What is gravity?",
  back: "A force",
  content: {} as any,
  hint: "Physics",
  explanation: "Newton's law",
  sourceExcerpt: "Principia",
  difficulty: "medium",
  tags: ["physics", "mechanics"],
  isSuspended: false,
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
  ...overrides,
});

describe("cardToFormValues", () => {
  it("returns default values when no card is passed", () => {
    expect(cardToFormValues(undefined)).toEqual(getDefaultCardFormValues());
  });

  it("maps plain card fields to form values", () => {
    const card = makeCard();
    const values = cardToFormValues(card);

    expect(values.type).toBe("plain");
    expect(values.front).toBe("What is gravity?");
    expect(values.back).toBe("A force");
    expect(values.hint).toBe("Physics");
    expect(values.explanation).toBe("Newton's law");
    expect(values.sourceExcerpt).toBe("Principia");
    expect(values.difficulty).toBe("medium");
    expect(values.tags).toBe("physics, mechanics");
  });

  it("maps multiple_choice card content (choices, correctChoiceId)", () => {
    const card = makeCard({
      type: "multiple_choice",
      content: {
        choices: [
          { id: "a", text: "Earth" },
          { id: "b", text: "Jupiter" },
        ],
        correctChoiceId: "b",
      },
    });
    const values = cardToFormValues(card);

    expect(values.type).toBe("multiple_choice");
    expect(values.choices).toEqual([
      { id: "a", text: "Earth" },
      { id: "b", text: "Jupiter" },
    ]);
    expect(values.correctChoiceId).toBe("b");
  });

  it("maps typed_answer card content (acceptedAnswer, aliases, caseSensitive)", () => {
    const card = makeCard({
      type: "typed_answer",
      content: {
        acceptedAnswer: "Paris",
        aliases: ["paris", "PARIS"],
        caseSensitive: true,
      },
    });
    const values = cardToFormValues(card);

    expect(values.type).toBe("typed_answer");
    expect(values.acceptedAnswer).toBe("Paris");
    expect(values.aliases).toBe("paris, PARIS");
    expect(values.caseSensitive).toBe(true);
  });

  it("falls back to empty string when card back is null", () => {
    const card = makeCard({ back: null });
    const values = cardToFormValues(card);
    expect(values.back).toBe("");
  });
});

describe("formValuesToCreatePayload", () => {
  it("builds a plain card payload with trimmed front and back", () => {
    const values = {
      ...getDefaultCardFormValues(),
      type: "plain" as const,
      front: "  What is gravity?  ",
      back: "  A force  ",
      tags: "physics, mechanics",
    };

    const payload = formValuesToCreatePayload("deck-1", values);

    expect(payload.deckId).toBe("deck-1");
    expect(payload.type).toBe("plain");
    expect(payload.front).toBe("What is gravity?");
    expect(payload.back).toBe("A force");
    expect(payload.tags).toEqual(["physics", "mechanics"]);
  });

  it("omits optional fields when they are blank", () => {
    const values = {
      ...getDefaultCardFormValues(),
      type: "plain" as const,
      front: "Q",
      back: "A",
    };

    const payload = formValuesToCreatePayload("deck-1", values);

    expect(payload.hint).toBeUndefined();
    expect(payload.explanation).toBeUndefined();
    expect(payload.sourceExcerpt).toBeUndefined();
    expect(payload.difficulty).toBeUndefined();
    expect(payload.tags).toBeUndefined();
  });

  it("builds a multiple_choice payload with content and no back", () => {
    const values = {
      ...getDefaultCardFormValues(),
      type: "multiple_choice" as const,
      front: "Largest planet?",
      choices: [
        { id: "a", text: "Earth" },
        { id: "b", text: "Jupiter" },
      ],
      correctChoiceId: "b",
    };

    const payload = formValuesToCreatePayload("deck-1", values);

    expect(payload.type).toBe("multiple_choice");
    expect(payload.content).toEqual({
      question: "Largest planet?",
      choices: [
        { id: "a", text: "Earth" },
        { id: "b", text: "Jupiter" },
      ],
      correctChoiceId: "b",
    });
    expect(payload.back).toBeUndefined();
  });

  it("builds a typed_answer payload with content", () => {
    const values = {
      ...getDefaultCardFormValues(),
      type: "typed_answer" as const,
      front: "Capital of France?",
      acceptedAnswer: "Paris",
      aliases: "paris, PARIS",
      caseSensitive: false,
    };

    const payload = formValuesToCreatePayload("deck-1", values);

    expect(payload.type).toBe("typed_answer");
    expect(payload.content).toEqual({
      prompt: "Capital of France?",
      acceptedAnswer: "Paris",
      aliases: ["paris", "PARIS"],
      caseSensitive: false,
    });
  });

  it("omits aliases from typed_answer payload when blank", () => {
    const values = {
      ...getDefaultCardFormValues(),
      type: "typed_answer" as const,
      front: "Capital?",
      acceptedAnswer: "Paris",
      aliases: "",
      caseSensitive: false,
    };

    const payload = formValuesToCreatePayload("deck-1", values);

    expect(
      (payload.content as Record<string, unknown>)?.aliases,
    ).toBeUndefined();
  });
});

describe("formValuesToUpdatePayload", () => {
  it("returns an object with id and without deckId", () => {
    const values = {
      ...getDefaultCardFormValues(),
      type: "plain" as const,
      front: "Q",
      back: "A",
    };

    const payload = formValuesToUpdatePayload("card-42", values);

    expect(payload.id).toBe("card-42");
    expect("deckId" in payload).toBe(false);
  });

  it("includes the same fields as createPayload minus deckId", () => {
    const values = {
      ...getDefaultCardFormValues(),
      type: "plain" as const,
      front: "  Q  ",
      back: "  A  ",
      hint: "hint text",
    };

    const payload = formValuesToUpdatePayload("card-1", values);

    expect(payload.front).toBe("Q");
    expect(payload.back).toBe("A");
    expect(payload.hint).toBe("hint text");
  });
});
