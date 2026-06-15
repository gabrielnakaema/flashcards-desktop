import type { CardRepository } from "@/data/card-repository";
import {
  toCard,
  toCardSchedule,
  toReviewLog,
  type Card,
  type CardSchedule,
  type CardWithSchedule,
  type CreateCardPayload,
  type ReviewLog,
  type SubmitReviewPayload,
  type UpdateCardPayload,
} from "@/types/card";
import { formatZodError } from "@/utils/format-zod-error";
import { DEFAULT_EASE_FACTOR, computeNextSchedule } from "@/lib/srs";
import { getDb } from "./db";
import type { SqlClient } from "./sql-client";

const now = (): string => {
  return new Date().toISOString();
};

const toCardRow = (raw: Record<string, unknown>): unknown => {
  return {
    id: raw.id,
    deckId: raw.deck_id,
    type: raw.type,
    front: raw.front,
    back: raw.back ?? null,
    content: raw.content ?? "{}",
    hint: raw.hint ?? null,
    explanation: raw.explanation ?? null,
    sourceExcerpt: raw.source_excerpt ?? null,
    difficulty: raw.difficulty ?? null,
    tags: raw.tags ?? "[]",
    isSuspended: raw.is_suspended === 1 || raw.is_suspended === true,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
};

const toScheduleRow = (raw: Record<string, unknown>): unknown => {
  return {
    cardId: raw.card_id,
    state: raw.state,
    dueAt: raw.due_at ?? null,
    intervalDays: raw.interval_days,
    easeFactor: raw.ease_factor,
    repetitionCount: raw.repetition_count,
    lapseCount: raw.lapse_count,
    lastReviewedAt: raw.last_reviewed_at ?? null,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
};

const toReviewLogRow = (raw: Record<string, unknown>): unknown => {
  return {
    id: raw.id,
    cardId: raw.card_id,
    deckId: raw.deck_id,
    rating: raw.rating,
    response: raw.response ?? null,
    wasCorrect: raw.was_correct ?? null,
    reviewedAt: raw.reviewed_at,
    previousDueAt: raw.previous_due_at ?? null,
    nextDueAt: raw.next_due_at ?? null,
    elapsedMs: raw.elapsed_ms ?? null,
  };
};

const parseCard = (raw: Record<string, unknown>): Card => {
  const result = toCard(toCardRow(raw));
  if (!result.success) {
    throw new Error(`Failed to parse card: ${formatZodError(result.error)}`);
  }
  return result.data;
};

const parseSchedule = (raw: Record<string, unknown>): CardSchedule => {
  const result = toCardSchedule(toScheduleRow(raw));
  if (!result.success) {
    throw new Error(
      `Failed to parse card schedule: ${formatZodError(result.error)}`
    );
  }
  return result.data;
};

export class CardSqliteRepository implements CardRepository {
  constructor(private readonly db?: SqlClient) {}

  private get dbClient(): SqlClient {
    return this.db ?? getDb();
  }

  private async beginTransaction(): Promise<void> {
    await this.dbClient.execute("BEGIN");
  }

  private async commitTransaction(): Promise<void> {
    await this.dbClient.execute("COMMIT");
  }

  private async rollbackTransaction(): Promise<void> {
    await this.dbClient.execute("ROLLBACK");
  }

  private async insertCardWithSchedule(
    payload: CreateCardPayload
  ): Promise<Card> {
    const id = crypto.randomUUID();
    const timestamp = now();

    await this.dbClient.execute(
      `INSERT INTO cards (
        id, deck_id, type, front, back, content,
        hint, explanation, source_excerpt, difficulty,
        tags, is_suspended, created_at, updated_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,0,$12,$13)`,
      [
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
      ]
    );

    await this.dbClient.execute(
      `INSERT INTO card_schedules (
        card_id, state, due_at, interval_days, ease_factor,
        repetition_count, lapse_count, last_reviewed_at,
        created_at, updated_at
      ) VALUES ($1,'new',NULL,0,$2,0,0,NULL,$3,$4)`,
      [id, DEFAULT_EASE_FACTOR, timestamp, timestamp]
    );

    const [raw] = await this.dbClient.select<Record<string, unknown>[]>(
      "SELECT * FROM cards WHERE id = $1",
      [id]
    );
    return parseCard(raw);
  }

  createCard = async (payload: CreateCardPayload): Promise<Card> => {
    await this.beginTransaction();
    try {
      const card = await this.insertCardWithSchedule(payload);
      await this.commitTransaction();
      return card;
    } catch (err) {
      await this.rollbackTransaction();
      throw err;
    }
  };

  bulkCreateCards = async (payloads: CreateCardPayload[]): Promise<Card[]> => {
    await this.beginTransaction();
    try {
      const cards: Card[] = [];
      for (const payload of payloads) {
        cards.push(await this.insertCardWithSchedule(payload));
      }
      await this.commitTransaction();
      return cards;
    } catch (err) {
      await this.rollbackTransaction();
      throw err;
    }
  };

  updateCard = async (payload: UpdateCardPayload): Promise<Card> => {
    const timestamp = now();

    const existing = await this.getCard(payload.id);

    const updatedType = payload.type ?? existing.type;
    const updatedFront = payload.front ?? existing.front;
    const updatedBack =
      payload.back !== undefined ? payload.back : existing.back;
    const updatedContent =
      payload.content !== undefined
        ? JSON.stringify(payload.content)
        : JSON.stringify(existing.content);
    const updatedHint =
      payload.hint !== undefined ? payload.hint : existing.hint;
    const updatedExplanation =
      payload.explanation !== undefined
        ? payload.explanation
        : existing.explanation;
    const updatedSourceExcerpt =
      payload.sourceExcerpt !== undefined
        ? payload.sourceExcerpt
        : existing.sourceExcerpt;
    const updatedDifficulty =
      payload.difficulty !== undefined
        ? payload.difficulty
        : existing.difficulty;
    const updatedTags =
      payload.tags !== undefined
        ? JSON.stringify(payload.tags)
        : JSON.stringify(existing.tags);

    await this.dbClient.execute(
      `UPDATE cards SET
        type = $1, front = $2, back = $3, content = $4,
        hint = $5, explanation = $6, source_excerpt = $7,
        difficulty = $8, tags = $9, updated_at = $10
      WHERE id = $11`,
      [
        updatedType,
        updatedFront,
        updatedBack,
        updatedContent,
        updatedHint,
        updatedExplanation,
        updatedSourceExcerpt,
        updatedDifficulty,
        updatedTags,
        timestamp,
        payload.id,
      ]
    );

    return this.getCard(payload.id);
  };

  deleteCard = async (id: string): Promise<void> => {
    await this.dbClient.execute("DELETE FROM cards WHERE id = $1", [id]);
  };

  getCard = async (id: string): Promise<Card> => {
    const [raw] = await this.dbClient.select<Record<string, unknown>[]>(
      "SELECT * FROM cards WHERE id = $1",
      [id]
    );
    if (!raw) {
      throw new Error(`Card not found: ${id}`);
    }
    return parseCard(raw);
  };

  listCardsByDeck = async (deckId: string): Promise<Card[]> => {
    const rows = await this.dbClient.select<Record<string, unknown>[]>(
      "SELECT * FROM cards WHERE deck_id = $1 ORDER BY created_at ASC",
      [deckId]
    );
    return rows.map(parseCard);
  };

  getDueCards = async (deckId: string): Promise<CardWithSchedule[]> => {
    const rows = await this.dbClient.select<Record<string, unknown>[]>(
      `SELECT
        c.*,
        cs.card_id, cs.state, cs.due_at, cs.interval_days,
        cs.ease_factor, cs.repetition_count, cs.lapse_count,
        cs.last_reviewed_at,
        cs.created_at AS cs_created_at,
        cs.updated_at AS cs_updated_at
      FROM cards c
      JOIN card_schedules cs ON c.id = cs.card_id
      WHERE c.deck_id = $1
        AND c.is_suspended = 0
        AND cs.due_at IS NOT NULL
        AND cs.due_at <= datetime('now')
      ORDER BY cs.due_at ASC`,
      [deckId]
    );

    return rows.map((row) => {
      const card = parseCard(row);
      const schedule = parseSchedule({
        card_id: row.card_id,
        state: row.state,
        due_at: row.due_at,
        interval_days: row.interval_days,
        ease_factor: row.ease_factor,
        repetition_count: row.repetition_count,
        lapse_count: row.lapse_count,
        last_reviewed_at: row.last_reviewed_at,
        created_at: row.cs_created_at,
        updated_at: row.cs_updated_at,
      });
      return { ...card, schedule };
    });
  };

  getSchedule = async (cardId: string): Promise<CardSchedule> => {
    const [raw] = await this.dbClient.select<Record<string, unknown>[]>(
      "SELECT * FROM card_schedules WHERE card_id = $1",
      [cardId]
    );
    if (!raw) {
      throw new Error(`Schedule not found for card: ${cardId}`);
    }
    return parseSchedule(raw);
  };

  submitReview = async (payload: SubmitReviewPayload): Promise<ReviewLog> => {
    const currentSchedule = await this.getSchedule(payload.cardId);
    const reviewedAt = new Date();

    const update = computeNextSchedule(
      {
        state: currentSchedule.state,
        intervalDays: currentSchedule.intervalDays,
        easeFactor: currentSchedule.easeFactor,
        repetitionCount: currentSchedule.repetitionCount,
        lapseCount: currentSchedule.lapseCount,
      },
      payload.rating,
      reviewedAt
    );

    const timestamp = now();
    const logId = crypto.randomUUID();

    await this.beginTransaction();
    try {
      await this.dbClient.execute(
        `UPDATE card_schedules SET
          state = $1, due_at = $2, interval_days = $3,
          ease_factor = $4, repetition_count = $5, lapse_count = $6,
          last_reviewed_at = $7, updated_at = $8
        WHERE card_id = $9`,
        [
          update.state,
          update.dueAt,
          update.intervalDays,
          update.easeFactor,
          update.repetitionCount,
          update.lapseCount,
          update.lastReviewedAt,
          timestamp,
          payload.cardId,
        ]
      );

      await this.dbClient.execute(
        `INSERT INTO review_logs (
          id, card_id, deck_id, rating, response, was_correct,
          reviewed_at, previous_due_at, next_due_at, elapsed_ms
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [
          logId,
          payload.cardId,
          payload.deckId,
          payload.rating,
          payload.response ?? null,
          payload.wasCorrect !== undefined
            ? payload.wasCorrect
              ? 1
              : 0
            : null,
          update.lastReviewedAt,
          currentSchedule.dueAt,
          update.dueAt,
          payload.elapsedMs ?? null,
        ]
      );

      await this.commitTransaction();
    } catch (err) {
      await this.rollbackTransaction();
      throw err;
    }

    const [rawLog] = await this.dbClient.select<Record<string, unknown>[]>(
      "SELECT * FROM review_logs WHERE id = $1",
      [logId]
    );

    const result = toReviewLog(toReviewLogRow(rawLog));
    if (!result.success) {
      throw new Error(
        `Failed to parse review log: ${formatZodError(result.error)}`
      );
    }
    return result.data;
  };
}
