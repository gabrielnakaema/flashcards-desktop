import { afterEach, describe, expect, it } from "vitest";
import {
  createTestCardRepository,
  seedCard,
  seedCategory,
  seedDeck,
} from "./test/create-test-card-repository";
import type { TestSqlClient } from "./test/test-sql-client";
import type { CardSqliteRepository } from "./card-sqlite-repository";

interface TestContext {
  repository: CardSqliteRepository;
  db: TestSqlClient;
  teardown: () => Promise<void>;
}

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

describe("CardSqliteRepository", () => {
  let teardown: (() => Promise<void>) | undefined;

  afterEach(async () => {
    await teardown?.();
    teardown = undefined;
  });

  describe("createCard", () => {
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

  describe("bulkCreateCards", () => {
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

  describe("updateCard", () => {
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

  describe("deleteCard", () => {
    it("deletes the card and cascades to schedule and review logs", async () => {
      const ctx = await setupContext();
      teardown = ctx.teardown;

      const card = await ctx.repository.createCard({
        deckId: DECK_ID,
        type: "plain",
        front: "To be deleted",
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

  describe("listCardsByDeck", () => {
    it("returns all cards for a deck ordered by creation time", async () => {
      const ctx = await setupContext();
      teardown = ctx.teardown;

      await ctx.repository.createCard({
        deckId: DECK_ID,
        type: "plain",
        front: "First",
      });
      await ctx.repository.createCard({
        deckId: DECK_ID,
        type: "plain",
        front: "Second",
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
      });
      await ctx.repository.createCard({
        deckId: "deck-2",
        type: "plain",
        front: "Not mine",
      });

      const cards = await ctx.repository.listCardsByDeck(DECK_ID);
      expect(cards).toHaveLength(1);
      expect(cards[0].front).toBe("Mine");
    });
  });

  describe("getDueCards", () => {
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

  describe("submitReview", () => {
    it("updates schedule and inserts review log", async () => {
      const ctx = await setupContext();
      teardown = ctx.teardown;

      const card = await ctx.repository.createCard({
        deckId: DECK_ID,
        type: "plain",
        front: "Review me",
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
});
