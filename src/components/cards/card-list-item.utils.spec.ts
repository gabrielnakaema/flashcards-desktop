import { describe, expect, it } from "vitest";
import {
  formatInterval,
  formatScheduleSummary,
  getCardAnswerPreview,
} from "./card-list-item.utils";
import type { Card } from "@/types/card";

const baseCard: Card = {
  id: "card-1",
  deckId: "deck-1",
  type: "plain",
  front: "What is gravity?",
  back: "A force",
  content: {},
  hint: null,
  explanation: null,
  sourceExcerpt: null,
  difficulty: null,
  tags: [],
  isSuspended: false,
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
};

describe("card-list-item.utils", () => {
  describe("formatInterval", () => {
    it("formats same-day intervals", () => {
      expect(formatInterval(0)).toBe("Same day");
    });

    it("formats single-day intervals", () => {
      expect(formatInterval(1)).toBe("1 day");
    });

    it("formats multi-day intervals", () => {
      expect(formatInterval(3)).toBe("3 days");
    });
  });

  describe("getCardAnswerPreview", () => {
    it("returns the back text for plain cards", () => {
      expect(getCardAnswerPreview(baseCard)).toBe("A force");
    });

    it("returns the correct choice for multiple choice cards", () => {
      expect(
        getCardAnswerPreview({
          ...baseCard,
          type: "multiple_choice",
          content: {
            choices: [
              { id: "a", text: "Earth" },
              { id: "b", text: "Jupiter" },
            ],
            correctChoiceId: "a",
          },
        })
      ).toBe("Earth");
    });

    it("returns the accepted answer for typed answer cards", () => {
      expect(
        getCardAnswerPreview({
          ...baseCard,
          type: "typed_answer",
          content: {
            acceptedAnswer: "Paris",
          },
        })
      ).toBe("Paris");
    });
  });

  describe("formatScheduleSummary", () => {
    it("includes due date and interval text", () => {
      expect(
        formatScheduleSummary({
          cardId: "card-1",
          state: "review",
          dueAt: "2024-01-02T15:00:00.000Z",
          intervalDays: 3,
          easeFactor: 2.5,
          repetitionCount: 1,
          lapseCount: 0,
          lastReviewedAt: null,
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-01T00:00:00.000Z",
        })
      ).toMatch(/Due .+ · 3 days interval/);
    });
  });
});
