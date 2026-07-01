import { describe, expect, it } from "vitest";
import {
  formatInterval,
  formatScheduleSummary,
} from "./card-list-item.utils";

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
