import { afterEach, describe, expect, it } from "vitest";
import {
  createTestCardRepositories,
  seedCard,
  seedCategory,
  seedDeck,
} from "./test/create-test-card-repository";

describe("CardStatisticsSqliteRepository contract", () => {
  let teardown: (() => Promise<void>) | undefined;

  afterEach(async () => {
    await teardown?.();
    teardown = undefined;
  });

  it("reports deck count and the earliest scheduled due time", async () => {
    const context = await createTestCardRepositories();
    teardown = context.teardown;
    await seedCategory(context.db, { id: "stats-category", name: "Stats" });
    await seedDeck(context.db, {
      id: "stats-deck-1",
      categoryId: "stats-category",
    });
    await seedDeck(context.db, {
      id: "stats-deck-2",
      categoryId: "stats-category",
    });
    await seedCard(context.db, {
      id: "later-card",
      deckId: "stats-deck-1",
      dueAt: "2030-02-01T00:00:00.000Z",
    });
    await seedCard(context.db, {
      id: "earlier-card",
      deckId: "stats-deck-2",
      dueAt: "2030-01-01T00:00:00.000Z",
    });

    const stats = await context.cardStatisticsRepository.getStats(
      new Date("2029-01-01T12:00:00.000Z")
    );

    expect(stats.deckCount).toBe(2);
    expect(stats.nextDueAt).toBe("2030-01-01 00:00:00");
  });
});
