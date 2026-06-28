import type { CardRepository } from "@/features/cards/card-repository";
import {
  createCardPayloadSchema,
  type Card,
  type CardWithSchedule,
  type CreateCardPayload,
  type UpdateCardPayload,
} from "@/features/cards/types";
import { DEFAULT_EASE_FACTOR } from "@/shared/lib/srs";
import { formatZodError } from "@/shared/utils/format-zod-error";
import {
  CARD_WITH_SCHEDULE_SELECT,
  rowToCardWithSchedule,
} from "./card-with-schedule-query";
import { parseCard } from "./card-sqlite-mappers";
import { getDb } from "./db";
import type { SqlClient } from "./sql-client";
import {
  buildSqlStatementBatch,
  type SqlStatement,
} from "./sql-statement-batch";

const now = (): string => new Date().toISOString();

const buildCardInsertStatements = (
  payload: CreateCardPayload
): { id: string; statements: SqlStatement[] } => {
  const id = crypto.randomUUID();
  const timestamp = now();

  const cardInsert: SqlStatement = {
    query: `INSERT INTO cards (
      id, deck_id, type, front, back, content,
      hint, explanation, source_excerpt, difficulty,
      tags, is_suspended, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 0, $12, $13)`,
    args: [
      id,
      payload.deckId,
      payload.type,
      payload.front,
      payload.back ?? null,
      JSON.stringify(payload.content ?? {}),
      payload.hint ?? null,
      payload.explanation ?? null,
      payload.sourceExcerpt ?? null,
      payload.difficulty ?? null,
      JSON.stringify(payload.tags ?? []),
      timestamp,
      timestamp,
    ],
  };

  const scheduleInsert: SqlStatement = {
    query: `INSERT INTO card_schedules (
      card_id, state, due_at, interval_days, ease_factor,
      repetition_count, lapse_count, last_reviewed_at,
      created_at, updated_at
    ) VALUES ($1, 'new', $2, 0, $3, 0, 0, NULL, $4, $5)`,
    args: [id, timestamp, DEFAULT_EASE_FACTOR, timestamp, timestamp],
  };

  return { id, statements: [cardInsert, scheduleInsert] };
};

const parseCreateCardPayload = (
  payload: CreateCardPayload
): CreateCardPayload => {
  const result = createCardPayloadSchema.safeParse(payload);
  if (!result.success) {
    throw new Error(`Invalid card payload: ${formatZodError(result.error)}`);
  }
  return result.data;
};

export class CardSqliteRepository implements CardRepository {
  constructor(private readonly db?: SqlClient) {}

  private get dbClient(): SqlClient {
    return this.db ?? getDb();
  }

  private getCard = async (id: string): Promise<Card> => {
    const [raw] = await this.dbClient.select<Record<string, unknown>[]>(
      "SELECT * FROM cards WHERE id = $1",
      [id]
    );
    if (!raw) {
      throw new Error(`Card not found: ${id}`);
    }
    return parseCard(raw);
  };

  createCard = async (payload: CreateCardPayload): Promise<Card> => {
    const parsedPayload = parseCreateCardPayload(payload);
    const { id, statements } = buildCardInsertStatements(parsedPayload);
    const batch = buildSqlStatementBatch([
      { query: "BEGIN", args: [] },
      ...statements,
      { query: "COMMIT", args: [] },
    ]);

    await this.dbClient.execute(batch.query, batch.args);

    const [raw] = await this.dbClient.select<Record<string, unknown>[]>(
      "SELECT * FROM cards WHERE id = $1",
      [id]
    );
    return parseCard(raw);
  };

  bulkCreateCards = async (payloads: CreateCardPayload[]): Promise<Card[]> => {
    if (payloads.length === 0) {
      return [];
    }

    const cardIds: string[] = [];
    const statements: SqlStatement[] = [];

    for (const payload of payloads) {
      const result = buildCardInsertStatements(parseCreateCardPayload(payload));
      cardIds.push(result.id);
      statements.push(...result.statements);
    }

    const batch = buildSqlStatementBatch([
      { query: "BEGIN", args: [] },
      ...statements,
      { query: "COMMIT", args: [] },
    ]);
    await this.dbClient.execute(batch.query, batch.args);

    const placeholders = cardIds.map((_, i) => `$${i + 1}`).join(", ");
    const rows = await this.dbClient.select<Record<string, unknown>[]>(
      `SELECT * FROM cards WHERE id IN (${placeholders})`,
      cardIds
    );
    const cardMap = new Map(
      rows.map((row) => [row.id as string, parseCard(row)])
    );
    return cardIds.map((id) => cardMap.get(id)!);
  };

  updateCard = async (payload: UpdateCardPayload): Promise<Card> => {
    const timestamp = now();
    const existing = await this.getCard(payload.id);

    const [raw] = await this.dbClient.select<Record<string, unknown>[]>(
      `UPDATE cards SET
        type = $1, front = $2, back = $3, content = $4,
        hint = $5, explanation = $6, source_excerpt = $7,
        difficulty = $8, tags = $9, updated_at = $10
      WHERE id = $11
      RETURNING *`,
      [
        payload.type ?? existing.type,
        payload.front ?? existing.front,
        payload.back !== undefined ? payload.back : existing.back,
        payload.content !== undefined
          ? JSON.stringify(payload.content)
          : JSON.stringify(existing.content),
        payload.hint !== undefined ? payload.hint : existing.hint,
        payload.explanation !== undefined
          ? payload.explanation
          : existing.explanation,
        payload.sourceExcerpt !== undefined
          ? payload.sourceExcerpt
          : existing.sourceExcerpt,
        payload.difficulty !== undefined
          ? payload.difficulty
          : existing.difficulty,
        payload.tags !== undefined
          ? JSON.stringify(payload.tags)
          : JSON.stringify(existing.tags),
        timestamp,
        payload.id,
      ]
    );
    return parseCard(raw);
  };

  deleteCard = async (id: string): Promise<void> => {
    await this.dbClient.execute("DELETE FROM cards WHERE id = $1", [id]);
  };

  listCardsByDeck = async (deckId: string): Promise<CardWithSchedule[]> => {
    const rows = await this.dbClient.select<Record<string, unknown>[]>(
      `${CARD_WITH_SCHEDULE_SELECT}
      WHERE c.deck_id = $1
      ORDER BY c.created_at ASC`,
      [deckId]
    );
    return rows.map(rowToCardWithSchedule);
  };
}
