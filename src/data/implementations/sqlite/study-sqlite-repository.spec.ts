import { afterEach, describe, expect, it } from "vitest";
import {
  createTestCardRepositories,
  seedCategory,
  seedDeck,
} from "./test/create-test-card-repository";

const DECK_ID = "study-deck";

describe("StudySqliteRepository contract", () => {
  let teardown: (() => Promise<void>) | undefined;

  afterEach(async () => {
    await teardown?.();
    teardown = undefined;
  });

  it("reads schedules created by CardSqliteRepository", async () => {
    const context = await createTestCardRepositories();
    teardown = context.teardown;
    await seedCategory(context.db, { id: "study-category", name: "Study" });
    await seedDeck(context.db, {
      id: DECK_ID,
      categoryId: "study-category",
    });

    const card = await context.cardRepository.createCard({
      deckId: DECK_ID,
      type: "plain",
      front: "Question",
      back: "Answer",
    });

    const dueCards = await context.studyRepository.getDueCards(DECK_ID);
    expect(dueCards).toHaveLength(1);
    expect(dueCards[0].id).toBe(card.id);
    expect(dueCards[0].schedule.state).toBe("new");
  });

  it("preserves the missing-schedule error contract", async () => {
    const context = await createTestCardRepositories();
    teardown = context.teardown;

    await expect(
      context.studyRepository.submitReview({
        cardId: "missing",
        deckId: DECK_ID,
        rating: "good",
      })
    ).rejects.toThrow("Schedule not found for card: missing");
  });
});
