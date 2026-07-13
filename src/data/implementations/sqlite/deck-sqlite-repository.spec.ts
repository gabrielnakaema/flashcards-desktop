import { randomUUID } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import {
  createTestDeckRepository,
  seedCategory,
} from "./test/create-test-deck-repository";
import { DeckSqliteRepository } from "./deck-sqlite-repository";

describe("DeckSqliteRepository", () => {
  let teardown: (() => Promise<void>) | undefined;

  afterEach(async () => {
    await teardown?.();
    teardown = undefined;
  });

  it("creates a category", async () => {
    const testContext = await createTestDeckRepository();
    teardown = testContext.teardown;

    const category = await testContext.repository.createCategory({
      name: "Languages",
    });
    expect(category.id).toBeTruthy();

    const categories = await testContext.repository.listCategories();
    expect(categories).toHaveLength(1);
    expect(categories[0].name).toBe("Languages");
  });

  it("lists categories", async () => {
    const testContext = await createTestDeckRepository();
    teardown = testContext.teardown;

    await seedCategory(testContext.db, {
      id: "cat-1",
      name: "Languages",
    });
    await seedCategory(testContext.db, {
      id: "cat-2",
      name: "Math",
    });

    const categories = await testContext.repository.listCategories();
    expect(categories).toHaveLength(2);
  });

  it("updates a category", async () => {
    const testContext = await createTestDeckRepository();
    teardown = testContext.teardown;

    await seedCategory(testContext.db, {
      id: "cat-1",
      name: "Languages",
    });

    const updated = await testContext.repository.updateCategory({
      id: "cat-1",
      name: "World Languages",
    });

    expect(updated.name).toBe("World Languages");

    const categories = await testContext.repository.listCategories();
    expect(categories[0].name).toBe("World Languages");
  });

  it("deletes a category", async () => {
    const testContext = await createTestDeckRepository();
    teardown = testContext.teardown;

    await seedCategory(testContext.db, {
      id: "cat-1",
      name: "Languages",
    });

    await testContext.repository.deleteCategory("cat-1");

    const categories = await testContext.repository.listCategories();
    expect(categories).toHaveLength(0);
  });

  it("returns a formatted error when deleting a category that has decks", async () => {
    const testContext = await createTestDeckRepository();
    teardown = testContext.teardown;

    await seedCategory(testContext.db, {
      id: "cat-1",
      name: "Languages",
    });

    await testContext.repository.createDeck({
      title: "Japanese",
      tags: [],
      categoryId: "cat-1",
    });

    await expect(
      testContext.repository.deleteCategory("cat-1")
    ).rejects.toThrow(
      "This category has decks. Move or delete those decks before deleting the category."
    );

    const categories = await testContext.repository.listCategories();
    expect(categories).toHaveLength(1);
  });

  it("creates a deck", async () => {
    const testContext = await createTestDeckRepository();
    teardown = testContext.teardown;

    await seedCategory(testContext.db, {
      id: "cat-1",
      name: "Languages",
    });

    const deck = await testContext.repository.createDeck({
      title: "Japanese",
      tags: ["vocab", "n5"],
      categoryId: "cat-1",
    });

    expect(deck.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
    );
    expect(deck.title).toBe("Japanese");
    expect(deck.tags).toEqual(["vocab", "n5"]);
    expect(deck.category.id).toBe("cat-1");
  });

  it("updates a deck", async () => {
    const testContext = await createTestDeckRepository();
    teardown = testContext.teardown;

    await seedCategory(testContext.db, {
      id: "cat-1",
      name: "Languages",
    });

    const created = await testContext.repository.createDeck({
      title: "Japanese",
      tags: ["vocab"],
      categoryId: "cat-1",
    });

    const updated = await testContext.repository.updateDeck({
      id: created.id,
      title: "Japanese N5",
      tags: ["vocab", "grammar"],
      categoryId: "cat-1",
    });

    expect(updated.id).toBe(created.id);
    expect(updated.title).toBe("Japanese N5");
    expect(updated.tags).toEqual(["vocab", "grammar"]);
    expect(updated.category.id).toBe("cat-1");
    expect(updated.category.name).toBe("Languages");
  });

  it("persists moving a deck to another category", async () => {
    const testContext = await createTestDeckRepository();
    teardown = testContext.teardown;

    await seedCategory(testContext.db, {
      id: "cat-1",
      name: "Languages",
    });
    await seedCategory(testContext.db, {
      id: "cat-2",
      name: "Travel",
    });
    const created = await testContext.repository.createDeck({
      title: "Japanese",
      tags: [],
      categoryId: "cat-1",
    });

    await testContext.repository.updateDeck({
      id: created.id,
      title: created.title,
      tags: created.tags,
      categoryId: "cat-2",
    });

    const restartedRepository = new DeckSqliteRepository(testContext.db);
    const persistedDeck = await restartedRepository.getDeck(created.id);
    expect(persistedDeck.category).toEqual({ id: "cat-2", name: "Travel" });
  });

  it("deletes a deck", async () => {
    const testContext = await createTestDeckRepository();
    teardown = testContext.teardown;

    await seedCategory(testContext.db, {
      id: "cat-1",
      name: "Languages",
    });

    const created = await testContext.repository.createDeck({
      title: "Japanese",
      tags: ["vocab"],
      categoryId: "cat-1",
    });
    expect(created.id).toBeTruthy();

    await testContext.repository.deleteDeck(created.id);

    const decks = await testContext.repository.listDeckWithStats();
    expect(decks).toHaveLength(0);
  });

  it("lists decks with card counts", async () => {
    const testContext = await createTestDeckRepository();
    teardown = testContext.teardown;

    await seedCategory(testContext.db, {
      id: "cat-1",
      name: "Languages",
    });

    const deck = await testContext.repository.createDeck({
      title: "Japanese",
      tags: ["vocab"],
      categoryId: "cat-1",
    });

    const timestamp = new Date().toISOString();
    const cardId1 = randomUUID();
    const cardId2 = randomUUID();

    for (const cardId of [cardId1, cardId2]) {
      await testContext.db.execute(
        `INSERT INTO cards (id, deck_id, type, front, content, tags, is_suspended, created_at, updated_at)
         VALUES ($1, $2, 'plain', 'Q?', '{}', '[]', 0, $3, $4)`,
        [cardId, deck.id, timestamp, timestamp]
      );
      await testContext.db.execute(
        `INSERT INTO card_schedules (card_id, state, due_at, interval_days, ease_factor, repetition_count, lapse_count, created_at, updated_at)
         VALUES ($1, 'new', $2, 0, 2.5, 0, 0, $3, $4)`,
        [cardId, timestamp, timestamp, timestamp]
      );
    }

    const decks = await testContext.repository.listDeckWithStats();

    expect(decks).toHaveLength(1);
    expect(decks[0].title).toBe("Japanese");
    expect(decks[0].totalCards).toBe(2);
    expect(decks[0].cardsDue).toBe(2);
    expect(decks[0].masteryPercentage).toBe(0);
    expect(decks[0].category.name).toBe("Languages");
    expect(decks[0].category.id).toBe("cat-1");
  });

  it("counts only due unsuspended cards in deck stats", async () => {
    const testContext = await createTestDeckRepository();
    teardown = testContext.teardown;

    await seedCategory(testContext.db, {
      id: "cat-1",
      name: "Languages",
    });

    const deck = await testContext.repository.createDeck({
      title: "Japanese",
      tags: ["vocab"],
      categoryId: "cat-1",
    });

    const timestamp = new Date().toISOString();
    const cards = [
      {
        id: randomUUID(),
        front: "Due new",
        state: "new",
        dueAt: timestamp,
        isSuspended: 0,
      },
      {
        id: randomUUID(),
        front: "Future review",
        state: "review",
        dueAt: "2099-01-01T00:00:00.000Z",
        isSuspended: 0,
      },
      {
        id: randomUUID(),
        front: "Suspended due",
        state: "review",
        dueAt: timestamp,
        isSuspended: 1,
      },
    ];

    for (const card of cards) {
      await testContext.db.execute(
        `INSERT INTO cards (id, deck_id, type, front, content, tags, is_suspended, created_at, updated_at)
         VALUES ($1, $2, 'plain', $3, '{}', '[]', $4, $5, $6)`,
        [card.id, deck.id, card.front, card.isSuspended, timestamp, timestamp]
      );
      await testContext.db.execute(
        `INSERT INTO card_schedules (card_id, state, due_at, interval_days, ease_factor, repetition_count, lapse_count, created_at, updated_at)
         VALUES ($1, $2, $3, 0, 2.5, 0, 0, $4, $5)`,
        [card.id, card.state, card.dueAt, timestamp, timestamp]
      );
    }

    const decks = await testContext.repository.listDeckWithStats();

    expect(decks).toHaveLength(1);
    expect(decks[0].totalCards).toBe(3);
    expect(decks[0].cardsDue).toBe(1);
  });

  it("counts only active mature review cards as mastery", async () => {
    const testContext = await createTestDeckRepository();
    teardown = testContext.teardown;

    await seedCategory(testContext.db, {
      id: "cat-1",
      name: "Languages",
    });

    const deck = await testContext.repository.createDeck({
      title: "Japanese",
      tags: ["vocab"],
      categoryId: "cat-1",
    });

    const timestamp = new Date().toISOString();
    const cards = [
      {
        id: randomUUID(),
        front: "Unseen",
        state: "new",
        intervalDays: 0,
        lastReviewedAt: null,
        isSuspended: 0,
      },
      {
        id: randomUUID(),
        front: "Learning",
        state: "learning",
        intervalDays: 0,
        lastReviewedAt: timestamp,
        isSuspended: 0,
      },
      {
        id: randomUUID(),
        front: "Young review",
        state: "review",
        intervalDays: 6,
        lastReviewedAt: timestamp,
        isSuspended: 0,
      },
      {
        id: randomUUID(),
        front: "Mature review",
        state: "review",
        intervalDays: 21,
        lastReviewedAt: timestamp,
        isSuspended: 0,
      },
      {
        id: randomUUID(),
        front: "Suspended mature",
        state: "review",
        intervalDays: 90,
        lastReviewedAt: timestamp,
        isSuspended: 1,
      },
    ];

    for (const card of cards) {
      await testContext.db.execute(
        `INSERT INTO cards (id, deck_id, type, front, content, tags, is_suspended, created_at, updated_at)
         VALUES ($1, $2, 'plain', $3, '{}', '[]', $4, $5, $6)`,
        [card.id, deck.id, card.front, card.isSuspended, timestamp, timestamp]
      );
      await testContext.db.execute(
        `INSERT INTO card_schedules (
          card_id, state, due_at, interval_days, ease_factor, repetition_count,
          lapse_count, last_reviewed_at, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, 2.5, 0, 0, $5, $6, $7)`,
        [
          card.id,
          card.state,
          timestamp,
          card.intervalDays,
          card.lastReviewedAt,
          timestamp,
          timestamp,
        ]
      );
    }

    const decks = await testContext.repository.listDeckWithStats();

    expect(decks[0].masteryPercentage).toBe(20);
  });
});
