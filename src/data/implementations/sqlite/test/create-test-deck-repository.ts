import { DeckSqliteRepository } from "../deck-sqlite-repository";
import { TestSqlClient } from "./test-sql-client";

export const createTestDeckRepository = async () => {
  const db = await TestSqlClient.create();
  const repository = new DeckSqliteRepository(db);

  return {
    repository,
    db,
    async teardown() {
      await db.destroy();
    },
  };
};

export const seedCategory = async (
  db: TestSqlClient,
  category: { id: string; name: string }
) => {
  const timestamp = new Date().toISOString();
  await db.execute(
    "INSERT INTO deck_categories (id, name, created_at, updated_at) VALUES ($1, $2, $3, $4)",
    [category.id, category.name, timestamp, timestamp]
  );
};
