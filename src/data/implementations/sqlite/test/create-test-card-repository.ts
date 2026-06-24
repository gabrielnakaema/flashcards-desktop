import { DEFAULT_EASE_FACTOR } from "@/lib/srs";
import { CardSqliteRepository } from "../card-sqlite-repository";
import { TestSqlClient } from "./test-sql-client";

export const createTestCardRepository = async () => {
  const db = await TestSqlClient.create();
  const repository = new CardSqliteRepository(db);

  return {
    repository,
    db,
    async teardown() {
      await db.destroy();
    },
  };
};

interface SeedCategoryOptions {
  id: string;
  name: string;
}

interface SeedDeckOptions {
  id: string;
  categoryId: string;
  title?: string;
}

interface SeedCardOptions {
  id: string;
  deckId: string;
  type?: string;
  front?: string;
  dueAt?: string | null;
  state?: string;
  isSuspended?: boolean;
}

interface SeedReviewLogOptions {
  id: string;
  cardId: string;
  deckId: string;
  reviewedAt: string;
  rating?: string;
}

export const seedCategory = async (
  db: TestSqlClient,
  category: SeedCategoryOptions
) => {
  const timestamp = new Date().toISOString();
  await db.execute(
    "INSERT INTO deck_categories (id, name, created_at, updated_at) VALUES ($1, $2, $3, $4)",
    [category.id, category.name, timestamp, timestamp]
  );
};

export const seedDeck = async (db: TestSqlClient, deck: SeedDeckOptions) => {
  const timestamp = new Date().toISOString();
  await db.execute(
    "INSERT INTO decks (id, category, title, tags, created_at, updated_at) VALUES ($1, $2, $3, '[]', $4, $5)",
    [deck.id, deck.categoryId, deck.title ?? "Test Deck", timestamp, timestamp]
  );
};

export const seedCard = async (db: TestSqlClient, card: SeedCardOptions) => {
  const timestamp = new Date().toISOString();
  await db.execute(
    `INSERT INTO cards (
      id, deck_id, type, front, back, content, tags, is_suspended, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, NULL, '{}', '[]', $5, $6, $7)`,
    [
      card.id,
      card.deckId,
      card.type ?? "plain",
      card.front ?? "Test question?",
      card.isSuspended ? 1 : 0,
      timestamp,
      timestamp,
    ]
  );

  await db.execute(
    `INSERT INTO card_schedules (
      card_id, state, due_at, interval_days, ease_factor,
      repetition_count, lapse_count, last_reviewed_at, created_at, updated_at
    ) VALUES ($1, $2, $3, 0, $4, 0, 0, NULL, $5, $6)`,
    [
      card.id,
      card.state ?? "new",
      card.dueAt ?? null,
      DEFAULT_EASE_FACTOR,
      timestamp,
      timestamp,
    ]
  );
};

export const seedReviewLog = async (
  db: TestSqlClient,
  log: SeedReviewLogOptions
) => {
  await db.execute(
    `INSERT INTO review_logs (
      id, card_id, deck_id, rating, response, was_correct,
      reviewed_at, previous_due_at, next_due_at, elapsed_ms
    ) VALUES ($1, $2, $3, $4, NULL, NULL, $5, NULL, NULL, NULL)`,
    [log.id, log.cardId, log.deckId, log.rating ?? "good", log.reviewedAt]
  );
};
