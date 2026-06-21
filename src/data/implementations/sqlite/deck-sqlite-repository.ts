import { DeckRepository } from "@/data/deck-repository";
import { MATURE_INTERVAL_DAYS } from "@/lib/srs";
import {
  CreateDeckCategoryPayload,
  CreateDeckPayload,
  Deck,
  DeckCategory,
  DeckWithStats,
  toDeck,
  toDeckCategory,
  toDeckWithStats,
  UpdateDeckCategoryPayload,
  UpdateDeckPayload,
} from "@/types/deck";
import { formatZodError } from "@/utils/format-zod-error";
import { getDb } from "./db";
import type { SqlClient } from "./sql-client";

export class DeckSqliteRepository implements DeckRepository {
  constructor(private readonly db?: SqlClient) {}

  private get dbClient(): SqlClient {
    return this.db ?? getDb();
  }

  createCategory = async (
    payload: CreateDeckCategoryPayload
  ): Promise<DeckCategory> => {
    const query =
      "INSERT INTO deck_categories (id, name, created_at, updated_at) VALUES ($1, $2, $3, $4) RETURNING id, name";
    const id = crypto.randomUUID();
    const timestamp = new Date().toISOString();
    const params = [id, payload.name, timestamp, timestamp];
    const [category] = await this.dbClient.select<DeckCategory[]>(
      query,
      params
    );
    return category;
  };

  listCategories = async (): Promise<DeckCategory[]> => {
    const query = "SELECT id, name FROM deck_categories";

    const categories = await this.dbClient.select<DeckCategory[]>(query);
    const results = categories.map(toDeckCategory);
    const success = results.every((result) => result.success);

    if (!success) {
      const errors = results
        .map((result) => formatZodError(result.error!))
        .join("\n");
      throw new Error(`Failed to parse categories: ${errors}`);
    }

    return results.map((result) => result.data);
  };

  updateCategory = async (
    payload: UpdateDeckCategoryPayload
  ): Promise<DeckCategory> => {
    const timestamp = new Date().toISOString();
    const query =
      "UPDATE deck_categories SET name = $1, updated_at = $2 WHERE id = $3 RETURNING id, name";
    const params = [payload.name, timestamp, payload.id];
    const [category] = await this.dbClient.select<DeckCategory[]>(
      query,
      params
    );

    const result = toDeckCategory(category);
    if (!result.success) {
      throw new Error(
        `Failed to parse category: ${formatZodError(result.error!)}`
      );
    }

    return result.data;
  };

  deleteCategory = async (id: string): Promise<void> => {
    const query = "DELETE FROM deck_categories WHERE id = $1";
    await this.dbClient.execute(query, [id]);
  };

  listDeckWithStats = async (): Promise<DeckWithStats[]> => {
    const query = `
      WITH params(now, mature_interval_days) AS (SELECT $1, $2)
      SELECT
        d.id,
        d.title,
        d.tags,
        d.category as categoryId,
        dc.name AS categoryName,
        COUNT(c.id) AS totalCards,
        COALESCE(SUM(
          CASE WHEN c.is_suspended = 0
            AND cs.due_at IS NOT NULL
            AND datetime(cs.due_at) <= datetime(params.now)
          THEN 1 ELSE 0 END
        ), 0) AS cardsDue,
        CASE WHEN COUNT(c.id) = 0 THEN 0
          ELSE ROUND(
            100.0 * SUM(
              CASE WHEN c.is_suspended = 0
                AND cs.state = 'review'
                AND cs.interval_days >= params.mature_interval_days
                AND cs.last_reviewed_at IS NOT NULL
              THEN 1 ELSE 0 END
            ) / COUNT(c.id)
          )
        END AS masteryPercentage
      FROM decks d
      CROSS JOIN params
      LEFT JOIN cards c ON d.id = c.deck_id
      LEFT JOIN card_schedules cs ON c.id = cs.card_id
      LEFT JOIN deck_categories dc ON d.category = dc.id
      GROUP BY d.id, d.title, d.tags, d.category
    `;

    interface QueryResultItem {
      id: string;
      title: string;
      tags: string[];
      categoryId: string;
      categoryName: string;
      totalCards: number;
      cardsDue: number;
      masteryPercentage: number;
    }

    const decks = await this.dbClient.select<QueryResultItem[]>(query, [
      new Date().toISOString(),
      MATURE_INTERVAL_DAYS,
    ]);

    const results = decks.map((deck) =>
      toDeckWithStats({
        ...deck,
        category: {
          id: deck.categoryId,
          name: deck.categoryName,
        },
      })
    );
    const success = results.every((result) => result.success);

    if (!success) {
      const errors = results
        .map((result) => formatZodError(result.error!))
        .join("\n");
      throw new Error(`Failed to parse deck with stats: ${errors}`);
    }

    return results.map((result) => result.data);
  };

  createDeck = async (payload: CreateDeckPayload): Promise<Deck> => {
    const query = `
      INSERT INTO decks (id, title, tags, category, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, title, tags, category
    `;
    const id = crypto.randomUUID();
    const timestamp = new Date().toISOString();
    const params = [
      id,
      payload.title,
      JSON.stringify(payload.tags),
      payload.categoryId,
      timestamp,
      timestamp,
    ];

    const [deck] = await this.dbClient.select<Deck[]>(query, params);

    const result = await this.getDeck(deck.id);

    return result;
  };

  updateDeck = async (payload: UpdateDeckPayload): Promise<Deck> => {
    const timestamp = new Date().toISOString();
    const query = `
      UPDATE decks SET title = $1, tags = $2, category = $3, updated_at = $4 WHERE id = $5
      RETURNING id, title, tags, category
    `;
    const params = [
      payload.title,
      JSON.stringify(payload.tags),
      payload.categoryId,
      timestamp,
      payload.id,
    ];

    interface QueryResultItem {
      id: string;
      title: string;
      tags: string;
      category: string;
    }

    const [deck] = await this.dbClient.select<QueryResultItem[]>(query, params);
    const result = await this.getDeck(deck.id);
    return result;
  };

  deleteDeck = async (id: string): Promise<void> => {
    const query = `
      DELETE FROM decks WHERE id = $1
    `;
    const params = [id];

    await this.dbClient.execute(query, params);
  };

  getDeck = async (id: string): Promise<Deck> => {
    const query = `
      SELECT
        d.id,
        d.title,
        d.tags,
        d.category as categoryId,
        dc.name AS categoryName
      FROM decks d
      LEFT JOIN deck_categories dc ON d.category = dc.id
      WHERE d.id = $1
    `;

    interface QueryResultItem {
      id: string;
      title: string;
      tags: string[];
      categoryId: string;
      categoryName: string;
    }

    const params = [id];
    const [deck] = await this.dbClient.select<QueryResultItem[]>(query, params);
    if (!deck) {
      throw new Error(`Deck not found: ${id}`);
    }

    const result = toDeck({
      id: deck.id,
      title: deck.title,
      tags: deck.tags,
      category: {
        id: deck.categoryId,
        name: deck.categoryName,
      },
    });
    if (!result.success) {
      console.error(result.error);
      throw new Error(`Failed to parse deck: ${formatZodError(result.error!)}`);
    }
    return result.data;
  };
}
