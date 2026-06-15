import { DeckRepository } from "@/data/deck-repository";
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
      "INSERT INTO deck_categories (id, name) VALUES ($1, $2) RETURNING id, name";
    const id = crypto.randomUUID();
    const params = [id, payload.name];
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
    const query =
      "UPDATE deck_categories SET name = $1 WHERE id = $2 RETURNING id, name";
    const params = [payload.name, payload.id];
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
      SELECT
        d.id,
        d.title,
        d.tags,
        d.category as categoryId,
        dc.name AS categoryName,
        COUNT(c.id) AS totalCards,
        COUNT(c.id) AS cardsDue,
        COUNT(c.id) AS masteryPercentage
      FROM decks d
      LEFT JOIN cards c ON d.id = c.deck_id
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

    const decks = await this.dbClient.select<QueryResultItem[]>(query);

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
      INSERT INTO decks (id, title, tags, category) VALUES ($1, $2, $3, $4)
      RETURNING id, title, tags, category
    `;
    const id = crypto.randomUUID();
    const params = [
      id,
      payload.title,
      JSON.stringify(payload.tags),
      payload.categoryId,
    ];

    const [deck] = await this.dbClient.select<Deck[]>(query, params);

    const result = toDeck(deck);
    if (!result.success) {
      throw new Error(`Failed to parse deck: ${formatZodError(result.error!)}`);
    }

    return result.data;
  };

  updateDeck = async (payload: UpdateDeckPayload): Promise<Deck> => {
    const query = `
      UPDATE decks SET title = $1, tags = $2, category = $3 WHERE id = $4
      RETURNING id, title, tags, category
    `;
    const params = [
      payload.title,
      JSON.stringify(payload.tags),
      payload.categoryId,
      payload.id,
    ];

    const [deck] = await this.dbClient.select<Deck[]>(query, params);
    return deck;
  };

  deleteDeck = async (id: string): Promise<void> => {
    const query = `
      DELETE FROM decks WHERE id = $1
    `;
    const params = [id];

    await this.dbClient.execute(query, params);
  };
}
