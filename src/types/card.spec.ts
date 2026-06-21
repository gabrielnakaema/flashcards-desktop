import { describe, expect, it } from "vitest";
import {
  createCardPayloadSchema,
  multipleChoiceCardContentSchema,
  typedAnswerCardContentSchema,
} from "./card";

describe("card payload schemas", () => {
  it("trims valid plain card payload text fields", () => {
    const result = createCardPayloadSchema.safeParse({
      deckId: " deck-1 ",
      type: "plain",
      front: " What is gravity? ",
      back: " A force that attracts mass. ",
      tags: [" physics "],
    });

    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({
      deckId: "deck-1",
      front: "What is gravity?",
      back: "A force that attracts mass.",
      tags: ["physics"],
    });
  });

  it("rejects plain card payloads without a back", () => {
    const result = createCardPayloadSchema.safeParse({
      deckId: "deck-1",
      type: "plain",
      front: "What is gravity?",
      back: "   ",
    });

    expect(result.success).toBe(false);
  });

  it("requires multiple choice cards to have at least two choices", () => {
    const result = multipleChoiceCardContentSchema.safeParse({
      choices: [{ id: "a", text: "Earth" }],
      correctChoiceId: "a",
    });

    expect(result.success).toBe(false);
  });

  it("requires the correct choice id to match a choice", () => {
    const result = multipleChoiceCardContentSchema.safeParse({
      choices: [
        { id: "a", text: "Earth" },
        { id: "b", text: "Jupiter" },
      ],
      correctChoiceId: "c",
    });

    expect(result.success).toBe(false);
  });

  it("rejects blank multiple choice ids and text", () => {
    const result = multipleChoiceCardContentSchema.safeParse({
      choices: [
        { id: " ", text: "Earth" },
        { id: "b", text: " " },
      ],
      correctChoiceId: "b",
    });

    expect(result.success).toBe(false);
  });

  it("requires a typed answer accepted answer", () => {
    const result = typedAnswerCardContentSchema.safeParse({
      acceptedAnswer: "   ",
    });

    expect(result.success).toBe(false);
  });
});
