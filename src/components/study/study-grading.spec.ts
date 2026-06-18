import type { Card } from "@/types/card";
import { describe, expect, it } from "vitest";
import {
  gradeTypedAnswer,
  isCorrectChoice,
  normalizeTypedAnswer,
} from "./study-grading";

const makeTypedCard = (
  content: Extract<Card, { type: "typed_answer" }>["content"]
): Extract<Card, { type: "typed_answer" }> => ({
  id: "typed-1",
  deckId: "deck-1",
  type: "typed_answer",
  front: "Capital of France?",
  back: null,
  content,
  hint: null,
  explanation: null,
  sourceExcerpt: null,
  difficulty: null,
  tags: [],
  isSuspended: false,
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
});

const multipleChoiceCard: Extract<Card, { type: "multiple_choice" }> = {
  id: "choice-1",
  deckId: "deck-1",
  type: "multiple_choice",
  front: "Largest planet?",
  back: null,
  content: {
    choices: [
      { id: "a", text: "Earth" },
      { id: "b", text: "Jupiter" },
    ],
    correctChoiceId: "b",
  },
  hint: null,
  explanation: null,
  sourceExcerpt: null,
  difficulty: null,
  tags: [],
  isSuspended: false,
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
};

describe("study grading", () => {
  it("normalizes whitespace and casing by default", () => {
    expect(normalizeTypedAnswer("  New   York  ")).toBe("new york");
  });

  it("grades exact typed answers as correct", () => {
    const result = gradeTypedAnswer(
      makeTypedCard({ acceptedAnswer: "Paris" }),
      "paris"
    );
    expect(result.isCorrect).toBe(true);
  });

  it("grades aliases as correct", () => {
    const result = gradeTypedAnswer(
      makeTypedCard({ acceptedAnswer: "SQLite", aliases: ["sqlite3"] }),
      "sqlite3"
    );
    expect(result.isCorrect).toBe(true);
  });

  it("respects case-sensitive typed answers", () => {
    const result = gradeTypedAnswer(
      makeTypedCard({ acceptedAnswer: "HTTP", caseSensitive: true }),
      "http"
    );
    expect(result.isCorrect).toBe(false);
  });

  it("grades multiple-choice answers by correct choice id", () => {
    expect(isCorrectChoice(multipleChoiceCard, "b")).toBe(true);
    expect(isCorrectChoice(multipleChoiceCard, "a")).toBe(false);
  });
});
