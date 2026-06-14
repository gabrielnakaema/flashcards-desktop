import { randomUUID } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import {
  createTestDeckRepository,
  seedCategory,
} from "./test/create-test-deck-repository";

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
    expect(deck.category).toBe("cat-1");
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
    expect(updated.tags).toBe(JSON.stringify(["vocab", "grammar"]));
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

    await testContext.db.execute(
      "INSERT INTO cards (id, deck_id) VALUES ($1, $2), ($3, $4)",
      [randomUUID(), deck.id, randomUUID(), deck.id]
    );

    const decks = await testContext.repository.listDeckWithStats();

    expect(decks).toHaveLength(1);
    expect(decks[0].title).toBe("Japanese");
    expect(decks[0].totalCards).toBe(2);
  });
});
