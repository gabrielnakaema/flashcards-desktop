import {
  toReviewLog,
  type CardSchedule,
  type CardWithSchedule,
  type ReviewLog,
  type SubmitReviewPayload,
} from "@/features/cards/types";
import type { StudyRepository } from "@/features/study/study-repository";
import { DEFAULT_EASE_FACTOR, computeNextSchedule } from "@/shared/lib/srs";
import { formatZodError } from "@/shared/utils/format-zod-error";
import {
  CARD_WITH_SCHEDULE_SELECT,
  rowToCardWithSchedule,
} from "./card-with-schedule-query";
import { parseSchedule } from "./card-sqlite-mappers";
import { getDb } from "./db";
import type { SqlClient } from "./sql-client";
import { buildSqlStatementBatch } from "./sql-statement-batch";

const now = (): string => new Date().toISOString();

const toReviewLogRow = (raw: Record<string, unknown>): unknown => ({
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
});

export class StudySqliteRepository implements StudyRepository {
  constructor(private readonly db?: SqlClient) {}

  private get dbClient(): SqlClient {
    return this.db ?? getDb();
  }

  private getSchedule = async (cardId: string): Promise<CardSchedule> => {
    const [raw] = await this.dbClient.select<Record<string, unknown>[]>(
      "SELECT * FROM card_schedules WHERE card_id = $1",
      [cardId]
    );
    if (!raw) {
      throw new Error(`Schedule not found for card: ${cardId}`);
    }
    return parseSchedule(raw);
  };

  getDueCards = async (deckId: string): Promise<CardWithSchedule[]> => {
    const rows = await this.dbClient.select<Record<string, unknown>[]>(
      `${CARD_WITH_SCHEDULE_SELECT}
      WHERE c.deck_id = $1
        AND c.is_suspended = 0
        AND cs.due_at IS NOT NULL
        AND datetime(cs.due_at) <= datetime($2)
      ORDER BY cs.due_at ASC`,
      [deckId, now()]
    );

    return rows.map(rowToCardWithSchedule);
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
    const wasCorrect =
      payload.wasCorrect !== undefined ? (payload.wasCorrect ? 1 : 0) : null;
    const batch = buildSqlStatementBatch([
      { query: "BEGIN", args: [] },
      {
        query: `UPDATE card_schedules SET
          state = $1, due_at = $2, interval_days = $3,
          ease_factor = $4, repetition_count = $5, lapse_count = $6,
          last_reviewed_at = $7, updated_at = $8
        WHERE card_id = $9`,
        args: [
          update.state,
          update.dueAt,
          update.intervalDays,
          update.easeFactor,
          update.repetitionCount,
          update.lapseCount,
          update.lastReviewedAt,
          timestamp,
          payload.cardId,
        ],
      },
      {
        query: `INSERT INTO review_logs (
          id, card_id, deck_id, rating, response, was_correct,
          reviewed_at, previous_due_at, next_due_at, elapsed_ms
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        args: [
          logId,
          payload.cardId,
          payload.deckId,
          payload.rating,
          payload.response ?? null,
          wasCorrect,
          update.lastReviewedAt,
          currentSchedule.dueAt,
          update.dueAt,
          payload.elapsedMs ?? null,
        ],
      },
      { query: "COMMIT", args: [] },
    ]);

    await this.dbClient.execute(batch.query, batch.args);

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

  buryCard = async (cardId: string, dueAt: string): Promise<void> => {
    await this.dbClient.execute(
      `UPDATE card_schedules SET due_at = $1, updated_at = $2 WHERE card_id = $3`,
      [dueAt, now(), cardId]
    );
  };

  resetDeckStudyProgress = async (deckId: string): Promise<void> => {
    const timestamp = now();
    const batch = buildSqlStatementBatch([
      { query: "BEGIN", args: [] },
      {
        query: "DELETE FROM review_logs WHERE deck_id = $1",
        args: [deckId],
      },
      {
        query: `UPDATE card_schedules
          SET state = 'new',
            due_at = $1,
            interval_days = 0,
            ease_factor = $2,
            repetition_count = 0,
            lapse_count = 0,
            last_reviewed_at = NULL,
            updated_at = $3
          WHERE card_id IN (
            SELECT id FROM cards WHERE deck_id = $4
          )`,
        args: [timestamp, DEFAULT_EASE_FACTOR, timestamp, deckId],
      },
      { query: "COMMIT", args: [] },
    ]);

    await this.dbClient.execute(batch.query, batch.args);
  };
}
