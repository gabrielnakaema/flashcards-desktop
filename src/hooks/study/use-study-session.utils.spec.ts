import { describe, expect, it } from "vitest";
import {
  countDueCards,
  getSoonestDueAt,
  getUpdatedStats,
} from "./use-study-session.utils";
import type { CardWithSchedule } from "@/types/card";
import type { StudySessionStats, StudyAnswerResult } from "./use-study-session.utils";

const baseSchedule = {
  cardId: "card-1",
  dueAt: "2024-01-01T00:00:00.000Z",
  intervalDays: 1,
  easeFactor: 2.5,
  repetitionCount: 0,
  lapseCount: 0,
  lastReviewedAt: null,
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
};

const baseCard: CardWithSchedule = {
  id: "card-1",
  deckId: "deck-1",
  type: "plain",
  front: "Q",
  back: "A",
  content: {},
  hint: null,
  explanation: null,
  sourceExcerpt: null,
  difficulty: null,
  tags: [],
  isSuspended: false,
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
  schedule: { ...baseSchedule, state: "new" },
};

const baseStats: StudySessionStats = {
  reviewed: 0,
  correct: 0,
  again: 0,
  nextDueAt: null,
};

const revealedCorrect: StudyAnswerResult = { isRevealed: true, wasCorrect: true };
const revealedIncorrect: StudyAnswerResult = { isRevealed: true, wasCorrect: false };

describe("countDueCards", () => {
  it("returns zeros for an empty array", () => {
    expect(countDueCards([])).toEqual({ new: 0, learning: 0, review: 0 });
  });

  it("counts new cards", () => {
    const cards = [
      { ...baseCard, schedule: { ...baseSchedule, state: "new" as const } },
      { ...baseCard, id: "card-2", schedule: { ...baseSchedule, cardId: "card-2", state: "new" as const } },
    ];
    expect(countDueCards(cards)).toEqual({ new: 2, learning: 0, review: 0 });
  });

  it("counts learning cards", () => {
    const card = { ...baseCard, schedule: { ...baseSchedule, state: "learning" as const } };
    expect(countDueCards([card])).toEqual({ new: 0, learning: 1, review: 0 });
  });

  it("counts relearning cards as learning", () => {
    const card = { ...baseCard, schedule: { ...baseSchedule, state: "relearning" as const } };
    expect(countDueCards([card])).toEqual({ new: 0, learning: 1, review: 0 });
  });

  it("counts review cards", () => {
    const card = { ...baseCard, schedule: { ...baseSchedule, state: "review" as const } };
    expect(countDueCards([card])).toEqual({ new: 0, learning: 0, review: 1 });
  });

  it("counts mixed states correctly", () => {
    const cards: CardWithSchedule[] = [
      { ...baseCard, id: "1", schedule: { ...baseSchedule, cardId: "1", state: "new" } },
      { ...baseCard, id: "2", schedule: { ...baseSchedule, cardId: "2", state: "learning" } },
      { ...baseCard, id: "3", schedule: { ...baseSchedule, cardId: "3", state: "relearning" } },
      { ...baseCard, id: "4", schedule: { ...baseSchedule, cardId: "4", state: "review" } },
      { ...baseCard, id: "5", schedule: { ...baseSchedule, cardId: "5", state: "review" } },
    ];
    expect(countDueCards(cards)).toEqual({ new: 1, learning: 2, review: 2 });
  });
});

describe("getSoonestDueAt", () => {
  it("returns null when both are null", () => {
    expect(getSoonestDueAt(null, null)).toBeNull();
  });

  it("returns current when next is null", () => {
    expect(getSoonestDueAt("2024-06-01T10:00:00.000Z", null)).toBe(
      "2024-06-01T10:00:00.000Z"
    );
  });

  it("returns next when current is null", () => {
    expect(getSoonestDueAt(null, "2024-06-01T10:00:00.000Z")).toBe(
      "2024-06-01T10:00:00.000Z"
    );
  });

  it("returns the earlier date when next is earlier", () => {
    expect(
      getSoonestDueAt("2024-06-02T10:00:00.000Z", "2024-06-01T10:00:00.000Z")
    ).toBe("2024-06-01T10:00:00.000Z");
  });

  it("returns current when current is earlier", () => {
    expect(
      getSoonestDueAt("2024-06-01T10:00:00.000Z", "2024-06-02T10:00:00.000Z")
    ).toBe("2024-06-01T10:00:00.000Z");
  });

  it("returns current when both dates are equal", () => {
    const date = "2024-06-01T10:00:00.000Z";
    expect(getSoonestDueAt(date, date)).toBe(date);
  });
});

describe("getUpdatedStats", () => {
  it("increments reviewed count", () => {
    const result = getUpdatedStats(baseStats, "good", revealedCorrect, null);
    expect(result.reviewed).toBe(1);
  });

  it("increments correct count on correct answer", () => {
    const result = getUpdatedStats(baseStats, "good", revealedCorrect, null);
    expect(result.correct).toBe(1);
  });

  it("does not increment correct count on incorrect answer", () => {
    const result = getUpdatedStats(baseStats, "good", revealedIncorrect, null);
    expect(result.correct).toBe(0);
  });

  it("increments again count when rating is 'again'", () => {
    const result = getUpdatedStats(baseStats, "again", revealedIncorrect, null);
    expect(result.again).toBe(1);
  });

  it("does not increment again count for other ratings", () => {
    const result = getUpdatedStats(baseStats, "good", revealedCorrect, null);
    expect(result.again).toBe(0);
  });

  it("propagates nextDueAt when current is null", () => {
    const result = getUpdatedStats(
      baseStats,
      "good",
      revealedCorrect,
      "2024-06-01T10:00:00.000Z"
    );
    expect(result.nextDueAt).toBe("2024-06-01T10:00:00.000Z");
  });

  it("keeps existing nextDueAt when new one is later", () => {
    const stats: StudySessionStats = { ...baseStats, nextDueAt: "2024-06-01T10:00:00.000Z" };
    const result = getUpdatedStats(stats, "good", revealedCorrect, "2024-06-02T10:00:00.000Z");
    expect(result.nextDueAt).toBe("2024-06-01T10:00:00.000Z");
  });

  it("updates nextDueAt when new one is earlier", () => {
    const stats: StudySessionStats = { ...baseStats, nextDueAt: "2024-06-02T10:00:00.000Z" };
    const result = getUpdatedStats(stats, "good", revealedCorrect, "2024-06-01T10:00:00.000Z");
    expect(result.nextDueAt).toBe("2024-06-01T10:00:00.000Z");
  });

  it("accumulates stats across multiple reviews", () => {
    let stats = baseStats;
    stats = getUpdatedStats(stats, "good", revealedCorrect, "2024-06-03T00:00:00.000Z");
    stats = getUpdatedStats(stats, "again", revealedIncorrect, "2024-06-01T00:00:00.000Z");
    stats = getUpdatedStats(stats, "hard", revealedCorrect, "2024-06-02T00:00:00.000Z");
    expect(stats.reviewed).toBe(3);
    expect(stats.correct).toBe(2);
    expect(stats.again).toBe(1);
    expect(stats.nextDueAt).toBe("2024-06-01T00:00:00.000Z");
  });
});
