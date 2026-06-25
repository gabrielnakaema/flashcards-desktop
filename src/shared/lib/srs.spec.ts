import { describe, expect, it } from "vitest";
import { computeNextSchedule, DEFAULT_EASE_FACTOR } from "./srs";
import type { CardScheduleInput } from "./srs";

const newCard: CardScheduleInput = {
  state: "new",
  intervalDays: 0,
  easeFactor: DEFAULT_EASE_FACTOR,
  repetitionCount: 0,
  lapseCount: 0,
};

const learningCard: CardScheduleInput = {
  state: "learning",
  intervalDays: 0,
  easeFactor: DEFAULT_EASE_FACTOR,
  repetitionCount: 0,
  lapseCount: 0,
};

const reviewCard: CardScheduleInput = {
  state: "review",
  intervalDays: 10,
  easeFactor: DEFAULT_EASE_FACTOR,
  repetitionCount: 5,
  lapseCount: 0,
};

const relearningCard: CardScheduleInput = {
  state: "relearning",
  intervalDays: 1,
  easeFactor: 2.0,
  repetitionCount: 3,
  lapseCount: 1,
};

const fixedDate = new Date("2024-01-15T12:00:00.000Z");

describe("computeNextSchedule", () => {
  describe("new card", () => {
    it("again => stays learning, short interval", () => {
      const result = computeNextSchedule(newCard, "again", fixedDate);
      expect(result.state).toBe("learning");
      expect(result.intervalDays).toBe(0);
      expect(result.repetitionCount).toBe(0);
      expect(result.lapseCount).toBe(0);
      const due = new Date(result.dueAt);
      expect(due.getTime() - fixedDate.getTime()).toBe(10 * 60 * 1000);
    });

    it("hard => stays learning, short interval", () => {
      const result = computeNextSchedule(newCard, "hard", fixedDate);
      expect(result.state).toBe("learning");
      expect(result.intervalDays).toBe(0);
    });

    it("good => graduates to review, interval 1 day", () => {
      const result = computeNextSchedule(newCard, "good", fixedDate);
      expect(result.state).toBe("review");
      expect(result.intervalDays).toBe(1);
      expect(result.repetitionCount).toBe(1);
    });

    it("easy => graduates to review, interval 4 days", () => {
      const result = computeNextSchedule(newCard, "easy", fixedDate);
      expect(result.state).toBe("review");
      expect(result.intervalDays).toBe(4);
      expect(result.repetitionCount).toBe(1);
    });
  });

  describe("learning card", () => {
    it("again => stays learning", () => {
      const result = computeNextSchedule(learningCard, "again", fixedDate);
      expect(result.state).toBe("learning");
    });

    it("good => graduates to review", () => {
      const result = computeNextSchedule(learningCard, "good", fixedDate);
      expect(result.state).toBe("review");
      expect(result.intervalDays).toBe(1);
    });

    it("easy => graduates with 4 day interval", () => {
      const result = computeNextSchedule(learningCard, "easy", fixedDate);
      expect(result.state).toBe("review");
      expect(result.intervalDays).toBe(4);
    });
  });

  describe("review card", () => {
    it("again => lapses to relearning, ease drops", () => {
      const result = computeNextSchedule(reviewCard, "again", fixedDate);
      expect(result.state).toBe("relearning");
      expect(result.intervalDays).toBe(1);
      expect(result.lapseCount).toBe(1);
      expect(result.easeFactor).toBeCloseTo(DEFAULT_EASE_FACTOR - 0.2);
    });

    it("hard => interval * 1.2, ease drops", () => {
      const result = computeNextSchedule(reviewCard, "hard", fixedDate);
      expect(result.state).toBe("review");
      expect(result.intervalDays).toBe(Math.max(1, Math.round(10 * 1.2)));
      expect(result.easeFactor).toBeCloseTo(DEFAULT_EASE_FACTOR - 0.15);
      expect(result.repetitionCount).toBe(reviewCard.repetitionCount + 1);
    });

    it("good => interval * ease, ease unchanged", () => {
      const result = computeNextSchedule(reviewCard, "good", fixedDate);
      expect(result.state).toBe("review");
      expect(result.intervalDays).toBe(
        Math.max(1, Math.round(10 * DEFAULT_EASE_FACTOR))
      );
      expect(result.easeFactor).toBe(DEFAULT_EASE_FACTOR);
    });

    it("easy => interval * ease * 1.3, ease increases", () => {
      const result = computeNextSchedule(reviewCard, "easy", fixedDate);
      expect(result.state).toBe("review");
      expect(result.intervalDays).toBe(
        Math.max(1, Math.round(10 * DEFAULT_EASE_FACTOR * 1.3))
      );
      expect(result.easeFactor).toBeCloseTo(DEFAULT_EASE_FACTOR + 0.15);
    });
  });

  describe("relearning card", () => {
    it("again => stays relearning, lapse count increments", () => {
      const result = computeNextSchedule(relearningCard, "again", fixedDate);
      expect(result.state).toBe("relearning");
      expect(result.lapseCount).toBe(relearningCard.lapseCount + 1);
    });

    it("good => re-graduates to review", () => {
      const result = computeNextSchedule(relearningCard, "good", fixedDate);
      expect(result.state).toBe("review");
      expect(result.intervalDays).toBe(1);
    });

    it("easy => re-graduates to review", () => {
      const result = computeNextSchedule(relearningCard, "easy", fixedDate);
      expect(result.state).toBe("review");
      expect(result.intervalDays).toBe(1);
    });
  });

  describe("ease factor floor", () => {
    it("ease never drops below 1.3 after repeated lapses", () => {
      let card: CardScheduleInput = {
        state: "review",
        intervalDays: 5,
        easeFactor: 1.4,
        repetitionCount: 2,
        lapseCount: 0,
      };
      const result = computeNextSchedule(card, "again", fixedDate);
      expect(result.easeFactor).toBeGreaterThanOrEqual(1.3);

      card = { ...card, easeFactor: 1.3 };
      const result2 = computeNextSchedule(card, "again", fixedDate);
      expect(result2.easeFactor).toBe(1.3);
    });
  });

  describe("minimum interval", () => {
    it("interval is always at least 1 for review cards", () => {
      const card: CardScheduleInput = {
        state: "review",
        intervalDays: 1,
        easeFactor: 1.3,
        repetitionCount: 1,
        lapseCount: 0,
      };
      const hard = computeNextSchedule(card, "hard", fixedDate);
      expect(hard.intervalDays).toBeGreaterThanOrEqual(1);

      const good = computeNextSchedule(card, "good", fixedDate);
      expect(good.intervalDays).toBeGreaterThanOrEqual(1);
    });
  });

  describe("timestamps", () => {
    it("lastReviewedAt matches the provided reviewedAt", () => {
      const result = computeNextSchedule(newCard, "good", fixedDate);
      expect(result.lastReviewedAt).toBe(fixedDate.toISOString());
    });

    it("dueAt is in the future relative to reviewedAt for review graduation", () => {
      const result = computeNextSchedule(newCard, "good", fixedDate);
      expect(new Date(result.dueAt).getTime()).toBeGreaterThan(
        fixedDate.getTime()
      );
    });
  });
});
