import { afterEach, describe, expect, it } from "vitest";
import {
  createTestCardRepositories,
  seedCategory,
  seedDeck,
} from "./test/create-test-card-repository";

describe("card repository boundary integration", () => {
  let teardown: (() => Promise<void>) | undefined;

  afterEach(async () => {
    await teardown?.();
    teardown = undefined;
  });

  it("reflects a study review in card listing and statistics", async () => {
    const context = await createTestCardRepositories();
    teardown = context.teardown;
    await seedCategory(context.db, {
      id: "integration-category",
      name: "Integration",
    });
    await seedDeck(context.db, {
      id: "integration-deck",
      categoryId: "integration-category",
    });
    const card = await context.cardRepository.createCard({
      deckId: "integration-deck",
      type: "plain",
      front: "Question",
      back: "Answer",
    });

    await context.studyRepository.submitReview({
      cardId: card.id,
      deckId: "integration-deck",
      rating: "good",
    });

    const [listedCard] = await context.cardRepository.listCardsByDeck(
      "integration-deck"
    );
    const stats = await context.cardStatisticsRepository.getStats(new Date());
    expect(listedCard.schedule.state).toBe("review");
    expect(listedCard.schedule.repetitionCount).toBe(1);
    expect(stats.cardsReviewedToday).toBe(1);
  });
});
