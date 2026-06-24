import type { CardRepository, CardStats } from "@/data/card-repository";
import {
  toCard,
  toCardSchedule,
  toReviewLog,
  createCardPayloadSchema,
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

const createBindBuilder = () => {
  const values: unknown[] = [];

  const add = (value: unknown): string => {
    values.push(value);
    return `$${values.length}`;
  };

  return { values, add };
};

const buildCardInsertStatements = (
  payload: CreateCardPayload,
  add: (value: unknown) => string
): { id: string; statements: string[] } => {
  const id = crypto.randomUUID();
  const timestamp = now();

  const cardInsert = `INSERT INTO cards (
    id, deck_id, type, front, back, content,
    hint, explanation, source_excerpt, difficulty,
    tags, is_suspended, created_at, updated_at
  ) VALUES (${add(id)},${add(payload.deckId)},${add(payload.type)},${add(payload.front)},${add(payload.back ?? null)},${add(JSON.stringify(payload.content ?? {}))},${add(payload.hint ?? null)},${add(payload.explanation ?? null)},${add(payload.sourceExcerpt ?? null)},${add(payload.difficulty ?? null)},${add(JSON.stringify(payload.tags ?? []))},0,${add(timestamp)},${add(timestamp)})`;

  const scheduleInsert = `INSERT INTO card_schedules (
    card_id, state, due_at, interval_days, ease_factor,
    repetition_count, lapse_count, last_reviewed_at,
    created_at, updated_at
  ) VALUES (${add(id)},'new',${add(timestamp)},0,${add(DEFAULT_EASE_FACTOR)},0,0,NULL,${add(timestamp)},${add(timestamp)})`;

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

const getStartOfDay = (date: Date): Date => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const getEndOfDay = (date: Date): Date => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

const getWeekRange = (inputDate: Date): { start: Date; end: Date } => {
  const date = new Date(inputDate);
  const day = date.getDay();
  const mondayIndex = (day + 6) % 7;
  const start = new Date(date);
  start.setDate(start.getDate() - mondayIndex);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setDate(end.getDate() + (6 - mondayIndex));
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

const queryCount = async (
  db: SqlClient,
  sql: string,
  params?: unknown[]
): Promise<number> => {
  const [row] = await db.select<{ count: number }[]>(sql, params);
  return row?.count ?? 0;
};

const queryCardsDueNow = (db: SqlClient, endOfDay: string) =>
  queryCount(
    db,
    `SELECT COUNT(card_id) AS count FROM card_schedules
     WHERE due_at IS NOT NULL AND datetime(due_at) <= datetime($1)`,
    [endOfDay]
  );

const queryReviewedInRange = (db: SqlClient, start: string, end: string) =>
  queryCount(
    db,
    `SELECT COUNT(id) AS count FROM review_logs
     WHERE datetime(reviewed_at) >= datetime($1) AND datetime(reviewed_at) <= datetime($2)`,
    [start, end]
  );

const queryTotalCards = (db: SqlClient) =>
  queryCount(db, `SELECT COUNT(id) AS count FROM cards`);

const queryDeckCount = (db: SqlClient) =>
  queryCount(db, `SELECT COUNT(*) AS count FROM decks`);

const queryDeckWithMostCardsDue = async (
  db: SqlClient,
  endOfDay: string
): Promise<{ deckId: string; count: number }> => {
  const [row] = await db.select<{ deck_id: string; count: number }[]>(
    `SELECT c.deck_id AS deck_id, COUNT(cs.card_id) AS count
     FROM card_schedules cs
     JOIN cards c ON cs.card_id = c.id
     WHERE cs.due_at IS NOT NULL AND datetime(cs.due_at) <= datetime($1)
     GROUP BY c.deck_id
     ORDER BY COUNT(cs.card_id) DESC
     LIMIT 1`,
    [endOfDay]
  );
  return { deckId: row?.deck_id ?? "", count: row?.count ?? 0 };
};

const queryNextDueAt = async (db: SqlClient): Promise<string | null> => {
  const [row] = await db.select<{ nextDueAt: string | null }[]>(
    `SELECT MIN(datetime(due_at)) AS nextDueAt FROM card_schedules WHERE due_at IS NOT NULL`
  );
  return row?.nextDueAt ?? null;
};

export class CardSqliteRepository implements CardRepository {
  constructor(private readonly db?: SqlClient) {}

  private get dbClient(): SqlClient {
    return this.db ?? getDb();
  }

  createCard = async (payload: CreateCardPayload): Promise<Card> => {
    const parsedPayload = parseCreateCardPayload(payload);
    const { values, add } = createBindBuilder();
    const { id, statements } = buildCardInsertStatements(parsedPayload, add);

    await this.dbClient.execute(
      ["BEGIN", ...statements, "COMMIT"].join(";\n"),
      values
    );

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

    const { values, add } = createBindBuilder();
    const cardIds: string[] = [];
    const statements: string[] = [];

    for (const payload of payloads) {
      const result = buildCardInsertStatements(
        parseCreateCardPayload(payload),
        add
      );
      cardIds.push(result.id);
      statements.push(...result.statements);
    }

    await this.dbClient.execute(
      ["BEGIN", ...statements, "COMMIT"].join(";\n"),
      values
    );

    const cards: Card[] = [];
    for (const id of cardIds) {
      cards.push(await this.getCard(id));
    }
    return cards;
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

  listCardsByDeck = async (deckId: string): Promise<CardWithSchedule[]> => {
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
      ORDER BY c.created_at ASC`,
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

  getDueCards = async (deckId: string): Promise<CardWithSchedule[]> => {
    const timeNow = now();

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
        AND datetime(cs.due_at) <= datetime($2)
      ORDER BY cs.due_at ASC`,
      [deckId, timeNow]
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
    const wasCorrect =
      payload.wasCorrect !== undefined ? (payload.wasCorrect ? 1 : 0) : null;

    const { values, add } = createBindBuilder();

    await this.dbClient.execute(
      [
        "BEGIN",
        `UPDATE card_schedules SET
          state = ${add(update.state)}, due_at = ${add(update.dueAt)}, interval_days = ${add(update.intervalDays)},
          ease_factor = ${add(update.easeFactor)}, repetition_count = ${add(update.repetitionCount)}, lapse_count = ${add(update.lapseCount)},
          last_reviewed_at = ${add(update.lastReviewedAt)}, updated_at = ${add(timestamp)}
        WHERE card_id = ${add(payload.cardId)}`,
        `INSERT INTO review_logs (
          id, card_id, deck_id, rating, response, was_correct,
          reviewed_at, previous_due_at, next_due_at, elapsed_ms
        ) VALUES (${add(logId)},${add(payload.cardId)},${add(payload.deckId)},${add(payload.rating)},${add(payload.response ?? null)},${add(wasCorrect)},${add(update.lastReviewedAt)},${add(currentSchedule.dueAt)},${add(update.dueAt)},${add(payload.elapsedMs ?? null)})`,
        "COMMIT",
      ].join(";\n"),
      values
    );

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

  resetDeckStudyProgress = async (deckId: string): Promise<void> => {
    const timestamp = now();
    const { values, add } = createBindBuilder();

    await this.dbClient.execute(
      [
        "BEGIN",
        `DELETE FROM review_logs WHERE deck_id = ${add(deckId)}`,
        `UPDATE card_schedules
          SET state = 'new',
            due_at = ${add(timestamp)},
            interval_days = 0,
            ease_factor = ${add(DEFAULT_EASE_FACTOR)},
            repetition_count = 0,
            lapse_count = 0,
            last_reviewed_at = NULL,
            updated_at = ${add(timestamp)}
          WHERE card_id IN (
            SELECT id FROM cards WHERE deck_id = ${add(deckId)}
          )`,
        "COMMIT",
      ].join(";\n"),
      values
    );
  };

  getStats = async (date: Date): Promise<CardStats> => {
    const endOfDay = getEndOfDay(date).toISOString();
    const startOfDay = getStartOfDay(date).toISOString();
    const { start: startOfWeek, end: endOfWeek } = getWeekRange(date);

    const [
      cardsDueNow,
      cardsReviewedToday,
      totalCardsInDecks,
      totalCardsReviewedThisWeek,
      deckWithMostDue,
      deckCount,
      nextDueAt,
    ] = await Promise.all([
      queryCardsDueNow(this.dbClient, endOfDay),
      queryReviewedInRange(this.dbClient, startOfDay, endOfDay),
      queryTotalCards(this.dbClient),
      queryReviewedInRange(
        this.dbClient,
        startOfWeek.toISOString(),
        endOfWeek.toISOString()
      ),
      queryDeckWithMostCardsDue(this.dbClient, endOfDay),
      queryDeckCount(this.dbClient),
      queryNextDueAt(this.dbClient),
    ]);

    return {
      cardsDueNow,
      cardsReviewedToday,
      totalCardsInDecks,
      totalCardsReviewedThisWeek,
      deckIdWithMostCardsDue: deckWithMostDue.deckId,
      mostCardsDueInDeck: deckWithMostDue.count,
      deckCount,
      nextDueAt,
    };
  };
}
