import { afterEach, describe, expect, it } from "vitest";
import {
  createTestCardRepository,
  seedCard,
  seedCategory,
  seedDeck,
  seedReviewLog,
} from "./test/create-test-card-repository";
import type { TestSqlClient } from "./test/test-sql-client";

type TestContext = Awaited<ReturnType<typeof createTestCardRepository>> & {
  db: TestSqlClient;
};

const DECK_ID = "deck-1";
const CATEGORY_ID = "cat-1";

const setupContext = async (): Promise<TestContext> => {
  const ctx = await createTestCardRepository();
  await seedCategory(ctx.db, { id: CATEGORY_ID, name: "Science" });
  await seedDeck(ctx.db, {
    id: DECK_ID,
    categoryId: CATEGORY_ID,
    title: "Physics",
  });
  return ctx;
};

describe("SQLite card data repositories", () => {
  let teardown: (() => Promise<void>) | undefined;

  afterEach(async () => {
    await teardown?.();
    teardown = undefined;
  });

  describe("CardSqliteRepository.createCard", () => {
    it("stores SQL-like user input only as a bound value", async () => {
      const ctx = await setupContext();
      teardown = ctx.teardown;
      const front = "'); DROP TABLE cards; --";

      const card = await ctx.cardRepository.createCard({
        deckId: DECK_ID,
        type: "plain",
        front,
        back: "Answer",
      });
      const cards = await ctx.cardRepository.listCardsByDeck(DECK_ID);

      expect(card.front).toBe(front);
      expect(cards.map((item) => item.id)).toEqual([card.id]);
    });

    it("rejects an invalid payload before writing card or schedule rows", async () => {
      const ctx = await setupContext();
      teardown = ctx.teardown;

      await expect(
        ctx.cardRepository.createCard({
          deckId: DECK_ID,
          type: "plain",
          front: "",
          back: "Answer",
        })
      ).rejects.toThrow("Invalid card payload:");

      const [{ cardCount }] = await ctx.db.select<{ cardCount: number }[]>(
        "SELECT COUNT(*) AS cardCount FROM cards"
      );
      const [{ scheduleCount }] = await ctx.db.select<
        { scheduleCount: number }[]
      >("SELECT COUNT(*) AS scheduleCount FROM card_schedules");
      expect(cardCount).toBe(0);
      expect(scheduleCount).toBe(0);
    });

    it("creates a plain card and initial schedule row", async () => {
      const ctx = await setupContext();
      teardown = ctx.teardown;

      const card = await ctx.repository.createCard({
        deckId: DECK_ID,
        type: "plain",
        front: "What is Newton's first law?",
        back: "An object at rest stays at rest.",
        tags: ["mechanics"],
      });

      expect(card.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
      );
      expect(card.deckId).toBe(DECK_ID);
      expect(card.type).toBe("plain");
      expect(card.front).toBe("What is Newton's first law?");
      expect(card.back).toBe("An object at rest stays at rest.");
      expect(card.tags).toEqual(["mechanics"]);
      expect(card.isSuspended).toBe(false);

      const schedule = await ctx.repository.getSchedule(card.id);
      expect(schedule.state).toBe("new");
      expect(schedule.easeFactor).toBe(2.5);
      expect(schedule.intervalDays).toBe(0);
      expect(schedule.dueAt).not.toBeNull();
      expect(new Date(schedule.dueAt!).toString()).not.toBe("Invalid Date");
      expect(schedule.lastReviewedAt).toBeNull();
    });

    it("creates a multiple choice card", async () => {
      const ctx = await setupContext();
      teardown = ctx.teardown;

      const content = {
        question: "Which planet is largest?",
        choices: [
          { id: "a", text: "Earth" },
          { id: "b", text: "Jupiter" },
        ],
        correctChoiceId: "b",
      };

      const card = await ctx.repository.createCard({
        deckId: DECK_ID,
        type: "multiple_choice",
        front: "Which planet is largest?",
        content,
      });

      expect(card.type).toBe("multiple_choice");
      expect(card.content).toEqual(content);
    });

    it("creates a typed_answer card", async () => {
      const ctx = await setupContext();
      teardown = ctx.teardown;

      const card = await ctx.repository.createCard({
        deckId: DECK_ID,
        type: "typed_answer",
        front: "Name the speed of light constant.",
        content: {
          acceptedAnswer: "299792458",
          aliases: ["c", "speed of light"],
          caseSensitive: false,
        },
      });

      expect(card.type).toBe("typed_answer");
    });
  });

  describe("CardSqliteRepository.bulkCreateCards", () => {
    it("creates all cards and their schedules", async () => {
      const ctx = await setupContext();
      teardown = ctx.teardown;

      const payloads = [
        { deckId: DECK_ID, type: "plain" as const, front: "Q1", back: "A1" },
        { deckId: DECK_ID, type: "plain" as const, front: "Q2", back: "A2" },
        { deckId: DECK_ID, type: "plain" as const, front: "Q3", back: "A3" },
      ];

      const cards = await ctx.repository.bulkCreateCards(payloads);

      expect(cards).toHaveLength(3);
      expect(cards.map((c) => c.front)).toEqual(["Q1", "Q2", "Q3"]);

      for (const card of cards) {
        const schedule = await ctx.repository.getSchedule(card.id);
        expect(schedule.state).toBe("new");
        expect(schedule.dueAt).not.toBeNull();
      }

      const dueCards = await ctx.repository.getDueCards(DECK_ID);
      expect(dueCards.map((card) => card.front)).toEqual(["Q1", "Q2", "Q3"]);
    });

    it("returns empty array for empty input", async () => {
      const ctx = await setupContext();
      teardown = ctx.teardown;

      const cards = await ctx.repository.bulkCreateCards([]);
      expect(cards).toEqual([]);
    });
  });

  describe("CardSqliteRepository.updateCard", () => {
    it("preserves the missing-card error contract", async () => {
      const ctx = await setupContext();
      teardown = ctx.teardown;

      await expect(
        ctx.cardRepository.updateCard({ id: "missing", front: "Updated" })
      ).rejects.toThrow("Card not found: missing");
    });

    it("updates card fields", async () => {
      const ctx = await setupContext();
      teardown = ctx.teardown;

      const card = await ctx.repository.createCard({
        deckId: DECK_ID,
        type: "plain",
        front: "Original front",
        back: "Original back",
      });

      const updated = await ctx.repository.updateCard({
        id: card.id,
        front: "Updated front",
        tags: ["updated"],
      });

      expect(updated.front).toBe("Updated front");
      expect(updated.back).toBe("Original back");
      expect(updated.tags).toEqual(["updated"]);
    });
  });

  describe("CardSqliteRepository.deleteCard", () => {
    it("deletes the card and cascades to schedule and review logs", async () => {
      const ctx = await setupContext();
      teardown = ctx.teardown;

      const card = await ctx.repository.createCard({
        deckId: DECK_ID,
        type: "plain",
        front: "To be deleted",
        back: "Delete me",
      });

      await ctx.repository.submitReview({
        cardId: card.id,
        deckId: DECK_ID,
        rating: "good",
      });

      await ctx.repository.deleteCard(card.id);

      const [scheduleRow] = await ctx.db.select<unknown[]>(
        "SELECT * FROM card_schedules WHERE card_id = $1",
        [card.id]
      );
      expect(scheduleRow).toBeUndefined();

      const [logRow] = await ctx.db.select<unknown[]>(
        "SELECT * FROM review_logs WHERE card_id = $1",
        [card.id]
      );
      expect(logRow).toBeUndefined();
    });
  });

  describe("CardSqliteRepository.listCardsByDeck", () => {
    it("returns all cards for a deck ordered by creation time", async () => {
      const ctx = await setupContext();
      teardown = ctx.teardown;

      await ctx.repository.createCard({
        deckId: DECK_ID,
        type: "plain",
        front: "First",
        back: "First answer",
      });
      await ctx.repository.createCard({
        deckId: DECK_ID,
        type: "plain",
        front: "Second",
        back: "Second answer",
      });

      const cards = await ctx.repository.listCardsByDeck(DECK_ID);
      expect(cards).toHaveLength(2);
      expect(cards[0].front).toBe("First");
      expect(cards[0].schedule.cardId).toBe(cards[0].id);
      expect(cards[0].schedule.state).toBe("new");
      expect(cards[0].schedule.dueAt).not.toBeNull();
    });

    it("does not return cards from other decks", async () => {
      const ctx = await setupContext();
      teardown = ctx.teardown;

      await seedDeck(ctx.db, {
        id: "deck-2",
        categoryId: CATEGORY_ID,
        title: "Other Deck",
      });

      await ctx.repository.createCard({
        deckId: DECK_ID,
        type: "plain",
        front: "Mine",
        back: "Mine answer",
      });
      await ctx.repository.createCard({
        deckId: "deck-2",
        type: "plain",
        front: "Not mine",
        back: "Not mine answer",
      });

      const cards = await ctx.repository.listCardsByDeck(DECK_ID);
      expect(cards).toHaveLength(1);
      expect(cards[0].front).toBe("Mine");
    });
  });

  describe("StudySqliteRepository.getDueCards", () => {
    it("returns cards whose due_at is in the past", async () => {
      const ctx = await setupContext();
      teardown = ctx.teardown;

      await seedCard(ctx.db, {
        id: "due-card",
        deckId: DECK_ID,
        front: "Due card",
        state: "review",
        dueAt: "2000-01-01T00:00:00.000Z",
      });

      await seedCard(ctx.db, {
        id: "future-card",
        deckId: DECK_ID,
        front: "Future card",
        state: "review",
        dueAt: "2099-01-01T00:00:00.000Z",
      });

      const due = await ctx.repository.getDueCards(DECK_ID);
      expect(due).toHaveLength(1);
      expect(due[0].id).toBe("due-card");
      expect(due[0].schedule.state).toBe("review");
    });

    it("excludes suspended cards", async () => {
      const ctx = await setupContext();
      teardown = ctx.teardown;

      await seedCard(ctx.db, {
        id: "suspended-card",
        deckId: DECK_ID,
        front: "Suspended",
        state: "review",
        dueAt: "2000-01-01T00:00:00.000Z",
        isSuspended: true,
      });

      const due = await ctx.repository.getDueCards(DECK_ID);
      expect(due).toHaveLength(0);
    });

    it("returns newly created cards as due immediately", async () => {
      const ctx = await setupContext();
      teardown = ctx.teardown;

      const card = await ctx.repository.createCard({
        deckId: DECK_ID,
        type: "plain",
        front: "New card, due now",
        back: "New answer",
      });

      const due = await ctx.repository.getDueCards(DECK_ID);
      expect(due).toHaveLength(1);
      expect(due[0].id).toBe(card.id);
      expect(due[0].schedule.state).toBe("new");
    });

    it("returns same-day ISO due timestamps", async () => {
      const ctx = await setupContext();
      teardown = ctx.teardown;

      await seedCard(ctx.db, {
        id: "iso-due-card",
        deckId: DECK_ID,
        front: "ISO due now",
        state: "review",
        dueAt: new Date().toISOString(),
      });

      const due = await ctx.repository.getDueCards(DECK_ID);
      expect(due).toHaveLength(1);
      expect(due[0].id).toBe("iso-due-card");
    });
  });

  describe("StudySqliteRepository.submitReview", () => {
    it("updates schedule and inserts review log", async () => {
      const ctx = await setupContext();
      teardown = ctx.teardown;

      const card = await ctx.repository.createCard({
        deckId: DECK_ID,
        type: "plain",
        front: "Review me",
        back: "Review answer",
      });

      const log = await ctx.repository.submitReview({
        cardId: card.id,
        deckId: DECK_ID,
        rating: "good",
      });

      expect(log.cardId).toBe(card.id);
      expect(log.rating).toBe("good");

      const schedule = await ctx.repository.getSchedule(card.id);
      expect(schedule.state).toBe("review");
      expect(schedule.intervalDays).toBe(1);
      expect(schedule.repetitionCount).toBe(1);
      expect(schedule.dueAt).not.toBeNull();
    });

    it("records lapse when rating is again on a review card", async () => {
      const ctx = await setupContext();
      teardown = ctx.teardown;

      await seedCard(ctx.db, {
        id: "review-card",
        deckId: DECK_ID,
        state: "review",
        dueAt: "2000-01-01T00:00:00.000Z",
      });

      const log = await ctx.repository.submitReview({
        cardId: "review-card",
        deckId: DECK_ID,
        rating: "again",
        wasCorrect: false,
        elapsedMs: 3000,
      });

      expect(log.wasCorrect).toBe(0);
      expect(log.elapsedMs).toBe(3000);

      const schedule = await ctx.repository.getSchedule("review-card");
      expect(schedule.state).toBe("relearning");
      expect(schedule.lapseCount).toBe(1);
    });

    it("stores optional response for typed-answer cards", async () => {
      const ctx = await setupContext();
      teardown = ctx.teardown;

      const card = await ctx.repository.createCard({
        deckId: DECK_ID,
        type: "typed_answer",
        front: "Capital of France?",
        content: { acceptedAnswer: "Paris" },
      });

      const log = await ctx.repository.submitReview({
        cardId: card.id,
        deckId: DECK_ID,
        rating: "easy",
        response: "Paris",
        wasCorrect: true,
      });

      expect(log.response).toBe("Paris");
      expect(log.wasCorrect).toBe(1);
    });

    it("writes schedule update and review log in a single transaction", async () => {
      const ctx = await setupContext();
      teardown = ctx.teardown;

      const card = await ctx.repository.createCard({
        deckId: DECK_ID,
        type: "plain",
        front: "Review me",
        back: "Review answer",
      });
      const originalExecute = ctx.db.execute.bind(ctx.db);
      let executeCallCount = 0;

      ctx.db.execute = async (query, bindValues) => {
        executeCallCount += 1;
        expect(query).toContain("BEGIN");
        expect(query).toContain("UPDATE card_schedules");
        expect(query).toContain("INSERT INTO review_logs");
        expect(query).toContain("COMMIT");
        return originalExecute(query, bindValues);
      };

      const log = await ctx.repository.submitReview({
        cardId: card.id,
        deckId: DECK_ID,
        rating: "good",
      });

      expect(executeCallCount).toBe(1);
      expect(log.cardId).toBe(card.id);
      expect(log.rating).toBe("good");
    });
  });

  describe("StudySqliteRepository.resetDeckStudyProgress", () => {
    it("clears review logs and returns deck schedules to new due-now state", async () => {
      const ctx = await setupContext();
      teardown = ctx.teardown;

      const card = await ctx.repository.createCard({
        deckId: DECK_ID,
        type: "plain",
        front: "Review me",
        back: "Review answer",
      });

      await ctx.repository.submitReview({
        cardId: card.id,
        deckId: DECK_ID,
        rating: "easy",
      });

      const reviewedSchedule = await ctx.repository.getSchedule(card.id);
      expect(reviewedSchedule.state).toBe("review");
      expect(reviewedSchedule.repetitionCount).toBe(1);

      await ctx.repository.resetDeckStudyProgress(DECK_ID);

      const resetSchedule = await ctx.repository.getSchedule(card.id);
      expect(resetSchedule.state).toBe("new");
      expect(resetSchedule.intervalDays).toBe(0);
      expect(resetSchedule.easeFactor).toBe(2.5);
      expect(resetSchedule.repetitionCount).toBe(0);
      expect(resetSchedule.lapseCount).toBe(0);
      expect(resetSchedule.lastReviewedAt).toBeNull();
      expect(resetSchedule.dueAt).not.toBeNull();

      const dueCards = await ctx.repository.getDueCards(DECK_ID);
      expect(dueCards.map((dueCard) => dueCard.id)).toEqual([card.id]);

      const [logRow] = await ctx.db.select<unknown[]>(
        "SELECT * FROM review_logs WHERE deck_id = $1",
        [DECK_ID]
      );
      expect(logRow).toBeUndefined();
    });

    it("does not reset cards or review logs from another deck", async () => {
      const ctx = await setupContext();
      teardown = ctx.teardown;

      await seedDeck(ctx.db, {
        id: "deck-2",
        categoryId: CATEGORY_ID,
        title: "Other Deck",
      });

      const deckCard = await ctx.repository.createCard({
        deckId: DECK_ID,
        type: "plain",
        front: "Mine",
        back: "Mine answer",
      });
      const otherCard = await ctx.repository.createCard({
        deckId: "deck-2",
        type: "plain",
        front: "Other",
        back: "Other answer",
      });

      await ctx.repository.submitReview({
        cardId: deckCard.id,
        deckId: DECK_ID,
        rating: "good",
      });
      await ctx.repository.submitReview({
        cardId: otherCard.id,
        deckId: "deck-2",
        rating: "good",
      });

      await ctx.repository.resetDeckStudyProgress(DECK_ID);

      const otherSchedule = await ctx.repository.getSchedule(otherCard.id);
      expect(otherSchedule.state).toBe("review");
      expect(otherSchedule.repetitionCount).toBe(1);

      const [otherLogRow] = await ctx.db.select<unknown[]>(
        "SELECT * FROM review_logs WHERE deck_id = $1",
        ["deck-2"]
      );
      expect(otherLogRow).toBeDefined();
    });

    it("preserves card content and suspension state", async () => {
      const ctx = await setupContext();
      teardown = ctx.teardown;

      const card = await ctx.repository.createCard({
        deckId: DECK_ID,
        type: "typed_answer",
        front: "Capital of France?",
        content: { acceptedAnswer: "Paris" },
        difficulty: "medium",
        tags: ["geography"],
      });
      await ctx.db.execute("UPDATE cards SET is_suspended = 1 WHERE id = $1", [
        card.id,
      ]);

      await ctx.repository.submitReview({
        cardId: card.id,
        deckId: DECK_ID,
        rating: "good",
      });
      await ctx.repository.resetDeckStudyProgress(DECK_ID);

      const [resetCard] = await ctx.repository.listCardsByDeck(DECK_ID);
      expect(resetCard.type).toBe("typed_answer");
      expect(resetCard.content).toEqual({ acceptedAnswer: "Paris" });
      expect(resetCard.difficulty).toBe("medium");
      expect(resetCard.tags).toEqual(["geography"]);
      expect(resetCard.isSuspended).toBe(true);
      expect(resetCard.schedule.state).toBe("new");
    });
  });

  describe("CardStatisticsSqliteRepository.getStats", () => {
    it("returns all zeroes when there are no cards or reviews", async () => {
      const ctx = await setupContext();
      teardown = ctx.teardown;

      const stats = await ctx.repository.getStats(new Date());

      expect(stats.cardsDueNow).toBe(0);
      expect(stats.cardsReviewedToday).toBe(0);
      expect(stats.totalCardsInDecks).toBe(0);
      expect(stats.totalCardsReviewedThisWeek).toBe(0);
      expect(stats.deckIdWithMostCardsDue).toBe("");
      expect(stats.mostCardsDueInDeck).toBe(0);
    });

    it("counts cards with due_at in the past as due now", async () => {
      const ctx = await setupContext();
      teardown = ctx.teardown;

      await seedCard(ctx.db, {
        id: "past-due",
        deckId: DECK_ID,
        state: "review",
        dueAt: "2000-01-01T00:00:00.000Z",
      });
      await seedCard(ctx.db, {
        id: "future-due",
        deckId: DECK_ID,
        state: "review",
        dueAt: "2099-01-01T00:00:00.000Z",
      });

      const stats = await ctx.repository.getStats(new Date());

      expect(stats.cardsDueNow).toBe(1);
    });

    it("counts all cards regardless of schedule in totalCardsInDecks", async () => {
      const ctx = await setupContext();
      teardown = ctx.teardown;

      await ctx.repository.createCard({
        deckId: DECK_ID,
        type: "plain",
        front: "Card A",
        back: "A",
      });
      await ctx.repository.createCard({
        deckId: DECK_ID,
        type: "plain",
        front: "Card B",
        back: "B",
      });

      const stats = await ctx.repository.getStats(new Date());

      expect(stats.totalCardsInDecks).toBe(2);
    });

    it("counts only reviews from today in cardsReviewedToday", async () => {
      const ctx = await setupContext();
      teardown = ctx.teardown;

      const card = await ctx.repository.createCard({
        deckId: DECK_ID,
        type: "plain",
        front: "Q",
        back: "A",
      });

      const today = new Date();
      const todayIso = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        12,
        0,
        0
      ).toISOString();
      const lastWeekIso = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() - 8,
        12,
        0,
        0
      ).toISOString();

      await seedReviewLog(ctx.db, {
        id: "log-today",
        cardId: card.id,
        deckId: DECK_ID,
        reviewedAt: todayIso,
      });
      await seedReviewLog(ctx.db, {
        id: "log-last-week",
        cardId: card.id,
        deckId: DECK_ID,
        reviewedAt: lastWeekIso,
      });

      const stats = await ctx.repository.getStats(today);

      expect(stats.cardsReviewedToday).toBe(1);
    });

    it("counts reviews within the week in totalCardsReviewedThisWeek", async () => {
      const ctx = await setupContext();
      teardown = ctx.teardown;

      const card = await ctx.repository.createCard({
        deckId: DECK_ID,
        type: "plain",
        front: "Q",
        back: "A",
      });

      const today = new Date();
      const day = today.getDay();
      const mondayOffset = (day + 6) % 7;

      const thisWeekMonday = new Date(today);
      thisWeekMonday.setDate(today.getDate() - mondayOffset);
      thisWeekMonday.setHours(12, 0, 0, 0);

      const lastWeekMonday = new Date(thisWeekMonday);
      lastWeekMonday.setDate(thisWeekMonday.getDate() - 7);

      await seedReviewLog(ctx.db, {
        id: "log-this-week",
        cardId: card.id,
        deckId: DECK_ID,
        reviewedAt: thisWeekMonday.toISOString(),
      });
      await seedReviewLog(ctx.db, {
        id: "log-last-week",
        cardId: card.id,
        deckId: DECK_ID,
        reviewedAt: lastWeekMonday.toISOString(),
      });

      const stats = await ctx.repository.getStats(today);

      expect(stats.totalCardsReviewedThisWeek).toBe(1);
    });

    it("identifies the deck with the most cards due", async () => {
      const ctx = await setupContext();
      teardown = ctx.teardown;

      await seedDeck(ctx.db, {
        id: "deck-2",
        categoryId: CATEGORY_ID,
        title: "Deck 2",
      });

      await seedCard(ctx.db, {
        id: "d1-card-1",
        deckId: DECK_ID,
        state: "review",
        dueAt: "2000-01-01T00:00:00.000Z",
      });
      await seedCard(ctx.db, {
        id: "d2-card-1",
        deckId: "deck-2",
        state: "review",
        dueAt: "2000-01-01T00:00:00.000Z",
      });
      await seedCard(ctx.db, {
        id: "d2-card-2",
        deckId: "deck-2",
        state: "review",
        dueAt: "2000-01-01T00:00:00.000Z",
      });

      const stats = await ctx.repository.getStats(new Date());

      expect(stats.deckIdWithMostCardsDue).toBe("deck-2");
      expect(stats.mostCardsDueInDeck).toBe(2);
    });

    it("does not mutate the date argument", async () => {
      const ctx = await setupContext();
      teardown = ctx.teardown;

      const input = new Date("2024-06-15T14:30:00.000Z");
      const originalTime = input.getTime();

      await ctx.repository.getStats(input);

      expect(input.getTime()).toBe(originalTime);
    });
  });

  describe("CardStatisticsSqliteRepository.getStreak", () => {
    const dayIso = (offsetDays: number): string => {
      const d = new Date();
      d.setUTCDate(d.getUTCDate() - offsetDays);
      d.setUTCHours(12, 0, 0, 0);
      return d.toISOString();
    };

    it("returns zero when there are no reviews", async () => {
      const ctx = await setupContext();
      teardown = ctx.teardown;

      const streak = await ctx.repository.getStreak();

      expect(streak.currentStreak).toBe(0);
      expect(streak.bestStreak).toBe(0);
    });

    it("counts a review today as a 1-day streak", async () => {
      const ctx = await setupContext();
      teardown = ctx.teardown;

      const card = await ctx.repository.createCard({
        deckId: DECK_ID,
        type: "plain",
        front: "Q",
        back: "A",
      });
      await seedReviewLog(ctx.db, {
        id: "log-1",
        cardId: card.id,
        deckId: DECK_ID,
        reviewedAt: dayIso(0),
      });

      const streak = await ctx.repository.getStreak();

      expect(streak.currentStreak).toBe(1);
      expect(streak.bestStreak).toBe(1);
    });

    it("keeps the streak alive when the last review was yesterday", async () => {
      const ctx = await setupContext();
      teardown = ctx.teardown;

      const card = await ctx.repository.createCard({
        deckId: DECK_ID,
        type: "plain",
        front: "Q",
        back: "A",
      });
      await seedReviewLog(ctx.db, {
        id: "log-1",
        cardId: card.id,
        deckId: DECK_ID,
        reviewedAt: dayIso(1),
      });

      const streak = await ctx.repository.getStreak();

      expect(streak.currentStreak).toBe(1);
      expect(streak.bestStreak).toBe(1);
    });

    it("breaks the streak when the last review was 2+ days ago", async () => {
      const ctx = await setupContext();
      teardown = ctx.teardown;

      const card = await ctx.repository.createCard({
        deckId: DECK_ID,
        type: "plain",
        front: "Q",
        back: "A",
      });
      await seedReviewLog(ctx.db, {
        id: "log-1",
        cardId: card.id,
        deckId: DECK_ID,
        reviewedAt: dayIso(2),
      });

      const streak = await ctx.repository.getStreak();

      expect(streak.currentStreak).toBe(0);
      expect(streak.bestStreak).toBe(1);
    });

    it("counts consecutive days correctly", async () => {
      const ctx = await setupContext();
      teardown = ctx.teardown;

      const card = await ctx.repository.createCard({
        deckId: DECK_ID,
        type: "plain",
        front: "Q",
        back: "A",
      });
      await seedReviewLog(ctx.db, {
        id: "log-0",
        cardId: card.id,
        deckId: DECK_ID,
        reviewedAt: dayIso(0),
      });
      await seedReviewLog(ctx.db, {
        id: "log-1",
        cardId: card.id,
        deckId: DECK_ID,
        reviewedAt: dayIso(1),
      });
      await seedReviewLog(ctx.db, {
        id: "log-2",
        cardId: card.id,
        deckId: DECK_ID,
        reviewedAt: dayIso(2),
      });

      const streak = await ctx.repository.getStreak();

      expect(streak.currentStreak).toBe(3);
      expect(streak.bestStreak).toBe(3);
    });

    it("ignores multiple reviews on the same day for streak counting", async () => {
      const ctx = await setupContext();
      teardown = ctx.teardown;

      const card = await ctx.repository.createCard({
        deckId: DECK_ID,
        type: "plain",
        front: "Q",
        back: "A",
      });
      await seedReviewLog(ctx.db, {
        id: "log-a",
        cardId: card.id,
        deckId: DECK_ID,
        reviewedAt: dayIso(0),
      });
      await seedReviewLog(ctx.db, {
        id: "log-b",
        cardId: card.id,
        deckId: DECK_ID,
        reviewedAt: dayIso(0),
      });

      const streak = await ctx.repository.getStreak();

      expect(streak.currentStreak).toBe(1);
    });

    it("reports best streak from a past run even after the streak breaks", async () => {
      const ctx = await setupContext();
      teardown = ctx.teardown;

      const card = await ctx.repository.createCard({
        deckId: DECK_ID,
        type: "plain",
        front: "Q",
        back: "A",
      });

      for (let i = 10; i <= 14; i++) {
        await seedReviewLog(ctx.db, {
          id: `log-old-${i}`,
          cardId: card.id,
          deckId: DECK_ID,
          reviewedAt: dayIso(i),
        });
      }

      await seedReviewLog(ctx.db, {
        id: "log-new-0",
        cardId: card.id,
        deckId: DECK_ID,
        reviewedAt: dayIso(0),
      });
      await seedReviewLog(ctx.db, {
        id: "log-new-1",
        cardId: card.id,
        deckId: DECK_ID,
        reviewedAt: dayIso(1),
      });

      const streak = await ctx.repository.getStreak();

      expect(streak.currentStreak).toBe(2);
      expect(streak.bestStreak).toBe(5);
    });
  });
});
