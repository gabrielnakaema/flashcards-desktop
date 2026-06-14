import { DeckSqliteRepository } from "../deck-sqlite-repository";
import { TestSqlClient } from "./test-sql-client";

export async function createTestDeckRepository() {
  const db = await TestSqlClient.create();
  const repository = new DeckSqliteRepository(db);

  return {
    repository,
    db,
    async teardown() {
      await db.destroy();
    },
  };
}

export async function seedCategory(
  db: TestSqlClient,
  category: { id: string; name: string }
) {
  await db.execute("INSERT INTO deck_categories (id, name) VALUES ($1, $2)", [
    category.id,
    category.name,
  ]);
}
